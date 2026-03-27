-- Migration: 0001_auth_domain
-- Auth Domain: User, Session, Role tables
-- Custom IDs: USR-*, SES-*, ROL-*

-- Enums
CREATE TYPE "UserRole" AS ENUM (
  'SuperAdmin',
  'Admin',
  'Instructor',
  'Assessor',
  'Learner',
  'CorporatePartner',
  'FinanceAdmin',
  'DevOpsEngineer'
);

CREATE TYPE "UserStatus" AS ENUM (
  'Active',
  'Inactive',
  'Suspended',
  'PendingVerification'
);

-- Users table
CREATE TABLE "users" (
  "id"             TEXT         NOT NULL,
  "email"          TEXT         NOT NULL,
  "password_hash"  TEXT         NOT NULL,
  "role"           "UserRole"   NOT NULL,
  "mfa_enabled"    BOOLEAN      NOT NULL DEFAULT false,
  "mfa_secret"     TEXT,
  "email_verified" BOOLEAN      NOT NULL DEFAULT false,
  "status"         "UserStatus" NOT NULL DEFAULT 'PendingVerification',
  "created_at"     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");

-- Sessions table
CREATE TABLE "sessions" (
  "id"             TEXT        NOT NULL,
  "user_id"        TEXT        NOT NULL,
  "jwt_token_hash" TEXT        NOT NULL,
  "expires_at"     TIMESTAMPTZ NOT NULL,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions" ("expires_at");

-- Roles table
CREATE TABLE "roles" (
  "id"          TEXT   NOT NULL,
  "name"        TEXT   NOT NULL,
  "permissions" TEXT[] NOT NULL DEFAULT '{}',

  CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_name_key" ON "roles" ("name");
