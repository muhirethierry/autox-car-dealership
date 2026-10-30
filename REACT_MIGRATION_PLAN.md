# AUTOX React + Vite migration plan

## Visual and behavior reference

The current source of truth is the existing site in this repository. Keep its three visual systems intact: rental landing page (`style.css`), authentication (`login.css`), and the rental operations dashboard (`admin.css`). Preserve the current logo, favicon, hero video, remote vehicle photos/fallback behavior, Google Fonts, Font Awesome icons, color tokens, breakpoints, animations, and copy.

## Current architecture found

- The repository has no package manifest, Vite configuration, React source, or dependency lockfile.
- `index.html` and `script.js` render the customer landing page, booking dialogs, fleet search/filter/sort, rental requests, and localStorage persistence.
- `fleet-data.js` supplies 51 default vehicle records. `admin-data.js` is the shared localStorage adapter; `admin.js` drives the fleet/booking operations UI; `admin-reports.js` calculates and renders dashboard reports.
- `login.html` and `signup.html` share `login.css` and `login.js`; their forms are frontend-only and must remain explicitly so.
- `admin.html` and `admin.css` define the dashboard UI. The current UI JavaScript is imperative and depends on stable DOM IDs and event delegation.
- `assets/` currently contains the AUTOX SVG logo, hero MP4, and favicon. Most vehicle photographs are remote URLs with fallbacks in the fleet records.
- Existing localStorage keys include `autoxFleetAdminState` and `autoxRentalRequests`, plus dashboard records. Keep these keys and data shapes readable during migration.
- Existing responsive breakpoints are in `style.css`, `login.css`, and `admin.css`; leave the styles byte-for-byte unchanged during the initial parity pass.

## Migration approach

1. Preserve all current HTML, CSS, JavaScript, and fleet data in a `legacy/` reference folder before changing entry points. Keep `assets/` in place and reuse the existing media.
2. Add a root Vite/React application with React Router routes for `/`, `/login.html`, `/signup.html`, and `/admin.html`; preserve those familiar URLs.
3. Build separate React page modules and a small shared app/router shell. Keep the existing CSS files as the first-pass visual source of truth; avoid a CSS framework and do not rewrite style values during conversion.
4. Reuse the fleet defaults and existing storage adapter at first, preserving its keys and migration behavior. Add a React context/service boundary so the imperative page controllers can be migrated incrementally without splitting the data store.
5. Move customer, auth, and admin views one at a time. Keep frontend-only authentication and unverified payment limitations visible; do not store passwords or claim secure authorization.
6. Build and run the reference and React app at desktop/mobile viewport sizes. Compare screenshots and test core flows before treating parity as complete.

## Acceptance checks

- Vite build succeeds and direct visits to all four routes resolve.
- Existing CSS and local assets are reused without a theme/layout rewrite.
- Hero video, fleet cards, booking request persistence, login/signup validation, and dashboard fleet/booking actions remain functional.
- Legacy fleet and request localStorage data survives refresh and is not overwritten by defaults.
- Desktop/tablet/mobile screenshots are visually reviewed against the preserved reference before calling the migration complete.

## Known limitations until a backend exists

Browser localStorage remains local to one browser. It is not multi-user storage or access control. Login/signup stay UI-only, password fields are never persisted, and payment notes remain unverified. Production authorization, sessions, shared records, and payment-provider verification require a backend.

## Current migration progress

- Complete: source backup, Vite multi-page setup, React Router and data contexts, unchanged customer-site CSS, homepage React state/actions, and React login/signup forms.
- Compatibility bridge: the admin page mounts its preserved HTML template and runs its existing controller as a page module. This keeps all current fleet/request/report behavior available while that dashboard is converted section by section.
- Still required before final acceptance: migrate the admin dashboard controller into React components/state, then complete desktop/tablet/mobile visual comparison and interactive browser checks.
