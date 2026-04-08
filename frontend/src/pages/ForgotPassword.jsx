import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiJsonBody } from '../api/client.js';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await apiJsonBody('POST', '/api/auth/forgot-password', { username: username.trim() });
      navigate('/forgot-password/sent');
    } catch {
      setErr('Không gửi được yêu cầu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="login-header">
          <h3>Quên mật khẩu</h3>
          <p>Nhập tên đăng nhập — hệ thống gửi OTP qua email công việc (nếu cấu hình SMTP).</p>
        </div>
        <div className="auth-inner">
          {err && (
            <div className="login-alert danger" role="alert">
              {err}
            </div>
          )}
          <form onSubmit={onSubmit}>
            <label className="form-label" htmlFor="fp-user">
              Tên đăng nhập
            </label>
            <input
              id="fp-user"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <button type="submit" className="btn-login" style={{ marginTop: 18 }} disabled={loading}>
              {loading ? 'Đang gửi…' : 'Gửi mã OTP'}
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
