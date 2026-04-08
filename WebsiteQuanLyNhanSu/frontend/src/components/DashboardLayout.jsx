import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SITE_TITLE, SITE_SIDEBAR_EMPHASIS, SITE_SIDEBAR_PREFIX } from '../constants/brand.js';
import { apiJson } from '../api/client.js';
import { clearSession, getRole, getToken, getUsername } from '../api/authStorage.js';
import { initSocket, disconnectSocket } from '../api/socket.js';
import ToastNotif from './dashboard/ToastNotif.jsx';
import NotificationDropdown from './NotificationDropdown.jsx';

/** Tiêu đề topbar — khớp breadcrumb trang cũ */
const PAGE_TITLES = [
  ['/dashboard/admin/login-logs', 'Nhật ký đăng nhập'],
  ['/dashboard/admin/accounts', 'Quản lý tài khoản'],
  ['/dashboard/admin/permissions', 'Phân quyền'],
  ['/dashboard/admin/settings', 'Cấu hình hệ thống'],
  ['/dashboard/admin', 'Dashboard'],
  ['/dashboard/hr/employees', 'Quản lý nhân viên'],
  ['/dashboard/hr/organization', 'Tổ chức'],
  ['/dashboard/hr/decisions', 'Quyết định'],
  ['/dashboard/hr/attendance', 'Chấm công'],
  ['/dashboard/hr/leaves', 'Đơn phép'],
  ['/dashboard/hr/payroll', 'Lương'],
  ['/dashboard/hr/recruitment', 'Tuyển dụng'],
  ['/dashboard/hr', 'Dashboard'],
  ['/dashboard/director/reports', 'Báo cáo'],
  ['/dashboard/director/kpi', 'KPI kinh doanh'],
  ['/dashboard/director', 'Dashboard'],
  ['/dashboard/employee/profile', 'Hồ sơ cá nhân'],
  ['/dashboard/employee/attendance', 'Chấm công của tôi'],
  ['/dashboard/employee/leaves', 'Đơn phép'],
  ['/dashboard/employee/payslip', 'Lương của tôi'],
  ['/dashboard/employee', 'Dashboard'],
  ['/dashboard', 'Dashboard'],
];

function getPageTitle(pathname) {
  const sorted = [...PAGE_TITLES].sort((a, b) => b[0].length - a[0].length);
  for (const [prefix, title] of sorted) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return title;
  }
  return 'Dashboard';
}

function navSectionsForRole(role) {
  const R = role.toUpperCase();
  if (R === 'DIRECTOR') {
    return [
      {
        title: 'Dashboard',
        items: [{ to: '/dashboard/director', label: 'Dashboard', icon: 'fas fa-tachometer-alt', end: true }],
      },
      {
        title: 'Báo cáo',
        items: [
          { to: '/dashboard/director/reports', label: 'Báo cáo', icon: 'fas fa-chart-bar' },
          { to: '/dashboard/director/kpi', label: 'KPI kinh doanh', icon: 'fas fa-chart-line' },
        ],
      },
    ];
  }
  if (R === 'ADMIN') {
    return [
      {
        title: 'Quản trị',
        items: [
          { to: '/dashboard/admin', label: 'Dashboard', icon: 'fas fa-tachometer-alt', end: true },
          { to: '/dashboard/admin/accounts', label: 'Quản lý tài khoản', icon: 'fas fa-users' },
          { to: '/dashboard/admin/login-logs', label: 'Nhật ký đăng nhập', icon: 'fas fa-clipboard-list' },
          { to: '/dashboard/admin/permissions', label: 'Phân quyền', icon: 'fas fa-lock' },
          { to: '/dashboard/admin/settings', label: 'Cấu hình hệ thống', icon: 'fas fa-cog' },
        ],
      },
    ];
  }
  if (R === 'HR') {
    return [
      {
        title: 'Tổng quan',
        items: [{ to: '/dashboard/hr', label: 'Dashboard', icon: 'fas fa-tachometer-alt', end: true }],
      },
      {
        title: 'Nhân sự',
        items: [
          { to: '/dashboard/hr/employees', label: 'Quản lý nhân viên', icon: 'fas fa-users' },
          { to: '/dashboard/hr/organization', label: 'Tổ chức', icon: 'fas fa-sitemap' },
          { to: '/dashboard/hr/decisions', label: 'Quyết định', icon: 'fas fa-file-signature' },
        ],
      },
      {
        title: 'Tính công & lương',
        items: [
          { to: '/dashboard/hr/attendance', label: 'Chấm công', icon: 'fas fa-clock' },
          { to: '/dashboard/hr/leaves', label: 'Đơn phép', icon: 'fas fa-calendar-alt' },
          { to: '/dashboard/hr/payroll', label: 'Lương', icon: 'fas fa-money-bill-wave' },
        ],
      },
      {
        title: 'Tuyển dụng',
        items: [{ to: '/dashboard/hr/recruitment', label: 'Tuyển dụng', icon: 'fas fa-handshake' }],
      },
    ];
  }
  if (R === 'EMPLOYEE') {
    return [
      {
        title: 'Tổng quan',
        items: [{ to: '/dashboard/employee', label: 'Dashboard', icon: 'fas fa-tachometer-alt', end: true }],
      },
      {
        title: 'Cá nhân',
        items: [{ to: '/dashboard/employee/profile', label: 'Hồ sơ cá nhân', icon: 'fas fa-user' }],
      },
      {
        title: 'Tính công & lương',
        items: [
          { to: '/dashboard/employee/attendance', label: 'Chấm công của tôi', icon: 'fas fa-clock' },
          { to: '/dashboard/employee/leaves', label: 'Đơn phép', icon: 'fas fa-calendar-alt' },
          { to: '/dashboard/employee/payslip', label: 'Lương của tôi', icon: 'fas fa-file-invoice-dollar' },
        ],
      },
    ];
  }
  return [];
}

