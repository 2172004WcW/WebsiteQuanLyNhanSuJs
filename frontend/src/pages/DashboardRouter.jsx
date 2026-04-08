import { Routes, Route, Navigate } from 'react-router-dom';
import { getRole, getToken } from '../api/authStorage.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import RequireRole from '../components/RequireRole.jsx';
import AdminAccounts from './dashboard/AdminAccounts.jsx';
import AdminPermissions from './dashboard/AdminPermissions.jsx';
import AdminLoginLogs from './dashboard/AdminLoginLogs.jsx';

function defaultDashboardSegment() {
  const r = (getRole() || '').toUpperCase();
  if (r === 'ADMIN') return 'admin';
  return '/login?error=unauthorized';
}

function DashboardIndexRedirect() {
  return <Navigate to={defaultDashboardSegment()} replace />;
}

export default function DashboardRouter() {
  const token = getToken();
  if (!token) return <Navigate to="/login?error=unauthorized" replace />;

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<DashboardIndexRedirect />} />

        {/* ADMIN Routes */}
        <Route
          path="admin/accounts"
          element={
            <RequireRole roles={['ADMIN']}>
              <AdminAccounts />
            </RequireRole>
          }
        />
        <Route
          path="admin/login-logs"
          element={
            <RequireRole roles={['ADMIN']}>
              <AdminLoginLogs />
            </RequireRole>
          }
        />
        <Route
          path="admin/permissions"
          element={
            <RequireRole roles={['ADMIN']}>
              <AdminPermissions />
            </RequireRole>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard/admin/accounts" replace />} />
      </Route>
    </Routes>
  );
}
