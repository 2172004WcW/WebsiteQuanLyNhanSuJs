import { useEffect, useMemo, useState } from 'react';
import { apiJson } from '../../api/client.js';
import HrChrome from '../../components/hr/HrChrome.jsx';

export default function HrAttendance() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [sum, setSum] = useState(null);
  const [top, setTop] = useState([]);
  const [err, setErr] = useState('');

  const monthOptions = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      out.push({ value: val, label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}` });
    }
    return out;
  }, []);

  async function load() {
    const [s, t] = await Promise.all([
      apiJson(`/api/dashboard/hr/attendance/summary?month=${encodeURIComponent(month)}`),
      apiJson(`/api/dashboard/hr/attendance/top-late?month=${encodeURIComponent(month)}&limit=10`),
    ]);
    setSum(s);
    setTop(Array.isArray(t) ? t : []);
  }

  useEffect(() => {
    (async () => {
      try {
        setErr('');
        await load();
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [month]);

  return (
    <HrChrome
      iconClass="fa-solid fa-clock"
      title="Chấm công"
      subtitle="Thống kê chuyên cần và danh sách nhân sự đi muộn."
    >
      {err && <p className="err">{err}</p>}
      <div className="hr-g2">
        <div className="hr-card">
          <div className="hr-card-hd">
            <div className="hr-card-title">
              <i className="fa-solid fa-chart-pie" style={{ color: 'var(--hr)' }} aria-hidden />
              Tỷ lệ trong tháng
            </div>
            <div className="hr-filter-row" style={{ marginBottom: 0 }}>
              <label htmlFor="att-month">Tháng:</label>
              <select
                id="att-month"
                className="hr-filter-select"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {sum && (
            <div className="hr-g4" style={{ marginBottom: 0 }}>
              <div className="hr-kpi-card">
                <div className="hr-kpi-icon" style={{ background: 'var(--ok-s)', color: 'var(--ok)' }}>
                  <i className="fa-solid fa-check" />
                </div>
                <div>
                  <div className="hr-kpi-lbl">Đúng giờ</div>
                  <div className="hr-kpi-val">{sum.presentPct}%</div>
                </div>
              </div>
              <div className="hr-kpi-card">
                <div className="hr-kpi-icon" style={{ background: 'var(--warn-s)', color: 'var(--warn)' }}>
                  <i className="fa-solid fa-clock" />
                </div>
                <div>
                  <div className="hr-kpi-lbl">Đi muộn</div>
                  <div className="hr-kpi-val">{sum.latePct}%</div>
                </div>
              </div>
              <div className="hr-kpi-card">
                <div className="hr-kpi-icon" style={{ background: 'var(--inf-s)', color: 'var(--inf)' }}>
                  <i className="fa-solid fa-umbrella-beach" />
                </div>
                <div>
                  <div className="hr-kpi-lbl">Nghỉ phép</div>
                  <div className="hr-kpi-val">{sum.permittedPct}%</div>
                </div>
              </div>
              <div className="hr-kpi-card">
                <div className="hr-kpi-icon" style={{ background: 'var(--err-s)', color: 'var(--err)' }}>
                  <i className="fa-solid fa-user-xmark" />
                </div>
                <div>
                  <div className="hr-kpi-lbl">Vắng</div>
                  <div className="hr-kpi-val">{sum.absentPct}%</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="hr-card">
          <div className="hr-card-hd">
            <div className="hr-card-title">
              <i className="fa-solid fa-ranking-star" style={{ color: 'var(--warn)' }} aria-hidden />
              Top đi muộn
            </div>
          </div>
          <div className="dash-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="hr-rank-table">
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Phòng</th>
                  <th>Lần muộn</th>
                  <th>Phút muộn</th>
                </tr>
              </thead>
              <tbody>
                {top.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="hr-empty">
                        <i className="fa-solid fa-circle-check" style={{ color: 'var(--ok)' }} />
                        <p>Không có dữ liệu đi muộn trong tháng</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  top.map((r) => (
                    <tr key={r.nhanVienId}>
                      <td>{r.tenNV}</td>
                      <td>{r.tenPhong}</td>
                      <td>{r.soLanMuon}</td>
                      <td>{r.tongPhutMuon}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </HrChrome>
  );
}
