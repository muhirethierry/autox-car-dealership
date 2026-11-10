# AUTOX full-stack migration status

## Existing architecture

- React 19, React Router, and Vite serve `/`, `/login.html`, `/signup.html`, and `/admin.html`.
- Existing AUTOX CSS, fonts, media, logo, local fleet data, and browser storage adapter are retained. Original source snapshots remain under `legacy/`.
- Express 5 serves `/api` with Zod validation, Helmet, same-origin development proxy, rate limiting, MariaDB-backed sessions, and session-bound CSRF protection.
- Prisma 7 schema and an initial SQL migration define users/roles, vehicles, bookings, payments, maintenance, and admin activity. Prisma's MariaDB adapter connects through `DATABASE_URL`.

## Implemented in the prototype

- The admin dashboard is split into React section components. Its existing dark navy/gold design is retained and mobile overflow handling is included.
- The customer site, admin fleet, booking actions, and customer directory can use API records; localStorage remains a fallback for existing preview data.
- Sign-up and sign-in use server-managed sessions. Passwords are hashed using Node's built-in scrypt, never returned to the browser or stored in localStorage. Admin privileges are read from the database for each protected API request.
- Booking creation and approval lock the vehicle row and check overlapping holds plus maintenance within a transaction.
- Admin payment entries are pending/unverified. Revenue aggregation counts only records with a provider-verified status.
- A dry-run fleet import previews missing default fleet rows; `--apply` inserts only missing records.
- Node tests cover password hashing, CSRF token binding, rental package calculation, and booking overlap rules. Playwright smoke tests cover the public pages and mobile layout.

## Setup sequence

Follow the full local setup in `README.md`: configure `.env`, start MariaDB, run Prisma generation/migration, preview and apply fleet import, create the initial Super Admin, then run the API and Vite in separate terminals.

## Remaining before production

- Configure a production MariaDB provider, HTTPS, secrets, backups, same-site API routing, and monitoring.
- Connect remaining dashboard sections (payments, maintenance, reports, settings, notifications, reviews, and activity) to their authoritative database records; finish migration of existing browser-only data through an explicit export/import process.
- Implement email verification/reset flows with a configured mail provider; configure Google OAuth only if desired.
- Integrate MTN MoMo/Airtel Money sandbox and production credentials, signed callback/webhook verification, status reconciliation, idempotency, refunds, and provider-specific operations.
- Run browser acceptance checks with a real local MariaDB, including admin CRUD, customer booking conflicts, role restrictions, and data consistency across devices.
- Set the trusted `APP_ORIGIN`, production cookie flags, and hosting configuration. Deployment is not performed by this repository setup.

## Architecture boundary

Browser localStorage is only a local preview/fallback and is not shared or authoritative. Only API/database data is shared across sessions. The current implementation is a development prototype, not production-ready payment or business software.
