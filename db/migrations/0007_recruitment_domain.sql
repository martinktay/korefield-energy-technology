-- Migration: 0007_recruitment_domain
-- Adds recruitment pipeline tables for job openings and applications with ATS scoring

-- Job opening type enum
DO $$ BEGIN
  CREATE TYPE job_opening_type AS ENUM ('full_time', 'contract');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Job opening status enum
DO $$ BEGIN
  CREATE TYPE job_opening_status AS ENUM ('open', 'closed', 'filled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Application status enum
DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('new_application', 'in_review', 'shortlisted', 'interview', 'offer', 'hired', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Job openings table
CREATE TABLE IF NOT EXISTS job_openings (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  department       TEXT NOT NULL,
  type             job_opening_type NOT NULL DEFAULT 'full_time',
  location         TEXT NOT NULL,
  description      TEXT NOT NULL,
  responsibilities JSONB NOT NULL DEFAULT '[]',
  requirements     JSONB NOT NULL DEFAULT '[]',
  nice_to_have     JSONB NOT NULL DEFAULT '[]',
  keywords         JSONB NOT NULL DEFAULT '[]',
  status           job_opening_status NOT NULL DEFAULT 'open',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_openings_status ON job_openings(status);
CREATE INDEX IF NOT EXISTS idx_job_openings_department ON job_openings(department);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id               TEXT PRIMARY KEY,
  job_opening_id   TEXT NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
  applicant_name   TEXT NOT NULL,
  applicant_email  TEXT NOT NULL,
  cv_s3_key        TEXT NOT NULL,
  cv_filename      TEXT NOT NULL,
  cover_note       TEXT,
  ats_score        INTEGER NOT NULL DEFAULT 0,
  matched_keywords JSONB NOT NULL DEFAULT '[]',
  missing_keywords JSONB NOT NULL DEFAULT '[]',
  status           application_status NOT NULL DEFAULT 'new_application',
  reviewer_notes   TEXT,
  applied_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_job_opening ON applications(job_opening_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(applicant_email);