let toastSeq = 0;

export default function DashboardLayout() {
  const role = (getRole() || '').toUpperCase();
  const username = getUsername() || '';
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);
  const sections = useMemo(() => navSectionsForRole(role), [role]);

  const initial = (username.trim().charAt(0) || '?').toUpperCase();
  // Tất cả role đều thấy được thông báo
  const showNotifLink = Boolean(role);

  // ── Notification badge + dropdown ───────────
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifListVersion, setNotifListVersion] = useState(0);
  const notifWrapRef = useRef(null);
  const [toasts, setToasts] = useState([]);
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;

  const syncUnreadCount = useCallback(() => {
    apiJson('/api/notifications/unread-count')
      .then((d) => setUnread(d?.unread ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    syncUnreadCount();
  }, [syncUnreadCount]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!notifOpen) return;
    function onDocClick(ev) {
      if (notifWrapRef.current && !notifWrapRef.current.contains(ev.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [notifOpen]);

  // Xoá toast theo id
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Socket connection ───────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Khởi tạo kết nối socket (no-op nếu đã kết nối)
    const socket = initSocket(token);

    function handleNewNotif(data) {
      // Badge chỉ phản ánh tin riêng chưa đọc (broadcast không tăng unread trên server)
      syncUnreadCount();
      setNotifListVersion((v) => v + 1);
      const toastId = `toast_${++toastSeq}_${Date.now()}`;
      setToasts((prev) => [
        ...prev.slice(-4),
        { id: toastId, tieuDe: data.tieuDe, noiDung: data.noiDung, loai: data.loai },
      ]);
    }

    socket.on('new_notification', handleNewNotif);

    return () => {
      socket.off('new_notification', handleNewNotif);
    };
  }, [username, syncUnreadCount]);

  function logout() {
    disconnectSocket();
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className="hrm-dashboard-root">
      <aside className="sidebar">
        <div className="sidebar-logo" title={SITE_TITLE}>
          <div className="logo-icon">H</div>
          <span>
            {SITE_SIDEBAR_PREFIX} <em>{SITE_SIDEBAR_EMPHASIS}</em>
          </span>
        </div>
        <nav className="sidebar-nav">
          {sections.map((sec) => (
            <Fragment key={sec.title}>
              <div className="nav-section">{sec.title}</div>
              {sec.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  end={Boolean(item.end)}
                >
                  <i className={item.icon} aria-hidden />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </Fragment>
          ))}
        </nav>
        <footer className="sidebar-footer">
          <div className="s-avatar" title={username || 'Tài khoản'}>
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="s-uname" title={username}>
              {username || '—'}
            </div>
            <div className="s-role">{role || '—'}</div>
          </div>
          <button type="button" className="logout-btn" title="Đăng xuất" onClick={logout} aria-label="Đăng xuất">
            <i className="fas fa-sign-out-alt" />
          </button>
        </footer>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <div className="topbar-inner">
            <div className="topbar-title-wrap">
              <h2 className="page-title">{pageTitle}</h2>
            </div>
            <div className="topbar-right">
              {showNotifLink ? (
                <div className="notif-wrap" ref={notifWrapRef}>
                  <button
                    type="button"
                    className="icon-btn notif-btn"
                    title="Thông báo"
                    aria-label="Thông báo"
                    aria-expanded={notifOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotifOpen((o) => !o);
                    }}
                  >
                    <i className="fas fa-bell" />
                    {unread > 0 && (
                      <span className="notif-badge" aria-label={`${unread} thông báo chưa đọc`}>
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown
                    open={notifOpen}
                    listVersion={notifListVersion}
                    onUnreadSynced={setUnread}
                  />
                </div>
              ) : (
                <button type="button" className="icon-btn" title="Thông báo" disabled aria-label="Thông báo">
                  <i className="fas fa-bell" />
                </button>
              )}
              <div className="t-avatar" title="Tài khoản">
                {initial}
              </div>
            </div>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {/* Toast stack — góc dưới phải */}
      <ToastNotif toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
