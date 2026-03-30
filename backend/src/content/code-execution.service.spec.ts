/**
 * @file code-execution.service.spec.ts
 * Tests for the Docker-sandboxed code execution service.
 * Mocks dockerode to verify container creation, isolation settings,
 * timeout handling, and output capture.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CodeExecutionService, TestCase } from './code-execution.service';

// Mock dockerode
const mockContainerWait = jest.fn();
const mockContainerLogs = jest.fn();
const mockContainerStart = jest.fn();
const mockContainerStop = jest.fn();
const mockContainerRemove = jest.fn();
const mockCreateContainer = jest.fn();

jest.mock('dockerode', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      createContainer: mockCreateContainer,
    })),
  };
});

function setupMockContainer(opts: {
  exitCode?: number;
  output?: string;
  startError?: Error;
}) {
  const container = {
    start: opts.startError
      ? jest.fn().mockRejectedValue(opts.startError)
      : mockContainerStart.mockResolvedValue(undefined),
    wait: mockContainerWait.mockResolvedValue({ StatusCode: opts.exitCode ?? 0 }),
    logs: mockContainerLogs.mockResolvedValue(Buffer.from(opts.output ?? '')),
    stop: mockContainerStop.mockResolvedValue(undefined),
    remove: mockContainerRemove.mockResolvedValue(undefined),
  };
  mockCreateContainer.mockResolvedValue(container);
  return container;
}

describe('CodeExecutionService', () => {
  let service: CodeExecutionService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CodeExecutionService],
    }).compile();

    service = module.get<CodeExecutionService>(CodeExecutionService);
  });

  describe('executeCode', () => {
    it('should create a Docker container with correct isolation settings', async () => {
      setupMockContainer({ output: 'hello', exitCode: 0 });

      await service.executeCode('print("hello")', 'python', 10, 256);

      expect(mockCreateContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          Image: 'kf-sandbox-python:latest',
          Cmd: ['python3', '-c', 'print("hello")'],
          NetworkDisabled: true,
          HostConfig: expect.objectContaining({
            ReadonlyRootfs: true,
            Memory: 256 * 1024 * 1024,
            MemorySwap: 256 * 1024 * 1024,
            NetworkMode: 'none',
          }),
        }),
      );
    });

    it('should use kf-sandbox-node image for JavaScript', async () => {
      setupMockContainer({ output: 'hi', exitCode: 0 });

      await service.executeCode('console.log("hi")', 'javascript', 10, 256);

      expect(mockCreateContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          Image: 'kf-sandbox-node:latest',
          Cmd: ['node', '-e', 'console.log("hi")'],
        }),
      );
    });

    it('should return output from successful execution', async () => {
      setupMockContainer({ output: 'hello world', exitCode: 0 });

      const result = await service.executeCode('print("hello world")', 'python', 10, 256);

      expect(result.output).toBe('hello world');
      expect(result.error).toBeUndefined();
      expect(result.execution_time_ms).toBeGreaterThanOrEqual(0);
    });

    it('should return error when container exits with non-zero code', async () => {
      setupMockContainer({ output: 'NameError: name "x" is not defined', exitCode: 1 });

      const result = await service.executeCode('print(x)', 'python', 10, 256);

      expect(result.error).toBeDefined();
      expect(result.execution_time_ms).toBeGreaterThanOrEqual(0);
    });

    it('should return error for unsupported language', async () => {
      const result = await service.executeCode('SELECT 1', 'sql', 10, 256);

      expect(result.error).toContain('Unsupported language');
      expect(mockCreateContainer).not.toHaveBeenCalled();
    });

    it('should throw HTTP 503 when Docker daemon is unavailable', async () => {
      mockCreateContainer.mockRejectedValue(new Error('connect ECONNREFUSED'));

      await expect(
        service.executeCode('print(1)', 'python', 10, 256),
      ).rejects.toThrow(HttpException);

      try {
        await service.executeCode('print(1)', 'python', 10, 256);
      } catch (err) {
        expect((err as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        expect((err as HttpException).message).toContain('temporarily unavailable');
      }
    });

    it('should clean up container after execution', async () => {
      const container = setupMockContainer({ output: 'done', exitCode: 0 });

      await service.executeCode('print("done")', 'python', 10, 256);

      expect(container.remove).toHaveBeenCalledWith({ force: true });
    });

    it('should apply correct memory limit in bytes', async () => {
      setupMockContainer({ output: '', exitCode: 0 });

      await service.executeCode('x = 1', 'python', 10, 512);

      expect(mockCreateContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          HostConfig: expect.objectContaining({
            Memory: 512 * 1024 * 1024,
          }),
        }),
      );
    });
  });

  describe('executeWithTests', () => {
    it('should return raw output when no test cases provided', async () => {
      setupMockContainer({ output: 'hello', exitCode: 0 });

      const result = await service.executeWithTests('print("hello")', 'python', [], 10, 256);

      expect(result.output).toBe('hello');
      expect(result.test_results).toEqual([]);
    });

    it('should run test cases and return pass/fail per test', async () => {
      const testCases: TestCase[] = [
        { input: 'print(add(1, 2))', expected_output: '3', description: 'adds 1 + 2' },
        { input: 'print(add(0, 0))', expected_output: '0', description: 'adds 0 + 0' },
      ];

      // Mock 3 calls: raw execution + 2 test cases
      mockCreateContainer
        .mockResolvedValueOnce({
          start: jest.fn().mockResolvedValue(undefined),
          wait: jest.fn().mockResolvedValue({ StatusCode: 0 }),
          logs: jest.fn().mockResolvedValue(Buffer.from('')),
          stop: jest.fn().mockResolvedValue(undefined),
          remove: jest.fn().mockResolvedValue(undefined),
        })
        .mockResolvedValueOnce({
          start: jest.fn().mockResolvedValue(undefined),
          wait: jest.fn().mockResolvedValue({ StatusCode: 0 }),
          logs: jest.fn().mockResolvedValue(Buffer.from('3')),
          stop: jest.fn().mockResolvedValue(undefined),
          remove: jest.fn().mockResolvedValue(undefined),
        })
        .mockResolvedValueOnce({
          start: jest.fn().mockResolvedValue(undefined),
          wait: jest.fn().mockResolvedValue({ StatusCode: 0 }),
          logs: jest.fn().mockResolvedValue(Buffer.from('0')),
          stop: jest.fn().mockResolvedValue(undefined),
          remove: jest.fn().mockResolvedValue(undefined),
        });

      const result = await service.executeWithTests(
        'def add(a, b): return a + b',
        'python',
        testCases,
        10,
        256,
      );

      expect(result.test_results).toHaveLength(2);
      expect(result.test_results[0].passed).toBe(true);
      expect(result.test_results[0].expected).toBe('3');
      expect(result.test_results[0].actual).toBe('3');
      expect(result.test_results[1].passed).toBe(true);
    });

    it('should report failing test with expected vs actual output', async () => {
      const testCases: TestCase[] = [
        { input: 'print(add(1, 2))', expected_output: '3', description: 'adds 1 + 2' },
      ];

      mockCreateContainer
        .mockResolvedValueOnce({
          start: jest.fn().mockResolvedValue(undefined),
          wait: jest.fn().mockResolvedValue({ StatusCode: 0 }),
          logs: jest.fn().mockResolvedValue(Buffer.from('')),
          stop: jest.fn().mockResolvedValue(undefined),
          remove: jest.fn().mockResolvedValue(undefined),
        })
        .mockResolvedValueOnce({
          start: jest.fn().mockResolvedValue(undefined),
          wait: jest.fn().mockResolvedValue({ StatusCode: 0 }),
          logs: jest.fn().mockResolvedValue(Buffer.from('-1')),
          stop: jest.fn().mockResolvedValue(undefined),
          remove: jest.fn().mockResolvedValue(undefined),
        });

      const result = await service.executeWithTests(
        'def add(a, b): return a - b',
        'python',
        testCases,
        10,
        256,
      );

      expect(result.test_results[0].passed).toBe(false);
      expect(result.test_results[0].expected).toBe('3');
      expect(result.test_results[0].actual).toBe('-1');
    });
  });
});
