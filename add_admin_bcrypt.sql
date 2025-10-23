-- Generated admin account insertion SQL (bcrypt hash)
SET @uid = (SELECT id FROM users WHERE name = 'Administrator' LIMIT 1);

-- If no user row exists, insert one first. See 00_schema.sql for an example.
-- Insert or update admin_accounts row for username: admin
INSERT INTO admin_accounts (username, user_id, password_hash)
VALUES ('admin', @uid, '$2b$10$0UtQMP3rXfehQnXbsMaG2.YTurndCcSLo2zwiuzLqbANgYZ2ZWRwy')
ON DUPLICATE KEY UPDATE password_hash='$2b$10$0UtQMP3rXfehQnXbsMaG2.YTurndCcSLo2zwiuzLqbANgYZ2ZWRwy';

