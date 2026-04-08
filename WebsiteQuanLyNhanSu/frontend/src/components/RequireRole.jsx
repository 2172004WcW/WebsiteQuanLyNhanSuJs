import { Link } from 'react-router-dom';
import { getRole } from '../api/authStorage.js';

export default function RequireRole({ roles, children }) {
  const r = (getRole() || '').toUpperCase();
  const ok = roles.some((x) => x.toUpperCase() === r);
  if (!ok) {
    return (
      <div className="dash-page">
        <h1>Không đủ quyền</h1>
        <p className="sub">Vai trò hiện tại: {r || '—'}</p>
        <Link to="/dashboard">← Về trang làm việc</Link>
      </div>
    );
  }
  return children;
}
