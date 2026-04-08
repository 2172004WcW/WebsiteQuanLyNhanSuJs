import {
  CategoryScale,
  Chart,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { apiJson } from '../../api/client.js';
import EmployeeChrome from '../../components/employee/EmployeeChrome.jsx';
import { trangThaiChamCongLabel } from '../../utils/employeeDisplay.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'DI_LAM', label: 'Đúng giờ' },
  { value: 'DI_MUON', label: 'Đi muộn' },
  { value: 'PHEP', label: 'Phép' },
  { value: 'NGHI_PHEP', label: 'Nghỉ phép' },
  { value: 'DI_VANG', label: 'Vắng' },
  { value: 'CUOI_TUAN', label: 'Cuối tuần' },
  { value: 'CHUA_CHAM_CONG', label: 'Chưa chấm công' },
];

export default function EmployeeAttendance() {
  const [sum, setSum] = useState(null);
  const [hist, setHist] = useState(null);
  const [trend, setTrend] = useState(null);
  const [err, setErr] = useState('');

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState('date_desc');
  const [status, setStatus] = useState('ALL');

  const chartRef = useRef(null);
  const chartInst = useRef(null);

  const monthOptions = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
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
        setErr('');
        const [s, t] = await Promise.all([
          apiJson('/api/dashboard/employee/attendance-summary'),
          apiJson('/api/dashboard/employee/attendance-trend'),
        ]);
        if (!cancelled) {
          setSum(s);
          setTrend(t);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErr('');
        const qs = new URLSearchParams({
          month,
          page: String(page),
          pageSize: String(pageSize),
          sort,
          status,
        });
        const h = await apiJson(`/api/dashboard/employee/attendance-history?${qs}`);
        if (!cancelled) setHist(h);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month, page, pageSize, sort, status]);

  useEffect(() => {
    const canvas = chartRef.current;
    if (!canvas || !trend?.labels?.length) return;
    if (chartInst.current) {
      chartInst.current.destroy();
      chartInst.current = null;
    }
    chartInst.current = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: trend.labels,
        datasets: [
          {
            label: 'Đúng giờ',
            data: trend.onTime || [],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.12)',
            tension: 0.25,
            fill: false,
          },
          {
            label: 'Đi muộn',
            data: trend.late || [],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.12)',
            tension: 0.25,
            fill: false,
          },
          {
            label: 'Vắng mặt',
            data: trend.absent || [],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.12)',
            tension: 0.25,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });
    return () => {
      if (chartInst.current) {
        chartInst.current.destroy();
        chartInst.current = null;
      }
    };
  }, [trend]);

  const totalPages = hist?.totalPages ?? 1;
  const curPage = hist?.page ?? page;

  return (
    <EmployeeChrome title="Chấm công" subtitle="Check-in / check-out và tỷ lệ chuyên cần tháng này.">
      {err && <p className="err">{err}</p>}
      <div className="emp-stat-grid">
        <div className="emp-stat-card">
          <div className="stat-label">Đúng giờ</div>
          <strong>{sum?.pctDungGio != null ? `${sum.pctDungGio}%` : '—'}</strong>
        </div>
        <div className="emp-stat-card">
          <div className="stat-label">Đi muộn</div>
          <strong>{sum?.pctDiMuon != null ? `${sum.pctDiMuon}%` : '—'}</strong>
        </div>
        <div className="emp-stat-card">
          <div className="stat-label">Vắng mặt</div>
          <strong>{sum?.pctVangMat != null ? `${sum.pctVangMat}%` : '—'}</strong>
        </div>
      </div>

      <div className="dash-card emp-attn-chart-card">
        <div className="dash-card-title">Xu hướng chuyên cần — 6 tháng gần đây</div>
        <div className="emp-attn-chart-wrap">
          <canvas ref={chartRef} />
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">Lịch sử chấm công</div>
        <div className="emp-attn-toolbar">
          <label className="emp-attn-field">
            <span>Tháng</span>
            <select
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setPage(1);
              }}
            >
              {monthOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="emp-attn-field">
            <span>Trạng thái</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              {STATUS_FILTERS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="emp-attn-field">
            <span>Sắp xếp</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="date_desc">Ngày mới → cũ</option>
              <option value="date_asc">Ngày cũ → mới</option>
            </select>
          </label>
          <label className="emp-attn-field">
            <span>/ trang</span>
            <select
              value={String(pageSize)}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </label>
        </div>

        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Giờ vào</th>
                <th>Giờ ra</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {(hist?.rows || []).map((r) => (
                <tr key={r._id || r.ngay}>
                  <td>{r.ngay ? new Date(r.ngay).toLocaleDateString('vi-VN') : ''}</td>
                  <td>{r.gioVao}</td>
                  <td>{r.gioRa}</td>
                  <td>{trangThaiChamCongLabel(r.trangThai)}</td>
                  <td>{r.ghiChu || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hist && (
          <div className="emp-attn-pager">
            <span className="sub">
              {hist.total} ngày · Trang {curPage} / {totalPages}
            </span>
            <div className="emp-attn-pager-btns">
              <button
                type="button"
                className="dash-btn secondary"
                disabled={curPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </button>
              <button
                type="button"
                className="dash-btn secondary"
                disabled={curPage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </EmployeeChrome>
  );
}
