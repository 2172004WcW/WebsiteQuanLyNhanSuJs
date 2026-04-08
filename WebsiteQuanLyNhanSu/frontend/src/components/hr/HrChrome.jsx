import { useDashboardClock } from '../dashboard/useDashboardClock.js';
import HrOrgSubnav from './HrOrgSubnav.jsx';
import HrSubnav from './HrSubnav.jsx';

/**
 * Khung trang HR giống templates/dashboard/hr/*.html: banner tím + đồng hồ + subnav.
 */
export default function HrChrome({
  iconClass,
  title,
  subtitle,
  right,
  showHrSubnav = true,
  showOrgSubnav = false,
  children,
}) {
  const clock = useDashboardClock();

  return (
    <div className="hr-page dash-page">
      <div className="hr-banner">
        <div className="hb-left">
          <h2>
            {iconClass ? <i className={iconClass} style={{ marginRight: 8, opacity: 0.85 }} aria-hidden /> : null}
            {title}
          </h2>
          {subtitle ? <p>{subtitle}</p> : null}
          <div className="hb-date">{clock}</div>
        </div>
        {right}
      </div>
      {showHrSubnav ? <HrSubnav /> : null}
      {showOrgSubnav ? <HrOrgSubnav /> : null}
      {children}
    </div>
  );
}
