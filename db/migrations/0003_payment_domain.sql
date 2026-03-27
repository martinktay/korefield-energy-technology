-- Migration: 0003_payment_domain
-- Payment Domain: PricingConfig, CountryBand, PaymentPlan, Installment, Campaign, Scholarship
-- Custom IDs: PRC-*, CBN-*, PAY-*, IST-*, CMP-*, SCH-*

-- Enums
CREATE TYPE "PaymentPlanType" AS ENUM (
  'full',
  'two_pay',
  'three_pay'
);

CREATE TYPE "PaymentPlanStatus" AS ENUM (
  'active',
  'completed',
  'paused',
  'cancelled'
);

CREATE TYPE "InstallmentStatus" AS ENUM (
  'pending',
  'paid',
  'overdue',
  'paused'
);

-- Pricing Configs table
CREATE TABLE "pricing_configs" (
  "id"             TEXT             NOT NULL,
  "track_id"       TEXT             NOT NULL,
  "base_price"     DOUBLE PRECISION NOT NULL,
  "floor_price"    DOUBLE PRECISION NOT NULL,
  "ceiling_price"  DOUBLE PRECISION NOT NULL,
  "effective_from" TIMESTAMPTZ      NOT NULL,

  CONSTRAINT "pricing_configs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pricing_configs_track_id_fkey"
    FOREIGN KEY ("track_id") REFERENCES "tracks" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "pricing_configs_track_id_idx" ON "pricing_configs" ("track_id");

-- Country Bands table
CREATE TABLE "country_bands" (
  "id"                    TEXT             NOT NULL,
  "country_code"          TEXT             NOT NULL,
  "purchasing_power_band" TEXT             NOT NULL,
  "multiplier"            DOUBLE PRECISION NOT NULL,

  CONSTRAINT "country_bands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "country_bands_country_code_key" ON "country_bands" ("country_code");


-- Payment Plans table
CREATE TABLE "payment_plans" (
  "id"            TEXT               NOT NULL,
  "enrollment_id" TEXT               NOT NULL,
  "plan_type"     "PaymentPlanType"  NOT NULL,
  "total_amount"  DOUBLE PRECISION   NOT NULL,
  "currency"      TEXT               NOT NULL,
  "status"        "PaymentPlanStatus" NOT NULL DEFAULT 'active',
  "created_at"    TIMESTAMPTZ        NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMPTZ        NOT NULL DEFAULT now(),

  CONSTRAINT "payment_plans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_plans_enrollment_id_fkey"
    FOREIGN KEY ("enrollment_id") REFERENCES "enrollments" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "payment_plans_enrollment_id_idx" ON "payment_plans" ("enrollment_id");

-- Installments table
CREATE TABLE "installments" (
  "id"               TEXT                NOT NULL,
  "plan_id"          TEXT                NOT NULL,
  "sequence"         INTEGER             NOT NULL,
  "amount"           DOUBLE PRECISION    NOT NULL,
  "due_date"         TIMESTAMPTZ         NOT NULL,
  "paid_at"          TIMESTAMPTZ,
  "status"           "InstallmentStatus" NOT NULL DEFAULT 'pending',
  "grace_period_end" TIMESTAMPTZ,

  CONSTRAINT "installments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "installments_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "payment_plans" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "installments_plan_id_idx" ON "installments" ("plan_id");

-- Campaigns table
CREATE TABLE "campaigns" (
  "id"             TEXT             NOT NULL,
  "name"           TEXT             NOT NULL,
  "discount_type"  TEXT             NOT NULL,
  "discount_value" DOUBLE PRECISION NOT NULL,
  "active_from"    TIMESTAMPTZ      NOT NULL,
  "active_to"      TIMESTAMPTZ      NOT NULL,
  "created_at"     TIMESTAMPTZ      NOT NULL DEFAULT now(),

  CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- Scholarships table
CREATE TABLE "scholarships" (
  "id"                TEXT             NOT NULL,
  "learner_id"        TEXT             NOT NULL,
  "adjustment_amount" DOUBLE PRECISION NOT NULL,
  "approved_by"       TEXT             NOT NULL,
  "approved_at"       TIMESTAMPTZ      NOT NULL,

  CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "scholarships_learner_id_fkey"
    FOREIGN KEY ("learner_id") REFERENCES "learners" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "scholarships_learner_id_idx" ON "scholarships" ("learner_id");
