-- Migration: 0006_certification_domain
-- Certification Domain: Capstone, CapstoneDefense, Certificate, CertificationEligibility
-- Custom IDs: CPS-*, DEF-*, CRT-*, CEL-*

-- Enums
CREATE TYPE "CapstoneStatus" AS ENUM (
  'locked',
  'unlocked',
  'submitted',
  'evaluated'
);

CREATE TYPE "CertificateStatus" AS ENUM (
  'active',
  'revoked'
);

-- Capstones table
CREATE TABLE "capstones" (
  "id"           TEXT             NOT NULL,
  "learner_id"   TEXT             NOT NULL,
  "track_id"     TEXT             NOT NULL,
  "status"       "CapstoneStatus" NOT NULL DEFAULT 'locked',
  "submitted_at" TIMESTAMPTZ,
  "result"       TEXT,
  "feedback"     TEXT,
  "created_at"   TIMESTAMPTZ      NOT NULL DEFAULT now(),
  "updated_at"   TIMESTAMPTZ      NOT NULL DEFAULT now(),

  CONSTRAINT "capstones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "capstones_learner_id_fkey"
    FOREIGN KEY ("learner_id") REFERENCES "learners" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "capstones_track_id_fkey"
    FOREIGN KEY ("track_id") REFERENCES "tracks" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "capstones_learner_id_idx" ON "capstones" ("learner_id");
CREATE INDEX "capstones_track_id_idx" ON "capstones" ("track_id");

-- Capstone Defenses table
CREATE TABLE "capstone_defenses" (
  "id"                 TEXT        NOT NULL,
  "capstone_id"        TEXT        NOT NULL,
  "panel_assessor_ids" TEXT[]      NOT NULL,
  "scheduled_at"       TIMESTAMPTZ NOT NULL,
  "result"             TEXT,
  "feedback"           TEXT,
  "created_at"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "capstone_defenses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "capstone_defenses_capstone_id_fkey"
    FOREIGN KEY ("capstone_id") REFERENCES "capstones" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "capstone_defenses_capstone_id_idx" ON "capstone_defenses" ("capstone_id");

-- Certificates table
CREATE TABLE "certificates" (
  "id"                TEXT                NOT NULL,
  "learner_id"        TEXT                NOT NULL,
  "track_id"          TEXT                NOT NULL,
  "verification_code" TEXT                NOT NULL,
  "issued_at"         TIMESTAMPTZ         NOT NULL DEFAULT now(),
  "status"            "CertificateStatus" NOT NULL DEFAULT 'active',
  "revocation_reason" TEXT,
  "created_at"        TIMESTAMPTZ         NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ         NOT NULL DEFAULT now(),

  CONSTRAINT "certificates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "certificates_verification_code_key" UNIQUE ("verification_code"),
  CONSTRAINT "certificates_learner_id_fkey"
    FOREIGN KEY ("learner_id") REFERENCES "learners" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "certificates_track_id_fkey"
    FOREIGN KEY ("track_id") REFERENCES "tracks" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "certificates_learner_id_idx" ON "certificates" ("learner_id");
CREATE INDEX "certificates_track_id_idx" ON "certificates" ("track_id");
CREATE INDEX "certificates_verification_code_idx" ON "certificates" ("verification_code");

-- Certification Eligibilities table
CREATE TABLE "certification_eligibilities" (
  "id"                        TEXT        NOT NULL,
  "learner_id"                TEXT        NOT NULL,
  "track_id"                  TEXT        NOT NULL,
  "foundation_complete"       BOOLEAN     NOT NULL DEFAULT false,
  "levels_complete"           BOOLEAN     NOT NULL DEFAULT false,
  "pod_deliverables_complete" BOOLEAN     NOT NULL DEFAULT false,
  "capstone_passed"           BOOLEAN     NOT NULL DEFAULT false,
  "assessor_approved"         BOOLEAN     NOT NULL DEFAULT false,
  "payment_cleared"           BOOLEAN     NOT NULL DEFAULT false,
  "eligible"                  BOOLEAN     NOT NULL DEFAULT false,
  "created_at"                TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"                TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "certification_eligibilities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "certification_eligibilities_learner_id_fkey"
    FOREIGN KEY ("learner_id") REFERENCES "learners" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "certification_eligibilities_track_id_fkey"
    FOREIGN KEY ("track_id") REFERENCES "tracks" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "certification_eligibilities_learner_id_idx" ON "certification_eligibilities" ("learner_id");
CREATE INDEX "certification_eligibilities_track_id_idx" ON "certification_eligibilities" ("track_id");
