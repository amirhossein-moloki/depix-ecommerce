#!/bin/sh
set -e

echo "Running Medusa database migrations..."
yarn medusa db:migrate --execute-all-links --execute-all-search

echo "Starting Medusa backend server on ${HOST:-0.0.0.0}:${PORT:-9000}..."
exec yarn start --host "${HOST:-0.0.0.0}" --port "${PORT:-9000}"
