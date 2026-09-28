import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Threats from './pages/Threats';
import Servers from './pages/Servers';
import AddServer from './pages/AddServer';
import Sessions from './pages/Sessions';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Alerts from './pages/Alerts';
import Incidents from './pages/Incidents';
import Profile from './pages/Profile';
import Intelligence from './pages/Intelligence';
import UsersPage from './pages/Users';
import AuditLogsPage from './pages/AuditLogs';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected SOC Application Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="intelligence" element={<Intelligence />} />
              <Route path="threats" element={<Threats />} />
              <Route path="servers" element={<Servers />} />
              <Route
                path="servers/add"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AddServer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="sessions"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'analyst']}>
                    <Sessions />
                  </ProtectedRoute>
                }
              />
              <Route path="analytics" element={<Analytics />} />
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'analyst']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="settings" element={<Settings />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
