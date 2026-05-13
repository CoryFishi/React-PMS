# React-PMS — Property Management Software

Storage-facility property management: companies own facilities, facilities contain units, tenants rent units via rentals, payments are processed through Stripe, leases through DocuSign.

## Stack

- **Client** (`client/`): React 18 + Vite 6, Tailwind CSS, MUI v7, react-router v6, axios, Stripe.js, Chart.js / MUI X Charts, react-hot-toast. Plain JSX — no TypeScript.
- **Server** (`server/`): Node ESM (`"type": "module"`), Express 4, Mongoose 8 (MongoDB), JWT auth via cookies, bcrypt, Stripe, DocuSign eSign, Nodemailer.

## Run

```bash
# server (port 3000 by default)
cd server && npm start          # uses nodemon

# client (port 5173)
cd client && npm run dev

# lint
cd client && npm run lint
cd server && npm run lint
```

There is a Vitest test suite on the server: `cd server && npm test` (39 tests as of 2026-05-12). There is still no client-side test suite.

## Required env vars

The server reads these from `server/.env`. Never read, log, or commit the file.

- `MONGO_URL`, `PORT`, `JWT_SECRET`, `API_KEY`, `FRONTEND_URL`
- Email: `EMAIL`, `PASS`
- Stripe: `STRIPE_SECRET`, `STRIPE_SECRET_KEY`
- DocuSign: `DS_ACCOUNT_ID`, `DS_BASE_PATH`, `DS_INTEGRATION_KEY`, `DS_OAUTH_BASE`, `DS_PRIVATE_KEY_B64`, `DS_USER_ID`, `DS_LEASE_TEMPLATE_ID`. Legacy `DS_PRIVATE_KEY_B` is still read with a deprecation warning.

The client uses `dotenv` and Vite env (`VITE_*`).

## Architecture map

```
Company  ──owns──▶  Facility  ──contains──▶  Unit (typed by UnitType)
                                                 │
                                                 ▼
                                            Rental ──┐
                                                     ├──▶ Tenant
                                                     └──▶ Payment

User (role-based)   Event (audit/activity log)
```

Server routes mount in `server/index.js`:
- `/companies`, `/facilities`, `/tenants`, `/events`, `/payments`, `/rental`, `/` (user)

Each domain follows the same pattern: `routes/<x>Routes.js` → `controllers/<x>Controller.js` → `models/<x>.js`. Background jobs live in `server/processes/` (`delinquency.js`, `monthly.js`). Third-party SDK wrappers in `server/services/` (Stripe Connect, DocuSign).

Client pages in `client/src/pages/`, feature-grouped components in `client/src/components/<area>Components/`. Shared UI in `sharedComponents/`. Auth context in `client/src/context/`.

## Conventions

- ESM imports everywhere on the server, including relative paths with `.js` extensions.
- Mongoose models export the model as default; one model per file.
- Controllers export named handler functions; routes are thin and only wire URL → handler + middleware.
- Auth: JWT in HTTP-only cookies, parsed in `server/middleware/authentication.js`. API-key endpoints use `server/middleware/apiKeyAuth.js`.
- Client uses axios with `withCredentials: true` so cookies travel.
- Styling: Tailwind utility classes first; reach for MUI when a component (DataGrid, Charts, Dialog) saves real work. Don't introduce a third UI system.
- Files use `.jsx`, never `.tsx`.

## Guardrails

- **Don't introduce TypeScript** — the project is plain JSX/JS by choice.
- **Don't run `npm install` or change dependency versions** without asking. Lockfiles are committed.
- **Don't touch `.env`, `.env.local`, or any secrets** — read env var names from this file or `grep process.env`.
- **Don't refactor unrelated code** while fixing a bug. The README tracks intentional scope.
- When adding a domain entity, follow the existing route+controller+model triplet pattern — don't introduce a new architecture.
- Prefer editing existing files over creating new ones; ask before adding a new top-level folder.

## Known open work / bugs (from README)

Bugs:
- Multi-unit creation: on partial failure, retry reports "already created" for successful rows.
- Navbar user dropdown doesn't dismiss on outside click.
- Facility Application Events report errors on API call.

Pending features include: consolidated dashboard endpoint, company-scoped admin/user dashboards, facility unit map, previous-tenants table, gate integration, tenant payments/lease/insurance UI, facility-level settings, removing security level from the unit layer.

## Where to look

- Server entry & route mounting: `server/index.js`
- Auth middleware: `server/middleware/authentication.js`
- Stripe wrapper: `server/services/stripeConnect.js`
- DocuSign wrapper: `server/services/docusignClient.js`
- Recurring jobs: `server/processes/`
- Client routing: `client/src/App.jsx`
- Client auth state: `client/src/context/`
