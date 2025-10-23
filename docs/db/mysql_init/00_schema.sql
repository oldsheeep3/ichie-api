-- MySQL initialization script for Surechigai (runs in docker-entrypoint-initdb.d)

-- Use the database created by MYSQL_DATABASE env var
USE `surechigai`;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  major INT NOT NULL,
  minor INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  mail VARCHAR(255),
  github VARCHAR(255),
  x VARCHAR(255),
  icon VARCHAR(2048) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY users_major_minor_unique (major, minor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Major allocations table
CREATE TABLE IF NOT EXISTS major_allocations (
  major INT PRIMARY KEY,
  last_minor INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OAuth accounts
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255),
  provider_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY oauth_unique_provider_account (provider, provider_account_id),
  INDEX idx_oauth_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_refresh_tokens_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Encounters
CREATE TABLE IF NOT EXISTS encounters (
  id CHAR(36) PRIMARY KEY,
  reporter_user_id CHAR(36) NOT NULL,
  target_major INT NOT NULL,
  target_minor INT NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_encounters_reporter (reporter_user_id),
  INDEX idx_encounters_target_major_minor (target_major, target_minor),
  FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Helper stored procedure to create user with allocation
DROP PROCEDURE IF EXISTS create_user_with_allocation;
DELIMITER $$
CREATE PROCEDURE create_user_with_allocation(
  IN p_id CHAR(36),
  IN p_name VARCHAR(255),
  IN p_icon VARCHAR(2048),
  IN p_mail VARCHAR(255),
  IN p_github VARCHAR(255),
  IN p_x VARCHAR(255)
)
BEGIN
  DECLARE sel_major INT;
  DECLARE sel_minor INT;

  START TRANSACTION;

  -- Try to find any major row, if none create a new major using MAX+1
  SELECT major INTO sel_major FROM major_allocations LIMIT 1 FOR UPDATE;

  IF sel_major IS NULL THEN
    SET sel_major = 1;
    INSERT INTO major_allocations(major, last_minor) VALUES (sel_major, 0);
  END IF;

  -- increment last_minor
  UPDATE major_allocations SET last_minor = last_minor + 1 WHERE major = sel_major;
  SELECT last_minor INTO sel_minor FROM major_allocations WHERE major = sel_major;

  -- insert user
  INSERT INTO users(id, major, minor, name, mail, github, x, icon) VALUES (p_id, sel_major, sel_minor, p_name, p_mail, p_github, p_x, p_icon);

  COMMIT;
END$$
DELIMITER ;

-- Generate a UUID helper using UUID() where needed at insertion time

-- ------------------------------------------------------------------
-- Create an admin user for convenience
-- Username: admin
-- Password: password
-- NOTE: Password stored as SHA2 for simple verification. For production
-- use bcrypt or another strong hashing mechanism and do NOT store plain
-- SHA hashes.
-- ------------------------------------------------------------------
INSERT INTO users (id, major, minor, name, mail, github, x, icon)
VALUES (UUID(), 0, 0, 'Administrator', 'admin@example.com', NULL, NULL, 'https://example.com/admin-icon.png');

-- create admin_accounts table to store login credentials for admin users
CREATE TABLE IF NOT EXISTS admin_accounts (
  username VARCHAR(255) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: admin_accounts insertion will be provided by the bcrypt-generated
-- SQL file produced at image build time (01_add_admin_bcrypt.sql). Do not
-- insert SHA2 hashes here.

