-- Migration: 0008_lesson_content_fields
-- Add content_body, video_url, file_url, file_name to lessons table
-- These fields enable instructors to author lesson content directly

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content_body TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS file_name TEXT;
