Place these files in ./docs/db/mysql_init and run `docker compose up` from the project root.

The MySQL container will initialize the database `surechigai` using the environment variables in `.env` (copy `.env.example` to `.env`).

The init SQL includes a stored procedure `create_user_with_allocation` which expects the caller to generate a UUID (use UUID() on INSERT) or pass one in from client code.

Notes:
- In MySQL we use CHAR(36) to store UUID strings.
- Adjust `create_user_with_allocation` allocation policy as needed.
