# Deployment Guide

This app deploys cleanly to any platform that runs a Next.js server or a Docker
container with a PostgreSQL database. Two recommended free paths are below.

## Option A: Render (Blueprint, fully free)

Render offers a free web service and a free PostgreSQL instance, and supports
Docker natively. A [render.yaml](../render.yaml) blueprint is included.

1. Push this repository to GitHub.
2. In Render: **New > Blueprint**, and select the repository.
3. Render reads `render.yaml` and provisions:
   - `travelplanner-db` (free PostgreSQL)
   - `ai-travel-planner` (Docker web service)
4. After the first deploy, set `NEXTAUTH_URL` to your service URL
   (for example `https://ai-travel-planner.onrender.com`) and redeploy.
5. Optionally set `OPENAI_API_KEY` to enable live AI generation.

`DATABASE_URL` is wired automatically from the database, `AUTH_SECRET` is
generated, and `SEED_ON_START=true` seeds demo data on first boot. The container
entrypoint applies the schema (`prisma migrate deploy`, or `prisma db push` if
no migrations exist) before the server starts.

## Option B: Vercel + Neon

1. Create a free PostgreSQL database at [neon.tech](https://neon.tech) and copy
   its connection string.
2. Import the repository into [Vercel](https://vercel.com).
3. Set environment variables in the Vercel project:
   - `DATABASE_URL` = your Neon connection string
   - `AUTH_SECRET` = output of `openssl rand -base64 32`
   - `NEXTAUTH_URL` = your Vercel URL (e.g. `https://your-app.vercel.app`)
   - `OPENAI_API_KEY` = optional
4. The build runs `prisma generate && next build` automatically.
5. After the first deploy, apply the schema and seed once from your machine,
   pointing at the production database:

   ```bash
   DATABASE_URL="<neon-url>" npm run db:deploy   # or db:push if no migrations
   DATABASE_URL="<neon-url>" npm run db:seed
   ```

> Note: the build sets Next.js `output: "standalone"`, which is ideal for Docker
> and also works on Vercel.

## Option C: Docker anywhere

```bash
docker compose up --build
```

Or build and run the image against an external database:

```bash
docker build -t ai-travel-planner .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/travelplanner" \
  -e AUTH_SECRET="$(openssl rand -base64 32)" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e SEED_ON_START="true" \
  ai-travel-planner
```

## Production checklist

- [ ] `DATABASE_URL` points at a managed PostgreSQL instance
- [ ] `AUTH_SECRET` is a strong random value (not the dev default)
- [ ] `NEXTAUTH_URL` matches the public URL exactly (scheme + host)
- [ ] Schema applied (`prisma migrate deploy` or `prisma db push`)
- [ ] Demo data seeded if desired (`SEED_ON_START=true` or `npm run db:seed`)
- [ ] `OPENAI_API_KEY` set if live AI generation is wanted (optional)

## Database migrations

For a controlled production workflow, commit versioned migrations:

```bash
npm run db:migrate   # locally: creates prisma/migrations/*
git add prisma/migrations && git commit -m "Add migration"
```

The Docker entrypoint and the `db:deploy` script run `prisma migrate deploy`,
applying committed migrations in order. If no migrations directory exists, the
entrypoint falls back to `prisma db push`.

## CI/CD

[.github/workflows/ci.yml](../.github/workflows/ci.yml) runs on every push and
pull request to `main`: it spins up PostgreSQL, installs dependencies, generates
the Prisma client, pushes the schema, seeds, lints, type-checks, builds the app,
and builds the Docker image.
