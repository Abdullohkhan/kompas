# PulseBoard backend

NestJS 11 + Prisma 7 + PostgreSQL. JWT in an httpOnly cookie, bcrypt passwords, roles `ADMIN` / `USER`.

## Local development

```bash
cd backend
cp .env.example .env            # fill DATABASE_URL, JWT_SECRET, SEED_ADMIN_PASSWORD
npm install                     # also runs `prisma generate`
npx prisma migrate dev          # create tables
npm run db:seed                 # admin + demo data (all fictional)
npm run dev                     # http://localhost:4000/api/health
npm test                        # e2e tests (need the database above)
```

Then run the frontend from the repo root (`npm run dev`); it proxies `/api/*` to `BACKEND_URL`.

## API (all under `/api`, JWT required unless noted)

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` (public) | creates a `USER`; disable with `ALLOW_REGISTRATION=false` |
| POST | `/auth/login` (public) | sets httpOnly cookie `pulse_token` |
| POST | `/auth/logout` (public) | clears cookie |
| GET / PATCH | `/auth/me` | profile (name, phone, company) |
| GET | `/dashboard/:page`, `/dashboard/charts` | stats, traffic, activity, chart series |
| GET | `/customers?q=` | search; POST/PATCH/DELETE are **ADMIN** only |
| GET / POST / DELETE | `/reports` | delete: author or admin |
| GET | `/team` | POST `/team/invite` is **ADMIN** only (returns a one-time temp password) |
| GET | `/health` (public) | DB check for Railway |

## Deploy on Railway

1. New project → add **PostgreSQL**. 
2. Add a service from this repo, **Root Directory `backend`**. Variables:
   `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `JWT_SECRET` (`openssl rand -hex 32`), `NODE_ENV=production`,
   `SEED_ADMIN_PASSWORD` (only for the first seed). `railway.json` sets build/start/healthcheck;
   start runs `prisma migrate deploy` first.
3. Seed once (Railway shell / `railway run npm run db:seed`). Use `SEED_DEMO_DATA=false` for an admin-only database.
4. Add a second service for the frontend (Root Directory `/`): variable `BACKEND_URL` = the backend's
   URL (public domain or `http://<backend>.railway.internal:<PORT>`). It is read **at build time**, so redeploy after changing it.
5. Set `ALLOW_REGISTRATION=false` once your real admin account exists.

Notes: the dashboard's per-page stats, traffic split, activity feed and chart series are stored as seeded
rows (`PageMetrics`, `ChartSeries`, `TopPage`); customers, reports, users and team are real CRUD data.
