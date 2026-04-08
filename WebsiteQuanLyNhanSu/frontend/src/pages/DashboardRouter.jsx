import { Routes, Route, Navigate } from 'react-router-dom';
import { getRole, getToken } from '../api/authStorage.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import RequireRole from '../components/RequireRole.jsx';
import DirectorHome from './dashboard/DirectorHome.jsx';
import DirectorReports from './dashboard/DirectorReports.jsx';
import DirectorKpi from './dashboard/DirectorKpi.jsx';
import AdminHome from './dashboard/AdminHome.jsx';
import AdminAccounts from './dashboard/AdminAccounts.jsx';
import AdminPermissions from './dashboard/AdminPermissions.jsx';
import AdminSettings from './dashboard/AdminSettings.jsx';
import AdminLoginLogs from './dashboard/AdminLoginLogs.jsx';
import HrHome from './dashboard/HrHome.jsx';
import HrEmployees from './dashboard/HrEmployees.jsx';
import HrAttendance from './dashboard/HrAttendance.jsx';
import HrLeaves from './dashboard/HrLeaves.jsx';
import HrPayroll from './dashboard/HrPayroll.jsx';
import HrOrganization from './dashboard/HrOrganization.jsx';
import OrgEntity from './dashboard/OrgEntity.jsx';
import HrEmployeeProfile from './dashboard/HrEmployeeProfile.jsx';
import HrDecisions from './dashboard/HrDecisions.jsx';
import HrRecruitment from './dashboard/HrRecruitment.jsx';
import EmployeeHome from './dashboard/EmployeeHome.jsx';
import EmployeeProfile from './dashboard/EmployeeProfile.jsx';
import EmployeeAttendance from './dashboard/EmployeeAttendance.jsx';
import EmployeeLeaves from './dashboard/EmployeeLeaves.jsx';
import EmployeePayslip from './dashboard/EmployeePayslip.jsx';
import EmployeeList from './dashboard/EmployeeList.jsx';

function defaultDashboardSegment() {
  const r = (getRole() || '').toUpperCase();
  if (r === 'ADMIN') return 'admin';
  if (r === 'HR') return 'hr';
  if (r === 'DIRECTOR') return 'director';
  return 'employee';
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

        <Route
          path="director"
          element={
            <RequireRole roles={['DIRECTOR']}>
              <DirectorHome />
            </RequireRole>
          }
        />
        <Route
          path="director/reports"
          element={
            <RequireRole roles={['DIRECTOR']}>
              <DirectorReports />
            </RequireRole>
          }
        />
        <Route
          path="director/kpi"
          element={
            <RequireRole roles={['DIRECTOR']}>
              <DirectorKpi />
            </RequireRole>
          }
        />

        <Route
          path="admin"
          element={
            <RequireRole roles={['ADMIN']}>
              <AdminHome />
            </RequireRole>
          }
        />
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
        <Route
          path="admin/settings"
          element={
            <RequireRole roles={['ADMIN']}>
              <AdminSettings />
            </RequireRole>
          }
        />

        <Route
          path="hr"
          element={
            <RequireRole roles={['HR']}>
              <HrHome />
            </RequireRole>
          }
        />
        <Route
          path="hr/employees"
          element={
            <RequireRole roles={['HR']}>
              <HrEmployees />
            </RequireRole>
          }
        />
        <Route
          path="hr/employee-list"
          element={
            <RequireRole roles={['HR']}>
              <EmployeeList />
            </RequireRole>
          }
        />
        <Route
          path="hr/attendance"
          element={
            <RequireRole roles={['HR']}>
              <HrAttendance />
            </RequireRole>
          }
        />
        <Route
          path="hr/leaves"
          element={
            <RequireRole roles={['HR']}>
              <HrLeaves />
            </RequireRole>
          }
        />
        <Route
          path="hr/payroll"
          element={
            <RequireRole roles={['HR']}>
              <HrPayroll />
            </RequireRole>
          }
        />
        <Route
          path="hr/organization"
          element={
            <RequireRole roles={['HR']}>
              <HrOrganization />
            </RequireRole>
          }
        />
        <Route
          path="hr/org/chi-nhanh"
          element={
            <RequireRole roles={['HR']}>
              <OrgEntity />
            </RequireRole>
          }
        />
        <Route
          path="hr/org/phong-ban"
          element={
            <RequireRole roles={['HR']}>
              <OrgEntity />
            </RequireRole>
          }
        />
        <Route
          path="hr/org/nhom"
          element={
            <RequireRole roles={['HR']}>
              <OrgEntity />
            </RequireRole>
          }
        />
        <Route
          path="hr/org/chuc-vu"
          element={
            <RequireRole roles={['HR']}>
              <OrgEntity />
            </RequireRole>
          }
        />
        <Route
          path="hr/employees/profile"
          element={
            <RequireRole roles={['HR']}>
              <HrEmployeeProfile />
            </RequireRole>
          }
        />
        <Route
          path="hr/decisions"
          element={
            <RequireRole roles={['HR']}>
              <HrDecisions />
            </RequireRole>
          }
        />
        <Route
          path="hr/recruitment"
          element={
            <RequireRole roles={['HR']}>
              <HrRecruitment />
            </RequireRole>
          }
        />

        <Route
          path="employee"
          element={
            <RequireRole roles={['EMPLOYEE']}>
              <EmployeeHome />
            </RequireRole>
          }
        />
        <Route
          path="employee/profile"
          element={
            <RequireRole roles={['EMPLOYEE']}>
              <EmployeeProfile />
            </RequireRole>
          }
        />
        <Route
          path="employee/attendance"
          element={
            <RequireRole roles={['EMPLOYEE']}>
              <EmployeeAttendance />
            </RequireRole>
          }
        />
        <Route
          path="employee/leaves"
          element={
            <RequireRole roles={['EMPLOYEE']}>
              <EmployeeLeaves />
            </RequireRole>
          }
        />
        <Route
          path="employee/payslip"
          element={
            <RequireRole roles={['EMPLOYEE']}>
              <EmployeePayslip />
            </RequireRole>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
