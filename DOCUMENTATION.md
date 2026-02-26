# EVPulse Documentations

Full-stack EV charging platform documentation for setup, architecture, API groups, and troubleshooting.

## Table of Contents
- [Overview](#overview)
- [Stack](#stack)
- [Project Layout](#project-layout)
- [Environment Variables](#environment-variables)
- [Setup](#setup)
- [Startup (Daily Use)](#startup-daily-use)
- [API Surface](#api-surface)
- [Demo Accounts](#demo-accounts)
- [Troubleshooting](#troubleshooting)

## Overview

EVPulse provides role-based EV charging workflows for:
- **Users**: discover stations, create bookings, manage charging sessions, payments, and profile
- **Operators**: manage stations, sessions, maintenance, and operator reports
- **Admins**: monitor users, stations, transactions, and platform-level reports

## Stack

### Backend
- Python 3.9+
- Flask 3
- PyMongo 4
- Flask-JWT-Extended
- Flask-CORS
- python-dotenv

### Frontend
- React 19
- Vite 7 (`rolldown-vite`)
- Tailwind CSS 3
- React Router 7
- Recharts

### Database
- MongoDB (Atlas or local)

## Project Layout

```text
EVPulse/
├─ README.md
├─ STARTUP.md
├─ SETUP_GUIDE.md
├─ DOCUMENTATION.md
├─ backend/
│  ├─ app.py
│  ├─ start_server.py
│  ├─ test_database.py
│  ├─ requirements.txt
│  ├─ .env.example
│  ├─ database/
│  ├─ models/
│  ├─ routes/
│  └─ scripts/seed_db.py
└─ frontend/
   ├─ package.json
   └─ src/
      ├─ App.jsx
      ├─ context/
      ├─ pages/
      ├─ components/
      └─ services/api.js
```

## Environment Variables

### Backend (`backend/.env`)

Create from template:

```powershell
Copy-Item .env.example .env
```

Required:
- `MONGODB_URI`
- `SECRET_KEY`
- `JWT_SECRET_KEY`

Common:
- `FLASK_APP=app.py`
- `FLASK_ENV=development`
- `FLASK_DEBUG=1`
- `MONGODB_DATABASE=evpulse`
- `JWT_ACCESS_TOKEN_EXPIRES=86400`

Optional:
- `AI_API_KEY` (used by `POST /api/ai/optimize`)

### Frontend (`frontend/.env`, optional)
- `VITE_API_URL` (default: `http://localhost:5000/api`)

## Setup

### 1) Backend Setup

PowerShell (Windows):

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

After filling `.env`, run:

```powershell
python scripts/seed_db.py
python start_server.py
```

Backend should be available at `http://localhost:5000`.

### 2) Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

Frontend should be available at `http://localhost:5173`.

## Startup (Daily Use)

Terminal 1:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python start_server.py
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

## API Surface

Base URL: `http://localhost:5000/api`

Core route groups (registered in `backend/app.py`):
- `/api/auth`
- `/api/stations`
- `/api/sessions`
- `/api/bookings`
- `/api/transactions`
- `/api/reviews`
- `/api/notifications`
- `/api/admin`
- `/api/operator`
- `/api/users`

Utility endpoints:
- `GET /api/health`
- `GET /api/test`
- `GET /api/db/status`
- `GET /api/db/diagnostics`
- `POST /api/ai/optimize` (requires `AI_API_KEY`)

## Demo Accounts

Created by `python scripts/seed_db.py`:

| Role | Email | Password |
|------|-------|----------|
| User | `user@evpulse.com` | `user123` |
| Operator | `operator@evpulse.com` | `operator123` |
| Admin | `admin@evpulse.com` | `admin123` |

## Troubleshooting

### Backend not starting
- Re-activate venv and reinstall deps:
  ```powershell
  .\venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  ```

### MongoDB connection issues
- Verify `MONGODB_URI` in `backend/.env`
- Ensure Atlas IP/network access is configured
- Run diagnostics:
  ```powershell
  cd backend
  .\venv\Scripts\Activate.ps1
  python test_database.py --diagnostics
  ```

### Frontend cannot call API
- Confirm backend is running on `http://localhost:5000`
- Check `VITE_API_URL` if set
- Confirm browser requests target `/api/...`

## Recent Changes

- Session and transaction payloads are enriched with dynamic `userName` and `operatorName` values from database records.
- Admin transaction list hides the session subtitle under user names for cleaner display.
- User station AI analyze includes corrected estimated cost calculation and a shortened key breakdown view.

---

