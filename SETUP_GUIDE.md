# EVPulse Setup Guide

Step-by-step setup for local development.

## 1) Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB Atlas account or local MongoDB instance

## 2) Backend Setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Update `backend/.env` values:
- `MONGODB_URI`
- `SECRET_KEY`
- `JWT_SECRET_KEY`

Optional:
- `AI_API_KEY` (for `/api/ai/optimize`)

Seed data and start server:

```powershell
python scripts/seed_db.py
python start_server.py
```

Backend URL: `http://localhost:5000`

## 3) Frontend Setup

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## 4) Verify Setup

Health check:

```powershell
Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -Method GET
```

Login test:

```powershell
$body = @{email='user@evpulse.com'; password='user123'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $body -ContentType 'application/json'
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| User | `user@evpulse.com` | `user123` |
| Operator | `operator@evpulse.com` | `operator123` |
| Admin | `admin@evpulse.com` | `admin123` |

## Troubleshooting

### PowerShell activation blocked

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### DB connection error
- Check `MONGODB_URI` in `backend/.env`
- Verify Atlas network access/IP whitelist
- Run diagnostics:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python test_database.py --diagnostics
```

### Frontend “Failed to fetch”
- Ensure backend is running on `http://localhost:5000`
- If using frontend env file, verify `VITE_API_URL`

### Port 5000 in use

```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

Last updated: 2026-02-19
