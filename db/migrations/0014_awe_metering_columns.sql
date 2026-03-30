-- Migration: 0014_awe_metering_columns
-- Adds metering columns to agent_workflow_executions for AI cost tracking:
-- token counts, model name, estimated cost, cohort/learner IDs, latency, and cache hit flag.
-- Also creates the table if it does not yet exist.

CREATE TABLE IF NOT EXISTS agent_workflow_executions (
  id              TEXT PRIMARY KEY,
  agent_type      TEXT,
  status          TEXT NOT NULL DEFAULT 'completed',
  input_text      TEXT,
  output_text     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_workflow_executions
  ADD COLUMN IF NOT EXISTS token_count_input   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS token_count_output  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS model_name          VARCHAR(64),
  ADD COLUMN IF NOT EXISTS estimated_cost_usd  DECIMAL(10, 6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cohort_id           VARCHAR(32),
  ADD COLUMN IF NOT EXISTS learner_id          VARCHAR(32),
  ADD COLUMN IF NOT EXISTS latency_ms          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_hit           BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_awe_cohort_id  ON agent_workflow_executions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_awe_learner_id ON agent_workflow_executions(learner_id);
CREATE INDEX IF NOT EXISTS idx_awe_created_at ON agent_workflow_executions(created_at);
