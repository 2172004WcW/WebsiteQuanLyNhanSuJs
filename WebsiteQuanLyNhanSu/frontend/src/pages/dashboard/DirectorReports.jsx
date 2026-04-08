import { useEffect, useMemo, useState } from 'react';
import { apiJson } from '../../api/client.js';
import DirectorChrome from '../../components/director/DirectorChrome.jsx';

// Dropdown styles
const selectStyle = {
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  outline: 'none',
  minWidth: '140px',
};

export default function DirectorReports() {
  const [head, setHead] = useState([]);
  const [salary, setSalary] = useState([]);
  const [dept, setDept] = useState([]);
  const [ym, setYm] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  });
  const [err, setErr] = useState('');

  // Month options: 1-12
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: `Tháng ${i + 1}`,
    }));
  }, []);

  // Year options: current year - 2 to current year
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 3 }, (_, i) => ({
      value: currentYear - 2 + i,
      label: String(currentYear - 2 + i),
    }));
  }, []);

  // Format helpers
  const fmtNum = (v) => (v == null || v === 0) ? '—' : String(v);
  const fmtSalary = (v) => {
    if (v == null || v === 0) return '—';
    return Math.round(v).toLocaleString('vi-VN');
  };

  useEffect(() => {
    (async () => {
      try {
        const [h, s] = await Promise.all([
          apiJson('/api/dashboard/director/headcount-trend'),
          apiJson('/api/dashboard/director/salary-trend'),
        ]);
        setHead(Array.isArray(h) ? h : []);
        setSalary(Array.isArray(s) ? s : []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const d = await apiJson(`/api/dashboard/director/attendance-by-dept?month=${ym.m}&year=${ym.y}`);
        setDept(Array.isArray(d) ? d : []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [ym.m, ym.y]);

  return (
    <DirectorChrome
      iconClass="fa-solid fa-chart-bar"
      title="Báo cáo"
      subtitle="Xu hướng nhân sự, quỹ lương, tỷ lệ đi làm theo phòng ban."
    >
      {err && <p className="err">{err}</p>}

      <div className="dash-card" style={{ marginBottom: 20 }}>
        <div className="dash-card-title">Bộ lọc báo cáo</div>
        <form className="dash-form" style={{ marginBottom: 0 }}>
          <div className="field-grid" style={{ gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1fr)', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Tháng</span>
              <select
                style={selectStyle}
                value={ym.m}
                onChange={(e) => setYm((x) => ({ ...x, m: Number(e.target.value) }))}
                onFocus={(e) => e.target.style.borderColor = '#fb923c'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Năm</span>
              <select
                style={selectStyle}
                value={ym.y}
                onChange={(e) => setYm((x) => ({ ...x, y: Number(e.target.value) }))}
                onFocus={(e) => e.target.style.borderColor = '#fb923c'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              >
                {yearOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
        </form>
      </div>

      <div className="dash-card" style={{ marginBottom: 20 }}>
        <div className="dash-card-title">Xu hướng headcount</div>
        <p className="sub">Dữ liệu 6 tháng gần nhất.</p>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Tháng</th>
                <th>Tổng NV (ước)</th>
                <th>Mới</th>
              </tr>
            </thead>
            <tbody>
              {head.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td style={{ color: r.totalActive ? 'inherit' : '#9ca3af' }}>{fmtNum(r.totalActive)}</td>
                  <td style={{ color: r.newJoined ? 'inherit' : '#9ca3af' }}>{fmtNum(r.newJoined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {head.some((r) => (r.totalActive === 0 || r.totalActive == null)) && (
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, fontStyle: 'italic' }}>
              * Tháng chưa có dữ liệu hiển thị —
            </p>
          )}
        </div>
      </div>

      <div className="dash-card" style={{ marginBottom: 20 }}>
        <div className="dash-card-title">Quỹ lương theo tháng</div>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Tháng</th>
                <th>Tổng quỹ</th>
                <th>TB / NV</th>
              </tr>
            </thead>
            <tbody>
              {salary.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td style={{ color: r.total ? 'inherit' : '#9ca3af' }}>{fmtSalary(r.total)}</td>
                  <td style={{ color: r.averagePerEmployee ? 'inherit' : '#9ca3af' }}>{fmtSalary(r.averagePerEmployee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {salary.some((r) => (r.total === 0 || r.total == null)) && (
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, fontStyle: 'italic' }}>
              * Tháng chưa có dữ liệu hiển thị —
            </p>
          )}
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">Tỷ lệ đi làm theo phòng ban</div>
        <div className="field-grid" style={{ marginBottom: 16, gridTemplateColumns: 'minmax(180px, 1fr) minmax(180px, 1fr)', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Tháng</span>
            <select
              style={selectStyle}
              value={ym.m}
              onChange={(e) => setYm((x) => ({ ...x, m: Number(e.target.value) }))}
              onFocus={(e) => e.target.style.borderColor = '#fb923c'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              {monthOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Năm</span>
            <select
              style={selectStyle}
              value={ym.y}
              onChange={(e) => setYm((x) => ({ ...x, y: Number(e.target.value) }))}
              onFocus={(e) => e.target.style.borderColor = '#fb923c'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              {yearOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Phòng ban</th>
                <th>Tỷ lệ (%)</th>
              </tr>
            </thead>
            <tbody>
              {dept.map((r) => (
                <tr key={r.departmentName}>
                  <td>{r.departmentName}</td>
                  <td style={{ color: r.attendanceRate ? 'inherit' : '#9ca3af' }}>{fmtNum(r.attendanceRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {dept.length === 0 && (
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, fontStyle: 'italic' }}>
              * Chưa có dữ liệu cho kỳ này —
            </p>
          )}
        </div>
      </div>
    </DirectorChrome>
  );
}
