-- Migration: 0010_notification_push_system
-- Adds persistent notification storage and Web Push subscription tracking.
-- Notifications are role-aware and support in-app bell, browser push, and email channels.

CREATE TYPE notification_channel AS ENUM ('in_app', 'push', 'email');

CREATE TABLE notifications (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  channel     notification_channel NOT NULL DEFAULT 'in_app',
  category    TEXT NOT NULL DEFAULT 'general',
  action_url  TEXT,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  pushed      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

CREATE TABLE push_subscriptions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
