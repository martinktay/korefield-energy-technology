-- Migration: Add lab session submission support
-- Adds lab_session_id, feedback, and feedback_at columns to submissions table
-- Links submissions to lab sessions for async lab work and instructor feedback

ALTER TABLE submissions
  ADD COLUMN lab_session_id TEXT REFERENCES lab_sessions(id) ON DELETE CASCADE,
  ADD COLUMN feedback TEXT,
  ADD COLUMN feedback_at TIMESTAMPTZ;

CREATE INDEX idx_submissions_lab_session_id ON submissions(lab_session_id);
