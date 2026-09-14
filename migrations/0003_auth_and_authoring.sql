PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'EDITOR', 'ADMIN')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX sessions_by_user ON sessions(user_id);
CREATE INDEX sessions_by_expiry ON sessions(expires_at);

CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE
);

INSERT OR IGNORE INTO tags (id, name, normalized_name)
SELECT lower(hex(randomblob(12))), tag, lower(tag)
FROM recipe_tags;

ALTER TABLE recipes ADD COLUMN author_id TEXT REFERENCES users(id);
ALTER TABLE recipes ADD COLUMN created_at TEXT NOT NULL DEFAULT '';
ALTER TABLE recipes ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';
