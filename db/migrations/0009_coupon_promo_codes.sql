-- Migration: 0009_coupon_promo_codes
-- Adds coupon/promo code system for Super Admin to create track-specific discount codes.
-- Supports percentage, fixed amount, and full access (100% off) discount types.

CREATE TYPE coupon_status AS ENUM ('active', 'expired', 'exhausted', 'disabled');

CREATE TABLE coupons (
  id              TEXT PRIMARY KEY,
  code            TEXT UNIQUE NOT NULL,
  description     TEXT,
  discount_type   TEXT NOT NULL DEFAULT 'percentage',
  discount_value  DOUBLE PRECISION NOT NULL DEFAULT 0,
  track_ids       TEXT[] DEFAULT '{}',
  max_uses        INTEGER NOT NULL DEFAULT 0,
  times_used      INTEGER NOT NULL DEFAULT 0,
  valid_from      TIMESTAMPTZ NOT NULL,
  valid_to        TIMESTAMPTZ NOT NULL,
  status          coupon_status NOT NULL DEFAULT 'active',
  created_by      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_status ON coupons(status);

CREATE TABLE coupon_redemptions (
  id          TEXT PRIMARY KEY,
  coupon_id   TEXT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  learner_id  TEXT NOT NULL,
  track_id    TEXT NOT NULL,
  discount    DOUBLE PRECISION NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX idx_coupon_redemptions_learner ON coupon_redemptions(learner_id);
