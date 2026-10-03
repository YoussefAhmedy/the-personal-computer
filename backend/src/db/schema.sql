-- THE PERSONAL COMPUTER — database schema
-- SQLite. Kept intentionally simple: one small, self-hosted database file,
-- no separate DB server to install or secure.

PRAGMA foreign_keys = ON;

-- Single-row table holding the "personal" settings that used to be the
-- ✎ EDIT ZONE constants at the top of the original file.
CREATE TABLE IF NOT EXISTS site_config (
  id                INTEGER PRIMARY KEY CHECK (id = 1),
  user_name         TEXT NOT NULL DEFAULT 'GUEST',
  finale_heading    TEXT NOT NULL DEFAULT 'HAPPY BIRTHDAY',
  final_message     TEXT NOT NULL DEFAULT '',
  passcode_hash     TEXT NOT NULL,
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Admin (creator) accounts. A table rather than a single row so a second
-- admin can be added later without a schema change.
CREATE TABLE IF NOT EXISTS admin_users (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  username          TEXT NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memories (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  ext_id            TEXT NOT NULL,
  date_label        TEXT NOT NULL DEFAULT '',
  title             TEXT NOT NULL DEFAULT '',
  caption           TEXT NOT NULL DEFAULT '',
  tags              TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  is_secret         INTEGER NOT NULL DEFAULT 0,   -- 0/1
  art_type          TEXT NOT NULL DEFAULT 'clouds',
  media_url         TEXT,                          -- optional uploaded photo, overrides art
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS photos (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  ext_id            TEXT NOT NULL,
  date_label        TEXT NOT NULL DEFAULT '',
  title             TEXT NOT NULL DEFAULT '',
  description       TEXT NOT NULL DEFAULT '',
  category          TEXT NOT NULL DEFAULT 'trips',
  art_type          TEXT NOT NULL DEFAULT 'clouds',
  media_url         TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  ext_id            TEXT NOT NULL,
  title             TEXT NOT NULL DEFAULT '',
  date_label        TEXT NOT NULL DEFAULT '',
  body              TEXT NOT NULL DEFAULT '',
  is_rtl            INTEGER NOT NULL DEFAULT 0,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS videos (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  ext_id            TEXT NOT NULL,
  file_label        TEXT NOT NULL DEFAULT '',
  title             TEXT NOT NULL DEFAULT '',
  duration_seconds  INTEGER NOT NULL DEFAULT 20,
  art_type          TEXT NOT NULL DEFAULT 'road',
  media_url         TEXT,                          -- optional uploaded video, overrides simulation
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tracks (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  ext_id            TEXT NOT NULL,
  title             TEXT NOT NULL DEFAULT '',
  artist            TEXT NOT NULL DEFAULT '',
  art_type          TEXT NOT NULL DEFAULT 'hearts',
  notes_json        TEXT NOT NULL DEFAULT '[]',    -- JSON [[freq,duration], ...] chiptune fallback
  media_url         TEXT,                          -- optional uploaded audio, overrides chiptune
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  ext_id            TEXT NOT NULL,
  from_label        TEXT NOT NULL DEFAULT '',
  subject           TEXT NOT NULL DEFAULT '',
  body              TEXT NOT NULL DEFAULT '',
  is_rtl            INTEGER NOT NULL DEFAULT 0,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS secret_message (
  id                INTEGER PRIMARY KEY CHECK (id = 1),
  title             TEXT NOT NULL DEFAULT '/SECRET/DO_NOT_OPEN.TXT',
  body              TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_memories_sort ON memories(sort_order);
CREATE INDEX IF NOT EXISTS idx_photos_sort ON photos(sort_order);
CREATE INDEX IF NOT EXISTS idx_notes_sort ON notes(sort_order);
CREATE INDEX IF NOT EXISTS idx_videos_sort ON videos(sort_order);
CREATE INDEX IF NOT EXISTS idx_tracks_sort ON tracks(sort_order);
CREATE INDEX IF NOT EXISTS idx_messages_sort ON messages(sort_order);
