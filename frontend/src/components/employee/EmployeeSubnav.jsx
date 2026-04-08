import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/dashboard/employee', label: 'Trang chủ', match: (p) => p === '/dashboard/employee' },
  { to: '/dashboard/employee/profile', label: 'Hồ sơ', match: (p) => p.includes('/dashboard/employee/profile') },
  { to: '/dashboard/employee/attendance', label: 'Chấm công', match: (p) => p.includes('/dashboard/employee/attendance') },
  { to: '/dashboard/employee/leaves', label: 'Đơn phép', match: (p) => p.includes('/dashboard/employee/leaves') },
  { to: '/dashboard/employee/payslip', label: 'Phiếu lương', match: (p) => p.includes('/dashboard/employee/payslip') },
];

export default function EmployeeSubnav() {
  const { pathname } = useLocation();
  return (
    <nav className="emp-subnav" aria-label="Employee sub-navigation">
      {LINKS.map((l) => (
        <Link key={l.to} to={l.to} className={l.match(pathname) ? 'active' : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
