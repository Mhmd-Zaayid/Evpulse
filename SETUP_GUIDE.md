# EVPulse Setup Guide

## Database Connection Status
✅ **MongoDB Atlas is connected and working!**

## Backend Setup

### Start the Backend Server

```powershell
cd backend
python start_server.py
```

The server will run on `http://localhost:5000`

### Test Credentials

The database has been seeded with test users:

**Regular User:**
- Email: `user@evpulse.com`
- Password: `user123`
- Role: user

**Operator:**
- Email: `operator@evpulse.com`
- Password: `operator123`
- Role: operator

**Admin:**
- Email: `admin@evpulse.com`
- Password: `admin123`
- Role: admin

## Frontend Setup

### Start the Frontend

```powershell
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

## Testing the Connection

### 1. Check Backend Health
```powershell
Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -Method GET
```

### 2. Test Login
```powershell
$body = @{email='user@evpulse.com'; password='user123'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $body -ContentType 'application/json'
```

## Database Configuration

### Current Setup
- **MongoDB Atlas** (Cloud Database)
- Connection URI is configured in `.env` file
- Database name: `evpulse`
- Collections: users, stations, sessions, bookings, transactions, reviews, notifications

### Environment Variables (.env)

```env
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=your-actual-secret-key-here-change-in-production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://evpulse:evpulse2026@cluster0.kdwdasn.mongodb.net/evpulse?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true

# JWT Configuration
JWT_SECRET_KEY=your-actual-jwt-secret-key-here-change-in-production
JWT_ACCESS_TOKEN_EXPIRES=86400
```

## Troubleshooting

### "Failed to fetch" error in frontend
This usually means:
1. Backend server is not running → Start with `python start_server.py`
2. Backend is on wrong port → Should be port 5000
3. CORS issue → Already configured for localhost:5173

### Database connection errors
1. Check if MongoDB Atlas cluster is paused
2. Verify the MONGODB_URI in .env file
3. Run `python test_database.py` to diagnose

### Server won't start on port 5000
Kill any existing processes:
```powershell
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
```

## What Was Fixed

1. ✅ **Simplified MongoDB initialization** - Removed complex SSL configurations
2. ✅ **Fixed app factory** - Proper PyMongo initialization
3. ✅ **Disabled auto-reloader** - Prevents port conflicts and socket errors
4. ✅ **Created start_server.py** - Simple, reliable server startup script
5. ✅ **Database connection is working** - MongoDB Atlas is connected successfully

## Next Steps

1. Start the backend: `cd backend && python start_server.py`
2. Start the frontend: `cd frontend && npm run dev`
3. Open browser to `http://localhost:5173`
4. Login with `user@evpulse.com` / `user123`

**Database is ready to use!** 🎉
