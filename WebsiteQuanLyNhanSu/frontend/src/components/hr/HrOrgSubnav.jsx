import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  {
    to: '/dashboard/hr/organization',
    label: 'Tổng quan',
    match: (p) => p.endsWith('/organization'),
  },
  { to: '/dashboard/hr/org/chi-nhanh', label: 'Chi nhánh', match: (p) => p.includes('/org/chi-nhanh') },
  { to: '/dashboard/hr/org/phong-ban', label: 'Phòng ban', match: (p) => p.includes('/org/phong-ban') },
  { to: '/dashboard/hr/org/nhom', label: 'Nhóm', match: (p) => p.includes('/org/nhom') },
  { to: '/dashboard/hr/org/chuc-vu', label: 'Chức vụ', match: (p) => p.includes('/org/chuc-vu') },
];

export default function HrOrgSubnav() {
  const { pathname } = useLocation();
  return (
    <nav className="hr-org-subnav" aria-label="Tổ chức chi tiết">
      {LINKS.map((l) => (
        <Link key={l.to} to={l.to} className={l.match(pathname) ? 'active' : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
