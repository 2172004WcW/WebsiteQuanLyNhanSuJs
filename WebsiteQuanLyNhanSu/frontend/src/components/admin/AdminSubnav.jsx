import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/dashboard/admin', label: 'Tổng quan', match: (p) => p === '/dashboard/admin' },
  { to: '/dashboard/admin/accounts', label: 'Tài khoản', match: (p) => p.includes('/dashboard/admin/accounts') },
  { to: '/dashboard/admin/login-logs', label: 'Nhật ký ĐN', match: (p) => p.includes('/dashboard/admin/login-logs') },
  { to: '/dashboard/admin/permissions', label: 'Phân quyền', match: (p) => p.includes('/dashboard/admin/permissions') },
  { to: '/dashboard/admin/settings', label: 'Cấu hình', match: (p) => p.includes('/dashboard/admin/settings') },
];

export default function AdminSubnav() {
  const { pathname } = useLocation();
  return (
    <nav className="adm-subnav" aria-label="Admin sub-navigation">
      {LINKS.map((l) => (
        <Link key={l.to} to={l.to} className={l.match(pathname) ? 'active' : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
