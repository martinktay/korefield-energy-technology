/**
 * Seed script for KoreField Academy content data.
 *
 * Seeds:
 *  - Lessons (2-3 per module for first 3 modules of AI Engineering Beginner)
 *  - Assessments (1 per module — performance gates and lab submissions)
 *  - Lab Sessions (2 scheduled sessions with instructors)
 *  - Coding Exercises (1 per interactive_code lesson with test cases)
 *
 * Idempotent — uses upsert to avoid duplicates on re-run.
 *
 * Usage: cd backend && pnpm ts-node --transpile-only ../db/seeds/seed-content.ts
 *
 * Depends on: seed-curriculum.ts (modules), seed-users.ts (instructors)
 */

import {
  PrismaClient,
  ContentType,
  LabSessionStatus,
  AssessmentType,
} from '@prisma/client';

const prisma = new PrismaClient();

// ─── Module IDs (from seed-curriculum.ts) ───────────────────────

const MOD_PYTHON = 'MOD-ai-eng-b01';   // Python for AI
const MOD_DS     = 'MOD-ai-eng-b02';   // Data Structures and Algorithms for AI
const MOD_API    = 'MOD-ai-eng-b03';   // REST APIs and HTTP Fundamentals

// ─── Instructor IDs (from seed-users.ts) ────────────────────────

const INSTRUCTOR_EMEKA = 'USR-emeka-003';
const INSTRUCTOR_AMINA = 'USR-amina-004';

// ─── Lesson Definitions ─────────────────────────────────────────

interface LessonSeed {
  id: string;
  module_id: string;
  title: string;
  content_type: ContentType;
  sequence: number;
}

const lessons: LessonSeed[] = [
  // MOD-ai-eng-b01: Python for AI
  { id: 'LSN-py-001', module_id: MOD_PYTHON, title: 'Variables and Data Types',              content_type: ContentType.text,             sequence: 1 },
  { id: 'LSN-py-002', module_id: MOD_PYTHON, title: 'Control Flow and Functions',            content_type: ContentType.interactive_code,  sequence: 2 },
  { id: 'LSN-py-003', module_id: MOD_PYTHON, title: 'Working with Lists and Dictionaries',   content_type: ContentType.interactive_code,  sequence: 3 },

  // MOD-ai-eng-b02: Data Structures and Algorithms for AI
  { id: 'LSN-ds-001', module_id: MOD_DS, title: 'Arrays and Linked Lists',              content_type: ContentType.text,             sequence: 1 },
  { id: 'LSN-ds-002', module_id: MOD_DS, title: 'Stacks, Queues, and Hash Maps',        content_type: ContentType.interactive_code,  sequence: 2 },

  // MOD-ai-eng-b03: REST APIs and HTTP Fundamentals
  { id: 'LSN-api-001', module_id: MOD_API, title: 'HTTP Methods and Status Codes',       content_type: ContentType.text,             sequence: 1 },
  { id: 'LSN-api-002', module_id: MOD_API, title: 'Building a REST Client in Python',    content_type: ContentType.interactive_code,  sequence: 2 },
];

// ─── Assessment Definitions ─────────────────────────────────────

interface AssessmentSeed {
  id: string;
  module_id: string;
  title: string;
  type: AssessmentType;
  max_score: number;
}

const assessments: AssessmentSeed[] = [
  { id: 'ASM-py-gate',  module_id: MOD_PYTHON, title: 'Python Fundamentals Gate',  type: AssessmentType.performance_gate, max_score: 100 },
  { id: 'ASM-ds-gate',  module_id: MOD_DS,     title: 'Data Structures Gate',      type: AssessmentType.performance_gate, max_score: 100 },
  { id: 'ASM-api-lab',  module_id: MOD_API,    title: 'REST API Lab Submission',   type: AssessmentType.lab_submission,   max_score: 100 },
];

// ─── Lab Session Definitions ────────────────────────────────────

interface LabSessionSeed {
  id: string;
  module_id: string;
  instructor_id: string;
  scheduled_at: Date;
  status: LabSessionStatus;
}

const labSessions: LabSessionSeed[] = [
  {
    id: 'LAB-py-001',
    module_id: MOD_PYTHON,
    instructor_id: INSTRUCTOR_EMEKA,
    scheduled_at: new Date('2025-03-15T10:00:00Z'),
    status: LabSessionStatus.scheduled,
  },
  {
    id: 'LAB-api-001',
    module_id: MOD_API,
    instructor_id: INSTRUCTOR_AMINA,
    scheduled_at: new Date('2025-03-20T14:00:00Z'),
    status: LabSessionStatus.scheduled,
  },
];

// ─── Coding Exercise Definitions ────────────────────────────────

interface TestCase {
  input: string;
  expected_output: string;
  description: string;
}

interface CodingExerciseSeed {
  id: string;
  lesson_id: string;
  language: string;
  starter_code: string;
  test_cases: TestCase[];
}

