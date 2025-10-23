Bcrypt admin seed helper

This small helper generates SQL that inserts or updates the `admin_accounts` row using a bcrypt password hash instead of SHA2.

Why use this? SHA2 is fast and not suitable for password storage in production. Use bcrypt (or argon2) for stronger password hashing.

Prerequisites

- Node.js installed in your environment.
- Install the helper dependency:

  npm install bcryptjs

Usage

1. Generate SQL using the helper (runs locally, does not touch the database):

  node generate_admin_bcrypt.js <password> <username> <displayName> > add_admin_bcrypt.sql

  Example:
  node generate_admin_bcrypt.js password admin "Administrator" > add_admin_bcrypt.sql

2. Inspect `add_admin_bcrypt.sql` to ensure it looks correct.

3. Apply the SQL to your running MySQL container. If using the docker-compose from this repo, replace <container> with the mysql service name (usually `backend_mysql` or `mysql`), or run via phpMyAdmin.

  # example (replace credentials/container name as necessary)
  docker exec -i <mysql_container_name> mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} < add_admin_bcrypt.sql

Notes

- The generated SQL expects a user row with the given display name (defaults to `Administrator`) to already exist in the `users` table. If you don't have that user, insert it first or modify the SQL accordingly.
- This script uses `bcryptjs` (pure JS) to avoid native build steps. You can replace it with `bcrypt` or `argon2` if you prefer.
