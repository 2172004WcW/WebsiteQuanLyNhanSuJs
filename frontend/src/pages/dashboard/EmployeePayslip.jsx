import { useEffect, useMemo, useState } from 'react';
import { apiJson, getToken } from '../../api/client.js';
import EmployeeChrome from '../../components/employee/EmployeeChrome.jsx';
import {
  formatMoneyVnd,
  isPayslipNotFuture,
  kyLuongLabelFromThangNam,
  maPhieuFromRow,
  parseThangNamYm,
  trangThaiThanhToanLabel,
} from '../../utils/payslipDisplay.js';

export default function EmployeePayslip() {
  const [raw, setRaw] = useState([]);
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState('');

  const [year, setYear] = useState('ALL');
  const [month, setMonth] = useState('ALL');
  const [sort, setSort] = useState('new');
  const [pageSize, setPageSize] = useState(6);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiJson('/api/dashboard/employee/payslips');
        setRaw(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  const yearOptions = useMemo(() => {
    const ys = new Set();
    for (const r of raw) {
      const p = parseThangNamYm(r.thangNam);
      if (p) ys.add(p.y);
    }
    return [...ys].sort((a, b) => b - a);
  }, [raw]);

  const filtered = useMemo(() => {
    let list = raw.filter((r) => isPayslipNotFuture(r.thangNam));
    if (year !== 'ALL') {
      const y = Number(year);
      list = list.filter((r) => parseThangNamYm(r.thangNam)?.y === y);
    }
    if (month !== 'ALL') {
      const mo = Number(month);
      list = list.filter((r) => parseThangNamYm(r.thangNam)?.m === mo);
    }
    list = [...list].sort((a, b) => {
      const ya = parseThangNamYm(a.thangNam);
      const yb = parseThangNamYm(b.thangNam);
      if (!ya && !yb) return 0;
      if (!ya) return 1;
      if (!yb) return -1;
      const cmp = ya.y !== yb.y ? yb.y - ya.y : yb.m - ya.m;
      return sort === 'new' ? cmp : -cmp;
    });
    return list;
  }, [raw, year, month, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pageSlice = useMemo(() => {
    const p0 = (currentPage - 1) * pageSize;
    return filtered.slice(p0, p0 + pageSize);
  }, [filtered, currentPage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [year, month, sort, pageSize]);

  async function open(id) {
    try {
      const d = await apiJson(`/api/dashboard/employee/payslips/${encodeURIComponent(id)}`);
      setDetail(d);
    } catch (e) {
      setErr(e.message);
    }
  }

  const fromIdx = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toIdx = filtered.length === 0 ? 0 : Math.min(currentPage * pageSize, filtered.length);

  return (
    <EmployeeChrome title="Phiếu lương" subtitle="Xem phiếu lương theo tháng và tải PDF.">
      {err && <p className="err">{err}</p>}

      <div className="emp-payslip-toolbar">
        <label className="emp-attn-field">
          <span>Năm</span>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="ALL">Tất cả năm</option>
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="emp-attn-field">
          <span>Tháng</span>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="ALL">Tất cả tháng</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mo) => (
              <option key={mo} value={String(mo)}>
                Tháng {mo}
              </option>
            ))}
          </select>
        </label>
        <label className="emp-attn-field">
          <span>Sắp xếp</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">Kỳ lương: mới → cũ</option>
            <option value="old">Kỳ lương: cũ → mới</option>
          </select>
        </label>
        <label className="emp-attn-field">
          <span>/ trang</span>
          <select value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value))}>
            <option value="6">6</option>
            <option value="10">10</option>
            <option value="15">15</option>
          </select>
        </label>
      </div>

      <div className="emp-payslip-grid">
        {pageSlice.map((r) => {
          const st = String(r.trangThaiThanhToan || '').toUpperCase();
          const paid = st === 'DA_THANH_TOAN';
          return (
            <article key={r._id} className="emp-payslip-card">
              <header className="emp-payslip-card-head">
                <div>
                  <div className="emp-payslip-card-title">{kyLuongLabelFromThangNam(r.thangNam)}</div>
                  <div className="emp-payslip-card-code">Mã: {maPhieuFromRow(r)}</div>
                </div>
                <span className={`emp-payslip-badge ${paid ? 'is-paid' : 'is-unpaid'}`}>
                  {paid ? '✓ ' : ''}
                  {trangThaiThanhToanLabel(r.trangThaiThanhToan)}
                </span>
              </header>
              <div className="emp-payslip-card-body">
                <div className="emp-payslip-row">
                  <span>Tổng lương</span>
                  <strong className="emp-payslip-total">{formatMoneyVnd(r.tongLuong)}</strong>
                </div>
                <div className="emp-payslip-row">
                  <span>Phạt muộn</span>
                  <span className="emp-payslip-warn">{formatMoneyVnd(r.phatMuon)}</span>
                </div>
                <div className="emp-payslip-row">
                  <span>Nghỉ không phép</span>
                  <span className="emp-payslip-danger">{formatMoneyVnd(r.nghiKhongPhep)}</span>
                </div>
              </div>
              <footer className="emp-payslip-card-ft">
                <button type="button" className="emp-payslip-btn-detail" onClick={() => open(r._id)}>
                  Chi tiết
                </button>
                <a
                  className="emp-payslip-btn-pdf"
                  href={`/api/dashboard/employee/payslips/${encodeURIComponent(r._id)}/download?access_token=${encodeURIComponent(getToken() || '')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Tải (.pdf)
                </a>
              </footer>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && <p className="sub">Không có phiếu lương phù hợp.</p>}

      {filtered.length > 0 && (
        <div className="emp-payslip-pager">
          <span className="sub">
            Hiển thị {fromIdx} – {toIdx} / {filtered.length}
          </span>
          <div className="emp-attn-pager-btns">
            <button
              type="button"
              className="dash-btn secondary"
              disabled={currentPage <= 1}
              onClick={() => setPage((x) => Math.max(1, x - 1))}
            >
              ← Trước
            </button>
            <span className="emp-payslip-page-label">Trang {currentPage}/{totalPages}</span>
            <button
              type="button"
              className="dash-btn secondary"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((x) => x + 1)}
            >
              Sau →
            </button>
          </div>
        </div>
      )}

      {detail && (
        <div className="dash-modal-bg" onClick={() => setDetail(null)} role="presentation">
          <div className="dash-modal emp-payslip-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="emp-payslip-modal-x" onClick={() => setDetail(null)} aria-label="Đóng">
              ×
            </button>
            <h2 className="emp-payslip-modal-title">Chi tiết phiếu lương</h2>

            <section className="emp-payslip-modal-section">
              <h3 className="emp-payslip-modal-h3">Thông tin</h3>
              <dl className="emp-payslip-modal-dl">
                <div>
                  <dt>Nhân viên</dt>
                  <dd>{detail.hoTen}</dd>
                </div>
                <div>
                  <dt>Mã NV</dt>
                  <dd>{detail.maNhanVien}</dd>
                </div>
                <div>
                  <dt>Chức vụ</dt>
                  <dd>{detail.chucVu || '—'}</dd>
                </div>
                <div>
                  <dt>Phòng ban</dt>
                  <dd>{detail.phongBan || '—'}</dd>
                </div>
                <div>
                  <dt>Kỳ lương</dt>
                  <dd>{detail.kyLuongLabel || kyLuongLabelFromThangNam(detail.thangNam)}</dd>
                </div>
                <div>
                  <dt>Mã phiếu</dt>
                  <dd>{detail.maPhieu || '—'}</dd>
                </div>
              </dl>
            </section>

            <section className="emp-payslip-modal-section">
              <h3 className="emp-payslip-modal-h3">Phiếu lương</h3>
              <dl className="emp-payslip-modal-dl emp-payslip-modal-money">
                <div>
                  <dt>Tổng lương</dt>
                  <dd className="emp-payslip-money-total">{formatMoneyVnd(detail.tongLuong)}</dd>
                </div>
                <div>
                  <dt>Phạt muộn</dt>
                  <dd className="emp-payslip-warn">{formatMoneyVnd(detail.phatMuon)}</dd>
                </div>
                <div>
                  <dt>Nghỉ không phép</dt>
                  <dd className="emp-payslip-danger">{formatMoneyVnd(detail.nghiKhongPhep)}</dd>
                </div>
                <div>
                  <dt>Trạng thái thanh toán</dt>
                  <dd>{trangThaiThanhToanLabel(detail.trangThaiThanhToan)}</dd>
                </div>
              </dl>
            </section>

            <div className="emp-payslip-modal-actions">
              <button type="button" className="dash-btn" onClick={() => setDetail(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </EmployeeChrome>
  );
}
