import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, NotificationProvider, useAuth } from './context';
import { DashboardLayout } from './components';

// Landing Page
import Landing from './pages/Landing';

// Auth Pages
import { Login, Register } from './pages/auth';

// User Pages
import {
  Dashboard as UserDashboard,
  StationDiscovery,
  StationDetail,
  Bookings,
  Payments,
  Settings as UserSettings,
  ChargingHistory,
} from './pages/user';

// Operator Pages
import {
  Dashboard as OperatorDashboard,
  Stations as OperatorStations,
  Sessions as OperatorSessions,
  Feedback as OperatorFeedback,
  Maintenance,
  Reports as OperatorReports,
  Settings as OperatorSettings,
} from './pages/operator';

// Admin Pages
import {
  Dashboard as AdminDashboard,
  Users,
  Stations as AdminStations,
  Feedback as AdminFeedback,
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
      return <Navigate to="/user/dashboard" replace />;
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
      return <Navigate to="/user/dashboard" replace />;
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
        path="/user/dashboard"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <DashboardLayout>
              <UserDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={<Navigate to="/user/dashboard" replace />}
      />
      <Route
        path="/user/stations"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <DashboardLayout>
              <StationDiscovery />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stations"
        element={<Navigate to="/user/stations" replace />}
      />
      <Route
        path="/user/stations/:id"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <DashboardLayout>
              <StationDetail />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stations/:id"
        element={<Navigate to="/user/stations/:id" replace />}
      />
      <Route
        path="/user/bookings"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <DashboardLayout>
              <Bookings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={<Navigate to="/user/bookings" replace />}
      />
      <Route
        path="/user/history"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <DashboardLayout>
              <ChargingHistory />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/payments"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <DashboardLayout>
              <Payments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={<Navigate to="/user/payments" replace />}
      />
      <Route
        path="/user/settings"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <DashboardLayout>
              <UserSettings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={<Navigate to="/user/settings" replace />}
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
        path="/operator/feedback"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <DashboardLayout>
              <OperatorFeedback />
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
        path="/admin/feedback"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <AdminFeedback />
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
      <Route path="/" element={<Landing />} />
      <Route path="*" element={<Navigate to="/" replace />} />
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
