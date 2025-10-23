-- PostgreSQL DDL for Surechigai backend (based on docs/swagger.yml)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sequence to allocate new major values when needed
CREATE SEQUENCE IF NOT EXISTS major_seq START 1;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  major integer NOT NULL,
  minor integer NOT NULL,
  name text NOT NULL,
  mail text,
  github text,
  x text,
  icon text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_major_minor_unique UNIQUE (major, minor)
);

CREATE INDEX IF NOT EXISTS idx_users_major_minor ON users(major, minor);

-- Table that tracks allocation state for majors (to allocate minors within a major)
CREATE TABLE IF NOT EXISTS major_allocations (
  major integer PRIMARY KEY,
  last_minor integer NOT NULL DEFAULT 0
);

-- OAuth accounts linking external provider accounts to our users
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_account_id text,
  provider_token text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT oauth_unique_provider_account UNIQUE(provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user_id ON oauth_accounts(user_id);

-- Refresh tokens (store refresh tokens; consider hashing tokens in production)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Encounters table
CREATE TABLE IF NOT EXISTS encounters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_major integer NOT NULL,
  target_minor integer NOT NULL,
  occurred_at timestamptz NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_encounters_reporter ON encounters(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_encounters_target_major_minor ON encounters(target_major, target_minor);

-- Helper function: create_user_with_allocation
-- This function finds or creates a major with free minor slots and inserts a new user with assigned (major, minor).
-- NOTE: This is a simple allocation strategy. Tune MAX_MINOR or allocation policy as needed.

CREATE OR REPLACE FUNCTION create_user_with_allocation(
  p_name text,
  p_icon text,
  p_mail text DEFAULT NULL,
  p_github text DEFAULT NULL,
  p_x text DEFAULT NULL
) RETURNS users AS $$
DECLARE
  sel_major integer;
  sel_minor integer;
BEGIN
  LOOP
    -- Try to find an existing major with available minor slot and lock it
    SELECT major INTO sel_major
    FROM major_allocations
    WHERE last_minor < 2147483647
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
      sel_major := nextval('major_seq')::integer;
      INSERT INTO major_allocations(major, last_minor) VALUES (sel_major, 0);
    END IF;

    -- increment last_minor and return value
    UPDATE major_allocations
    SET last_minor = last_minor + 1
    WHERE major = sel_major
    RETURNING last_minor INTO sel_minor;

    IF sel_minor IS NOT NULL THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN QUERY
  INSERT INTO users(major, minor, name, mail, github, x, icon)
  VALUES (sel_major, sel_minor, p_name, p_mail, p_github, p_x, p_icon)
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Example usage (transaction):
-- BEGIN;
-- SELECT * FROM create_user_with_allocation('Taro Yamada', 'https://example.com/icon.png', 'taro@example.com', 'yamada', null);
-- COMMIT;

-- Sample insert for encounter (reporting):
-- INSERT INTO encounters (reporter_user_id, target_major, target_minor, occurred_at, message)
-- VALUES ('<reporter-uuid>', 1, 2, now(), 'こんにちは');
