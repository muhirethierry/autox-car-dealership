# AUTOX Car Rental

The React + Vite application keeps the existing AUTOX visual styles and public assets. The original HTML/CSS/JS source is preserved under `legacy/` as the parity reference.

## Run locally

```sh
npm install
npm run dev
```

Vite serves the four existing page URLs:

- `/` — rental homepage
- `/login.html` — sign-in UI
- `/signup.html` — account creation UI
- `/admin.html` — fleet and rental operations dashboard

Build and preview the production bundle with `npm run build` and `npm run preview`.

## Data and security

Fleet, booking, and dashboard records use the existing browser `localStorage` adapter and keys. The rental homepage and admin page see records in the same browser. This is a prototype store, not shared multi-user storage. Login/signup do not authenticate users, and payment notes are not verified. Do not enter real passwords or treat dashboard visibility as access control; secure sessions, roles, shared records, and payment confirmation require a trusted backend.

## Migration notes

- Existing design styles remain in `style.css`, `login.css`, and `admin.css`.
- Existing logo, favicon, and hero video are reused from `public/assets/`; the originals remain in `assets/`.
- The homepage and authentication forms are React-rendered pages.
- The admin dashboard currently uses its existing controller through a React-mounted compatibility page to preserve its current behaviors and visual layout while its sections are converted incrementally.
- `REACT_MIGRATION_PLAN.md` records the inspection notes and parity checklist.
