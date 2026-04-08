import { useDashboardClock } from '../dashboard/useDashboardClock.js';
import AdminSubnav from './AdminSubnav.jsx';

/** Khung trang Admin — giống dashboard/admin/overview.html */
export default function AdminChrome({
  iconClass,
  title,
  subtitle,
  right,
  showSubnav = true,
  children,
}) {
  const clock = useDashboardClock();

  return (
    <div className="adm-page dash-page">
      <div className="adm-banner">
        <div className="ab-left">
          <h2>
            {iconClass ? <i className={iconClass} style={{ marginRight: 8, opacity: 0.85 }} aria-hidden /> : null}
            {title}
          </h2>
          {subtitle ? <p>{subtitle}</p> : null}
          <div className="ab-date">{clock}</div>
        </div>
        {right}
      </div>
      {showSubnav ? <AdminSubnav /> : null}
      {children}
    </div>
  );
}
