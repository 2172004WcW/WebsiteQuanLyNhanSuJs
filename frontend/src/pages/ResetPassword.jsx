import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiJsonBody } from '../api/client.js';

export default function ResetPassword() {
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await apiJsonBody('POST', '/api/auth/reset-password', {
        username: username.trim(),
        otp: otp.trim(),
        newPassword,
      });
      navigate('/login');
    } catch {
      setErr('OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="login-header">
          <h3>Đặt lại mật khẩu</h3>
          <p>Nhập mã OTP đã nhận qua email và mật khẩu mới.</p>
        </div>
        <div className="auth-inner">
          {err && (
            <div className="login-alert danger" role="alert">
              {err}
            </div>
          )}
          <form onSubmit={onSubmit}>
            <label className="form-label" htmlFor="rp-user">
              Tên đăng nhập
            </label>
            <input
              id="rp-user"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label className="form-label" htmlFor="rp-otp" style={{ marginTop: 14 }}>
              Mã OTP
            </label>
            <input id="rp-otp" className="form-control" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            <label className="form-label" htmlFor="rp-pass" style={{ marginTop: 14 }}>
              Mật khẩu mới
            </label>
            <input
              id="rp-pass"
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="submit" className="btn-login" style={{ marginTop: 18 }} disabled={loading}>
              {loading ? 'Đang xử lý…' : 'Xác nhận'}
            </button>
          </form>
          <p style={{ marginTop: 20, marginBottom: 0, textAlign: 'center' }}>
            <Link to="/login" className="forgot-link">
              ← Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
