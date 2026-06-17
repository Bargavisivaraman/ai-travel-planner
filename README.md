# Wanderlust — AI Travel Planner

A full-stack, AI-powered travel planning platform. Generate, customize, save, and share complete trip itineraries with budgets, packing lists, checklists, expense tracking, and a public share page.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma, PostgreSQL, Auth.js, and the OpenAI API.

## Features

- **Authentication** with email and password (Auth.js, JWT sessions)
- **Trip dashboard** with budget and status summaries
- **Create, edit, and delete trips**
- **AI itinerary generator** (OpenAI, with a built-in deterministic engine fallback so it works with no API key)
- **Multi-city trip support** with arrival and departure dates
- **Budget planner** with a category breakdown chart
- **Daily schedule builder** with typed activities and per-activity costs
- **Hotel, flight, activity, and location notes**
- **Packing list generator** tuned to trip length and season
- **Travel checklist** with a one-click standard checklist
- **Weather-ready suggestions** plus a live-forecast link
- **Expense tracker** with budget-vs-spent progress
- **Map and location notes** with quick Google Maps links
- **Favorite destinations** wishlist
- **Shareable public itinerary page** at `/share/<slug>`
- **Dark and light mode** with system preference
- **Mobile-responsive UI**
- **Admin dashboard** for user and platform management (role based)
- **Seed script** with a demo account and rich demo data

## Tech stack

| Layer        | Technology                                  |
| ------------ | ------------------------------------------- |
| Framework    | Next.js 15 (App Router, Server Actions)     |
| Language     | TypeScript                                  |
| Styling      | Tailwind CSS + shadcn-style UI components   |
| Database     | PostgreSQL                                  |
| ORM          | Prisma                                      |
| Auth         | Auth.js (NextAuth v5)                        |
| AI           | OpenAI API (optional, with engine fallback) |
| Charts       | Recharts                                    |
| Container    | Docker + docker-compose                     |
| CI/CD        | GitHub Actions                              |

## Quick start (local)

### Prerequisites

- Node.js 20+ and npm
- A PostgreSQL database (local install, Docker, or a free cloud database such as Neon)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL and AUTH_SECRET (generate with: openssl rand -base64 32)

# 3. Create the schema and seed demo data
npm run db:push
npm run db:seed

# 4. Run the dev server
npm run dev
```

Open http://localhost:3000.

### Run everything with Docker

```bash
docker compose up --build
```

This starts PostgreSQL and the app, applies the schema, and seeds demo data. Open http://localhost:3000.

## Demo accounts

The seed script creates two accounts:

| Role  | Email                  | Password   |
| ----- | ---------------------- | ---------- |
| User  | demo@wanderlust.app    | demo1234   |
| Admin | admin@wanderlust.app   | admin1234  |

The login form is pre-filled with the demo user credentials.

## Scripts

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the development server             |
| `npm run build`     | Generate Prisma client and build         |
| `npm run start`     | Start the production server              |
| `npm run lint`      | Run ESLint                               |
| `npm run typecheck` | Run the TypeScript compiler (no emit)    |
| `npm run db:push`   | Push the Prisma schema to the database   |
| `npm run db:migrate`| Create and apply a dev migration         |
| `npm run db:deploy` | Apply migrations in production           |
| `npm run db:seed`   | Seed demo data                           |
| `npm run db:studio` | Open Prisma Studio                       |

## Environment variables

| Variable          | Required | Description                                            |
| ----------------- | -------- | ------------------------------------------------------ |
| `DATABASE_URL`    | yes      | PostgreSQL connection string                           |
| `AUTH_SECRET`     | yes      | Secret for signing sessions (`openssl rand -base64 32`)|
| `NEXTAUTH_URL`    | yes      | Public base URL of the app                             |
| `OPENAI_API_KEY`  | no       | Enables live AI generation; falls back to the engine   |
| `OPENAI_MODEL`    | no       | OpenAI model id (default `gpt-4o-mini`)                |

## Project structure

```
src/
  app/
    (app)/              Authenticated area (dashboard, trips, favorites, admin)
    api/                Route handlers (auth, register, generate)
    login, register     Auth pages
    share/[slug]        Public itinerary page
  components/           UI primitives and feature components
  lib/
    actions.ts          Server actions (all CRUD)
    ai.ts               AI generator + engine fallback + heuristics
    auth helpers        session.ts, validations.ts, prisma.ts, utils.ts
  auth.ts               Auth.js configuration
  middleware.ts         Route protection
prisma/
  schema.prisma         Database schema
  seed.ts               Seed script
```

## Documentation

- [Database schema](docs/DATABASE.md)
- [API documentation](docs/API.md)
- [Deployment guide](docs/DEPLOYMENT.md)

## How the AI generator works

The itinerary generator calls the OpenAI Chat Completions API when `OPENAI_API_KEY` is set, requesting structured JSON. If no key is configured, or the API call fails, it falls back to a deterministic engine that builds a realistic, well-paced itinerary from templates scaled by trip length, pace, and budget level. This means the app is fully functional out of the box without any paid API key.

## License

MIT
