import { getUsername } from '../../api/authStorage.js';
import { useDashboardClock } from '../dashboard/useDashboardClock.js';
import EmployeeSubnav from './EmployeeSubnav.jsx';

function greetingPart() {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

/** Giống dashboard/employee.html — banner cam + subnav; bannerRight = check-in/out (trang chủ) */
export default function EmployeeChrome({ home, title, subtitle, showSubnav = true, bannerRight, children }) {
  const clock = useDashboardClock();
  const username = getUsername() || '';

  const heading = home ? `${greetingPart()}, ${username}! 👋` : title;

  return (
    <div className="emp-page dash-page">
      <div className="emp-banner">
        <div className="emp-banner-row">
          <div className="emp-banner-text">
            <h2>{heading}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
            <p className="emp-banner-date">{clock}</p>
          </div>
          {bannerRight ? <div className="emp-banner-actions">{bannerRight}</div> : null}
        </div>
      </div>
      {showSubnav ? <EmployeeSubnav /> : null}
      {children}
    </div>
  );
}
