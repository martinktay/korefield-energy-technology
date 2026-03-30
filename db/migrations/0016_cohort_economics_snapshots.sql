-- Migration: 0016_cohort_economics_snapshots
-- Creates the cohort_economics_snapshots table for pre-aggregated cohort
-- economics metrics consumed by the Super Admin dashboard.

CREATE TABLE IF NOT EXISTS cohort_economics_snapshots (
  id                  VARCHAR(32) PRIMARY KEY,
  cohort_id           VARCHAR(32) NOT NULL,
  snapshot_date       DATE NOT NULL,
  total_revenue       DECIMAL(12, 2) DEFAULT 0,
  total_ai_cost       DECIMAL(12, 6) DEFAULT 0,
  gross_margin        DECIMAL(12, 2) DEFAULT 0,
  gross_margin_pct    DECIMAL(5, 2) DEFAULT 0,
  active_learners     INTEGER DEFAULT 0,
  ai_cost_per_learner DECIMAL(10, 6) DEFAULT 0,
  cache_hit_rate      DECIMAL(5, 4) DEFAULT 0,
  completion_rate     DECIMAL(5, 4) DEFAULT 0,
  conversion_rate     DECIMAL(5, 4) DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ces_cohort_date
  ON cohort_economics_snapshots(cohort_id, snapshot_date);
