import { useEffect, useState } from 'react';
import { apiJson, apiJsonBody } from '../../api/client.js';
import HrChrome from '../../components/hr/HrChrome.jsx';
import { leaveStatusLabel, loaiPhepLabel } from '../../utils/hrDisplay.js';

export default function HrLeaves() {
  const [pending, setPending] = useState([]);
  const [all, setAll] = useState([]);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showAll, setShowAll] = useState(false);

  async function load() {
    try {
      const [p, a] = await Promise.all([
        apiJson('/api/dashboard/hr/leaves/pending'),
        apiJson('/api/dashboard/hr/leaves'),
      ]);
      setPending(Array.isArray(p) ? p : []);
      setAll(Array.isArray(a) ? a : []);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id) {
    try {
      setErr('');
      await apiJson(`/api/dashboard/hr/leaves/${encodeURIComponent(id)}/approve`, { method: 'PUT' });
      setSuccessMsg('Đã xác nhận đơn nghỉ phép!');
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function reject(id) {
    const reason = window.prompt('Lý do từ chối?') || '';
    if (!reason) return;
    try {
      setErr('');
      await apiJsonBody(`/api/dashboard/hr/leaves/${encodeURIComponent(id)}/reject`, { reason });
      setSuccessMsg('Đã từ chối đơn nghỉ phép!');
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function del(id) {
    if (!window.confirm('Bạn có chắc muốn xóa đơn này?')) return;
    try {
      setErr('');
      await apiJson(`/api/dashboard/hr/leaves/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setSuccessMsg('Đã xóa đơn nghỉ phép!');
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN');
  };

  const getDeptHeadBadge = (status) => {
    if (status === 'APPROVED') {
      return <span className="badge badge-success"><i className="fa-solid fa-check" /> Đã duyệt</span>;
    }
    return <span className="badge badge-warning">Chờ duyệt</span>;
  };

  const getStatusBadge = (status) => {
    const st = String(status).toUpperCase();
    if (st.includes('DA_DUYET') || st.includes('APPROVED')) {
      return <span className="badge badge-success">{leaveStatusLabel(status)}</span>;
    }
    if (st.includes('CHO')) {
      return <span className="badge badge-warning">{leaveStatusLabel(status)}</span>;
    }
    if (st.includes('TU_CHOI') || st.includes('REJECT')) {
      return <span className="badge badge-danger">{leaveStatusLabel(status)}</span>;
    }
    return <span className="badge badge-muted">{leaveStatusLabel(status)}</span>;
  };

  return (
    <HrChrome
      iconClass="fa-solid fa-calendar-alt"
      title="Đơn phép"
      subtitle="Duyệt đơn phép cần chờ HR xử lý."
    >
      {err && <div className="alert alert-error">{err}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Đơn phép chờ HR xác nhận */}
      <div className="hr-card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div className="section-title">
            <i className="fa-solid fa-hourglass-half" style={{ color: 'var(--warn)' }} aria-hidden />
            Đơn phép chờ HR xác nhận
            <span className="badge-count" style={{ marginLeft: 8 }}>{pending.length}</span>
          </div>
          <button 
            type="button" 
            className="btn-pill btn-pill-primary"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Ẩn tất cả' : 'Xem tất cả'}
          </button>
        </div>

        {pending.length === 0 ? (
          <div className="hr-empty-state">
            <div className="empty-icon">
              <i className="fa-solid fa-circle-check" />
            </div>
            <p className="empty-title">Không còn đơn nào chờ duyệt</p>
            <p className="empty-subtitle">Tất cả đơn phép đã được HR xử lý</p>
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="hr-payroll-table">
              <thead>
                <tr>
                  <th className="col-number">#</th>
                  <th>NHÂN VIÊN</th>
                  <th>PHÒNG BAN</th>
                  <th>LOẠI PHÉP</th>
                  <th>THỜI GIAN</th>
                  <th>NGÀY NỘP</th>
                  <th>TRẠNG THÁI</th>
                  <th>DEPT HEAD</th>
                  <th className="col-action">THAO TÁC HR</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r, idx) => (
                  <tr key={r.id}>
                    <td className="col-number">{idx + 1}</td>
                    <td><strong>{r.tenNV}</strong></td>
                    <td>{r.tenPhong || '—'}</td>
                    <td>{loaiPhepLabel(r.loaiPhep || r.loaiNghi)}</td>
                    <td>
                      <span className="date-range">
                        {r.tuNgay} <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }} /> {r.denNgay}
                      </span>
                      <br />
                      <small className="text-muted">{r.soNgay} ngày</small>
                    </td>
                    <td>{formatDate(r.ngayGui)}</td>
                    <td>{getStatusBadge(r.trangThai)}</td>
                    <td>{getDeptHeadBadge(r.deptHeadStatus)}</td>
                    <td className="col-action">
                      <div className="action-btns">
                        <button type="button" className="btn-pill btn-pill-success" onClick={() => approve(r.id)}>
                          <i className="fa-solid fa-check" /> Xác nhận
                        </button>
                        <button type="button" className="btn-pill btn-pill-danger" onClick={() => reject(r.id)}>
                          <i className="fa-solid fa-xmark" /> Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tất cả đơn - chỉ hiển thị khi showAll = true */}
      {showAll && (
        <div className="hr-card">
          <div className="section-header">
            <div className="section-title">
              <i className="fa-solid fa-list" style={{ color: 'var(--hr)' }} aria-hidden />
              Tất cả đơn phép
            </div>
            <span className="badge-count">{all.length} đơn</span>
          </div>
          <div className="dash-table-wrap">
            <table className="hr-payroll-table">
              <thead>
                <tr>
                  <th className="col-number">#</th>
                  <th>NHÂN VIÊN</th>
                  <th>PHÒNG BAN</th>
                  <th>LOẠI PHÉP</th>
                  <th>THỜI GIAN</th>
                  <th>TRẠNG THÁI</th>
                  <th>DEPT HEAD</th>
                  <th className="col-action">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {all.map((r, idx) => (
                  <tr key={r.id}>
                    <td className="col-number">{idx + 1}</td>
                    <td><strong>{r.tenNV}</strong></td>
                    <td>{r.tenPhong || '—'}</td>
                    <td>{loaiPhepLabel(r.loaiPhep || r.loaiNghi)}</td>
                    <td>
                      <span className="date-range">
                        {r.tuNgay} <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }} /> {r.denNgay}
                      </span>
                    </td>
                    <td>{getStatusBadge(r.trangThai)}</td>
                    <td>{getDeptHeadBadge(r.deptHeadStatus)}</td>
                    <td className="col-action">
                      <button type="button" className="btn-pill btn-pill-danger" onClick={() => del(r.id)}>
                        <i className="fa-solid fa-trash" /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {all.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center text-muted" style={{ padding: 24 }}>
                      Chưa có đơn nghỉ phép nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </HrChrome>
  );
}
