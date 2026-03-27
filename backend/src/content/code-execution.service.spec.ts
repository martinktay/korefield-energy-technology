import { Test, TestingModule } from '@nestjs/testing';
import { CodeExecutionService, TestCase } from './code-execution.service';
import * as child_process from 'child_process';
import { EventEmitter } from 'events';

// Mock child_process.spawn
jest.mock('child_process');
const mockSpawn = child_process.spawn as jest.MockedFunction<typeof child_process.spawn>;

function createMockChildProcess() {
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();
  const child = new EventEmitter() as any;
  child.stdout = stdout;
  child.stderr = stderr;
  child.killed = false;
  child.kill = jest.fn(() => {
    child.killed = true;
  });
  return child;
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

  // ── executeCode ────────────────────────────────────────────────

  describe('executeCode', () => {
    it('should execute Python code via python3 -c and return output', async () => {
      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child as any);

      const promise = service.executeCode('print("hello")', 'python', 10, 256);

      // Simulate successful execution
      child.stdout.emit('data', Buffer.from('hello'));
      child.emit('close', 0, null);

      const result = await promise;

      expect(result.output).toBe('hello');
      expect(result.error).toBeUndefined();
      expect(result.execution_time_ms).toBeGreaterThanOrEqual(0);
      expect(mockSpawn).toHaveBeenCalledWith(
        'python3',
        ['-c', 'print("hello")'],
        expect.objectContaining({ timeout: 10000 }),
      );
    });

    it('should execute JavaScript code via node -e and return output', async () => {
      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child as any);

      const promise = service.executeCode('console.log("hi")', 'javascript', 10, 256);

      child.stdout.emit('data', Buffer.from('hi'));
      child.emit('close', 0, null);

      const result = await promise;

      expect(result.output).toBe('hi');
      expect(result.error).toBeUndefined();
      expect(mockSpawn).toHaveBeenCalledWith(
        'node',
        ['-e', 'console.log("hi")'],
        expect.objectContaining({ timeout: 10000 }),
      );
    });

    it('should return error when code has a runtime error (non-zero exit)', async () => {
      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child as any);

      const promise = service.executeCode('raise Exception("fail")', 'python', 10, 256);

      child.stderr.emit('data', Buffer.from('Exception: fail'));
      child.emit('close', 1, null);

      const result = await promise;

      expect(result.error).toBe('Exception: fail');
      expect(result.execution_time_ms).toBeGreaterThanOrEqual(0);
    });

    it('should return timeout error when execution exceeds time limit (SIGTERM)', async () => {
      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child as any);

      const promise = service.executeCode('import time; time.sleep(20)', 'python', 2, 256);

      // Simulate SIGTERM from timeout
      child.emit('close', null, 'SIGTERM');

      const result = await promise;

      expect(result.error).toContain('time limit');
      expect(result.error).toContain('2s');
    });

    it('should return error when spawn itself fails', async () => {
      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child as any);

      const promise = service.executeCode('code', 'python', 10, 256);

      child.emit('error', new Error('spawn ENOENT'));

      const result = await promise;

      expect(result.error).toContain('Execution failed');
      expect(result.error).toContain('spawn ENOENT');
    });

    it('should set NODE_OPTIONS with memory limit for JavaScript', async () => {
      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child as any);

      const promise = service.executeCode('console.log(1)', 'javascript', 10, 512);

      child.stdout.emit('data', Buffer.from('1'));
      child.emit('close', 0, null);

      await promise;

      expect(mockSpawn).toHaveBeenCalledWith(
        'node',
        ['-e', 'console.log(1)'],
        expect.objectContaining({
          env: expect.objectContaining({ NODE_OPTIONS: '--max-old-space-size=512' }),
        }),
      );
    });

    it('should handle SQL language as stub', async () => {
      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child as any);

      const promise = service.executeCode('SELECT 1', 'sql', 10, 256);

      child.stdout.emit('data', Buffer.from('SQL execution not yet supported in stub mode'));
      child.emit('close', 0, null);

      const result = await promise;

      expect(result.output).toContain('SQL');
      expect(mockSpawn).toHaveBeenCalledWith(
        'echo',
        ['SQL execution not yet supported in stub mode'],
        expect.any(Object),
      );
    });
  });

  // ── executeWithTests ───────────────────────────────────────────

  describe('executeWithTests', () => {
    it('should return raw output when no test cases provided', async () => {
      const child = createMockChildProcess();
      mockSpawn.mockReturnValue(child as any);

      const promise = service.executeWithTests(
        'print("hello")',
        'python',
        [],
        10,
        256,
      );

      child.stdout.emit('data', Buffer.from('hello'));
      child.emit('close', 0, null);

      const result = await promise;

      expect(result.output).toBe('hello');
      expect(result.test_results).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it('should run test cases and return pass/fail per test', async () => {
      const testCases: TestCase[] = [
        { input: 'print(add(1, 2))', expected_output: '3', description: 'adds 1 + 2' },
        { input: 'print(add(0, 0))', expected_output: '0', description: 'adds 0 + 0' },
      ];

      // Mock 3 calls: raw execution + 2 test cases
      const child1 = createMockChildProcess();
      const child2 = createMockChildProcess();
      const child3 = createMockChildProcess();
      mockSpawn
        .mockReturnValueOnce(child1 as any)
        .mockReturnValueOnce(child2 as any)
        .mockReturnValueOnce(child3 as any);

      const promise = service.executeWithTests(
        'def add(a, b): return a + b',
        'python',
        testCases,
        10,
        256,
      );

      // Raw execution (no output from function definition alone)
      child1.stdout.emit('data', Buffer.from(''));
      child1.emit('close', 0, null);

      // Wait for next tick to allow test case execution to start
      await new Promise((r) => setTimeout(r, 10));

      // Test case 1: passes
      child2.stdout.emit('data', Buffer.from('3'));
      child2.emit('close', 0, null);

      await new Promise((r) => setTimeout(r, 10));

      // Test case 2: passes
      child3.stdout.emit('data', Buffer.from('0'));
      child3.emit('close', 0, null);

      const result = await promise;

      expect(result.test_results).toHaveLength(2);
      expect(result.test_results[0]).toEqual({
        description: 'adds 1 + 2',
        passed: true,
        expected: '3',
        actual: '3',
      });
      expect(result.test_results[1]).toEqual({
        description: 'adds 0 + 0',
        passed: true,
        expected: '0',
        actual: '0',
      });
    });

    it('should report failing test with expected vs actual output', async () => {
      const testCases: TestCase[] = [
        { input: 'print(add(1, 2))', expected_output: '3', description: 'adds 1 + 2' },
      ];

      const child1 = createMockChildProcess();
      const child2 = createMockChildProcess();
      mockSpawn
        .mockReturnValueOnce(child1 as any)
        .mockReturnValueOnce(child2 as any);

      const promise = service.executeWithTests(
        'def add(a, b): return a - b',
        'python',
        testCases,
        10,
        256,
      );

      child1.stdout.emit('data', Buffer.from(''));
      child1.emit('close', 0, null);

      await new Promise((r) => setTimeout(r, 10));

      // Test returns wrong output
      child2.stdout.emit('data', Buffer.from('-1'));
      child2.emit('close', 0, null);

      const result = await promise;

      expect(result.test_results).toHaveLength(1);
      expect(result.test_results[0].passed).toBe(false);
      expect(result.test_results[0].expected).toBe('3');
      expect(result.test_results[0].actual).toBe('-1');
    });

    it('should report test as failed when execution errors occur', async () => {
      const testCases: TestCase[] = [
        { input: 'print(add(1, 2))', expected_output: '3', description: 'adds 1 + 2' },
      ];

      const child1 = createMockChildProcess();
      const child2 = createMockChildProcess();
      mockSpawn
        .mockReturnValueOnce(child1 as any)
        .mockReturnValueOnce(child2 as any);

      const promise = service.executeWithTests(
        'def add(a, b): return a + b',
        'python',
        testCases,
        10,
        256,
      );

      child1.stdout.emit('data', Buffer.from(''));
      child1.emit('close', 0, null);

      await new Promise((r) => setTimeout(r, 10));

      // Test case execution fails with error
      child2.stderr.emit('data', Buffer.from('NameError: name "add" is not defined'));
      child2.emit('close', 1, null);

      const result = await promise;

      expect(result.test_results[0].passed).toBe(false);
      expect(result.test_results[0].actual).toContain('Error:');
    });

    it('should accumulate execution time across all test runs', async () => {
      const testCases: TestCase[] = [
        { input: 'print(1)', expected_output: '1', description: 'test 1' },
        { input: 'print(2)', expected_output: '2', description: 'test 2' },
      ];

      const child1 = createMockChildProcess();
      const child2 = createMockChildProcess();
      const child3 = createMockChildProcess();
      mockSpawn
        .mockReturnValueOnce(child1 as any)
        .mockReturnValueOnce(child2 as any)
        .mockReturnValueOnce(child3 as any);

      const promise = service.executeWithTests('x = 1', 'python', testCases, 10, 256);

      child1.stdout.emit('data', Buffer.from(''));
      child1.emit('close', 0, null);

      await new Promise((r) => setTimeout(r, 10));

      child2.stdout.emit('data', Buffer.from('1'));
      child2.emit('close', 0, null);

      await new Promise((r) => setTimeout(r, 10));

      child3.stdout.emit('data', Buffer.from('2'));
      child3.emit('close', 0, null);

      const result = await promise;

      expect(result.execution_time_ms).toBeGreaterThanOrEqual(0);
      expect(result.test_results).toHaveLength(2);
    });
  });
});
