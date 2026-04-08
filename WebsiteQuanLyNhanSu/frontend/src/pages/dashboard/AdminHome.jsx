import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '../../api/client.js';
import AdminChrome from '../../components/admin/AdminChrome.jsx';

export default function AdminHome() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setS(await apiJson('/api/dashboard/admin/stats'));
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  const right =
    s != null ? (
      <div className="ab-right">
        <div className="ab-pill">
          <div className="num">{s.totalAccounts ?? '—'}</div>
          <div className="lbl">Tổng TK</div>
        </div>
        <div className="ab-pill">
          <div className="num" style={{ color: '#86efac' }}>
            {s.activeAccounts ?? '—'}
          </div>
          <div className="lbl">Đang HĐ</div>
        </div>
        <div className="ab-pill">
          <div className="num" style={{ color: '#fca5a5' }}>
            {s.lockedAccounts ?? '—'}
          </div>
          <div className="lbl">Bị khóa</div>
        </div>
        <div className="ab-pill">
          <div className="num" style={{ color: '#fcd34d' }}>
            {s.unassignedAccounts ?? '—'}
          </div>
          <div className="lbl">Chưa gán NV</div>
        </div>
      </div>
    ) : null;

  return (
    <AdminChrome
      iconClass="fa-solid fa-screwdriver-wrench"
      title="Quản trị hệ thống"
      subtitle="Tài khoản, phân quyền và giám sát truy cập — tách biệt nghiệp vụ HR."
      right={right}
    >
      {err && <p className="err">{err}</p>}
      {s && (
        <div className="hr-g4">
          <div className="hr-kpi-card">
            <div className="adm-kpi-icon" style={{ background: 'var(--adm-s)', color: 'var(--adm)' }}>
              <i className="fa-solid fa-users" />
            </div>
            <div>
              <div className="hr-kpi-lbl">Tổng tài khoản</div>
              <div className="hr-kpi-val">{s.totalAccounts}</div>
              <div style={{ marginTop: 6 }}>
                <span className="hr-st-badge" style={{ background: 'var(--ok-s)', color: 'var(--ok)' }}>
                  Hoạt động: {s.activeAccounts}
                </span>
              </div>
            </div>
          </div>
          <div className="hr-kpi-card">
            <div className="adm-kpi-icon" style={{ background: 'var(--err-s)', color: 'var(--err)' }}>
              <i className="fa-solid fa-lock" />
            </div>
            <div>
              <div className="hr-kpi-lbl">Tài khoản bị khóa</div>
              <div className="hr-kpi-val">{s.lockedAccounts}</div>
            </div>
          </div>
          <div className="hr-kpi-card">
            <div className="adm-kpi-icon" style={{ background: 'var(--warn-s)', color: 'var(--warn)' }}>
              <i className="fa-solid fa-link-slash" />
            </div>
            <div>
              <div className="hr-kpi-lbl">Chưa gán nhân viên</div>
              <div className="hr-kpi-val">{s.unassignedAccounts}</div>
            </div>
          </div>
          <div className="hr-kpi-card">
            <div className="adm-kpi-icon" style={{ background: 'var(--ok-s)', color: 'var(--ok)' }}>
              <i className="fa-solid fa-user-plus" />
            </div>
            <div>
              <div className="hr-kpi-lbl">Tạo mới tháng này</div>
              <div className="hr-kpi-val">{s.newThisMonth}</div>
            </div>
          </div>
        </div>
      )}

      <div className="hr-g2">
        <div className="adm-card">
          <div className="adm-card-hd">
            <div className="adm-card-title">
              <i className="fa-solid fa-bolt" style={{ color: 'var(--adm)' }} aria-hidden />
              Thao tác nhanh
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--txt2)', margin: '0 0 14px', lineHeight: 1.5 }}>
            Mở trang quản lý tài khoản để tạo, khóa, gán nhân viên và đổi role.
          </p>
          <Link to="/dashboard/admin/accounts" className="adm-btn-add">
            <i className="fa-solid fa-users-gear" aria-hidden />
            Quản lý tài khoản
          </Link>
        </div>
        <div className="adm-card">
          <div className="adm-card-hd">
            <div className="adm-card-title">
              <i className="fa-solid fa-shield-halved" style={{ color: 'var(--inf)' }} aria-hidden />
              Phân quyền theo vai trò
            </div>
            <Link to="/dashboard/admin/permissions" className="hr-card-link" style={{ color: 'var(--adm)' }}>
              Xem ma trận
            </Link>
          </div>
          <p style={{ fontSize: 13, color: 'var(--txt2)', margin: 0, lineHeight: 1.5 }}>
            DIRECTOR, ADMIN, HR, EMPLOYEE — xem mô tả quyền và luồng xử lý trong hệ thống.
          </p>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card-hd">
          <div className="adm-card-title">
            <i className="fa-solid fa-list" style={{ color: 'var(--warn)' }} aria-hidden />
            Liên kết khác
          </div>
        </div>
        <nav style={{ lineHeight: 2.2, fontSize: 14 }}>
          <Link to="/dashboard/admin/login-logs" className="hr-card-link" style={{ color: 'var(--adm)' }}>
            Nhật ký đăng nhập
          </Link>
          <br />
          <Link to="/dashboard/admin/settings" className="hr-card-link" style={{ color: 'var(--adm)' }}>
            Cấu hình / môi trường
          </Link>
        </nav>
      </div>
    </AdminChrome>
  );
}
