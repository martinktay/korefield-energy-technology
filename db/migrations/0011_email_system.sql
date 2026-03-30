-- Migration: 0011_email_system
-- Adds email delivery logging and per-user email preference tables for the
-- transactional email system. email_logs tracks every delivery attempt for
-- audit and debugging. email_preferences stores GDPR-compliant unsubscribe
-- preferences per user.

CREATE TABLE email_logs (
  id              TEXT PRIMARY KEY,                        -- EML-xxxxx
  user_id         TEXT,                                    -- FK to users.id (nullable for system emails)
  email_type      TEXT NOT NULL,                           -- One of 9 email types
  recipient       TEXT NOT NULL,                           -- Recipient email address
  subject         TEXT NOT NULL,                           -- Rendered subject line
  status          TEXT NOT NULL DEFAULT 'pending',         -- pending | sent | failed | skipped
  ses_message_id  TEXT,                                    -- SES message ID on success
  error_message   TEXT,                                    -- Error details on failure
  attempt_number  INT NOT NULL DEFAULT 1,                  -- Delivery attempt count
  correlation_id  TEXT NOT NULL,                           -- Matches the SQS message EML-xxxxx ID
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX idx_email_logs_correlation_id ON email_logs(correlation_id);

CREATE TABLE email_preferences (
  id                      TEXT PRIMARY KEY,                -- EPR-xxxxx
  user_id                 TEXT NOT NULL UNIQUE,            -- FK to users.id
  marketing_opted_out     BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_opted_out_at  TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_preferences_user_id ON email_preferences(user_id);
