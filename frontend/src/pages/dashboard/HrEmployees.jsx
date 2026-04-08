import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiJson, apiJsonBody } from '../../api/client.js';
import HrChrome from '../../components/hr/HrChrome.jsx';

const TRANG_THAI_LABEL = {
  DANG_LAM_VIEC: 'Đang làm việc',
  DA_NGHI_VIEC: 'Đã nghỉ việc',
  NGHI_PHEP: 'Nghỉ phép',
  TAM_NGHI: 'Tạm nghỉ',
};

const TRANG_THAI_BADGE = {
  DANG_LAM_VIEC: 'hr-emp-badge--active',
  DA_NGHI_VIEC: 'hr-emp-badge--inactive',
  NGHI_PHEP: 'hr-emp-badge--leave',
  TAM_NGHI: 'hr-emp-badge--suspend',
};

export default function HrEmployees() {
  const [params] = useSearchParams();
  const openNew = params.get('new') === '1';

  const [rows, setRows] = useState([]);
  const [pb, setPb] = useState([]);
  const [cv, setCv] = useState([]);
  const [nh, setNh] = useState([]);
  const [bl, setBl] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  // Create modal state
  const [showCreate, setShowCreate] = useState(openNew);
  const [createForm, setCreateForm] = useState({
    id: '',
    hoTen: '',
    emailCongViec: '',
    soDienThoai: '',
    soCccd: '',
    ngayVaoLam: '',
    phongBan: '',
    chucVu: '',
    nhom: '',
    bangLuong: '',
  });

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    _id: '',
    hoTen: '',
    emailCongViec: '',
    soDienThoai: '',
    soCccd: '',
    ngayVaoLam: '',
    phongBan: '',
    chucVu: '',
    nhom: '',
    bangLuong: '',
  });

  async function load() {
    setLoading(true);
    try {
      const [emps, p1, p2, p3, p4] = await Promise.all([
        apiJson('/api/dashboard/hr/employees'),
        apiJson('/api/organizations/phong-ban'),
        apiJson('/api/organizations/chuc-vu'),
        apiJson('/api/organizations/nhom'),
        apiJson('/api/payroll/structure'),
      ]);
      setRows(Array.isArray(emps) ? emps : []);
      setPb(p1 || []);
      setCv(p2 || []);
      setNh(p3 || []);
      setBl(p4 || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (openNew) setShowCreate(true);
  }, [openNew]);

  async function createEmp(e) {
    e.preventDefault();
    try {
      setErr('');
      await apiJsonBody('POST', '/api/dashboard/hr/employees', {
        id: createForm.id.trim(),
        hoTen: createForm.hoTen.trim(),
        emailCongViec: createForm.emailCongViec.trim(),
        soDienThoai: createForm.soDienThoai.trim(),
        soCccd: createForm.soCccd?.trim() || undefined,
        ngayVaoLam: createForm.ngayVaoLam,
        phongBan: createForm.phongBan || undefined,
        chucVu: createForm.chucVu || undefined,
        nhom: createForm.nhom || undefined,
        bangLuong: createForm.bangLuong || undefined,
      });
      setShowCreate(false);
      setCreateForm({
        id: '',
        hoTen: '',
        emailCongViec: '',
        soDienThoai: '',
        soCccd: '',
        ngayVaoLam: '',
        phongBan: '',
        chucVu: '',
        nhom: '',
        bangLuong: '',
      });
      await load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  function openEdit(emp) {
    setEditForm({
      _id: emp._id || '',
      hoTen: emp.hoTen || '',
      emailCongViec: emp.emailCongViec || '',
      soDienThoai: emp.soDienThoai || '',
      soCccd: emp.soCccd || '',
      ngayVaoLam: emp.ngayVaoLam ? new Date(emp.ngayVaoLam).toISOString().slice(0, 10) : '',
      phongBan: emp.phongBan?._id || emp.phongBan || '',
      chucVu: emp.chucVu?._id || emp.chucVu || '',
      nhom: emp.nhom?._id || emp.nhom || '',
      bangLuong: emp.bangLuong?._id || emp.bangLuong || '',
    });
    setShowEdit(true);
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      setErr('');
      await apiJsonBody('PUT', `/api/dashboard/hr/employees/${editForm._id}`, {
        hoTen: editForm.hoTen.trim(),
        emailCongViec: editForm.emailCongViec.trim(),
        soDienThoai: editForm.soDienThoai.trim(),
        soCccd: editForm.soCccd?.trim() || undefined,
        ngayVaoLam: editForm.ngayVaoLam,
        phongBan: editForm.phongBan || undefined,
        chucVu: editForm.chucVu || undefined,
        nhom: editForm.nhom || undefined,
        bangLuong: editForm.bangLuong || undefined,
      });
      setShowEdit(false);
      await load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function remove(id) {
    if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    try {
      await apiJson(`/api/dashboard/hr/employees/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  function formatDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  const renderEmployeeForm = (form, setForm, onSubmit, title, isEdit = false) => (
    <div className="hr-emp-modal-overlay" onClick={() => isEdit ? setShowEdit(false) : setShowCreate(false)}>
      <div className="hr-emp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hr-emp-modal-header">
          <h3>{title}</h3>
          <button
            type="button"
            className="hr-emp-modal-close"
            onClick={() => isEdit ? setShowEdit(false) : setShowCreate(false)}
          >
            <i className="fa-solid fa-times" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="hr-emp-form">
          <div className="hr-emp-form-section">
            <h4>Thông tin cơ bản</h4>
            <div className="hr-emp-form-row">
              {!isEdit && (
                <div className="hr-emp-form-field">
                  <label>Mã nhân viên *</label>
                  <input
                    value={form.id || ''}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    required={!isEdit}
                    disabled={isEdit}
                    placeholder="NV001"
                  />
                </div>
              )}
              <div className={`hr-emp-form-field${isEdit ? ' hr-emp-form-field--full' : ''}`}>
                <label>Họ tên nhân viên *</label>
                <input
                  value={form.hoTen || ''}
                  onChange={(e) => setForm({ ...form, hoTen: e.target.value })}
                  required
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>
          </div>

          <div className="hr-emp-form-section">
            <h4>Thông tin liên hệ</h4>
            <div className="hr-emp-form-row">
              <div className="hr-emp-form-field">
                <label>Email công việc</label>
                <input
                  type="email"
                  value={form.emailCongViec || ''}
                  onChange={(e) => setForm({ ...form, emailCongViec: e.target.value })}
                  placeholder="email@company.vn"
                />
              </div>
              <div className="hr-emp-form-field">
                <label>Số điện thoại</label>
                <input
                  value={form.soDienThoai || ''}
                  onChange={(e) => setForm({ ...form, soDienThoai: e.target.value })}
                  placeholder="0912345678"
                />
              </div>
            </div>
            <div className="hr-emp-form-row">
              <div className="hr-emp-form-field">
                <label>Số CCCD</label>
                <input
                  value={form.soCccd || ''}
                  onChange={(e) => setForm({ ...form, soCccd: e.target.value })}
                  placeholder="079xxxxxxxx"
                />
              </div>
              <div className="hr-emp-form-field">
                <label>Ngày vào làm</label>
                <input
                  type="date"
                  value={form.ngayVaoLam || ''}
                  onChange={(e) => setForm({ ...form, ngayVaoLam: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="hr-emp-form-section">
            <h4>Vị trí tổ chức</h4>
            <div className="hr-emp-form-row">
              <div className="hr-emp-form-field">
                <label>Phòng ban</label>
                <select value={form.phongBan || ''} onChange={(e) => setForm({ ...form, phongBan: e.target.value })}>
                  <option value="">— Chọn phòng ban —</option>
                  {pb.map((x) => (
                    <option key={x._id} value={x._id}>{x.tenPhongBan}</option>
                  ))}
                </select>
              </div>
              <div className="hr-emp-form-field">
                <label>Chức vụ</label>
                <select value={form.chucVu || ''} onChange={(e) => setForm({ ...form, chucVu: e.target.value })}>
                  <option value="">— Chọn chức vụ —</option>
                  {cv.map((x) => (
                    <option key={x._id} value={x._id}>{x.tenChucVu}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="hr-emp-form-row">
              <div className="hr-emp-form-field">
                <label>Nhóm</label>
                <select value={form.nhom || ''} onChange={(e) => setForm({ ...form, nhom: e.target.value })}>
                  <option value="">— Chọn nhóm —</option>
                  {nh.map((x) => (
                    <option key={x._id} value={x._id}>{x.tenNhom}</option>
                  ))}
                </select>
              </div>
              <div className="hr-emp-form-field">
                <label>Bảng lương</label>
                <select value={form.bangLuong || ''} onChange={(e) => setForm({ ...form, bangLuong: e.target.value })}>
                  <option value="">— Chọn bảng lương —</option>
                  {bl.map((x) => (
                    <option key={x._id} value={x._id}>{x.tenChucVu || x._id}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="hr-emp-form-actions">
            <button type="button" className="hr-emp-btn-secondary" onClick={() => isEdit ? setShowEdit(false) : setShowCreate(false)}>
              Hủy
            </button>
            <button type="submit" className="hr-emp-btn-primary">
              {isEdit ? 'Lưu thay đổi' : 'Thêm nhân viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <HrChrome
      iconClass="fa-solid fa-users"
      title="Quản lý nhân viên"
      subtitle="Thêm/sửa/xóa nhân viên và cập nhật trạng thái hoạt động."
    >
      {err && <div className="hr-emp-alert hr-emp-alert--error">{err}</div>}

      {/* Header with Add button */}
      <div className="hr-emp-header">
        <div className="hr-emp-header-left">
          <i className="fa-solid fa-users" />
          <span>Quản lý nhân viên</span>
        </div>
        <button type="button" className="hr-emp-btn-add" onClick={() => setShowCreate(true)}>
          <i className="fa-solid fa-plus" /> Thêm NV
        </button>
      </div>

      {/* Table */}
      <div className="hr-emp-table-container">
        <table className="hr-emp-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>ID</th>
              <th>HỌ TÊN</th>
              <th>PHÒNG BAN</th>
              <th>CHỨC VỤ</th>
              <th>TRẠNG THÁI</th>
              <th style={{ width: 200 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="hr-emp-loading">
                  <i className="fa-solid fa-spinner fa-spin" /> Đang tải...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="hr-emp-empty">
                  <i className="fa-solid fa-inbox" />
                  <p>Không có nhân viên nào</p>
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const status = r.trangThaiHoatDong || 'DANG_LAM_VIEC';
                const statusLabel = TRANG_THAI_LABEL[status] || status;
                const statusClass = TRANG_THAI_BADGE[status] || 'hr-emp-badge--default';
                return (
                  <tr key={r._id}>
                    <td className="hr-emp-number">{idx + 1}</td>
                    <td className="hr-emp-id">{r._id}</td>
                    <td className="hr-emp-name">{r.hoTen}</td>
                    <td>{r.phongBan?.tenPhongBan || '—'}</td>
                    <td>{r.chucVu?.tenChucVu || '—'}</td>
                    <td>
                      <span className={`hr-emp-badge ${statusClass}`}>{statusLabel}</span>
                    </td>
                    <td>
                      <div className="hr-emp-actions">
                        <Link
                          to={`/dashboard/hr/employees/profile?id=${encodeURIComponent(r._id)}`}
                          className="hr-emp-btn-action hr-emp-btn-profile"
                          title="Hồ sơ"
                        >
                          <i className="fa-solid fa-id-card" /> Hồ sơ
                        </Link>
                        <button
                          type="button"
                          className="hr-emp-btn-action hr-emp-btn-delete"
                          onClick={() => remove(r._id)}
                          title="Xóa"
                        >
                          <i className="fa-solid fa-trash" /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && renderEmployeeForm(createForm, setCreateForm, createEmp, 'Thêm nhân viên mới', false)}

      {/* Edit Modal */}
      {showEdit && renderEmployeeForm(editForm, setEditForm, saveEdit, 'Chỉnh sửa thông tin', true)}
    </HrChrome>
  );
}
