-- Migration: 0014_learner_lesson_progress
-- Adds the learner_lesson_progress table for persisting per-lesson progress
-- data (active tab, code drafts, practice inputs, deliverable inputs, MCQ
-- answers and scores, submission status). Enables backend sync from the
-- Zustand learner progress store so assessors can review work and progress
-- counts toward certification gating.

CREATE TABLE learner_lesson_progress (
  id                TEXT PRIMARY KEY,                       -- LLP-xxxxx
  learner_id        TEXT NOT NULL,                          -- FK to learners.id
  lesson_id         TEXT NOT NULL,                          -- FK to lessons.id
  active_tab        TEXT DEFAULT 'learn',                   -- Current tab: learn | practice | deliverable
  code_value        TEXT,                                   -- Saved code editor content
  practice_input    TEXT,                                   -- Saved practice tab input
  deliverable_input TEXT,                                   -- Saved deliverable tab input
  submitted         BOOLEAN DEFAULT FALSE,                  -- Whether lesson is submitted/completed
  mcq_answers       JSONB DEFAULT '{}',                     -- MCQ answer selections
  mcq_score         DOUBLE PRECISION,                       -- MCQ score (nullable until graded)
  updated_at        TIMESTAMPTZ DEFAULT NOW(),              -- Last update timestamp

  UNIQUE(learner_id, lesson_id)
);

CREATE INDEX idx_llp_learner ON learner_lesson_progress (learner_id);
