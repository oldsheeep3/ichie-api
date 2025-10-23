FROM node:18-alpine AS builder
WORKDIR /app

# Copy the helper script that generates bcrypt SQL
COPY docs/db/mysql_init/generate_admin_bcrypt.js ./generate_admin_bcrypt.js

# Build args for admin credentials (can be provided from docker-compose build args)
ARG ADMIN_PASSWORD=password
ARG ADMIN_USERNAME=admin
ARG ADMIN_DISPLAYNAME=Administrator

# Install bcryptjs and generate SQL file
RUN npm init -y \
  && npm install bcryptjs \
  && node generate_admin_bcrypt.js "$ADMIN_PASSWORD" "$ADMIN_USERNAME" "$ADMIN_DISPLAYNAME" > /tmp/01_add_admin_bcrypt.sql

FROM mysql:8.0

# Copy the main schema and the generated admin SQL into the image init directory
COPY docs/db/mysql_init/00_schema.sql /docker-entrypoint-initdb.d/00_schema.sql
COPY --from=builder /tmp/01_add_admin_bcrypt.sql /docker-entrypoint-initdb.d/01_add_admin_bcrypt.sql

RUN chmod 644 /docker-entrypoint-initdb.d/*.sql
