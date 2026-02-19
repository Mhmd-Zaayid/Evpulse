# EVPulse Frontend

React + Vite client for EVPulse.

## Requirements
- Node.js 18+
- npm 9+

## Install

```bash
npm install
```

## Run (Development)

```bash
npm run dev
```

Default dev URL: `http://localhost:5173`

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Environment Variable

Optional `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

If omitted, the app defaults to `http://localhost:5000/api`.

## App Structure

- `src/App.jsx` — route definitions and protected route logic
- `src/context/` — auth + notification providers
- `src/pages/` — role-specific pages (`auth`, `user`, `operator`, `admin`)
- `src/components/` — layout and reusable UI components
- `src/services/api.js` — API client modules

## Notes

- Keep backend running while developing frontend features.
- Login tokens are stored in browser `localStorage`.

---

Last updated: 2026-02-19
