import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/dashboard/hr/employees', label: 'Nhân viên', match: (p) => p.includes('/dashboard/hr/employees') },
  { to: '/dashboard/hr/attendance', label: 'Chấm công', match: (p) => p.includes('/dashboard/hr/attendance') },
  { to: '/dashboard/hr/leaves', label: 'Đơn phép', match: (p) => p.includes('/dashboard/hr/leaves') },
  { to: '/dashboard/hr/payroll', label: 'Lương', match: (p) => p.includes('/dashboard/hr/payroll') },
  {
    to: '/dashboard/hr/organization',
    label: 'Tổ chức',
    match: (p) => p.includes('/dashboard/hr/organization') || p.includes('/dashboard/hr/org/'),
  },
  { to: '/dashboard/hr/decisions', label: 'Quyết định', match: (p) => p.includes('/dashboard/hr/decisions') },
  { to: '/dashboard/hr/recruitment', label: 'Tuyển dụng', match: (p) => p.includes('/dashboard/hr/recruitment') },
];

export default function HrSubnav() {
  const { pathname } = useLocation();
  return (
    <nav className="hr-subnav" aria-label="HR sub-navigation">
      {LINKS.map((l) => (
        <Link key={l.to} to={l.to} className={l.match(pathname) ? 'active' : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
