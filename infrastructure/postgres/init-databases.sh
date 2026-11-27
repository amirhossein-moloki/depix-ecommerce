#!/bin/sh
set -eu

PG_SUPERUSER="${POSTGRES_USER:-postgres}"
BLOG_DB_NAME="${BLOG_DB_NAME:-blog_db}"
BLOG_DB_USER="${BLOG_DB_USER:-blog_user}"
BLOG_DB_PASSWORD="${BLOG_DB_PASSWORD:-blog_password}"

echo "Ensuring PostgreSQL role '${BLOG_DB_USER}' and database '${BLOG_DB_NAME}'..."

psql -v ON_ERROR_STOP=1 \
  --username "$PG_SUPERUSER" \
  --dbname postgres \
  -v blog_db="$BLOG_DB_NAME" \
  -v blog_user="$BLOG_DB_USER" \
  -v blog_password="$BLOG_DB_PASSWORD" <<'EOSQL'
SELECT CASE
  WHEN :'blog_user' <> current_user AND NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = :'blog_user'
  )
  THEN format(
    'CREATE ROLE %I WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L',
    :'blog_user',
    :'blog_password'
  )
  WHEN :'blog_user' <> current_user
  THEN format(
    'ALTER ROLE %I WITH LOGIN PASSWORD %L',
    :'blog_user',
    :'blog_password'
  )
  ELSE NULL
END AS sql_cmd \gexec

SELECT format('CREATE DATABASE %I OWNER %I', :'blog_db', :'blog_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'blog_db') \gexec

SELECT format('ALTER DATABASE %I OWNER TO %I', :'blog_db', :'blog_user') \gexec
SELECT format('GRANT ALL PRIVILEGES ON DATABASE %I TO %I', :'blog_db', :'blog_user') \gexec
EOSQL

psql -v ON_ERROR_STOP=1 \
  --username "$PG_SUPERUSER" \
  --dbname "$BLOG_DB_NAME" \
  -v blog_user="$BLOG_DB_USER" <<'EOSQL'
SELECT format('ALTER SCHEMA public OWNER TO %I', :'blog_user') \gexec
SELECT format('GRANT ALL ON SCHEMA public TO %I', :'blog_user') \gexec
EOSQL

echo "PostgreSQL database initialization complete."
