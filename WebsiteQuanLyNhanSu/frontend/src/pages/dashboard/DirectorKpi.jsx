import { useEffect, useRef, useState } from 'react';
import {
  CategoryScale,
  Chart,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  BarController,
  BarElement,
  Tooltip,
} from 'chart.js';
import { apiJson } from '../../api/client.js';
import DirectorChrome from '../../components/director/DirectorChrome.jsx';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, BarController, BarElement, Legend, Tooltip);

export default function DirectorKpi() {
  const [kpi, setKpi] = useState(null);
  const [head, setHead] = useState([]);
  const [salary, setSalary] = useState([]);
  const [err, setErr] = useState('');

  // Chart refs
  const headChartRef = useRef(null);
  const headChartInst = useRef(null);
  const salaryChartRef = useRef(null);
  const salaryChartInst = useRef(null);

  // KPI label mapping
  const kpiLabels = {
    totalActive: 'NV đang làm việc',
    newThisMonth: 'Tuyển mới tháng này',
    turnoverRate: 'Tỉ lệ nghỉ việc',
    openPositions: 'Vị trí đang tuyển',
    pendingLeaves: 'Đơn phép chờ duyệt',
    unclosedPayroll: 'Phiếu lương chưa chốt',
  };

  // Format number to show — if 0/null
  const fmtNum = (v) => (v == null || v === 0) ? '—' : String(v);

  // Format salary to M đ
  const fmtSalary = (v) => {
    if (v == null || v === 0) return '—';
    const millions = v / 1000000;
    return `${millions.toFixed(1)}M đ`;
  };

  useEffect(() => {
    (async () => {
      try {
        const [k, h, s] = await Promise.all([
          apiJson('/api/dashboard/director/kpi'),
          apiJson('/api/dashboard/director/headcount-trend'),
          apiJson('/api/dashboard/director/salary-trend'),
        ]);
        setKpi(k);
        setHead(h || []);
        setSalary(s || []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  // Headcount Line Chart
  useEffect(() => {
    const canvas = headChartRef.current;
    if (!canvas || !head.length) return;
    if (headChartInst.current) {
      headChartInst.current.destroy();
      headChartInst.current = null;
    }
    headChartInst.current = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: head.map((r) => r.label),
        datasets: [
          {
            label: 'Tổng NV',
            data: head.map((r) => r.totalActive || 0),
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.12)',
            tension: 0.25,
            fill: false,
          },
          {
            label: 'Mới vào',
            data: head.map((r) => r.newJoined || 0),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
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
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw || '—'}`,
            },
          },
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });
    return () => {
      if (headChartInst.current) {
        headChartInst.current.destroy();
        headChartInst.current = null;
      }
    };
  }, [head]);

  // Salary Bar Chart
  useEffect(() => {
    const canvas = salaryChartRef.current;
    if (!canvas || !salary.length) return;
    if (salaryChartInst.current) {
      salaryChartInst.current.destroy();
      salaryChartInst.current = null;
    }
    salaryChartInst.current = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: salary.map((r) => r.label),
        datasets: [
          {
            label: 'Tổng quỹ',
            data: salary.map((r) => r.total || 0),
            backgroundColor: '#f97316',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Tổng quỹ: ${fmtSalary(ctx.raw)}`,
            },
          },
        },
        scales: {
          y: { 
            beginAtZero: true,
            ticks: {
              callback: (val) => fmtSalary(val),
            },
          },
        },
      },
    });
    return () => {
      if (salaryChartInst.current) {
        salaryChartInst.current.destroy();
        salaryChartInst.current = null;
      }
    };
  }, [salary]);

  return (
    <DirectorChrome
      iconClass="fa-solid fa-chart-line"
      title="KPI & xu hướng"
      subtitle="Tổng hợp nhanh các chỉ số giám đốc và xu hướng headcount / lương."
    >
      {err && <p className="err">{err}</p>}
      {kpi && (
        <div className="dash-grid" style={{ marginBottom: 20 }}>
          {Object.entries(kpi).map(([k, v]) => (
            <div className="dash-card" key={k} style={{ padding: '18px 20px' }}>
              <div className="sub" style={{ marginBottom: 10, color: 'var(--txt2)' }}>
                {kpiLabels[k] || k}
              </div>
              <strong style={{ fontSize: '1.75rem' }}>{fmtNum(v)}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="dash-card" style={{ marginBottom: 20 }}>
        <div className="dash-card-title">Headcount 6 tháng</div>
        <div style={{ height: 280 }}>
          <canvas ref={headChartRef} />
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">Quỹ lương</div>
        <div style={{ height: 280 }}>
          <canvas ref={salaryChartRef} />
        </div>
      </div>
    </DirectorChrome>
  );
}
