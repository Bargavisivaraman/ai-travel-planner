#!/bin/sh
set -e

# Apply database schema on container start. Uses migrations if present,
# otherwise falls back to `prisma db push` for a fresh database.
PRISMA="./node_modules/.bin/prisma"
TSX="./node_modules/.bin/tsx"

if [ -d "./prisma/migrations" ] && [ "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
  echo "Running prisma migrate deploy…"
  "$PRISMA" migrate deploy
else
  echo "No migrations found — running prisma db push…"
  "$PRISMA" db push --skip-generate
fi

# Optional: seed when SEED_ON_START=true, but only if the database is empty
# (no users yet). This makes a fresh deploy self-seed without wiping data on
# later restarts.
if [ "$SEED_ON_START" = "true" ]; then
  USER_COUNT=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(c=>{console.log(c);return p.\$disconnect()}).catch(()=>{console.log(-1)})" 2>/dev/null || echo "-1")
  if [ "$USER_COUNT" = "0" ]; then
    echo "Empty database — seeding demo data…"
    "$TSX" prisma/seed.ts || echo "Seed failed (continuing)"
  else
    echo "Database already has data (users=$USER_COUNT) — skipping seed."
  fi
fi

exec "$@"
