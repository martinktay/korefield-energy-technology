import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ContentService } from './content.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { CacheService } from '@common/cache/cache.service';
import { CodeExecutionService } from './code-execution.service';

const mockPrisma = {
  track: { findMany: jest.fn(), findUnique: jest.fn() },
  module: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  level: { findUnique: jest.fn() },
  labSession: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  submission: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  user: { findUnique: jest.fn() },
  learner: { findUnique: jest.fn() },
  lesson: { findUnique: jest.fn() },
  assessment: { findUnique: jest.fn() },
  contentVersion: { create: jest.fn() },
  codingExercise: { create: jest.fn(), findUnique: jest.fn() },
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockCodeExecution = {
  executeCode: jest.fn(),
  executeWithTests: jest.fn(),
};

describe('ContentService — Coding Exercise Management', () => {
  let service: ContentService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
        { provide: CodeExecutionService, useValue: mockCodeExecution },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
  });

  // ── POST /content/exercises — create coding exercise ───────────

  describe('createCodingExercise', () => {
    it('should create a coding exercise with CEX-* ID', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ id: 'LSN-001' });
      mockPrisma.codingExercise.create.mockResolvedValue({
        id: 'CEX-abc123',
        lesson_id: 'LSN-001',
        assessment_id: null,
        starter_code: 'def add(a, b):\n  pass',
        test_cases: [{ input: 'print(add(1,2))', expected_output: '3', description: 'basic add' }],
        language: 'python',
        time_limit: 10,
        memory_limit: 256,
      });

      const result = await service.createCodingExercise({
        lesson_id: 'LSN-001',
        starter_code: 'def add(a, b):\n  pass',
        test_cases: [{ input: 'print(add(1,2))', expected_output: '3', description: 'basic add' }],
        language: 'python',
      });

      expect(result.id).toMatch(/^CEX-/);
      expect(result.language).toBe('python');
      expect(mockPrisma.codingExercise.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.stringMatching(/^CEX-/),
          lesson_id: 'LSN-001',
          starter_code: 'def add(a, b):\n  pass',
          language: 'python',
          time_limit: 10,
          memory_limit: 256,
        }),
      });
    });

    it('should use custom time and memory limits when provided', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ id: 'LSN-001' });
      mockPrisma.codingExercise.create.mockResolvedValue({
        id: 'CEX-abc123',
        time_limit: 5,
        memory_limit: 512,
      });

      await service.createCodingExercise({
        lesson_id: 'LSN-001',
        starter_code: 'code',
        test_cases: [],
        language: 'javascript',
        time_limit: 5,
        memory_limit: 512,
      });

      expect(mockPrisma.codingExercise.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          time_limit: 5,
          memory_limit: 512,
        }),
      });
    });

    it('should throw BadRequestException when neither lesson_id nor assessment_id provided', async () => {
      await expect(
        service.createCodingExercise({
          starter_code: 'code',
          test_cases: [],
          language: 'python',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when lesson does not exist', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(null);

      await expect(
        service.createCodingExercise({
          lesson_id: 'LSN-missing',
          starter_code: 'code',
          test_cases: [],
          language: 'python',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when assessment does not exist', async () => {
      mockPrisma.assessment.findUnique.mockResolvedValue(null);

      await expect(
        service.createCodingExercise({
          assessment_id: 'ASM-missing',
          starter_code: 'code',
          test_cases: [],
          language: 'python',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow creating exercise linked to an assessment', async () => {
      mockPrisma.assessment.findUnique.mockResolvedValue({ id: 'ASM-001' });
      mockPrisma.codingExercise.create.mockResolvedValue({
        id: 'CEX-def456',
        lesson_id: null,
        assessment_id: 'ASM-001',
        language: 'javascript',
      });

      const result = await service.createCodingExercise({
        assessment_id: 'ASM-001',
        starter_code: 'function solve() {}',
        test_cases: [],
        language: 'javascript',
      });

      expect(result.assessment_id).toBe('ASM-001');
    });
  });

  // ── GET /content/exercises/:exerciseId ─────────────────────────

  describe('getCodingExercise', () => {
    it('should return exercise details', async () => {
      mockPrisma.codingExercise.findUnique.mockResolvedValue({
        id: 'CEX-abc123',
        starter_code: 'def add(a, b): pass',
        test_cases: [{ input: 'print(add(1,2))', expected_output: '3', description: 'basic' }],
        language: 'python',
        time_limit: 10,
        memory_limit: 256,
      });

      const result = await service.getCodingExercise('CEX-abc123');

      expect(result.id).toBe('CEX-abc123');
      expect(result.language).toBe('python');
      expect(result.starter_code).toBe('def add(a, b): pass');
    });

    it('should throw NotFoundException when exercise does not exist', async () => {
      mockPrisma.codingExercise.findUnique.mockResolvedValue(null);

      await expect(
        service.getCodingExercise('CEX-missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── POST /content/exercises/:exerciseId/execute ────────────────

  describe('executeExercise', () => {
    const exercise = {
      id: 'CEX-abc123',
      starter_code: 'def add(a, b): pass',
      test_cases: [
        { input: 'print(add(1,2))', expected_output: '3', description: 'adds 1+2' },
        { input: 'print(add(0,0))', expected_output: '0', description: 'adds 0+0' },
      ],
      language: 'python',
      time_limit: 10,
      memory_limit: 256,
    };

    it('should execute code and return test results', async () => {
      mockPrisma.codingExercise.findUnique.mockResolvedValue(exercise);
      mockCodeExecution.executeWithTests.mockResolvedValue({
        output: '',
        test_results: [
          { description: 'adds 1+2', passed: true, expected: '3', actual: '3' },
          { description: 'adds 0+0', passed: true, expected: '0', actual: '0' },
        ],
        execution_time_ms: 150,
      });

      const result = await service.executeExercise('CEX-abc123', {
        code: 'def add(a, b): return a + b',
      });

      expect(result.test_results).toHaveLength(2);
      expect(result.test_results[0].passed).toBe(true);
      expect(result.test_results[1].passed).toBe(true);
      expect(result.execution_time_ms).toBe(150);
      expect(mockCodeExecution.executeWithTests).toHaveBeenCalledWith(
        'def add(a, b): return a + b',
        'python',
        exercise.test_cases,
        10,
        256,
      );
    });

    it('should use exercise language when dto.language is not provided', async () => {
      mockPrisma.codingExercise.findUnique.mockResolvedValue(exercise);
      mockCodeExecution.executeWithTests.mockResolvedValue({
        output: '',
        test_results: [],
        execution_time_ms: 50,
      });

      await service.executeExercise('CEX-abc123', { code: 'print(1)' });

      expect(mockCodeExecution.executeWithTests).toHaveBeenCalledWith(
        'print(1)',
        'python',
        expect.any(Array),
        10,
        256,
      );
    });

    it('should allow overriding language via dto', async () => {
      mockPrisma.codingExercise.findUnique.mockResolvedValue(exercise);
      mockCodeExecution.executeWithTests.mockResolvedValue({
        output: 'hi',
        test_results: [],
        execution_time_ms: 30,
      });

      await service.executeExercise('CEX-abc123', {
        code: 'console.log("hi")',
        language: 'javascript',
      });

      expect(mockCodeExecution.executeWithTests).toHaveBeenCalledWith(
        'console.log("hi")',
        'javascript',
        expect.any(Array),
        10,
        256,
      );
    });

    it('should throw NotFoundException when exercise does not exist', async () => {
      mockPrisma.codingExercise.findUnique.mockResolvedValue(null);

      await expect(
        service.executeExercise('CEX-missing', { code: 'print(1)' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return error when execution times out', async () => {
      mockPrisma.codingExercise.findUnique.mockResolvedValue(exercise);
      mockCodeExecution.executeWithTests.mockResolvedValue({
        output: '',
        test_results: [],
        execution_time_ms: 10000,
        error: 'Execution terminated: time limit of 10s exceeded',
      });

      const result = await service.executeExercise('CEX-abc123', {
        code: 'import time; time.sleep(20)',
      });

      expect(result.error).toContain('time limit');
    });

    it('should return failing test results with expected vs actual', async () => {
      mockPrisma.codingExercise.findUnique.mockResolvedValue(exercise);
      mockCodeExecution.executeWithTests.mockResolvedValue({
        output: '',
        test_results: [
          { description: 'adds 1+2', passed: false, expected: '3', actual: '-1' },
          { description: 'adds 0+0', passed: true, expected: '0', actual: '0' },
        ],
        execution_time_ms: 200,
      });

      const result = await service.executeExercise('CEX-abc123', {
        code: 'def add(a, b): return a - b',
      });

      expect(result.test_results[0].passed).toBe(false);
      expect(result.test_results[0].expected).toBe('3');
      expect(result.test_results[0].actual).toBe('-1');
      expect(result.test_results[1].passed).toBe(true);
    });
  });
});
