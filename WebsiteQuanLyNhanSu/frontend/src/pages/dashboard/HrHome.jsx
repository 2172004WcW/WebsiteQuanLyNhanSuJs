import { ArcElement, Chart, DoughnutController, Tooltip } from 'chart.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { apiJson } from '../../api/client.js';
import HrChrome from '../../components/hr/HrChrome.jsx';
import { leaveStatusLabel, loaiPhepLabel } from '../../utils/hrDisplay.js';

Chart.register(DoughnutController, ArcElement, Tooltip);

export default function HrHome() {
  const [stats, setStats] = useState(null);
  const [leaves, setLeaves] = useState(null);
  const [donut, setDonut] = useState(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [err, setErr] = useState('');
  const chartRef = useRef(null);
  const instRef = useRef(null);

  const monthOptions = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      out.push({ value: val, label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}` });
    }
    return out;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, l] = await Promise.all([
          apiJson('/api/dashboard/hr/stats'),
          apiJson('/api/dashboard/hr/leaves/pending'),
        ]);
        if (!cancelled) {
          setStats(s);
          setLeaves(Array.isArray(l) ? l : []);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Không tải được dữ liệu');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!month) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson(`/api/dashboard/hr/attendance/summary?month=${encodeURIComponent(month)}`);
        if (!cancelled) setDonut(data);
      } catch {
        if (!cancelled) setDonut(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month]);

  useEffect(() => {
    const canvas = chartRef.current;
    if (!canvas || !donut) return;
    const vals = [donut.presentPct || 0, donut.latePct || 0, donut.permittedPct || 0, donut.absentPct || 0];
    if (instRef.current) {
      instRef.current.destroy();
      instRef.current = null;
    }
    instRef.current = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Đúng giờ', 'Đi muộn', 'Nghỉ phép', 'Vắng'],
        datasets: [
          {
            data: vals,
            backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
      },
    });
    return () => {
      if (instRef.current) {
        instRef.current.destroy();
        instRef.current = null;
      }
    };
  }, [donut]);

  const bannerRight =
    stats != null ? (
      <div className="hb-right">
        <div className="hb-pill">
          <div className="num">{stats.totalEmployees ?? '—'}</div>
          <div className="lbl">Tổng NV</div>
        </div>
        <div className="hb-pill">
          <div className="num" style={{ color: '#c4b5fd' }}>
            {stats.totalDepartments ?? '—'}
          </div>
          <div className="lbl">Phòng ban</div>
        </div>
        <div className="hb-pill">
          <div className="num" style={{ color: '#fcd34d' }}>
            {stats.pendingLeaves ?? '—'}
          </div>
          <div className="lbl">Đơn chờ HR</div>
        </div>
        <div className="hb-pill">
          <div className="num" style={{ color: '#6ee7b7' }}>
            {`${Math.max(0, 100 - (Number(stats.missingAttendance) || 0))}%`}
          </div>
          <div className="lbl">Chuyên cần</div>
        </div>
      </div>
    ) : null;

  const pendingCv = stats?.pendingCv;

  return (
    <HrChrome
      iconClass="fa-solid fa-shield-halved"
      title="HR Overview"
      subtitle="Tổng quan nhanh về nhân sự, chuyên cần và đơn phép chờ xử lý."
      right={bannerRight}
    >
      {err && <p className="err">{err}</p>}

      <div className="hr-g4">
        <div className="hr-kpi-card">
          <div className="hr-kpi-icon" style={{ background: 'var(--warn-s)', color: 'var(--warn)' }}>
            <i className="fa-solid fa-file-circle-exclamation" />
          </div>
          <div>
            <div className="hr-kpi-lbl">Đơn phép chờ HR duyệt</div>
            <div className="hr-kpi-val">{stats?.pendingLeaves ?? '—'}</div>
          </div>
        </div>
        <div className="hr-kpi-card">
          <div className="hr-kpi-icon" style={{ background: 'var(--err-s)', color: 'var(--err)' }}>
            <i className="fa-solid fa-triangle-exclamation" />
          </div>
          <div>
            <div className="hr-kpi-lbl">Chấm công thiếu dữ liệu</div>
            <div className="hr-kpi-val">{stats?.missingAttendance ?? '—'}</div>
          </div>
        </div>
        <div className="hr-kpi-card">
          <div className="hr-kpi-icon" style={{ background: 'var(--inf-s)', color: 'var(--inf)' }}>
            <i className="fa-solid fa-money-bill-wave" />
          </div>
          <div>
            <div className="hr-kpi-lbl">Lương chưa chốt</div>
            <div className="hr-kpi-val">{stats?.unconfirmedSalary ?? '—'}</div>
          </div>
        </div>
        <div className="hr-kpi-card">
          <div className="hr-kpi-icon" style={{ background: 'var(--hr-s)', color: 'var(--hr)' }}>
            <i className="fa-solid fa-id-card" />
          </div>
          <div>
            <div className="hr-kpi-lbl">CV ứng viên chờ duyệt</div>
            <div className="hr-kpi-val">{pendingCv == null ? '—' : pendingCv}</div>
          </div>
        </div>
      </div>

      <div className="hr-g2">
        <div className="hr-card">
          <div className="hr-card-hd">
            <div className="hr-card-title">
              <i className="fa-solid fa-chart-pie" style={{ color: 'var(--ok)' }} />
              Tỉ lệ chuyên cần
            </div>
          </div>
          <div className="hr-filter-row">
            <label htmlFor="hr-donut-month">Tháng:</label>
            <select
              id="hr-donut-month"
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
          <div className="hr-donut-wrap">
            <canvas ref={chartRef} style={{ maxWidth: 200, maxHeight: 200 }} />
            <div className="hr-donut-center">
              <div className="big">
                {donut ? `${(donut.presentPct || 0) + (donut.latePct || 0)}%` : '—'}
              </div>
              <div className="sm">có mặt</div>
            </div>
          </div>
          <div className="hr-donut-legend">
            <div className="hr-legend-item">
              <div className="hr-legend-dot" style={{ background: 'var(--ok)' }} />
              <span style={{ color: 'var(--txt2)' }}>Đúng giờ</span>
              <span className="hr-legend-val">{donut ? `${donut.presentPct ?? 0}%` : '—'}</span>
            </div>
            <div className="hr-legend-item">
              <div className="hr-legend-dot" style={{ background: 'var(--warn)' }} />
              <span style={{ color: 'var(--txt2)' }}>Đi muộn</span>
              <span className="hr-legend-val">{donut ? `${donut.latePct ?? 0}%` : '—'}</span>
            </div>
            <div className="hr-legend-item">
              <div className="hr-legend-dot" style={{ background: 'var(--inf)' }} />
              <span style={{ color: 'var(--txt2)' }}>Nghỉ có phép</span>
              <span className="hr-legend-val">{donut ? `${donut.permittedPct ?? 0}%` : '—'}</span>
            </div>
            <div className="hr-legend-item">
              <div className="hr-legend-dot" style={{ background: 'var(--err)' }} />
              <span style={{ color: 'var(--txt2)' }}>Vắng</span>
              <span className="hr-legend-val">{donut ? `${donut.absentPct ?? 0}%` : '—'}</span>
            </div>
          </div>
        </div>

        <div className="hr-card">
          <div className="hr-card-hd">
            <div className="hr-card-title">
              <i className="fa-solid fa-list-check" style={{ color: 'var(--hr)' }} />
              5 đơn phép mới nhất
            </div>
          </div>
          <table className="hr-leave-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Loại phép</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {leaves === null ? (
                <tr>
                  <td colSpan={4}>
                    <div className="hr-empty">
                      <i className="fa-solid fa-spinner fa-spin" />
                      <p>Đang tải đơn phép…</p>
                    </div>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="hr-empty">
                      <i className="fa-solid fa-circle-check" style={{ color: 'var(--ok)' }} />
                      <p>Không có đơn phép chờ</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leaves.slice(0, 5).map((d) => (
                  <tr key={d.id}>
                    <td>{d.tenNV || '—'}</td>
                    <td>{loaiPhepLabel(d.loaiPhep || d.loaiNghi)}</td>
                    <td>
                      {d.tuNgay || '—'} → {d.denNgay || '—'}
                    </td>
                    <td>
                      <span className="hr-st-badge hr-st-warn">{leaveStatusLabel(d.trangThai)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </HrChrome>
  );
}
