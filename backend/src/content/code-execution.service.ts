/**
 * @file code-execution.service.ts
 * Sandboxed code execution service for in-browser coding exercises.
 * Spawns child processes with time/memory limits to run learner code
 * and validate against instructor-defined test cases.
 * Currently supports Python and JavaScript; SQL is stubbed.
 * Production will use Docker containers for full isolation.
 */
import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';

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

@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);

  /**
   * Execute code in a sandboxed child process with timeout and memory limits.
   * This is a stub implementation — real sandboxed execution (Docker containers) comes later.
   * Currently supports Python via `python -c` and JavaScript via `node -e`.
   */
  async executeCode(
    code: string,
    language: string,
    timeLimitSeconds: number,
    memoryLimitMb: number,
  ): Promise<{ output: string; execution_time_ms: number; error?: string }> {
    const { command, args } = this.buildCommand(code, language, memoryLimitMb);
    const timeoutMs = timeLimitSeconds * 1000;
    const startTime = Date.now();

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let killed = false;

      const child = spawn(command, args, {
        timeout: timeoutMs,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_OPTIONS: `--max-old-space-size=${memoryLimitMb}` },
      });

      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('error', (err) => {
        const executionTimeMs = Date.now() - startTime;
        this.logger.warn(`Execution error for ${language}: ${err.message}`);
        resolve({
          output: '',
          execution_time_ms: executionTimeMs,
          error: `Execution failed: ${err.message}`,
        });
      });

      child.on('close', (exitCode, signal) => {
        const executionTimeMs = Date.now() - startTime;

        if (signal === 'SIGTERM' || killed || executionTimeMs >= timeoutMs) {
          resolve({
            output: stdout.trim(),
            execution_time_ms: executionTimeMs,
            error: `Execution terminated: time limit of ${timeLimitSeconds}s exceeded`,
          });
          return;
        }

        if (exitCode !== 0) {
          resolve({
            output: stdout.trim(),
            execution_time_ms: executionTimeMs,
            error: stderr.trim() || `Process exited with code ${exitCode}`,
          });
          return;
        }

        resolve({
          output: stdout.trim(),
          execution_time_ms: executionTimeMs,
        });
      });

      // Enforce timeout manually as a safety net
      setTimeout(() => {
        if (!child.killed) {
          killed = true;
          child.kill('SIGTERM');
        }
      }, timeoutMs + 500);
    });
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
    timeLimitSeconds: number,
    memoryLimitMb: number,
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
   * Build the shell command and args for the given language.
   */
  private buildCommand(
    code: string,
    language: string,
    _memoryLimitMb: number,
  ): { command: string; args: string[] } {
    switch (language) {
      case 'python':
        return { command: 'python3', args: ['-c', code] };
      case 'javascript':
        return { command: 'node', args: ['-e', code] };
      case 'sql':
        // SQL execution is a stub — real implementation uses sandboxed PostgreSQL
        return { command: 'echo', args: ['SQL execution not yet supported in stub mode'] };
      default:
        return { command: 'echo', args: [`Unsupported language: ${language}`] };
    }
  }

  /**
   * Build test code by combining the user's code with the test input.
   * The test input is appended after the user's code.
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
