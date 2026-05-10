-- Migration: 0018_learner_diagnostic_results
-- Stores advisory diagnostic onboarding outputs for future AI-native personalization.

CREATE TABLE IF NOT EXISTS learner_diagnostic_results (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  country TEXT,
  learner_role TEXT,
  prior_coding_background TEXT,
  prior_ai_background TEXT,
  learning_goals TEXT[] DEFAULT ARRAY[]::TEXT[],
  project_interest TEXT,
  preferred_pace TEXT,
  profile_signals JSONB NOT NULL DEFAULT '{}'::JSONB,
  diagnostic_answers JSONB NOT NULL DEFAULT '[]'::JSONB,
  starting_level TEXT NOT NULL,
  recommended_track TEXT NOT NULL,
  recommended_path TEXT NOT NULL,
  weak_area_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  rationale TEXT NOT NULL,
  focus_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  confidence TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'fallback',
  telemetry JSONB NOT NULL DEFAULT '{}'::JSONB,
  override_active BOOLEAN NOT NULL DEFAULT FALSE,
  override_by TEXT,
  override_reason TEXT,
  override_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learner_diagnostic_results_learner_id
  ON learner_diagnostic_results (learner_id);

CREATE INDEX IF NOT EXISTS idx_learner_diagnostic_results_created_at
  ON learner_diagnostic_results (created_at);
