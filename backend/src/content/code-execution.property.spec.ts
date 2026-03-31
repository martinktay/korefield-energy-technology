/**
 * @file code-execution.property.spec.ts
 * Property-based tests for Docker sandbox isolation invariants.
 * Verifies that every code execution request creates a container with
 * network disabled, read-only root filesystem, and correct memory limit.
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.5**
 */
import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { CodeExecutionService } from './code-execution.service';

// ── Mock dockerode ──────────────────────────────────────────────

const mockContainerStart = jest.fn().mockResolvedValue(undefined);
const mockContainerWait = jest.fn().mockResolvedValue({ StatusCode: 0 });
const mockContainerLogs = jest.fn().mockResolvedValue(Buffer.from('output'));
const mockContainerStop = jest.fn().mockResolvedValue(undefined);
const mockContainerRemove = jest.fn().mockResolvedValue(undefined);
const mockCreateContainer = jest.fn();

jest.mock('dockerode', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    createContainer: mockCreateContainer,
  })),
}));

function setupMockContainer() {
  const container = {
    start: mockContainerStart,
    wait: mockContainerWait,
    logs: mockContainerLogs,
    stop: mockContainerStop,
    remove: mockContainerRemove,
  };
  mockCreateContainer.mockResolvedValue(container);
  return container;
}

// ── Generators ──────────────────────────────────────────────────

/** Supported languages that map to sandbox images. */
const languageArb = fc.constantFrom('python', 'javascript');

/** Timeout in seconds: 1–120s covers realistic exercise configs. */
const timeoutArb = fc.integer({ min: 1, max: 120 });

/** Memory limit in MB: 64–2048 MB covers realistic exercise configs. */
const memoryArb = fc.integer({ min: 64, max: 2048 });

/** Arbitrary non-empty code string. */
const codeArb = fc.string({ minLength: 1, maxLength: 200 });

// ── Property 7: Docker Sandbox Isolation Invariants ─────────────

