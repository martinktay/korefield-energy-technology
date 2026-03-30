-- Migration: 0013_dropout_risk_scores
-- Adds the dropout_risk_scores table for persisting AI-computed dropout risk
-- evaluations per learner. Replaces the in-memory _risk_store dict in the
-- dropout agent with durable PostgreSQL storage so risk data survives service
-- restarts and is available for assessor review.

CREATE TABLE dropout_risk_scores (
  record_id              TEXT PRIMARY KEY,                  -- DRS-xxxxx
  learner_id             TEXT NOT NULL,                     -- FK to learners.id
  enrollment_id          TEXT NOT NULL,                     -- FK to enrollments.id
  risk_score             DOUBLE PRECISION NOT NULL,         -- 0.0–1.0 risk probability
  risk_level             TEXT NOT NULL,                     -- low | medium | high | critical
  signals                JSONB NOT NULL DEFAULT '{}',       -- Contributing risk signals
  intervention_triggered BOOLEAN NOT NULL DEFAULT FALSE,    -- Whether intervention was fired
  computed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW() -- When the score was computed
);

CREATE INDEX idx_drs_learner ON dropout_risk_scores (learner_id, computed_at DESC);
