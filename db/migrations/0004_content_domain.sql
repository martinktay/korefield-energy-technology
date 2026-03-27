-- Migration: 0004_content_domain
-- Content Domain: Lesson, Assessment, LabSession, CodingExercise, Submission, ContentVersion
-- Custom IDs: LSN-*, ASM-*, LAB-*, CEX-*, SUB-*, CVR-*

-- Enums
CREATE TYPE "ContentType" AS ENUM (
  'text',
  'video',
  'interactive_code',
  'quiz',
  'downloadable'
);

CREATE TYPE "LabSessionStatus" AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE "AssessmentType" AS ENUM (
  'quiz',
  'code_exercise',
  'lab_submission',
  'pod_deliverable',
  'peer_review',
  'capstone_defense',
  'performance_gate'
);

CREATE TYPE "SubmissionStatus" AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'graded',
  'resubmission_requested',
  'resubmitted'
);

-- Lessons table
CREATE TABLE "lessons" (
  "id"           TEXT          NOT NULL,
  "module_id"    TEXT          NOT NULL,
  "title"        TEXT          NOT NULL,
  "content_type" "ContentType" NOT NULL,
  "sequence"     INTEGER       NOT NULL,
  "version"      INTEGER       NOT NULL DEFAULT 1,
  "created_at"   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "updated_at"   TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT "lessons_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lessons_module_id_fkey"
    FOREIGN KEY ("module_id") REFERENCES "modules" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "lessons_module_id_idx" ON "lessons" ("module_id");

-- Assessments table
CREATE TABLE "assessments" (
  "id"         TEXT             NOT NULL,
  "module_id"  TEXT             NOT NULL,
  "title"      TEXT             NOT NULL,
  "rubric"     JSONB            NOT NULL DEFAULT '{}',
  "max_score"  DOUBLE PRECISION NOT NULL,
  "type"       "AssessmentType" NOT NULL,
  "created_at" TIMESTAMPTZ      NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ      NOT NULL DEFAULT now(),

  CONSTRAINT "assessments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assessments_module_id_fkey"
    FOREIGN KEY ("module_id") REFERENCES "modules" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "assessments_module_id_idx" ON "assessments" ("module_id");

-- Lab Sessions table
CREATE TABLE "lab_sessions" (
  "id"            TEXT               NOT NULL,
  "module_id"     TEXT               NOT NULL,
  "instructor_id" TEXT               NOT NULL,
  "scheduled_at"  TIMESTAMPTZ        NOT NULL,
  "recording_url" TEXT,
  "status"        "LabSessionStatus" NOT NULL DEFAULT 'scheduled',
  "created_at"    TIMESTAMPTZ        NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMPTZ        NOT NULL DEFAULT now(),

  CONSTRAINT "lab_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lab_sessions_module_id_fkey"
    FOREIGN KEY ("module_id") REFERENCES "modules" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "lab_sessions_instructor_id_fkey"
    FOREIGN KEY ("instructor_id") REFERENCES "users" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "lab_sessions_module_id_idx" ON "lab_sessions" ("module_id");
CREATE INDEX "lab_sessions_instructor_id_idx" ON "lab_sessions" ("instructor_id");

-- Coding Exercises table
CREATE TABLE "coding_exercises" (
  "id"            TEXT        NOT NULL,
  "lesson_id"     TEXT,
  "assessment_id" TEXT,
  "starter_code"  TEXT        NOT NULL DEFAULT '',
  "test_cases"    JSONB       NOT NULL DEFAULT '[]',
  "language"      TEXT        NOT NULL DEFAULT 'python',
  "time_limit"    INTEGER     NOT NULL DEFAULT 10,
  "memory_limit"  INTEGER     NOT NULL DEFAULT 256,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "coding_exercises_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "coding_exercises_lesson_id_fkey"
    FOREIGN KEY ("lesson_id") REFERENCES "lessons" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "coding_exercises_assessment_id_fkey"
    FOREIGN KEY ("assessment_id") REFERENCES "assessments" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "coding_exercises_lesson_id_idx" ON "coding_exercises" ("lesson_id");
CREATE INDEX "coding_exercises_assessment_id_idx" ON "coding_exercises" ("assessment_id");

-- Submissions table
CREATE TABLE "submissions" (
  "id"            TEXT               NOT NULL,
  "learner_id"    TEXT               NOT NULL,
  "assessment_id" TEXT,
  "exercise_id"   TEXT,
  "content"       TEXT               NOT NULL DEFAULT '',
  "score"         DOUBLE PRECISION,
  "status"        "SubmissionStatus" NOT NULL DEFAULT 'draft',
  "submitted_at"  TIMESTAMPTZ,
  "created_at"    TIMESTAMPTZ        NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMPTZ        NOT NULL DEFAULT now(),

  CONSTRAINT "submissions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "submissions_learner_id_fkey"
    FOREIGN KEY ("learner_id") REFERENCES "learners" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "submissions_assessment_id_fkey"
    FOREIGN KEY ("assessment_id") REFERENCES "assessments" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "submissions_exercise_id_fkey"
    FOREIGN KEY ("exercise_id") REFERENCES "coding_exercises" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "submissions_learner_id_idx" ON "submissions" ("learner_id");
CREATE INDEX "submissions_assessment_id_idx" ON "submissions" ("assessment_id");
CREATE INDEX "submissions_exercise_id_idx" ON "submissions" ("exercise_id");

-- Content Versions table
CREATE TABLE "content_versions" (
  "id"               TEXT        NOT NULL,
  "module_id"        TEXT        NOT NULL,
  "version_number"   INTEGER     NOT NULL,
  "published_at"     TIMESTAMPTZ,
  "content_snapshot" JSONB       NOT NULL DEFAULT '{}',
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "content_versions_module_id_fkey"
    FOREIGN KEY ("module_id") REFERENCES "modules" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "content_versions_module_id_idx" ON "content_versions" ("module_id");
