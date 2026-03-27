-- Migration: 0002_enrollment_domain
-- Enrollment Domain: Learner, Track, Level, Module, Enrollment,
--   FoundationProgress, PerformanceGate, GateAttempt, Pod, PodMember, WaitlistEntry
-- Custom IDs: LRN-*, TRK-*, LVL-*, MOD-*, ENR-*, FND-*, PGT-*, GTA-*, POD-*, PDM-*, WTL-*

-- Enums
CREATE TYPE "LevelTier" AS ENUM (
  'Beginner',
  'Intermediate',
  'Advanced'
);

CREATE TYPE "TrackStatus" AS ENUM (
  'available',
  'waitlisted'
);

CREATE TYPE "EnrollmentStatus" AS ENUM (
  'active',
  'completed',
  'paused',
  'cancelled'
);

CREATE TYPE "PodStatus" AS ENUM (
  'pending',
  'active',
  'completed',
  'disbanded'
);

CREATE TYPE "PodMemberRole" AS ENUM (
  'ProductManager',
  'DataScientist',
  'AIEngineer',
  'CybersecurityAISecurity',
  'IndustrySpecialist',
  'DataEngineer',
  'DevOpsCloud',
  'BusinessAnalyst',
  'UXProductDesigner'
);

-- Learners table
CREATE TABLE "learners" (
  "id"                      TEXT        NOT NULL,
  "user_id"                 TEXT        NOT NULL,
  "country"                 TEXT,
  "professional_background" TEXT,
  "learning_goals"          TEXT,
  "onboarding_complete"     BOOLEAN     NOT NULL DEFAULT false,
  "created_at"              TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "learners_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "learners_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "learners_user_id_key" ON "learners" ("user_id");
CREATE INDEX "learners_user_id_idx" ON "learners" ("user_id");

-- Tracks table
CREATE TABLE "tracks" (
  "id"                 TEXT          NOT NULL,
  "name"               TEXT          NOT NULL,
  "description"        TEXT,
  "status"             "TrackStatus" NOT NULL DEFAULT 'available',
  "estimated_duration" TEXT,
  "created_at"         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "updated_at"         TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- Levels table
CREATE TABLE "levels" (
  "id"       TEXT        NOT NULL,
  "track_id" TEXT        NOT NULL,
  "tier"     "LevelTier" NOT NULL,
  "sequence" INTEGER     NOT NULL,

  CONSTRAINT "levels_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "levels_track_id_fkey"
    FOREIGN KEY ("track_id") REFERENCES "tracks" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "levels_track_id_idx" ON "levels" ("track_id");

-- Modules table
CREATE TABLE "modules" (
  "id"        TEXT    NOT NULL,
  "level_id"  TEXT    NOT NULL,
  "title"     TEXT    NOT NULL,
  "sequence"  INTEGER NOT NULL,
  "version"   INTEGER NOT NULL DEFAULT 1,
  "published" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "modules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "modules_level_id_fkey"
    FOREIGN KEY ("level_id") REFERENCES "levels" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "modules_level_id_idx" ON "modules" ("level_id");

-- Enrollments table
CREATE TABLE "enrollments" (
  "id"          TEXT               NOT NULL,
  "learner_id"  TEXT               NOT NULL,
  "track_id"    TEXT               NOT NULL,
  "status"      "EnrollmentStatus" NOT NULL DEFAULT 'active',
  "enrolled_at" TIMESTAMPTZ        NOT NULL DEFAULT now(),

  CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "enrollments_learner_id_fkey"
    FOREIGN KEY ("learner_id") REFERENCES "learners" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "enrollments_track_id_fkey"
    FOREIGN KEY ("track_id") REFERENCES "tracks" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "enrollments_learner_id_idx" ON "enrollments" ("learner_id");
CREATE INDEX "enrollments_track_id_idx" ON "enrollments" ("track_id");

-- Foundation Progress table
CREATE TABLE "foundation_progress" (
  "id"              TEXT        NOT NULL,
  "learner_id"      TEXT        NOT NULL,
  "module_statuses" JSONB       NOT NULL DEFAULT '[]',
  "completed"       BOOLEAN     NOT NULL DEFAULT false,
  "completed_at"    TIMESTAMPTZ,

  CONSTRAINT "foundation_progress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "foundation_progress_learner_id_fkey"
    FOREIGN KEY ("learner_id") REFERENCES "learners" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "foundation_progress_learner_id_key" ON "foundation_progress" ("learner_id");
CREATE INDEX "foundation_progress_learner_id_idx" ON "foundation_progress" ("learner_id");

-- Performance Gates table
CREATE TABLE "performance_gates" (
  "id"              TEXT    NOT NULL,
  "module_id"       TEXT    NOT NULL,
  "threshold_score" DOUBLE PRECISION NOT NULL,
  "max_attempts"    INTEGER NOT NULL DEFAULT 2,

  CONSTRAINT "performance_gates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "performance_gates_module_id_fkey"
    FOREIGN KEY ("module_id") REFERENCES "modules" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "performance_gates_module_id_idx" ON "performance_gates" ("module_id");

-- Gate Attempts table
CREATE TABLE "gate_attempts" (
  "id"             TEXT             NOT NULL,
  "gate_id"        TEXT             NOT NULL,
  "learner_id"     TEXT             NOT NULL,
  "score"          DOUBLE PRECISION NOT NULL,
  "passed"         BOOLEAN          NOT NULL,
  "attempt_number" INTEGER          NOT NULL,
  "attempted_at"   TIMESTAMPTZ      NOT NULL DEFAULT now(),

  CONSTRAINT "gate_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "gate_attempts_gate_id_fkey"
    FOREIGN KEY ("gate_id") REFERENCES "performance_gates" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "gate_attempts_learner_id_fkey"
    FOREIGN KEY ("learner_id") REFERENCES "learners" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "gate_attempts_gate_id_idx" ON "gate_attempts" ("gate_id");
CREATE INDEX "gate_attempts_learner_id_idx" ON "gate_attempts" ("learner_id");

-- Pods table
CREATE TABLE "pods" (
  "id"           TEXT        NOT NULL,
  "track_id"     TEXT        NOT NULL,
  "assessor_id"  TEXT        NOT NULL,
  "status"       "PodStatus" NOT NULL DEFAULT 'pending',
  "activated_at" TIMESTAMPTZ,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "pods_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pods_track_id_fkey"
    FOREIGN KEY ("track_id") REFERENCES "tracks" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "pods_assessor_id_fkey"
    FOREIGN KEY ("assessor_id") REFERENCES "users" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "pods_track_id_idx" ON "pods" ("track_id");
CREATE INDEX "pods_assessor_id_idx" ON "pods" ("assessor_id");

-- Pod Members table
CREATE TABLE "pod_members" (
  "id"          TEXT            NOT NULL,
  "pod_id"      TEXT            NOT NULL,
  "learner_id"  TEXT            NOT NULL,
  "role"        "PodMemberRole" NOT NULL,
  "assigned_at" TIMESTAMPTZ     NOT NULL DEFAULT now(),

  CONSTRAINT "pod_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pod_members_pod_id_fkey"
    FOREIGN KEY ("pod_id") REFERENCES "pods" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "pod_members_learner_id_fkey"
    FOREIGN KEY ("learner_id") REFERENCES "learners" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "pod_members_pod_id_idx" ON "pod_members" ("pod_id");
CREATE INDEX "pod_members_learner_id_idx" ON "pod_members" ("learner_id");

-- Waitlist Entries table
CREATE TABLE "waitlist_entries" (
  "id"                  TEXT        NOT NULL,
  "learner_id"          TEXT        NOT NULL,
  "track_id"            TEXT        NOT NULL,
  "position"            INTEGER     NOT NULL,
  "joined_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "notified_at"         TIMESTAMPTZ,
  "enrollment_deadline" TIMESTAMPTZ,

  CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "waitlist_entries_learner_id_fkey"
    FOREIGN KEY ("learner_id") REFERENCES "learners" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "waitlist_entries_track_id_fkey"
    FOREIGN KEY ("track_id") REFERENCES "tracks" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "waitlist_entries_learner_id_idx" ON "waitlist_entries" ("learner_id");
CREATE INDEX "waitlist_entries_track_id_idx" ON "waitlist_entries" ("track_id");