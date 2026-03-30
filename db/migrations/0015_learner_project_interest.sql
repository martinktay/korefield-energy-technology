-- Migration: 0015_learner_project_interest
-- Adds project_interest column to learners table for onboarding goal capture.

ALTER TABLE learners
  ADD COLUMN IF NOT EXISTS project_interest TEXT;
