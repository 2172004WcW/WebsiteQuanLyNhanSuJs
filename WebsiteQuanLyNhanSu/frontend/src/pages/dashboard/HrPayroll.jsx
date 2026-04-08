import { useEffect, useMemo, useState } from 'react';
import { apiJson, apiJsonBody } from '../../api/client.js';
import HrChrome from '../../components/hr/HrChrome.jsx';

export default function HrPayroll() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [payslips, setPayslips] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state for new salary structure
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStructure, setNewStructure] = useState({
    _id: '',
    tenChucVu: '',
    luongCoBan: '',
    phuCapDinhMuc: ''
  });

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

  async function loadPayslips() {
    const data = await apiJson(`/api/payroll/all?thang=${encodeURIComponent(month)}`);
    setPayslips(Array.isArray(data) ? data : []);
  }

  async function loadSalaryStructures() {
    const data = await apiJson('/api/payroll/structure');
    setSalaryStructures(Array.isArray(data) ? data : []);
  }

  async function loadAll() {
    try {
      setErr('');
      await Promise.all([loadPayslips(), loadSalaryStructures()]);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, [month]);

  async function generatePayslips() {
    try {
      setLoading(true);
      setErr('');
      setSuccessMsg('');
      await apiJson(`/api/payroll/generate?thangNam=${encodeURIComponent(month)}`, { method: 'POST' });
      setSuccessMsg(`Đã tính và tạo phiếu lương tháng ${month} thành công!`);
      await loadPayslips();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function approvePayslip(id) {
    try {
      setErr('');
      await apiJson(`/api/payroll/${encodeURIComponent(id)}/approve`, { method: 'PUT' });
      setSuccessMsg('Đã phê duyệt phiếu lương thành công!');
      await loadPayslips();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function deleteSalaryStructure(id) {
    if (!confirm('Bạn có chắc muốn xóa bảng lương này?')) return;
    try {
      setErr('');
      await apiJson(`/api/payroll/structure/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setSuccessMsg('Đã xóa bảng lương thành công!');
      await loadSalaryStructures();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function addSalaryStructure(e) {
    e.preventDefault();
    try {
      setErr('');
      await apiJsonBody('/api/payroll/structure', newStructure);
      setSuccessMsg('Đã thêm bảng lương thành công!');
      setShowAddForm(false);
      setNewStructure({ _id: '', tenChucVu: '', luongCoBan: '', phuCapDinhMuc: '' });
      await loadSalaryStructures();
    } catch (e) {
      setErr(e.message);
    }
  }

  const formatCurrency = (v) => {
    if (v == null) return '—';
    return Number(v).toLocaleString('vi-VN') + 'đ';
  };

  const getStatusBadge = (status) => {
    if (status === 'DA_THANH_TOAN') {
      return <span className="badge badge-success"><i className="fa-solid fa-check" /> Đã thanh toán</span>;
    }
    return <span className="badge badge-warning">Chưa thanh toán</span>;
  };

  return (
    <HrChrome
      iconClass="fa-solid fa-money-bill-wave"
      title="Lương"
      subtitle="Quản lý bảng lương và phiếu lương nhân viên."
    >
      {err && <div className="alert alert-error">{err}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Thao tác nghiệp vụ lương */}
      <div className="hr-card">
        <div className="hr-card-hd">
          <div className="hr-card-title">
            <i className="fa-solid fa-briefcase" style={{ color: 'var(--primary)' }} aria-hidden />
            Thao tác nghiệp vụ lương
          </div>
        </div>
        <div className="hr-card-body">
          <p className="text-muted" style={{ marginBottom: '12px' }}>
            Chọn tháng ở bảng dưới, sau đó chạy tổng hợp (tạo phiếu lương cho NV đã gán bảng lương). 
            Thiết lập cấu trúc theo chức vụ trước khi gán cho nhân viên.
          </p>
          <div className="hr-action-row">
            <button
              type="button"
              className="btn btn-success"
              onClick={generatePayslips}
              disabled={loading}
            >
              <i className="fa-solid fa-calculator" aria-hidden />
              {loading ? 'Đang tính...' : 'Tính/tạo phiếu lương tháng'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <i className="fa-solid fa-plus" aria-hidden />
              Thêm cấu trúc lương (chức vụ)
            </button>
          </div>
        </div>
      </div>

      {/* Form thêm bảng lương */}
      {showAddForm && (
        <div className="hr-card">
          <div className="hr-card-hd">
            <div className="hr-card-title">Thêm bảng lương mới</div>
          </div>
          <div className="hr-card-body">
            <form onSubmit={addSalaryStructure} className="hr-form-grid">
              <div className="form-group">
                <label>Mã bảng lương</label>
                <input
                  type="text"
                  className="form-control"
                  value={newStructure._id}
                  onChange={(e) => setNewStructure({ ...newStructure, _id: e.target.value })}
                  placeholder="VD: BL011"
                  required
                />
              </div>
              <div className="form-group">
                <label>Tên chức vụ</label>
                <input
                  type="text"
                  className="form-control"
                  value={newStructure.tenChucVu}
                  onChange={(e) => setNewStructure({ ...newStructure, tenChucVu: e.target.value })}
                  placeholder="VD: Senior Developer"
                  required
                />
              </div>
              <div className="form-group">
                <label>Lương cơ bản</label>
                <input
                  type="number"
                  className="form-control"
                  value={newStructure.luongCoBan}
                  onChange={(e) => setNewStructure({ ...newStructure, luongCoBan: e.target.value })}
                  placeholder="VD: 15000000"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phụ cấp</label>
                <input
                  type="number"
                  className="form-control"
                  value={newStructure.phuCapDinhMuc}
                  onChange={(e) => setNewStructure({ ...newStructure, phuCapDinhMuc: e.target.value })}
                  placeholder="VD: 2000000"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">Lưu</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danh sách bảng lương */}
      <div className="hr-card">
        <div className="section-header">
          <div className="section-title">
            <i className="fa-solid fa-table-list" style={{ color: 'var(--primary)' }} aria-hidden />
            Danh sách bảng lương
          </div>
          <span className="badge-count">{salaryStructures.length} bảng</span>
        </div>
        <div className="dash-table-wrap">
          <table className="hr-payroll-table">
            <thead>
              <tr>
                <th className="col-number">#</th>
                <th>MÃ</th>
                <th>TÊN CHỨC VỤ</th>
                <th className="col-currency">LƯƠNG CƠ BẢN</th>
                <th className="col-currency">PHỤ CẤP</th>
                <th className="col-action">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {salaryStructures.map((s, idx) => (
                <tr key={s._id}>
                  <td className="col-number">{idx + 1}</td>
                  <td className="col-id">{s._id}</td>
                  <td>{s.tenChucVu}</td>
                  <td className="col-currency">{formatCurrency(s.luongCoBan)}</td>
                  <td className="col-currency">{formatCurrency(s.phuCapDinhMuc)}</td>
                  <td className="col-action">
                    <button
                      type="button"
                      className="btn-pill btn-pill-danger"
                      onClick={() => deleteSalaryStructure(s._id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {salaryStructures.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ padding: '24px' }}>
                    Chưa có bảng lương nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phê duyệt lương */}
      <div className="hr-card">
        <div className="section-header">
          <div className="section-title">
            <i className="fa-solid fa-file-invoice-dollar" style={{ color: 'var(--primary)' }} aria-hidden />
            Phê duyệt lương
          </div>
          <div className="section-actions">
            <label htmlFor="pay-month" style={{ fontSize: '14px', color: '#64748b' }}>Tháng:</label>
            <select
              id="pay-month"
              className="hr-filter-select"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ minWidth: '120px' }}
            >
              {monthOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  Tháng {o.label.replace('Tháng ', '')}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-pill btn-pill-primary"
              onClick={loadAll}
            >
              <i className="fa-solid fa-rotate-right" aria-hidden />
              Tải lại
            </button>
          </div>
        </div>
        <div className="dash-table-wrap">
          <table className="hr-payroll-table">
            <thead>
              <tr>
                <th className="col-number">#</th>
                <th>ID</th>
                <th>NHÂN VIÊN</th>
                <th>THÁNG</th>
                <th className="col-currency">TỔNG</th>
                <th>TRẠNG THÁI</th>
                <th className="col-action">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((p, idx) => (
                <tr key={p._id}>
                  <td className="col-number">{idx + 1}</td>
                  <td className="col-id">{p._id}</td>
                  <td>{p.hoTen || p.nhanVien || '—'}</td>
                  <td>{p.thangNam}</td>
                  <td className="col-currency">{formatCurrency(p.tongLuong)}</td>
                  <td>{getStatusBadge(p.trangThaiThanhToan)}</td>
                  <td className="col-action">
                    {p.trangThaiThanhToan !== 'DA_THANH_TOAN' ? (
                      <button
                        type="button"
                        className="btn-pill btn-pill-success"
                        onClick={() => approvePayslip(p._id)}
                      >
                        <i className="fa-solid fa-check" aria-hidden />
                        Chốt trả lương
                      </button>
                    ) : (
                      <span className="badge badge-muted">
                        <i className="fa-solid fa-lock" aria-hidden /> Đã chốt
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {payslips.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted" style={{ padding: '24px' }}>
                    Chưa có phiếu lương nào cho tháng này. Vui lòng chạy "Tính/tạo phiếu lương tháng".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </HrChrome>
  );
}
