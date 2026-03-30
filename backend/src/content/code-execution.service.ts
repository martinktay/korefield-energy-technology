/**
 * @file code-execution.service.ts
 * Docker-sandboxed code execution service for coding exercises.
 * Runs learner code inside short-lived Docker containers with network disabled,
 * read-only root filesystem, and configurable memory/time limits.
 * Supports Python and JavaScript via pre-built sandbox images.
 */
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import Docker from 'dockerode';

export interface TestCase {
  input: string;
  expected_output: string;
  description: string;
}

export interface TestResult {
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export interface ExecutionResult {
  output: string;
  test_results: TestResult[];
  execution_time_ms: number;
  error?: string;
}

/** Default memory limit in MB. */
const DEFAULT_MEMORY_LIMIT_MB = 256;

/** Default time limit in seconds. */
const DEFAULT_TIME_LIMIT_SECONDS = 10;

/** Map of supported languages to their sandbox Docker images. */
const LANGUAGE_IMAGES: Record<string, string> = {
  python: 'kf-sandbox-python:latest',
  javascript: 'kf-sandbox-node:latest',
};

/** Map of supported languages to their execution commands. */
const LANGUAGE_COMMANDS: Record<string, string[]> = {
  python: ['python3', '-c'],
  javascript: ['node', '-e'],
};

@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);
  private readonly docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  /**
   * Execute code inside an isolated Docker container with network disabled,
   * read-only root filesystem, and configurable memory/time limits.
   * Returns captured stdout/stderr and execution timing.
   *
   * @param code - The source code to execute
   * @param language - Programming language ('python' or 'javascript')
   * @param timeLimitSeconds - Maximum execution time in seconds (default 10)
   * @param memoryLimitMb - Maximum memory in MB (default 256)
   */
  async executeCode(
    code: string,
    language: string,
    timeLimitSeconds: number = DEFAULT_TIME_LIMIT_SECONDS,
    memoryLimitMb: number = DEFAULT_MEMORY_LIMIT_MB,
  ): Promise<{ output: string; execution_time_ms: number; error?: string }> {
    const image = LANGUAGE_IMAGES[language];
    if (!image) {
      return {
        output: '',
        execution_time_ms: 0,
        error: `Unsupported language: ${language}`,
      };
    }

    const cmd = LANGUAGE_COMMANDS[language];
    if (!cmd) {
      return {
        output: '',
        execution_time_ms: 0,
        error: `No execution command for language: ${language}`,
      };
    }

    const timeoutMs = timeLimitSeconds * 1000;
    const memoryBytes = memoryLimitMb * 1024 * 1024;
    const startTime = Date.now();
    let container: Docker.Container | null = null;

    try {
      container = await this.docker.createContainer({
        Image: image,
        Cmd: [...cmd, code],
        NetworkDisabled: true,
        HostConfig: {
          ReadonlyRootfs: true,
          Memory: memoryBytes,
          MemorySwap: memoryBytes,
          NetworkMode: 'none',
        },
        AttachStdout: true,
        AttachStderr: true,
      });

      await container.start();

      // Race between container completion and timeout
      const result = await Promise.race([
        this.waitForContainer(container),
        this.timeoutContainer(container, timeoutMs),
      ]);

      const executionTimeMs = Date.now() - startTime;

      if (result.timedOut) {
        return {
          output: result.stdout.trim(),
          execution_time_ms: executionTimeMs,
          error: 'Execution terminated: time limit exceeded',
        };
      }

      if (result.exitCode !== 0) {
        return {
          output: result.stdout.trim(),
          execution_time_ms: executionTimeMs,
          error: result.stderr.trim() || `Process exited with code ${result.exitCode}`,
        };
      }

      return {
        output: result.stdout.trim(),
        execution_time_ms: executionTimeMs,
      };
    } catch (err: unknown) {
      const executionTimeMs = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Docker daemon unavailable
      if (
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('connect ENOENT') ||
        errorMessage.includes('socket not found') ||
        errorMessage.includes('Cannot connect to the Docker daemon')
      ) {
        throw new HttpException(
          'Execution service temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      this.logger.error(`Docker execution error for ${language}: ${errorMessage}`);
      return {
        output: '',
        execution_time_ms: executionTimeMs,
        error: `Execution failed: ${errorMessage}`,
      };
    } finally {
      // Clean up container
      if (container) {
        try {
          await container.remove({ force: true });
        } catch {
          // Container may already be removed
        }
      }
    }
  }

  /**
   * Execute code and run instructor-defined test cases against it.
   * Each test case provides an input that is appended to the code,
   * and the output is compared against the expected output.
   */
  async executeWithTests(
    code: string,
    language: string,
    testCases: TestCase[],
    timeLimitSeconds: number = DEFAULT_TIME_LIMIT_SECONDS,
    memoryLimitMb: number = DEFAULT_MEMORY_LIMIT_MB,
  ): Promise<ExecutionResult> {
    // First, execute the raw code to get output
    const rawResult = await this.executeCode(
      code,
      language,
      timeLimitSeconds,
      memoryLimitMb,
    );

    // If no test cases, return raw execution result
    if (!testCases || testCases.length === 0) {
      return {
        output: rawResult.output,
        test_results: [],
        execution_time_ms: rawResult.execution_time_ms,
        error: rawResult.error,
      };
    }

    // Run each test case
    const testResults: TestResult[] = [];
    let totalExecutionMs = rawResult.execution_time_ms;

    for (const testCase of testCases) {
      const testCode = this.buildTestCode(code, testCase.input, language);
      const testResult = await this.executeCode(
        testCode,
        language,
        timeLimitSeconds,
        memoryLimitMb,
      );

      totalExecutionMs += testResult.execution_time_ms;
      const actual = testResult.error
        ? `Error: ${testResult.error}`
        : testResult.output;
      const expected = testCase.expected_output.trim();

      testResults.push({
        description: testCase.description,
        passed: !testResult.error && actual === expected,
        expected,
        actual,
      });
    }

    return {
      output: rawResult.output,
      test_results: testResults,
      execution_time_ms: totalExecutionMs,
      error: rawResult.error,
    };
  }

  /**
   * Wait for a container to finish and collect its output.
   */
  private async waitForContainer(
    container: Docker.Container,
  ): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: false }> {
    const waitResult = await container.wait();
    const logs = await container.logs({ stdout: true, stderr: true });
    const logOutput = logs.toString('utf-8');

    // Docker multiplexed stream: stdout and stderr are interleaved with headers.
    // For simplicity, treat all output as stdout and parse stderr from exit code.
    return {
      stdout: logOutput,
      stderr: waitResult.StatusCode !== 0 ? logOutput : '',
      exitCode: waitResult.StatusCode,
      timedOut: false,
    };
  }

  /**
   * Enforce timeout by stopping and removing the container after the limit.
   */
  private async timeoutContainer(
    container: Docker.Container,
    timeoutMs: number,
  ): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: true }> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          await container.stop({ t: 0 });
        } catch {
          // Container may have already stopped
        }
        resolve({
          stdout: '',
          stderr: '',
          exitCode: -1,
          timedOut: true,
        });
      }, timeoutMs);
    });
  }

  /**
   * Build test code by combining the user's code with the test input.
   */
  private buildTestCode(
    userCode: string,
    testInput: string,
    language: string,
  ): string {
    switch (language) {
      case 'python':
      case 'javascript':
        return `${userCode}\n${testInput}`;
      default:
        return userCode;
    }
  }
}
