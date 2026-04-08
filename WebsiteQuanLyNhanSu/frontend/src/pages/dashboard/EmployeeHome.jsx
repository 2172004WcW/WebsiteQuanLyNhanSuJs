import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson, apiFetch } from '../../api/client.js';
import EmployeeChrome from '../../components/employee/EmployeeChrome.jsx';
import { leaveStatusEmployee, trangThaiChamCongLabel } from '../../utils/employeeDisplay.js';
import { loaiPhepLabel } from '../../utils/hrDisplay.js';
import {
  formatMoneyVnd,
  isPayslipNotFuture,
  kyLuongLabelFromThangNam,
  trangThaiThanhToanLabel,
} from '../../utils/payslipDisplay.js';

function BannerCheckIn({ nvId, checkinToday, onRefresh }) {
  const [msg, setMsg] = useState('');

  const st = (checkinToday?.status || 'CHUA_CHECKIN').toUpperCase();
  const label =
    st === 'CHUA_CHECKIN'
      ? 'Chưa check-in'
      : trangThaiChamCongLabel(st) + (checkinToday?.gioVao ? ` (${checkinToday.gioVao})` : '');

  async function checkIn() {
    setMsg('');
    const r = await apiFetch(`/api/attendance/check-in/${encodeURIComponent(nvId)}`, { method: 'POST' });
    const t = await r.text();
    setMsg(t);
    await onRefresh();
  }

  async function checkOut() {
    setMsg('');
    const r = await apiFetch(`/api/attendance/check-out/${encodeURIComponent(nvId)}`, { method: 'POST' });
    const t = await r.text();
    setMsg(t);
    await onRefresh();
  }

  const canIn =
    checkinToday?.canCheckIn === true ||
    (checkinToday?.canCheckIn === undefined && st === 'CHUA_CHECKIN');
  const canOut =
    checkinToday?.canCheckOut === true ||
    (checkinToday?.canCheckOut === undefined && !!checkinToday?.gioVao && !checkinToday?.gioRa);

  return (
    <div className="emp-banner-check-wrap">
      <div className="emp-banner-status">
        Trạng thái: <span>{label}</span>
        {checkinToday?.gioRa ? <span className="emp-banner-giora"> · Ra: {checkinToday.gioRa}</span> : null}
      </div>
      <div className="emp-banner-btns">
        {canIn ? (
          <button type="button" className="emp-banner-btn" onClick={checkIn} disabled={!nvId}>
            <i className="fas fa-fingerprint" aria-hidden /> Check-in
          </button>
        ) : null}
        {canOut ? (
          <button type="button" className="emp-banner-btn emp-banner-btn-outline" onClick={checkOut} disabled={!nvId}>
            Check-out
          </button>
        ) : null}
        {!canIn && !canOut && st !== 'CHUA_CHECKIN' ? (
          <span className="emp-banner-done">
            <i className="fas fa-check-circle" aria-hidden /> Đã hoàn thành chấm công hôm nay
          </span>
        ) : null}
      </div>
      {msg ? <p className="emp-banner-msg">{msg}</p> : null}
      <Link to="/dashboard/employee/attendance" className="emp-banner-detail-link">
        Chi tiết chấm công →
      </Link>
    </div>
  );
}

function formatRangeVi(tu, den) {
  const a = tu ? new Date(tu + 'T12:00:00').toLocaleDateString('vi-VN') : '—';
  const b = den ? new Date(den + 'T12:00:00').toLocaleDateString('vi-VN') : '—';
  return `${a} – ${b}`;
}

