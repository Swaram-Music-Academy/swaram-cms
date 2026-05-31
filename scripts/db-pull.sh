#!/usr/bin/env bash
set -e

DB_CONTAINER="supabase_db_swaram-software"
DUMP_FILE="prod_data.sql"

echo "==> Pulling schema changes from remote..."
if npx supabase db pull; then
  echo "==> Schema changes pulled. Resetting local DB..."
  npx supabase db reset
else
  echo "==> No schema changes (or pull failed). Skipping reset."
fi

echo "==> Dumping data from remote..."
npx supabase db dump --data-only -f "$DUMP_FILE"

echo "==> Restoring data into local DB..."
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres < "$DUMP_FILE"

echo "==> Cleaning up dump file..."
rm -f "$DUMP_FILE"

echo "==> Done. Local DB has latest schema + data from remote."
