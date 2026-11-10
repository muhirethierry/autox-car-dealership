# AUTOX Car Rental

AUTOX currently runs as a React/Vite customer site with an Express API and a MariaDB/Prisma backend foundation. Existing colors, layouts, media, and responsive CSS remain in place. The original website is preserved under `legacy/` as a reference.

## Frontend preview

```sh
npm install
npm run dev
```

Vite serves `/`, `/login.html`, `/signup.html`, and `/admin.html`. Without the API running, the homepage uses the existing local fleet preview; sign-in, shared fleet data, and server bookings require the API and database.

## Run the API and MariaDB locally

Install Docker Desktop or MariaDB 10+, then:

1. Copy `.env.example` to `.env`. Use a unique database password and a random `SESSION_SECRET` of at least 32 characters. The example values are for local development only.
2. With Docker installed, run `docker compose up -d` to start the local MariaDB service. If using a separate MariaDB server, create the database/user and set `DATABASE_URL` accordingly.
3. Run `npm run db:generate` and `npm run db:migrate -- --name init`.
4. Run `npm run fleet:import` to preview the default fleet import. Then run `npm run fleet:import -- --apply` to insert missing vehicles. Existing database vehicle records are left unchanged.
5. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, then run `npm run admin:create` to create the initial Super Admin account.
6. In one terminal run `npm run api`; in another run `npm run dev`. Vite proxies `/api` requests to the Express server at `localhost:4000`.

Useful commands:

```sh
npm run build
npm test
npm run test:e2e
```

Playwright uses the installed Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe` by default. Set `CHROME_PATH` or run `npx playwright install chromium` if needed.

## Backend status

- Implemented: validated signup/sign-in, scrypt password hashing, server-side MariaDB sessions, session-bound CSRF tokens, role checks against the current database user, auth rate limits, authenticated fleet and booking APIs, customer booking history restricted to the signed-in account, transactional vehicle locking and date-conflict checks, customer account reads, pending/manual payment records, maintenance records, and verified-payment-only revenue aggregation.
- Still browser-only in the admin UI: settings, reviews, notifications, activity history, and some manually recorded dashboard data. The API has database endpoints for primary fleet, booking, and customer management; the dashboard falls back to its existing local adapter when the API is unavailable.
- Payments: no payment is verified by the UI or a manual note. Provider checkout, callback/webhook signature verification, refunds, and provider reconciliation are not configured. MTN MoMo and Airtel Money credentials and compliance approval are required before those integrations can be enabled.
- Email, password reset, email verification, Google OAuth, and multi-factor authentication are not configured. The UI explains these limitations rather than simulating them.
- Security: database-backed sessions and server-side role checks protect API operations. Use HTTPS and `SESSION_SECURE=true` in production. Do not expose this development server directly to the public internet.
- Deployment: not configured or deployed. The API needs a production MariaDB service, secrets, HTTPS, backups, allowed frontend origin, and a same-site API URL/reverse proxy before production use.

## Key paths

- `src/pages/` — React pages for home, login, signup, and admin.
- `src/admin/` — dashboard sections and browser-data hooks.
- `src/server/` — Express API, session, security, and booking logic.
- `prisma/schema.prisma` and `prisma/migrations/` — MariaDB schema and initial migration.
- `scripts/` — initial administrator setup and safe default fleet import.
- `test/`, `e2e/` — Node unit tests and browser smoke tests.
- `REACT_MIGRATION_PLAN.md` — project inspection and staged migration record.
