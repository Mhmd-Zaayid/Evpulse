import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, NotificationProvider, useAuth } from './context';
import { DashboardLayout } from './components';

// Auth Pages
import { Login, Register } from './pages/auth';

// User Pages
import UserDashboard from './pages/user/DashboardNew';
import {
  StationDiscovery,
  StationDetail,
  Bookings,
  Payments,
  Settings as UserSettings,
} from './pages/user';

// Operator Pages
import {
  Dashboard as OperatorDashboard,
  Stations as OperatorStations,
  Sessions as OperatorSessions,
  Maintenance,
  Reports as OperatorReports,
  Settings as OperatorSettings,
} from './pages/operator';

// Admin Pages
import {
  Dashboard as AdminDashboard,
  Users,
  Stations as AdminStations,
  Transactions,
  Reports as AdminReports,
  Settings as AdminSettings,
} from './pages/admin';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === 'operator') {
      return <Navigate to="/operator" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === 'operator') {
      return <Navigate to="/operator" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

// App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* User Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <DashboardLayout>
              <UserDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stations"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <DashboardLayout>
              <StationDiscovery />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stations/:id"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <DashboardLayout>
              <StationDetail />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <DashboardLayout>
              <Bookings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <DashboardLayout>
              <Payments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <DashboardLayout>
              <UserSettings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Operator Routes */}
      <Route
        path="/operator"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <DashboardLayout>
              <OperatorDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/stations"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <DashboardLayout>
              <OperatorStations />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/sessions"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <DashboardLayout>
              <OperatorSessions />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/maintenance"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <DashboardLayout>
              <Maintenance />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/reports"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <DashboardLayout>
              <OperatorReports />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/settings"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <DashboardLayout>
              <OperatorSettings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <Users />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/stations"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <AdminStations />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transactions"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <Transactions />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <AdminReports />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <AdminSettings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
