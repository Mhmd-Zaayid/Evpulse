# EVPulse - Complete Project Documentation

> **EV Charging Station Management Platform**  
> A full-stack web application for managing electric vehicle charging stations, bookings, and payments.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Backend Setup (Flask)](#backend-setup-flask)
6. [Frontend Setup (React)](#frontend-setup-react)
7. [Database Setup (MongoDB)](#database-setup-mongodb)
8. [Environment Variables](#environment-variables)
9. [API Documentation](#api-documentation)
10. [User Roles & Permissions](#user-roles--permissions)
11. [Demo Credentials](#demo-credentials)
12. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
13. [Development Workflow](#development-workflow)

---

## 🚀 Project Overview

EVPulse is a comprehensive EV charging station management system that connects:
- **EV Owners** - Find stations, book charging slots, manage payments
- **Station Operators** - Manage stations, monitor sessions, view analytics
- **Administrators** - Oversee the entire platform, manage users, view reports

### Key Features
- 🔍 Station discovery with filters and search
- 📅 Booking system for charging slots
- ⚡ Real-time charging session monitoring
- 💳 Payment processing and history
- 📊 Analytics dashboards for operators and admins
- 🔔 Notification system
- ⭐ Rating and review system
- 🌱 Environmental impact tracking (CO2 savings)

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.9+ | Programming language |
| Flask | 3.0.0 | Web framework |
| PyMongo | 4.6.1 | MongoDB driver |
| Flask-JWT-Extended | 4.6.0 | JWT authentication |
| Flask-CORS | 4.0.0 | Cross-origin requests |
| bcrypt | 4.1.2 | Password hashing |
| python-dotenv | 1.0.0 | Environment variables |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| Vite | 7.x | Build tool |
| Tailwind CSS | 3.x | Styling |
| React Router | 7.x | Routing |
| Recharts | 2.x | Charts/graphs |
| Lucide React | - | Icons |

### Database
| Technology | Purpose |
|------------|---------|
| MongoDB | NoSQL database |
| MongoDB Atlas | Cloud-hosted option |

---

## 📁 Project Structure

```
EVPulse/
├── DOCUMENTATION.md          # This file
├── README.md                 # Quick start guide
│
├── backend/                  # Flask API Server
│   ├── app.py               # Main application entry
│   ├── config.py            # Configuration classes
│   ├── start_server.py      # Server startup script
│   ├── test_database.py     # Database connection test
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment template
│   ├── .env                 # Your environment file (create this)
│   │
│   ├── database/            # Database connection & config
│   │   ├── __init__.py
│   │   ├── connection.py    # MongoDB connection manager
│   │   └── config.py        # Database configuration
│   │
│   ├── models/              # Database models
│   │   ├── __init__.py
│   │   ├── user.py          # User model
│   │   ├── station.py       # Station model
│   │   ├── session.py       # Charging session model
│   │   ├── booking.py       # Booking model
│   │   ├── transaction.py   # Transaction model
│   │   ├── review.py        # Review model
│   │   └── notification.py  # Notification model
│   │
│   ├── routes/              # API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication routes
│   │   ├── stations.py      # Station routes
│   │   ├── sessions.py      # Session routes
│   │   ├── bookings.py      # Booking routes
│   │   ├── transactions.py  # Transaction routes
│   │   ├── reviews.py       # Review routes
│   │   ├── notifications.py # Notification routes
│   │   ├── admin.py         # Admin routes
│   │   ├── operator.py      # Operator routes
│   │   └── users.py         # User routes
│   │
│   └── scripts/
│       └── seed_db.py       # Database seeder
│
└── frontend/                 # React Application
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    │
    ├── public/              # Static assets
    │
    └── src/
        ├── main.jsx         # Entry point
        ├── App.jsx          # Root component
        ├── App.css          # Global styles
        ├── index.css        # Tailwind imports
        │
        ├── components/      # Reusable components
        │   ├── layout/      # Layout components
        │   └── ui/          # UI components
        │
        ├── pages/           # Page components
        │   ├── auth/        # Login, Register
        │   ├── user/        # User dashboard pages
        │   ├── operator/    # Operator pages
        │   └── admin/       # Admin pages
        │
        ├── context/         # React context providers
        ├── services/        # API services
        └── utils/           # Utility functions
```

---

## ✅ Prerequisites

Before starting, make sure you have these installed on your computer:

### 1. Python (for Backend)
- **Required Version**: Python 3.9 or higher
- **Download**: https://www.python.org/downloads/
- **Verify installation**:
  ```powershell
  python --version
  # Should show: Python 3.9.x or higher
  ```

### 2. Node.js (for Frontend)
- **Required Version**: Node.js 18 or higher
- **Download**: https://nodejs.org/
- **Verify installation**:
  ```powershell
  node --version
  # Should show: v18.x.x or higher
  
  npm --version
  # Should show: 9.x.x or higher
  ```

### 3. MongoDB (Database)
You have two options:

**Option A: MongoDB Atlas (Cloud - Recommended for beginners)**
- Free tier available
- No installation required
- Sign up at: https://www.mongodb.com/atlas

**Option B: Local MongoDB Installation**
- Download: https://www.mongodb.com/try/download/community
- Install MongoDB Compass (GUI) for easier management

### 4. Git (Optional but recommended)
- Download: https://git-scm.com/downloads

---

## 🔧 Backend Setup (Flask)

### Step 1: Open Terminal in Backend Folder

```powershell
cd c:\Users\emils\OneDrive\Desktop\Projects\EVPulse\backend
```

### Step 2: Create a Virtual Environment (Recommended)

A virtual environment keeps your project dependencies isolated from other Python projects.

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# If you get an execution policy error, run this first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Your terminal prompt should now show (venv) at the beginning
```

### Step 3: Install Python Dependencies

```powershell
# Make sure you're in the backend folder with venv activated
pip install -r requirements.txt
```

This installs all the packages listed in `requirements.txt`:
- Flask (web framework)
- PyMongo (MongoDB driver)
- Flask-JWT-Extended (authentication)
- Flask-CORS (cross-origin requests)
- bcrypt (password hashing)
- python-dotenv (environment variables)

### Step 4: Create Environment File

Create a new file called `.env` in the backend folder:

```powershell
# Copy the example file
copy .env.example .env
```

Now edit the `.env` file with your settings:

```env
# Flask Settings
FLASK_APP=app.py
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-super-secret-key-change-this-in-production

# MongoDB Connection
# Option A: MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/evpulse?retryWrites=true&w=majority

# Option B: Local MongoDB
# MONGODB_URI=mongodb://localhost:27017/evpulse

# App specific
MONGODB_DATABASE=evpulse

# JWT Settings
JWT_SECRET_KEY=your-jwt-secret-key-change-this-too
JWT_ACCESS_TOKEN_EXPIRES=86400
```

#### Getting MongoDB Atlas Connection String:

1. Go to https://cloud.mongodb.com and sign in
2. Create a new project (or use existing)
3. Click "Build a Database" → Choose FREE tier
4. Select a cloud provider and region
5. Create a database user (remember username & password!)
6. Add your IP address to the whitelist (or use 0.0.0.0/0 for development)
7. Click "Connect" → "Connect your application"
8. Copy the connection string and replace `<username>`, `<password>`, and `<cluster>`

### Step 5: Seed the Database (Add Sample Data)

```powershell
# Make sure venv is activated and you're in the backend folder
python scripts/seed_db.py
```

This creates:
- 3 demo users (user, operator, admin)
- 5 sample charging stations
- Sample bookings, sessions, and transactions

### Step 6: Start the Flask Server

```powershell
# Use the startup script (Recommended)
python start_server.py
```

You should see:
```
Starting EVPulse API server...
Server will be available at http://localhost:5000
Press Ctrl+C to stop the server
 * Running on http://0.0.0.0:5000
```

### ✅ Backend is now running at `http://localhost:5000`

### Quick Test

Open a browser and go to:
- `http://localhost:5000/api/health` - Should return `{"status": "healthy"}`

---

## 💻 Frontend Setup (React)

### Step 1: Open a NEW Terminal

Keep the backend terminal running, open a new terminal for frontend.

```powershell
cd c:\Users\emils\OneDrive\Desktop\Projects\EVPulse\frontend
```

### Step 2: Install Node Dependencies

```powershell
npm install
```

This reads `package.json` and installs all required packages.

### Step 3: Start the Development Server

```powershell
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### ✅ Frontend is now running at `http://localhost:5173`

Open your browser and go to `http://localhost:5173` to see the application.

---

## 🗄 Database Setup (MongoDB)

### MongoDB Atlas Setup (Recommended)

1. **Create Account**: https://www.mongodb.com/atlas/database
2. **Create Cluster**: Free M0 tier is sufficient for development
3. **Create Database User**:
   - Go to "Database Access"
   - Add new database user
   - Choose "Password" authentication
   - Save the username and password
4. **Network Access**:
   - Go to "Network Access"
   - Add IP Address
   - For development, you can use "Allow Access from Anywhere" (0.0.0.0/0)
5. **Get Connection String**:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Select "Python" and version "3.6 or later"
   - Copy the connection string

### Database Collections

The application uses these collections (created automatically):

| Collection | Purpose |
|------------|---------|
| users | User accounts |
| stations | Charging stations |
| sessions | Charging sessions |
| bookings | Slot reservations |
| transactions | Payment records |
| reviews | Station reviews |
| notifications | User notifications |

---

## 🔐 Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `FLASK_APP` | Entry point file | `app.py` |
| `FLASK_ENV` | Environment mode | `development` or `production` |
| `FLASK_DEBUG` | Enable debug mode | `True` or `False` |
| `SECRET_KEY` | Flask secret key | Ran1` or `0` |
| `SECRET_KEY` | Flask secret key | Random string |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `MONGODB_DATABASE` | Database name | `evpulse
| `JWT_ACCESS_TOKEN_EXPIRES` | Token expiry (seconds) | `86400` (24 hours) |

### Frontend

Create a `.env` file in the frontend folder (optional):

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| GET | `/auth/me` | Get current user | Yes |
| POST | `/auth/logout` | Logout user | Yes |

### Station Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/stations` | Get all stations | No |
| GET | `/stations/:id` | Get station by ID | No |
| POST | `/stations` | Create station | Yes (Operator) |
| PUT | `/stations/:id` | Update station | Yes (Operator) |
| DELETE | `/stations/:id` | Delete station | Yes (Admin) |

### Booking Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/bookings` | Get user's bookings | Yes |
| POST | `/bookings` | Create booking | Yes |
| PUT | `/bookings/:id` | Update booking | Yes |
| DELETE | `/bookings/:id` | Cancel booking | Yes |

### Session Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/sessions` | Get user's sessions | Yes |
| GET | `/sessions/active` | Get active session | Yes |
| POST | `/sessions/start` | Start charging | Yes |
| POST | `/sessions/:id/stop` | Stop charging | Yes |

### Request/Response Format

All requests and responses use JSON format.

**Headers for authenticated requests:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Example Login Request:**
```json
POST /api/auth/login
{
  "email": "user@evpulse.com",
  "password": "user123"
}
```

**Example Login Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "John User",
    "email": "user@evpulse.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 👥 User Roles & Permissions

### User (EV Owner)
- View and search charging stations
- Make bookings
- Start/stop charging sessions
- View charging history
- Manage payments
- Rate and review stations

### Operator (Station Owner)
- All user permissions
- Create and manage stations
- View station analytics
- Manage charging sessions
- View revenue reports
- Handle maintenance

### Admin (Platform Administrator)
- All operator permissions
- Manage all users
- Manage all stations
- View platform-wide analytics
- Access system settings
- View all transactions

---

## 🔑 Demo Credentials

After running the seed script, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| User | `user@evpulse.com` | `user123` |
| Operator | `operator@evpulse.com` | `operator123` |
| Admin | `admin@evpulse.com` | `admin123` |

---

## 🔧 Common Issues & Troubleshooting

### Backend Issues

#### 1. "python is not recognized"
**Solution**: Python is not in your PATH. Reinstall Python and check "Add to PATH" during installation.

#### 2. "pip is not recognized"
**Solution**: Try `python -m pip install -r requirements.txt`

#### 3. Virtual environment activation error (PowerShell)
**Solution**: Run as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 4. "ModuleNotFoundError: No module named 'flask'"
**Solution**: Make sure virtual environment is activated and dependencies installed:
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

#### 5. MongoDB connection error
**Solution**:`MONGODB_URI` in `.env` file
- Ensure your IP is whitelisted in MongoDB Atlas
- Check your username/password
- Make sure MongoDB is running (if local)
- Run the diagnostics script: `python test_database.py --diagnostics`
- Make sure MongoDB is running (if local)

#### 6. "Address already in use" (Port 5000)
**Solution**: Another process is using port 5000. Either:
```powershell
# Find and kill the process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or run on a different port
flask run --port 5001
```

### Frontend Issues

#### 1. "npm is not recognized"
**Solution**: Node.js is not installed or not in PATH. Download from https://nodejs.org/

#### 2. npm install errors
**Solution**: Delete `node_modules` and `package-lock.json`, then try again:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

#### 3. CORS errors in browser
**Solution**: Make sure backend is running on port 5000 and CORS is configured.

#### 4. API requests failing
**Solution**:
- Check if backend is running
- Check browser console for errors
- Verify API URL is correct (`http://localhost:5000/api`)

### Database Issues

#### 1. Seed script fails
**Solution**:
- Check MongoDB connection string
- Ensure database is accessible
- Check for existing data conflicts

#### 2. Data not showing in app
**Solution**:
- Run the seed script: `python scripts/seed_db.py`
- Check MongoDB Compass to verify data exists

---

## 🔄 Development Workflow

### Daily Development

1. **Start Backend**:
   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   flask run
   ```

2. **Start Frontend** (new terminal):
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Open Browser**: http://localhost:5173

### Making Changes

- **Backend changes**: Flask auto-reloads in debug mode
- **Frontend changes**: Vite provides hot module replacement (HMR)
- **Database changes**: May need to re-run seed script

### Stopping Servers

Press `Ctrl + C` in each terminal to stop the servers.

---

## 📚 Additional Resources

### Flask Documentation
- Official Docs: https://flask.palletsprojects.com/
- Flask-PyMongo: https://flask-pymongo.readthedocs.io/
- Flask-JWT-Extended: https://flask-jwt-extended.readthedocs.io/

### React Documentation
- React Docs: https://react.dev/
- Vite Docs: https://vitejs.dev/
- Tailwind CSS: https://tailwindcss.com/docs

### MongoDB
- MongoDB Manual: https://www.mongodb.com/docs/manual/
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/

---

## 📝 Quick Reference Commands

```powershell
# === BACKEND ===
cd backend
.\venv\Scripts\Activate.ps1    # Activate virtual environment
pip install -r requirements.txt # Install dependencies
python scripts/seed_db.py       # Seed database
flask run                       # Start server

# === FRONTEND ===
cd frontend
npm install                     # Install dependencies
npm run dev                     # Start dev server
npm run build                   # Build for production

# === DATABASE ===
# MongoDB Atlas - manage via web interface
# Local MongoDB - use MongoDB Compass GUI
```

---

## 🎉 You're All Set!

If you followed all the steps, you should have:
- ✅ Backend running on http://localhost:5000
- ✅ Frontend running on http://localhost:5173
- ✅ MongoDB connected with sample data
- ✅ Demo accounts ready to test

**Happy Coding!** 🚀

---

*Last Updated: January 31, 2026*
