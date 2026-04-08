import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson, apiJsonBody } from '../../api/client.js';
import DirectorChrome from '../../components/director/DirectorChrome.jsx';
import { loaiPhepLabel } from '../../utils/hrDisplay.js';

// KPI Card component with icon and badge
function KpiCard({ icon, iconBg, label, value, change, changeType }) {
  const isPositive = changeType === 'up' || (changeType === 'auto' && change >= 0);
  const badgeColor = isPositive ? '#22c55e' : '#ef4444';
  const badgeBg = isPositive ? '#dcfce7' : '#fee2e2';
  
  return (
    <div className="dash-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <i className={`fa-solid ${icon}`} style={{ fontSize: '20px', color: 'var(--pri)' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', color: 'var(--txt2)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>{value}</div>
        {change !== null && change !== undefined && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            background: badgeBg,
            color: badgeColor,
            marginTop: '4px',
          }}>
            <i className={`fa-solid fa-arrow-${isPositive ? 'up' : 'down'}`} style={{ fontSize: '10px' }} />
            {Math.abs(change)}% so tháng trước
          </div>
        )}
      </div>
    </div>
  );
}

export default function DirectorHome() {
  const [kpi, setKpi] = useState(null);
  const [pending, setPending] = useState([]);
  const [err, setErr] = useState('');

  async function load() {
    try {
      const [k, p] = await Promise.all([
        apiJson('/api/dashboard/director/kpi'),
        apiJson('/api/dashboard/director/leaves/pending'),
      ]);
      setKpi(k);
      setPending(Array.isArray(p) ? p : []);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id) {
    await apiJsonBody('PUT', `/api/dashboard/director/leaves/${id}/approve`, {});
    load();
  }

  async function reject(id) {
    const reason = window.prompt('Lý do từ chối?') || '';
    await apiJsonBody('PUT', `/api/dashboard/director/leaves/${id}/reject`, { reason });
    load();
  }

  const welcomeExtra = (
    <>
      Có <strong>{kpi?.pendingLeaves ?? '—'}</strong> đơn phép chờ xử lý &amp;{' '}
      <strong>{kpi?.unclosedPayroll ?? '—'}</strong> bảng lương chưa chốt
    </>
  );

  const right = (
    <div className="hdr-acts" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <Link to="/dashboard/director/reports" className="dash-btn secondary" style={{ textDecoration: 'none' }}>
        📊 Báo cáo
      </Link>
      <Link to="/dashboard/director/kpi" className="dash-btn" style={{ textDecoration: 'none' }}>
        KPI &amp; xu hướng
      </Link>
    </div>
  );

  return (
    <DirectorChrome welcome welcomeExtra={welcomeExtra} right={right}>
      {err && <p className="err">{err}</p>}
      {kpi && (
        <div className="dash-grid" style={{ marginBottom: 20 }}>
          <KpiCard
            icon="fa-users"
            iconBg="#fff7ed"
            label="NV đang làm việc"
            value={kpi.totalActive}
            change={kpi.totalActiveChange}
            changeType="auto"
          />
          <KpiCard
            icon="fa-user-plus"
            iconBg="#eff6ff"
            label="Tuyển mới tháng này"
            value={kpi.newThisMonth}
            change={kpi.newThisMonthChange}
            changeType="up"
          />
          <KpiCard
            icon="fa-briefcase"
            iconBg="#fef3c7"
            label="Yêu cầu tuyển mở"
            value={kpi.openPositions}
          />
          <KpiCard
            icon="fa-clock"
            iconBg="#fce7f3"
            label="Đơn phép chờ"
            value={kpi.pendingLeaves}
            change={kpi.pendingLeavesChange}
            changeType="down"
          />
          <KpiCard
            icon="fa-file-lines"
            iconBg="#f3e8ff"
            label="Phiếu lương chưa chốt"
            value={kpi.unclosedPayroll}
          />
        </div>
      )}

      <div className="dash-card">
        <div className="dash-card-title">
          <i className="fa-solid fa-calendar-check" style={{ color: 'var(--pri)', marginRight: 10 }} aria-hidden />
          Đơn nghỉ chờ quản lý duyệt
        </div>
        <div className="dash-table-wrap" style={{ marginTop: 16 }}>
          <table className="dir-leaves-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Phòng</th>
                <th>Loại</th>
                <th>Từ</th>
                <th>Đến</th>
                <th style={{ width: 220 }}></th>
              </tr>
            </thead>
            <tbody>
              {!pending.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="hr-empty">
                      <i className="fa-solid fa-circle-check" style={{ color: 'var(--ok)' }} />
                      <p>Không có đơn chờ duyệt</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pending.map((row) => (
                  <tr key={row.id}>
                    <td>{row.tenNV}</td>
                    <td>{row.tenPhong}</td>
                    <td>{loaiPhepLabel(row.loaiPhep || row.loaiNghi)}</td>
                    <td>{row.tuNgay}</td>
                    <td>{row.denNgay}</td>
                    <td className="dash-row" style={{ justifyContent: 'flex-end' }}>
                      <button type="button" className="dash-btn" onClick={() => approve(row.id)}>
                        Duyệt
                      </button>
                      <button type="button" className="dash-btn danger" onClick={() => reject(row.id)}>
                        Từ chối
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DirectorChrome>
  );
}
