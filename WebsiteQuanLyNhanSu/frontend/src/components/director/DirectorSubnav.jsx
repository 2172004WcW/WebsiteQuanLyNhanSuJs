import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/dashboard/director', label: 'Tổng quan', match: (p) => p === '/dashboard/director' },
  { to: '/dashboard/director/reports', label: 'Báo cáo', match: (p) => p.includes('/dashboard/director/reports') },
  { to: '/dashboard/director/kpi', label: 'KPI & xu hướng', match: (p) => p.includes('/dashboard/director/kpi') },
];

export default function DirectorSubnav() {
  const { pathname } = useLocation();
  return (
    <nav className="dir-subnav" aria-label="Director sub-navigation">
      {LINKS.map((l) => (
        <Link key={l.to} to={l.to} className={l.match(pathname) ? 'active' : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