const codingExercises: CodingExerciseSeed[] = [
  {
    id: 'CEX-py-002',
    lesson_id: 'LSN-py-002',
    language: 'python',
    starter_code: `def greet(name: str) -> str:
    """Return a greeting message for the given name."""
    # TODO: Implement this function
    pass


def is_even(n: int) -> bool:
    """Return True if n is even, False otherwise."""
    # TODO: Implement this function
    pass`,
    test_cases: [
      { input: 'greet("Alice")', expected_output: '"Hello, Alice!"', description: 'greet returns correct greeting' },
      { input: 'is_even(4)', expected_output: 'True', description: 'is_even returns True for even number' },
      { input: 'is_even(7)', expected_output: 'False', description: 'is_even returns False for odd number' },
    ],
  },
  {
    id: 'CEX-py-003',
    lesson_id: 'LSN-py-003',
    language: 'python',
    starter_code: `def filter_positive(numbers: list[int]) -> list[int]:
    """Return a new list containing only positive numbers."""
    # TODO: Implement this function
    pass


def word_count(text: str) -> dict[str, int]:
    """Return a dictionary mapping each word to its count."""
    # TODO: Implement this function
    pass`,
    test_cases: [
      { input: 'filter_positive([-1, 2, -3, 4, 0])', expected_output: '[2, 4]', description: 'filters out non-positive numbers' },
      { input: 'filter_positive([])', expected_output: '[]', description: 'handles empty list' },
      { input: 'word_count("the cat sat on the mat")', expected_output: "{'the': 2, 'cat': 1, 'sat': 1, 'on': 1, 'mat': 1}", description: 'counts word frequencies' },
    ],
  },
  {
    id: 'CEX-ds-002',
    lesson_id: 'LSN-ds-002',
    language: 'python',
    starter_code: `class Stack:
    """A simple stack implementation using a list."""

    def __init__(self):
        self._items: list = []

    def push(self, item) -> None:
        """Push an item onto the stack."""
        # TODO: Implement
        pass

    def pop(self):
        """Remove and return the top item. Raise IndexError if empty."""
        # TODO: Implement
        pass

    def peek(self):
        """Return the top item without removing it. Raise IndexError if empty."""
        # TODO: Implement
        pass

    def is_empty(self) -> bool:
        """Return True if the stack is empty."""
        # TODO: Implement
        pass`,
    test_cases: [
      { input: 's = Stack(); s.push(1); s.push(2); s.pop()', expected_output: '2', description: 'pop returns last pushed item' },
      { input: 's = Stack(); s.is_empty()', expected_output: 'True', description: 'new stack is empty' },
    ],
  },
  {
    id: 'CEX-api-002',
    lesson_id: 'LSN-api-002',
    language: 'python',
    starter_code: `import requests


def get_user(base_url: str, user_id: int) -> dict:
    """Fetch a user by ID from the REST API. Return the JSON response as a dict."""
    # TODO: Make a GET request to {base_url}/users/{user_id}
    pass


def create_user(base_url: str, name: str, email: str) -> dict:
    """Create a new user via POST. Return the JSON response as a dict."""
    # TODO: Make a POST request to {base_url}/users with name and email
    pass`,
    test_cases: [
      { input: 'get_user("https://api.example.com", 1)', expected_output: '{"id": 1, "name": "Alice"}', description: 'GET request returns user data' },
      { input: 'create_user("https://api.example.com", "Bob", "bob@example.com")', expected_output: '{"id": 2, "name": "Bob", "email": "bob@example.com"}', description: 'POST request creates user' },
    ],
  },
];


// ─── Seed Functions ─────────────────────────────────────────────

async function seedLessons(): Promise<void> {
  console.log('Seeding lessons...');

  for (const lesson of lessons) {
    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: {
        module_id: lesson.module_id,
        title: lesson.title,
        content_type: lesson.content_type,
        sequence: lesson.sequence,
      },
      create: {
        id: lesson.id,
        module_id: lesson.module_id,
        title: lesson.title,
        content_type: lesson.content_type,
        sequence: lesson.sequence,
        version: 1,
      },
    });
  }

  console.log(`  ✓ ${lessons.length} lessons`);
}

async function seedAssessments(): Promise<void> {
  console.log('Seeding assessments...');

  for (const assessment of assessments) {
    await prisma.assessment.upsert({
      where: { id: assessment.id },
      update: {
        module_id: assessment.module_id,
        title: assessment.title,
        type: assessment.type,
        max_score: assessment.max_score,
      },
      create: {
        id: assessment.id,
        module_id: assessment.module_id,
        title: assessment.title,
        type: assessment.type,
        max_score: assessment.max_score,
        rubric: {},
      },
    });
  }

  console.log(`  ✓ ${assessments.length} assessments`);
}

async function seedLabSessions(): Promise<void> {
  console.log('Seeding lab sessions...');

  for (const lab of labSessions) {
    await prisma.labSession.upsert({
      where: { id: lab.id },
      update: {
        module_id: lab.module_id,
        instructor_id: lab.instructor_id,
        scheduled_at: lab.scheduled_at,
        status: lab.status,
      },
      create: {
        id: lab.id,
        module_id: lab.module_id,
        instructor_id: lab.instructor_id,
        scheduled_at: lab.scheduled_at,
        status: lab.status,
      },
    });
  }

  console.log(`  ✓ ${labSessions.length} lab sessions`);
}

async function seedCodingExercises(): Promise<void> {
  console.log('Seeding coding exercises...');

  for (const exercise of codingExercises) {
    await prisma.codingExercise.upsert({
      where: { id: exercise.id },
      update: {
        lesson_id: exercise.lesson_id,
        language: exercise.language,
        starter_code: exercise.starter_code,
        test_cases: exercise.test_cases,
      },
      create: {
        id: exercise.id,
        lesson_id: exercise.lesson_id,
        language: exercise.language,
        starter_code: exercise.starter_code,
        test_cases: exercise.test_cases,
        time_limit: 10,
        memory_limit: 256,
      },
    });
  }

  console.log(`  ✓ ${codingExercises.length} coding exercises`);
}

// ─── Main ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🌱 KoreField Academy — Content Seed\n');

  await seedLessons();
  await seedAssessments();
  await seedLabSessions();
  await seedCodingExercises();

  console.log('\n✅ Content seed complete.\n');
}

main()
  .catch((error) => {
    console.error('Content seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
