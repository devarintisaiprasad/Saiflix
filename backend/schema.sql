-- Tables for SaiFlix (created automatically when the server starts)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Like Netflix, one account can have several profiles (max 4)
CREATE TABLE IF NOT EXISTS profiles (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  avatar     INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS titles (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  year        INTEGER,
  genre       TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'movie' CHECK (type IN ('movie', 'series')),
  maturity    TEXT NOT NULL DEFAULT '13+',
  runtime     TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  hue         INTEGER NOT NULL DEFAULT 0,
  featured    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS my_list (
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title_id   INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, title_id)
);

CREATE TABLE IF NOT EXISTS likes (
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title_id   INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, title_id)
);

-- "Continue watching": where each profile stopped
CREATE TABLE IF NOT EXISTS watch_progress (
  profile_id       INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title_id         INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  seconds          INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, title_id)
);
