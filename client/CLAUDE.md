# client/ — React-PMS Frontend

Vite + React 18, plain JSX. Tailwind utility classes are the default styling layer; MUI v7 is used where a complex component (DataGrid, Charts, Dialog, DatePicker) earns its weight. Don't introduce a third UI library.

## Run

```bash
npm run dev      # vite dev server on :5173
npm run build    # production build
npm run lint     # eslint (must stay at 0 warnings)
npm run preview  # serve built bundle
```

Lint runs with `--max-warnings 0`. If you add code that warns, fix it before claiming done.

## Layout

- `src/main.jsx` — entry, mounts `<App />`.
- `src/App.jsx` — top-level routing (react-router v6).
- `src/pages/` — route-level screens (Dashboard, Home, Login, Register, UserProfile, TenantPayment, NotFound).
- `src/components/` — grouped by feature area:
  - `companyComponents/`, `facilityComponents/`, `homeComponents/`, `paymentComponents/`, `rentalCenter/`, `reportComponents/`, `settingsComponents/`, `userComponents/`
  - `sharedComponents/` — reusable across features
  - Top-level: `Navbar.jsx`, `LoadingSpinner.jsx`, `NotFound.jsx`
- `src/context/` — React context providers (auth, etc.).
- `src/assets/` — images, static files.
- `src/index.css` — Tailwind directives + global styles.

## Conventions

- File extension is `.jsx`. Components are PascalCase, one component per file.
- Functional components + hooks only. No class components.
- HTTP calls use `axios` with `withCredentials: true` so the JWT cookie travels. Base URL comes from a Vite env var — check existing usage in components before introducing a new pattern.
- Tailwind first. Use MUI components when they save real work; don't restyle MUI internals with Tailwind unless the existing code does.
- Toasts: `react-hot-toast`. Don't add a second notification system.
- Charts: existing code mixes Chart.js (`react-chartjs-2`) and MUI X Charts — follow whichever the surrounding file uses.
- Routing: react-router v6 `<Route element={...}>` syntax. Protected routes wrap with the auth context.

## Adding a feature

1. Page goes in `src/pages/`, register the route in `App.jsx`.
2. Feature-specific components in `src/components/<area>Components/`. Generic UI in `sharedComponents/`.
3. If the feature talks to a new server route, confirm the corresponding controller exists in `server/controllers/` and is mounted in `server/index.js`.

## Don't

- Don't introduce TypeScript, Redux, Zustand, Tanstack Query, styled-components, or a new HTTP client.
- Don't rename existing component folders — links and imports are brittle.
- Don't add `node_modules`-level dependencies without asking.
