import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './pages/Layout.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import DashboardRouter from './pages/DashboardRouter.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ForgotPasswordSent from './pages/ForgotPasswordSent.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/forgot-password/sent" element={<ForgotPasswordSent />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/home" element={<Home />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/dashboard/*" element={<DashboardRouter />} />
      <Route path="/quan-ly-chuc-vu" element={<Navigate to="/dashboard/hr/org/chuc-vu" replace />} />
      <Route path="/them-nhan-vien" element={<Navigate to="/dashboard/hr/employees?new=1" replace />} />
      <Route path="/phong-ban" element={<Navigate to="/dashboard/hr/org/phong-ban" replace />} />
      <Route path="/quan-ly-nhan-vien" element={<Navigate to="/dashboard/hr/employees" replace />} />
      <Route path="/chi-nhanh" element={<Navigate to="/dashboard/hr/org/chi-nhanh" replace />} />
      <Route path="/nhom" element={<Navigate to="/dashboard/hr/org/nhom" replace />} />
      <Route path="/ho-so-nhan-vien" element={<Navigate to="/dashboard/hr/employees" replace />} />
      <Route path="/ban-hanh-quyet-dinh" element={<Navigate to="/dashboard/hr/decisions" replace />} />
      <Route path="/luong" element={<Navigate to="/dashboard/hr/payroll" replace />} />
      <Route path="*" element={<Layout title="404 — Không tìm thấy trang" />} />
    </Routes>
  );
}
