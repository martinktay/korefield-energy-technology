-- Migration: 0017_launch_waitlist_entries
-- Public coming-soon waitlist for the KoreField Academy business arm.

CREATE TABLE IF NOT EXISTS launch_waitlist_entries (
  id               VARCHAR(32) PRIMARY KEY,
  email            VARCHAR(320) NOT NULL UNIQUE,
  full_name        VARCHAR(120),
  organization     VARCHAR(160),
  role             VARCHAR(120),
  area_of_interest VARCHAR(120) DEFAULT 'KoreField Academy',
  source           VARCHAR(120) DEFAULT 'korefield-academy-coming-soon',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_launch_waitlist_created_at
  ON launch_waitlist_entries(created_at);
