import { getUsername } from '../../api/authStorage.js';
import { useDashboardClock } from '../dashboard/useDashboardClock.js';
import DirectorSubnav from './DirectorSubnav.jsx';

/**
 * Director: trang chủ = thẻ chào (dashboard/director.html),
 * trang con = tiêu đề + đồng hồ.
 */
export default function DirectorChrome({
  welcome,
  welcomeExtra,
  iconClass,
  title,
  subtitle,
  right,
  showSubnav = true,
  children,
}) {
  const clock = useDashboardClock();
  const username = getUsername() || '';
  const initial = (username.trim().charAt(0) || '?').toUpperCase();

  return (
    <div className="dir-page dash-page">
      {welcome ? (
        <div className="dir-wlc">
          <div className="dir-wlc-l">
            <div className="dir-wlc-av" aria-hidden>
              {initial}
            </div>
            <div>
              <div className="dir-wlc-nm">Xin chào, {username || '—'} 👋</div>
              <div className="dir-wlc-sub">{welcomeExtra}</div>
            </div>
          </div>
          {right}
        </div>
      ) : (
        <div className="dir-head-card">
          <div className="dir-head-l">
            {iconClass ? (
              <i className={iconClass} style={{ fontSize: 22, color: 'var(--pri)', marginTop: 2 }} aria-hidden />
            ) : null}
            <div>
              <h2>{title}</h2>
              {subtitle ? <p>{subtitle}</p> : null}
              <div className="dir-head-date">{clock}</div>
            </div>
          </div>
          {right}
        </div>
      )}
      {showSubnav ? <DirectorSubnav /> : null}
      {children}
    </div>
  );
}
