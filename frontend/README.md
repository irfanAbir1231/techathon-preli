# Office Energy Frontend

React + Vite + TypeScript dashboard for the Office Energy Monitoring project.

## Stack

- React
- Vite
- TypeScript
- React Router
- Socket.IO Client
- Lucide React
- Recharts
- Vitest + React Testing Library

## Local Setup

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local` for local development:

```bash
VITE_API_BASE_URL=https://techathon-preli-backend.onrender.com
VITE_SOCKET_URL=https://techathon-preli-backend.onrender.com
```

Do not commit `.env.local`.

## Commands

```bash
npm run lint
npm run test
npm run build
```

## Backend Dependency

The frontend reads the existing backend as the single source of truth. It does not
create device state, alert state, historical data, Discord state, Groq state, or
simulation state.

Render backend origin:

```bash
https://techathon-preli-backend.onrender.com
```

REST endpoints used:

- `GET /api/status`
- `POST /api/device/toggle`

Socket.IO event used:

- `dashboard-update`

## Vercel Deployment

Use these Vercel settings:

- Root Directory: `frontend`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Required Vercel environment variables:

```bash
VITE_API_BASE_URL=https://techathon-preli-backend.onrender.com
VITE_SOCKET_URL=https://techathon-preli-backend.onrender.com
```

`vercel.json` includes an SPA rewrite so direct route navigation works.

## Current Limitations

- The power trend displays live data collected during the current browser session.
  The backend does not yet provide persistent historical energy data.
- Analytics, reports, and settings are deferred.
- Discord and Groq integration are deferred to a later phase.
- The frontend displays active backend alerts only; resolved-alert history is not
  exposed by the backend.
