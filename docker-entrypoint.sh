#!/bin/sh
set -e

# Apply database schema on container start. Uses migrations if present,
# otherwise falls back to `prisma db push` for a fresh database.
if [ -d "./prisma/migrations" ] && [ "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
  echo "Running prisma migrate deploy…"
  npx prisma migrate deploy
else
  echo "No migrations found — running prisma db push…"
  npx prisma db push --skip-generate
fi

# Optional: seed when SEED_ON_START=true
if [ "$SEED_ON_START" = "true" ]; then
  echo "Seeding database…"
  npx tsx prisma/seed.ts || echo "Seed skipped/failed (continuing)"
fi

exec "$@"
