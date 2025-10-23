#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires, no-console */
// generate_admin_bcrypt.js
// Usage: node generate_admin_bcrypt.js [password] [username] [displayName]
// Example: node generate_admin_bcrypt.js mySecretP@ss admin "Administrator"

const bcrypt = require('bcryptjs');

const argv = process.argv.slice(2);
const password = argv[0] || 'password';
const username = argv[1] || 'admin';
const displayName = argv[2] || 'Administrator';

const hash = bcrypt.hashSync(password, 10);

const sql = `-- Generated admin account insertion SQL (bcrypt hash)
SET @uid = (SELECT id FROM users WHERE name = '${displayName}' LIMIT 1);

-- If no user row exists, insert one first. See 00_schema.sql for an example.
-- Insert or update admin_accounts row for username: ${username}
INSERT INTO admin_accounts (username, user_id, password_hash)
VALUES ('${username}', @uid, '${hash}')
ON DUPLICATE KEY UPDATE password_hash='${hash}';
`;

console.log(sql);
