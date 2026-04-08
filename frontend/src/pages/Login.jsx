import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SITE_TITLE } from '../constants/brand.js';
import { setSessionFromLogin } from '../api/authStorage.js';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.message || 'Đăng nhập thất bại');
        return;
      }
      setSessionFromLogin({
        token: data.token,
        role: data.role,
        username: data.username,
      });
      navigate('/dashboard');
    } catch {
      setErr('Lỗi mạng');
    } finally {
      setLoading(false);
    }
  }

  const q = params.get('error');

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <h3>{SITE_TITLE}</h3>
          <p>Đăng nhập hệ thống quản lý nhân sự</p>
        </div>
        <div className="login-body">
          {q && (
            <div className="login-alert danger" role="alert">
              {q}
            </div>
          )}
          {err && (
            <div className="login-alert danger" role="alert">
              {err}
            </div>
          )}
          <form onSubmit={onSubmit}>
            <label className="form-label" htmlFor="login-user">
              Tên đăng nhập
            </label>
            <input
              id="login-user"
              className="form-control"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label className="form-label" htmlFor="login-pass" style={{ marginTop: 14 }}>
              Mật khẩu
            </label>
            <input
              id="login-pass"
              type="password"
              className="form-control"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div style={{ textAlign: 'right', marginTop: 10 }}>
              <Link to="/forgot-password" className="forgot-link">
                Quên mật khẩu?
              </Link>
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
