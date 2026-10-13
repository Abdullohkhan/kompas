# Kompas backend

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

## API (all under `/api`, JWT cookie or `Authorization: Bearer` required unless noted)

| Method | Path | Notes |
|---|---|---|
| GET | `/auth/config` (public) | `{registration}` – whether sign-up is open |
| POST | `/auth/register` (public) | only when `ALLOW_REGISTRATION=true` (**closed by default**); creates a `USER` |
| POST | `/auth/login`, `/auth/logout` (public) | httpOnly cookie `kompas_token` |
| GET / PATCH | `/auth/me` | profile (name, phone, company) |
| POST | `/auth/change-password` | needs current password |
| GET | `/dashboard/:page`, `/dashboard/charts` | **computed from DB**: stats, goal, traffic split, activity feed, insights |
| GET | `/dashboard/:page/export` | CSV, **Pro/admin** |
| PATCH | `/dashboard/goals` | **ADMIN** – monthly targets |
| GET / POST | `/orders` | POST is **ADMIN** |
| POST | `/track` (public, rate-limited) | ingest a website session (`path`, `source`, `pageviews`, `durationSec`) |
| GET | `/customers?q=` | POST/PATCH/DELETE are **ADMIN** |
| GET / POST / DELETE | `/reports` | free plan: max 3 reports per user (402 `plan_limit`) |
| GET | `/reports/:id/export` | real CSV (sales / finance / marketing / ops), **Pro/admin** |
| GET | `/team` | POST `/team/invite` is **ADMIN** (returns a one-time temp password) |
| GET | `/billing/status` | plan + subscription state |
| POST | `/billing/checkout`, `/billing/portal` | Stripe Checkout / Customer Portal URLs (503 until Stripe is configured) |
| POST | `/billing/webhook` (public) | verified with `STRIPE_WEBHOOK_SECRET`, idempotent |
| GET | `/health` (public) | DB check for Railway |

### Where the numbers come from
Revenue/orders/conversion → `Order` + `Visit`; traffic split → `Visit.source` (or customers/reports/activity per page);
feed → `Activity` (written by every mutation); charts → SQL aggregates; goals → `Setting` rows (admin editable).
To feed real traffic, POST sessions to `/api/track` from your website (set `CORS_ORIGIN` to that site).

### Stripe setup
1. Stripe Dashboard → create a product with a recurring **price** → `STRIPE_PRICE_ID`.
2. API keys → `STRIPE_SECRET_KEY`.
3. Webhooks → endpoint `https://<backend-domain>/api/billing/webhook`, events: `checkout.session.completed`,
   `customer.subscription.created|updated|deleted`, `invoice.payment_failed` → `STRIPE_WEBHOOK_SECRET`.
4. Set `APP_URL` to the frontend URL (Checkout success/cancel redirects).
Test locally with `stripe listen --forward-to localhost:4000/api/billing/webhook`.

## Deploy on Railway

1. New project → add **PostgreSQL**.
2. Add a service from this repo, **Root Directory `backend`**. Variables:
   `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `JWT_SECRET` (`openssl rand -hex 32`), `NODE_ENV=production`,
   `APP_URL`, the `STRIPE_*` variables, and `SEED_ADMIN_PASSWORD` (first seed only). `railway.json` sets
   build/start/healthcheck; start runs `prisma migrate deploy` first.
3. Seed once (`railway run npm run db:seed`). `SEED_DEMO_DATA=false` creates only the admin user.
4. Frontend service (Root Directory `/`): `BACKEND_URL` = backend URL (public domain or
   `http://<backend>.railway.internal:<PORT>`). Read **at build time** — redeploy after changing it.
5. Keep `ALLOW_REGISTRATION` unset/`false`; add people with admin invites.
