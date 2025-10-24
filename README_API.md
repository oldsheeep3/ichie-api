Surechigai backend (dev)

Quick start (development):

1. Install dependencies

   npm install

2. Start dev server (ts-node required)

   npx ts-node src/index.ts

or use npm script:

   npm run start:dev

API endpoints (based on docs/swagger.yml):

- POST /auth/signup
- POST /auth/signin
- PUT /auth/update
- GET /auth/me
- POST /data/encount
- GET /data/encount/me

This is a minimal in-memory implementation for local development and testing. Tokens are dummy values and persistence is not implemented.
