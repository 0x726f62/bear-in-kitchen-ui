PRAGMA foreign_keys = ON;

ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_salt TEXT;
ALTER TABLE users ADD COLUMN password_iterations INTEGER;

CREATE TABLE auth_attempts (
  attempt_key TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  window_started TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
