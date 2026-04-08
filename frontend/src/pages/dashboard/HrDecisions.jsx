import { useEffect, useState } from 'react';
import { apiJson, apiJsonBody } from '../../api/client.js';
import HrChrome from '../../components/hr/HrChrome.jsx';

const LOAI_QD_OPTIONS = [
  { value: 'DIEU_CHUYEN', label: 'Điều chuyển công tác' },
  { value: 'THOI_VIEC', label: 'Thôi việc' },
  { value: 'KHEN_THUONG', label: 'Khen thưởng' },
  { value: 'KY_LUAT', label: 'Kỷ luật' },
];

const LOAI_QD_LABEL = {
  'DIEU_CHUYEN': 'Điều chuyển',
  'THOI_VIEC': 'Thôi việc',
  'KHEN_THUONG': 'Khen thưởng',
  'KY_LUAT': 'Kỷ luật',
};

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function formatCurrency(num) {
  if (!num && num !== 0) return '—';
  const n = Number(num);
  if (isNaN(n)) return '—';
  if (n === 0) return '0đ';
  return n.toLocaleString('vi-VN') + 'đ';
}

export default function HrDecisions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  
  // Reference data for dropdowns
  const [employees, setEmployees] = useState([]);
  const [phongBanList, setPhongBanList] = useState([]);
  const [chucVuList, setChucVuList] = useState([]);
  
  const [form, setForm] = useState({
    soQuyetDinh: '',
    loaiQuyetDinh: 'DIEU_CHUYEN',
    nhanVien: '',
    ngayKy: '',
    noiDungQuyetDinh: '',
    nguoiKy: '',
    phongBanMoiId: '',
    chucVuMoiId: '',
    soTien: '',
  });

  // Load reference data
  async function loadRefData() {
    try {
      const [emps, pbs, cvs] = await Promise.all([
        apiJson('/api/dashboard/hr/employees'),
        apiJson('/api/organizations/phong-ban'),
        apiJson('/api/organizations/chuc-vu'),
      ]);
      setEmployees(Array.isArray(emps) ? emps : []);
      setPhongBanList(Array.isArray(pbs) ? pbs : []);
      setChucVuList(Array.isArray(cvs) ? cvs : []);
    } catch (e) {
      console.error('Load ref data error:', e);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const data = await apiJson('/api/history/quyet-dinh');
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setErr('');
        await Promise.all([load(), loadRefData()]);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      setErr('');
      const q = new URLSearchParams();
      if (form.phongBanMoiId) q.set('phongBanMoiId', form.phongBanMoiId);
      if (form.chucVuMoiId) q.set('chucVuMoiId', form.chucVuMoiId);
      
      await apiJsonBody('POST', `/api/history/quyet-dinh?${q.toString()}`, {
        soQuyetDinh: form.soQuyetDinh,
        loaiQuyetDinh: form.loaiQuyetDinh,
        nhanVien: form.nhanVien,
        ngayKy: form.ngayKy || new Date().toISOString(),
        noiDungQuyetDinh: form.noiDungQuyetDinh,
        nguoiKy: form.nguoiKy,
        soTien: form.soTien ? Number(form.soTien) : undefined,
      });
      
      // Reset form
      setForm({
        soQuyetDinh: '',
        loaiQuyetDinh: 'DIEU_CHUYEN',
        nhanVien: '',
        ngayKy: '',
        noiDungQuyetDinh: '',
        nguoiKy: '',
        phongBanMoiId: '',
        chucVuMoiId: '',
        soTien: '',
      });
      
      await load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  const isDieuChuyen = form.loaiQuyetDinh === 'DIEU_CHUYEN';
  const isKhenThuong = form.loaiQuyetDinh === 'KHEN_THUONG';
  const isKyLuat = form.loaiQuyetDinh === 'KY_LUAT';
  const showSoTien = isKhenThuong || isKyLuat;

  // Get selected employee info for display
  const selectedEmployee = employees.find(emp => emp._id === form.nhanVien);

  return (
    <HrChrome
      iconClass="fa-solid fa-file-signature"
      title="Quyết định"
      subtitle="Ban hành và quản lý các quyết định nhân sự"
    >
      {err && <div className="hr-qd-alert hr-qd-alert--error">{err}</div>}

      {/* Form Section - Biểu mẫu */}
      <div className="hr-qd-form-section">
        <div className="hr-qd-form-header">
          <i className="fa-solid fa-wand-magic-sparkles" />
          <span>Biểu mẫu</span>
        </div>

        <form onSubmit={submit}>
          {/* Step 1: Chọn nhân viên */}
          <div className="hr-qd-form-step">
            <div className="hr-qd-step-number">1</div>
            <div className="hr-qd-step-label">Chọn nhân viên</div>
          </div>
          <div className="hr-qd-form-field">
            <select
              value={form.nhanVien}
              onChange={(e) => setForm({ ...form, nhanVien: e.target.value })}
              required
            >
              <option value="">— Chọn nhân viên —</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.hoTen} ({emp._id})
                </option>
              ))}
            </select>
            {selectedEmployee && (
              <div className="hr-qd-emp-info">
                <span><i className="fa-solid fa-building" /> {selectedEmployee.phongBan?.tenPhongBan || '—'}</span>
                <span><i className="fa-solid fa-id-badge" /> {selectedEmployee.chucVu?.tenChucVu || '—'}</span>
              </div>
            )}
          </div>

          {/* Step 2: Loại quyết định & Số QĐ */}
          <div className="hr-qd-form-step">
            <div className="hr-qd-step-number">2</div>
            <div className="hr-qd-step-label">Loại quyết định</div>
          </div>
          <div className="hr-qd-form-row">
            <div className="hr-qd-form-field">
              <select
                value={form.loaiQuyetDinh}
                onChange={(e) => setForm({ ...form, loaiQuyetDinh: e.target.value })}
              >
                {LOAI_QD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="hr-qd-form-field">
              <input
                type="text"
                placeholder="Số quyết định (VD: 956/2026/DC-G117)"
                value={form.soQuyetDinh}
                onChange={(e) => setForm({ ...form, soQuyetDinh: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Step 3: Thông tin điều chuyển (chỉ hiện khi loại là Điều chuyển) */}
          {isDieuChuyen && (
            <div className="hr-qd-transfer-section">
              <div className="hr-qd-transfer-title">Thông tin điều chuyển</div>
              <div className="hr-qd-form-row">
                <div className="hr-qd-form-field">
                  <label>Phòng ban mới</label>
                  <select
                    value={form.phongBanMoiId}
                    onChange={(e) => setForm({ ...form, phongBanMoiId: e.target.value })}
                  >
                    <option value="">— Chọn phòng ban —</option>
                    {phongBanList.map((pb) => (
                      <option key={pb._id} value={pb._id}>{pb.tenPhongBan}</option>
                    ))}
                  </select>
                </div>
                <div className="hr-qd-form-field">
                  <label>Chức vụ mới</label>
                  <select
                    value={form.chucVuMoiId}
                    onChange={(e) => setForm({ ...form, chucVuMoiId: e.target.value })}
                  >
                    <option value="">— Chọn chức vụ —</option>
                    {chucVuList.map((cv) => (
                      <option key={cv._id} value={cv._id}>{cv.tenChucVu}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Thông tin chung */}
          <div className="hr-qd-form-step">
            <div className="hr-qd-step-number">3</div>
            <div className="hr-qd-step-label">Thông tin quyết định</div>
          </div>
          <div className="hr-qd-form-row">
            <div className="hr-qd-form-field">
              <input
                type="text"
                placeholder="Người ký (VD: Giám đốc nhân sự)"
                value={form.nguoiKy}
                onChange={(e) => setForm({ ...form, nguoiKy: e.target.value })}
              />
            </div>
            {showSoTien && (
              <div className="hr-qd-form-field">
                <input
                  type="number"
                  placeholder="Số tiền (nếu có) - VD: 2000000"
                  value={form.soTien}
                  onChange={(e) => setForm({ ...form, soTien: e.target.value })}
                  min="0"
                />
              </div>
            )}
          </div>
          <div className="hr-qd-form-row">
            <div className="hr-qd-form-field hr-qd-form-field--date">
              <input
                type="date"
                placeholder="Ngày ký"
                value={form.ngayKy}
                onChange={(e) => setForm({ ...form, ngayKy: e.target.value })}
              />
            </div>
          </div>
          <div className="hr-qd-form-field">
            <textarea
              rows={3}
              placeholder="Nội dung/Chi tiết quyết định"
              value={form.noiDungQuyetDinh}
              onChange={(e) => setForm({ ...form, noiDungQuyetDinh: e.target.value })}
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="hr-qd-submit-btn">
            Ký & ban hành quyết định
          </button>
        </form>
      </div>

      {/* List Section - Lịch sử quyết định */}
      <div className="hr-qd-list-section">
        <div className="hr-qd-list-header">
          <div className="hr-qd-list-title">
            <i className="fa-solid fa-table-list" />
            <span>Lịch sử quyết định</span>
          </div>
          <button
            type="button"
            className="hr-qd-reload-btn"
            onClick={load}
            disabled={loading}
          >
            <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-rotate-right'}`} />
            Tải lại
          </button>
        </div>

        <div className="hr-qd-table-container">
          <table className="hr-qd-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>SỐ QUYẾT ĐỊNH</th>
                <th>NHÂN VIÊN</th>
                <th>LOẠI</th>
                <th>NGÀY KÝ</th>
                <th>NGƯỜI KÝ</th>
                <th>SỐ TIỀN</th>
                <th>NỘI DUNG</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="hr-qd-loading">
                    <i className="fa-solid fa-spinner fa-spin" /> Đang tải...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="hr-qd-empty">
                    <i className="fa-solid fa-inbox" />
                    <p>Chưa có quyết định nào</p>
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={r.soQuyetDinh || idx}>
                    <td className="hr-qd-number">{idx + 1}</td>
                    <td className="hr-qd-code">{r.soQuyetDinh || '—'}</td>
                    <td className="hr-qd-name">{r.tenNhanVien || r.nhanVien || '—'}</td>
                    <td>
                      <span className={`hr-qd-badge hr-qd-badge--${r.loaiQuyetDinh?.toLowerCase() || 'default'}`}>
                        {LOAI_QD_LABEL[r.loaiQuyetDinh] || r.loaiQuyetDinh}
                      </span>
                    </td>
                    <td>{formatDate(r.ngayKy)}</td>
                    <td>{r.nguoiKy || '—'}</td>
                    <td>{formatCurrency(r.soTien)}</td>
                    <td className="hr-qd-content">{r.noiDungQuyetDinh || '—'}</td>
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