describe('Property 7: Docker Sandbox Isolation Invariants', () => {
  let service: CodeExecutionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    setupMockContainer();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CodeExecutionService],
    }).compile();

    service = module.get<CodeExecutionService>(CodeExecutionService);
  });

  it('container is always created with NetworkDisabled: true', async () => {
    await fc.assert(
      fc.asyncProperty(
        codeArb,
        languageArb,
        timeoutArb,
        memoryArb,
        async (code, language, timeout, memory) => {
          jest.clearAllMocks();
          setupMockContainer();

          await service.executeCode(code, language, timeout, memory);

          expect(mockCreateContainer).toHaveBeenCalledTimes(1);
          const config = mockCreateContainer.mock.calls[0][0];
          expect(config.NetworkDisabled).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('container is always created with ReadonlyRootfs: true', async () => {
    await fc.assert(
      fc.asyncProperty(
        codeArb,
        languageArb,
        timeoutArb,
        memoryArb,
        async (code, language, timeout, memory) => {
          jest.clearAllMocks();
          setupMockContainer();

          await service.executeCode(code, language, timeout, memory);

          expect(mockCreateContainer).toHaveBeenCalledTimes(1);
          const config = mockCreateContainer.mock.calls[0][0];
          expect(config.HostConfig.ReadonlyRootfs).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('container memory limit equals memoryLimitMb * 1024 * 1024', async () => {
    await fc.assert(
      fc.asyncProperty(
        codeArb,
        languageArb,
        timeoutArb,
        memoryArb,
        async (code, language, timeout, memory) => {
          jest.clearAllMocks();
          setupMockContainer();

          await service.executeCode(code, language, timeout, memory);

          expect(mockCreateContainer).toHaveBeenCalledTimes(1);
          const config = mockCreateContainer.mock.calls[0][0];
          const expectedBytes = memory * 1024 * 1024;
          expect(config.HostConfig.Memory).toBe(expectedBytes);
          expect(config.HostConfig.MemorySwap).toBe(expectedBytes);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('container NetworkMode is always "none"', async () => {
    await fc.assert(
      fc.asyncProperty(
        codeArb,
        languageArb,
        timeoutArb,
        memoryArb,
        async (code, language, timeout, memory) => {
          jest.clearAllMocks();
          setupMockContainer();

          await service.executeCode(code, language, timeout, memory);

          expect(mockCreateContainer).toHaveBeenCalledTimes(1);
          const config = mockCreateContainer.mock.calls[0][0];
          expect(config.HostConfig.NetworkMode).toBe('none');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('all isolation invariants hold simultaneously for any valid input', async () => {
    await fc.assert(
      fc.asyncProperty(
        codeArb,
        languageArb,
        timeoutArb,
        memoryArb,
        async (code, language, timeout, memory) => {
          jest.clearAllMocks();
          setupMockContainer();

          await service.executeCode(code, language, timeout, memory);

          expect(mockCreateContainer).toHaveBeenCalledTimes(1);
          const config = mockCreateContainer.mock.calls[0][0];

          // Req 4.1: network disabled + read-only root filesystem
          expect(config.NetworkDisabled).toBe(true);
          expect(config.HostConfig.ReadonlyRootfs).toBe(true);
          expect(config.HostConfig.NetworkMode).toBe('none');

          // Req 4.3: memory limit matches configured value
          const expectedBytes = memory * 1024 * 1024;
          expect(config.HostConfig.Memory).toBe(expectedBytes);
          expect(config.HostConfig.MemorySwap).toBe(expectedBytes);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 8: Docker Sandbox Output Capture ───────────────────

/**
 * **Validates: Requirements 4.4**
 *
 * For any code that produces stdout/stderr output, verify ExecutionResult
 * contains the complete captured text from the container logs.
 */
describe('Property 8: Docker Sandbox Output Capture', () => {
  let service: CodeExecutionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    setupMockContainer();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CodeExecutionService],
    }).compile();

    service = module.get<CodeExecutionService>(CodeExecutionService);
  });

  /** Arbitrary non-empty output text simulating container stdout/stderr. */
  const outputArb = fc.string({ minLength: 1, maxLength: 500 });

  it('ExecutionResult output contains the complete captured container log text', async () => {
    await fc.assert(
      fc.asyncProperty(
        codeArb,
        languageArb,
        outputArb,
        async (code, language, expectedOutput) => {
          jest.clearAllMocks();
          const container = setupMockContainer();
          container.logs.mockResolvedValue(Buffer.from(expectedOutput));

          const result = await service.executeCode(code, language);

          expect(result.output).toBe(expectedOutput.trim());
        },
      ),
      { numRuns: 100 },
    );
  });

  it('ExecutionResult output preserves multi-line container log text', async () => {
    /** Generator for multi-line output with at least one newline. */
    const multiLineArb = fc
      .array(fc.string({ minLength: 1, maxLength: 80 }), { minLength: 2, maxLength: 10 })
      .map((lines) => lines.join('\n'));

    await fc.assert(
      fc.asyncProperty(
        codeArb,
        languageArb,
        multiLineArb,
        async (code, language, multiLineOutput) => {
          jest.clearAllMocks();
          const container = setupMockContainer();
          container.logs.mockResolvedValue(Buffer.from(multiLineOutput));

          const result = await service.executeCode(code, language);

          expect(result.output).toBe(multiLineOutput.trim());
        },
      ),
      { numRuns: 100 },
    );
  });

  it('ExecutionResult output captures error output on non-zero exit code', async () => {
    await fc.assert(
      fc.asyncProperty(
        codeArb,
        languageArb,
        outputArb,
        async (code, language, errorOutput) => {
          jest.clearAllMocks();
          const container = setupMockContainer();
          container.wait.mockResolvedValue({ StatusCode: 1 });
          container.logs.mockResolvedValue(Buffer.from(errorOutput));

          const result = await service.executeCode(code, language);

          // On non-zero exit, stdout is still captured in output
          expect(result.output).toBe(errorOutput.trim());
          // Error field should contain the stderr text
          expect(result.error).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});
