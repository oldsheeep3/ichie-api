-- PostgreSQL DDL for Surechigai (derived from docs/diagrams/er.mmd)
-- Run with psql against your database. Requires the "uuid-ossp" or "pgcrypto" extension.

-- Prefer pgcrypto for UUID generation (gen_random_uuid()).
-- Create the extension if it's not present. This requires superuser privileges.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mail text,
  github text,
  x text,
  icon text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- OAUTH_ACCOUNTS table (one-to-many: a user may have multiple oauth accounts)
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  provider_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_id)
  -- allow one user to have multiple oauth_accounts (one-to-many)
);

-- REFRESH_TOKENS (many per user)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- IBEACON_DATAS (one-to-one per user: each user has at most one (major, minor) pair)
-- Use user_id as primary key to enforce one record per user.
CREATE TABLE IF NOT EXISTS ibeacon_datas (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  major integer NOT NULL,
  minor integer NOT NULL
);

-- Index on major/minor to support lookups by beacon values.
CREATE INDEX IF NOT EXISTS idx_ibeacon_major_minor ON ibeacon_datas(major, minor);
-- Enforce that (major, minor) uniquely identifies a user and vice versa (bijection).
-- Use a unique index to ensure compatibility across Postgres versions.
CREATE UNIQUE INDEX IF NOT EXISTS ux_ibeacon_major_minor ON ibeacon_datas (major, minor);

-- MESSAGES (per user)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- Optional: add simple foreign key integrity check views or functions here

-- Example data insertion (commented)
-- INSERT INTO users (name, mail, github, x, icon) VALUES ('Alice', 'alice@example.com', 'aliceGH', 'aliceX', 'https://example.com/icon.png');

-- End of DDL