export default function EmployeeHome() {
  const [stats, setStats] = useState(null);
  const [attn, setAttn] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [payslip, setPayslip] = useState(null);
  const [nvId, setNvId] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const [s, leaveList, att, pays] = await Promise.all([
      apiJson('/api/dashboard/employee/stats'),
      apiJson('/api/dashboard/employee/leaves?limit=5'),
      apiJson('/api/dashboard/employee/attendance-summary'),
      apiJson('/api/dashboard/employee/payslips?limit=8'),
    ]);
    setStats(s);
    setAttn(att);
    setLeaves(Array.isArray(leaveList) ? leaveList.slice(0, 4) : []);
    const payArr = Array.isArray(pays) ? pays : [];
    const pick = payArr.find((p) => isPayslipNotFuture(p.thangNam)) ?? payArr[0] ?? null;
    setPayslip(pick);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await apiJson('/api/profile/me');
        setNvId(me._id || me.id);
        await load();
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [load]);

  const maxPhep = stats?.maxPhep ?? 12;
  const pctOn = attn?.pctDungGio ?? 0;
  const pctLate = attn?.pctDiMuon ?? 0;
  const pctAbs = attn?.pctVangMat ?? 0;

  return (
    <EmployeeChrome
      home
      subtitle="Hãy kiểm tra thông tin công việc của bạn hôm nay."
      bannerRight={
        stats && nvId ? <BannerCheckIn nvId={nvId} checkinToday={stats.checkinToday} onRefresh={load} /> : null
      }
    >
      {err && <p className="err">{err}</p>}
      {stats && (
        <>
          <div className="emp-stat-grid">
            <div className="emp-stat-card">
              <div className="emp-stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                <i className="fas fa-calendar-check" aria-hidden />
              </div>
              <div>
                <div className="emp-stat-label">Ngày có mặt (tháng)</div>
                <div className="emp-stat-value">
                  {stats.ngayCoMat}
                  <small> / {stats.tongNgayCong}</small>
                </div>
              </div>
            </div>
            <div className="emp-stat-card">
              <div className="emp-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <i className="fas fa-clock" aria-hidden />
              </div>
              <div>
                <div className="emp-stat-label">Đi muộn (tháng)</div>
                <div className="emp-stat-value">{stats.diMuon}</div>
              </div>
            </div>
            <div className="emp-stat-card">
              <div className="emp-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                <i className="fas fa-umbrella-beach" aria-hidden />
              </div>
              <div>
                <div className="emp-stat-label">Phép còn lại</div>
                <div className="emp-stat-value">
                  {stats.phepConLai ?? '—'}
                  <small> / {maxPhep}</small>
                </div>
              </div>
            </div>
            <div className="emp-stat-card">
              <div className="emp-stat-icon" style={{ background: '#fff0eb', color: '#ff6b35' }}>
                <i className="fas fa-money-bill-wave" aria-hidden />
              </div>
              <div>
                <div className="emp-stat-label">Lương tháng trước</div>
                <div className="emp-stat-value" style={{ fontSize: 18 }}>
                  {stats.luongThangTruoc != null ? `${stats.luongThangTruoc.toLocaleString('vi-VN')} đ` : '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="emp-home-two-col">
            <div className="dash-card emp-home-panel">
              <div className="emp-home-panel-hd">
                <span className="emp-home-panel-title">Đơn phép gần đây</span>
                <Link to="/dashboard/employee/leaves" className="emp-home-panel-link">
                  Xem tất cả →
                </Link>
              </div>
              <ul className="emp-home-leave-list">
                {leaves.length === 0 ? (
                  <li className="sub">Chưa có đơn phép.</li>
                ) : (
                  leaves.map((row) => {
                    const st = leaveStatusEmployee(row.trangThai);
                    return (
                      <li key={row.id} className="emp-home-leave-item">
                        <div>
                          <div className="emp-home-leave-type">{loaiPhepLabel(row.loaiNghi)}</div>
                          <div className="emp-home-leave-dates">{formatRangeVi(row.tuNgay, row.denNgay)}</div>
                        </div>
                        <span className={`emp-home-leave-badge emp-home-leave-badge--${st.tone}`}>
                          {st.tone === 'ok' ? '✓ ' : st.tone === 'wait' ? '⌛ ' : ''}
                          {st.text}
                        </span>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            <div className="dash-card emp-home-panel">
              <div className="emp-home-panel-hd">
                <span className="emp-home-panel-title">Chuyên cần tháng này</span>
                <Link to="/dashboard/employee/attendance" className="emp-home-panel-link">
                  Chi tiết →
                </Link>
              </div>
              {attn ? (
                <div className="emp-home-progress-block">
                  <div className="emp-home-bar-row">
                    <span className="emp-home-bar-label emp-home-bar-label--ok">Đúng giờ</span>
                    <div className="emp-home-bar-track">
                      <div className="emp-home-bar-fill emp-home-bar-fill--ok" style={{ width: `${pctOn}%` }} />
                    </div>
                    <span className="emp-home-bar-pct">{pctOn}%</span>
                  </div>
                  <div className="emp-home-bar-row">
                    <span className="emp-home-bar-label emp-home-bar-label--late">Đi muộn</span>
                    <div className="emp-home-bar-track">
                      <div className="emp-home-bar-fill emp-home-bar-fill--late" style={{ width: `${pctLate}%` }} />
                    </div>
                    <span className="emp-home-bar-pct">{pctLate}%</span>
                  </div>
                  <div className="emp-home-bar-row">
                    <span className="emp-home-bar-label emp-home-bar-label--abs">Vắng mặt</span>
                    <div className="emp-home-bar-track">
                      <div className="emp-home-bar-fill emp-home-bar-fill--abs" style={{ width: `${pctAbs}%` }} />
                    </div>
                    <span className="emp-home-bar-pct">{pctAbs}%</span>
                  </div>
                </div>
              ) : (
                <p className="sub">Đang tải…</p>
              )}
            </div>
          </div>

          <div className="dash-card emp-home-panel emp-home-salary-card">
            <div className="emp-home-panel-hd">
              <span className="emp-home-panel-title">Lương gần đây</span>
              <Link to="/dashboard/employee/payslip" className="emp-home-panel-link">
                Xem tất cả →
              </Link>
            </div>
            {payslip ? (
              <div className="emp-home-salary-row">
                <div>
                  <div className="emp-home-salary-title">
                    Phiếu lương {kyLuongLabelFromThangNam(payslip.thangNam)}
                  </div>
                  <div className="emp-home-salary-amount">{formatMoneyVnd(payslip.tongLuong)}</div>
                </div>
                <span
                  className={`emp-home-salary-status ${
                    String(payslip.trangThaiThanhToan || '').toUpperCase() === 'DA_THANH_TOAN'
                      ? 'is-paid'
                      : 'is-unpaid'
                  }`}
                >
                  {String(payslip.trangThaiThanhToan || '').toUpperCase() === 'DA_THANH_TOAN' ? '✓ ' : ''}
                  {trangThaiThanhToanLabel(payslip.trangThaiThanhToan)}
                </span>
              </div>
            ) : (
              <p className="sub">Chưa có phiếu lương.</p>
            )}
          </div>
        </>
      )}
    </EmployeeChrome>
  );
}
