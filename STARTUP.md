# EVPulse Startup Guide

Fast daily startup instructions.

## Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python start_server.py
```

Backend runs at: `http://localhost:5000`

## Frontend

Open a second terminal:

```powershell
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:5173`

## Quick Checks

- Health endpoint: `http://localhost:5000/api/health`
- App URL: `http://localhost:5173`

## Stop

Press `Ctrl + C` in each terminal.

