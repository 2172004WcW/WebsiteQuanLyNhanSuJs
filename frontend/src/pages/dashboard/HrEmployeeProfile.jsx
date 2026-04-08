import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiJson, apiJsonBody } from '../../api/client.js';
import HrChrome from '../../components/hr/HrChrome.jsx';

const TABS = [
  { id: 'nhanvien', label: 'Nhân viên', icon: 'fa-user' },
  { id: 'chamcong', label: 'Chấm công', icon: 'fa-clock' },
  { id: 'donphep', label: 'Đơn phép', icon: 'fa-calendar-minus' },
  { id: 'luong', label: 'Lương', icon: 'fa-money-bill' },
  { id: 'tochuc', label: 'Tổ chức', icon: 'fa-building' },
  { id: 'quyetdinh', label: 'Quyết định', icon: 'fa-file-signature' },
  { id: 'tuyendung', label: 'Tuyển dụng', icon: 'fa-briefcase' },
];

// Mock lịch sử công tác - sau này thay bằng API thật
const MOCK_LICH_SU = [
  {
    _id: 'ls1',
    ngay: '2024-01-15',
    loai: 'Bổ nhiệm',
    noiDung: 'Bổ nhiệm làm Trưởng phòng Kinh doanh',
    tu: null,
    den: 'PB001',
  },
  {
    _id: 'ls2',
    ngay: '2023-06-01',
    loai: 'Điều chuyển',
    noiDung: 'Điều chuyển từ phòng Marketing sang Kinh doanh',
    tu: 'PB003',
    den: 'PB001',
  },
  {
    _id: 'ls3',
    ngay: '2022-03-15',
    loai: 'Tuyển dụng',
    noiDung: 'Tuyển dụng vào vị trí Nhân viên kinh doanh',
    tu: null,
    den: 'PB003',
  },
];

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function getLoaiBadgeClass(loai) {
  const map = {
    'Bổ nhiệm': 'hr-profile-badge--promote',
    'Điều chuyển': 'hr-profile-badge--transfer',
    'Tuyển dụng': 'hr-profile-badge--hire',
    'Thăng chức': 'hr-profile-badge--promote',
    'Kỷ luật': 'hr-profile-badge--discipline',
  };
  return map[loai] || 'hr-profile-badge--default';
}

export default function HrEmployeeProfile() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const [nv, setNv] = useState(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('nhanvien');

  // Form state - chia theo section
  const [form, setForm] = useState({
    hoTen: '',
    emailCongViec: '',
    soDienThoai: '',
    soCccd: '',
    diaChiTamTru: '',
    ngayVaoLam: '',
    phongBan: '',
    chucVu: '',
    nhom: '',
    bangLuong: '',
  });

  // Options for selects
  const [options, setOptions] = useState({
    pb: [],
    cv: [],
    nh: [],
    bl: [],
  });

  // Lịch sử công tác
  const [lichSu, setLichSu] = useState([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        // Load employee data
        const data = await apiJson(`/api/dashboard/hr/employees/${encodeURIComponent(id)}`);
        setNv(data);
        setForm({
          hoTen: data.hoTen || '',
          emailCongViec: data.emailCongViec || '',
          soDienThoai: data.soDienThoai || '',
          soCccd: data.soCccd || '',
          diaChiTamTru: data.diaChiTamTru || '',
          ngayVaoLam: data.ngayVaoLam ? new Date(data.ngayVaoLam).toISOString().slice(0, 10) : '',
          phongBan: data.phongBan?._id || data.phongBan || '',
          chucVu: data.chucVu?._id || data.chucVu || '',
          nhom: data.nhom?._id || data.nhom || '',
          bangLuong: data.bangLuong?._id || data.bangLuong || '',
        });

        // Load options
        const [p1, p2, p3, p4] = await Promise.all([
          apiJson('/api/organizations/phong-ban'),
          apiJson('/api/organizations/chuc-vu'),
          apiJson('/api/organizations/nhom'),
          apiJson('/api/payroll/structure'),
        ]);
        setOptions({
          pb: p1 || [],
          cv: p2 || [],
          nh: p3 || [],
          bl: p4 || [],
        });

        // TODO: Load real lich su cong tac from API
        setLichSu(MOCK_LICH_SU);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [id]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await apiJsonBody('PUT', `/api/dashboard/hr/employees/${encodeURIComponent(id)}`, {
        hoTen: form.hoTen.trim(),
        emailCongViec: form.emailCongViec.trim(),
        soDienThoai: form.soDienThoai.trim(),
        soCccd: form.soCccd?.trim() || undefined,
        diaChiTamTru: form.diaChiTamTru?.trim() || undefined,
        ngayVaoLam: form.ngayVaoLam || undefined,
        phongBan: form.phongBan || undefined,
        chucVu: form.chucVu || undefined,
        nhom: form.nhom || undefined,
        bangLuong: form.bangLuong || undefined,
      });
      const data = await apiJson(`/api/dashboard/hr/employees/${encodeURIComponent(id)}`);
      setNv(data);
      alert('Đã lưu thay đổi thành công!');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setSaving(false);
    }
  }

  if (!id) {
    return (
      <div className="dash-page">
        <p>Thiếu tham số <code>id</code></p>
        <Link to="/dashboard/hr/employees">← Danh sách</Link>
      </div>
    );
  }

  // Header info
  const lastUpdated = nv?.updatedAt || new Date().toISOString();
  const lastUpdatedStr = new Date(lastUpdated).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <HrChrome
      iconClass="fa-solid fa-id-card"
      title="Hồ sơ nhân viên"
      subtitle="Cập nhật thông tin và xem lịch sử công tác."
    >
      {/* Header màu tím */}
      <div className="hr-profile-header">
        <div className="hr-profile-header-content">
          <div className="hr-profile-header-title">
            <i className="fa-solid fa-address-card" />
            <span>Hồ sơ nhân viên</span>
          </div>
          <div className="hr-profile-header-subtitle">
            Cập nhật thông tin và xem lịch sử công tác.
          </div>
          <div className="hr-profile-header-meta">
            Chỉnh sửa: {lastUpdatedStr}
          </div>
        </div>
        <Link to="/dashboard/hr/employees" className="hr-profile-back-btn">
          <i className="fa-solid fa-arrow-left" /> Danh sách
        </Link>
      </div>

      {/* Tabs */}
      <div className="hr-profile-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`hr-profile-tab ${activeTab === tab.id ? 'hr-profile-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fa-solid ${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {err && <div className="hr-profile-alert hr-profile-alert--error">{err}</div>}

      {/* Content - Tab Nhân viên */}
      {activeTab === 'nhanvien' && (
        <div className="hr-profile-content">
          <div className="hr-profile-grid">
            {/* Form bên trái */}
            <div className="hr-profile-form-section">
              <div className="hr-profile-section-header">
                <i className="fa-solid fa-pen-to-square" />
                <span>Chỉnh sửa thông tin</span>
              </div>

              <form onSubmit={save} className="hr-profile-form">
                {/* Thông tin cơ bản */}
                <div className="hr-profile-form-group">
                  <div className="hr-profile-form-group-title">THÔNG TIN CƠ BẢN</div>
                  <div className="hr-profile-form-field">
                    <label>Họ và tên *</label>
                    <input
                      value={form.hoTen}
                      onChange={(e) => setForm({ ...form, hoTen: e.target.value })}
                      required
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>

                {/* Thông tin liên hệ */}
                <div className="hr-profile-form-group">
                  <div className="hr-profile-form-group-title">THÔNG TIN LIÊN HỆ</div>
                  <div className="hr-profile-form-row">
                    <div className="hr-profile-form-field">
                      <label>Email công việc</label>
                      <input
                        type="email"
                        value={form.emailCongViec}
                        onChange={(e) => setForm({ ...form, emailCongViec: e.target.value })}
                        placeholder="email@company.vn"
                      />
                    </div>
                    <div className="hr-profile-form-field">
                      <label>Số điện thoại</label>
                      <input
                        value={form.soDienThoai}
                        onChange={(e) => setForm({ ...form, soDienThoai: e.target.value })}
                        placeholder="0912345678"
                      />
                    </div>
                  </div>
                  <div className="hr-profile-form-row">
                    <div className="hr-profile-form-field">
                      <label>Số CCCD</label>
                      <input
                        value={form.soCccd}
                        onChange={(e) => setForm({ ...form, soCccd: e.target.value })}
                        placeholder="079xxxxxxxx"
                      />
                    </div>
                    <div className="hr-profile-form-field">
                      <label>Ngày vào làm</label>
                      <input
                        type="date"
                        value={form.ngayVaoLam}
                        onChange={(e) => setForm({ ...form, ngayVaoLam: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="hr-profile-form-field">
                    <label>Địa chỉ tạm trú</label>
                    <input
                      value={form.diaChiTamTru}
                      onChange={(e) => setForm({ ...form, diaChiTamTru: e.target.value })}
                      placeholder="Số nhà, đường, phường, quận, thành phố"
                    />
                  </div>
                </div>

                {/* Vị trí tổ chức */}
                <div className="hr-profile-form-group">
                  <div className="hr-profile-form-group-title">VỊ TRÍ TỔ CHỨC</div>
                  <div className="hr-profile-form-row">
                    <div className="hr-profile-form-field">
                      <label>Phòng ban</label>
                      <select
                        value={form.phongBan}
                        onChange={(e) => setForm({ ...form, phongBan: e.target.value })}
                      >
                        <option value="">— Chọn phòng ban —</option>
                        {options.pb.map((x) => (
                          <option key={x._id} value={x._id}>{x.tenPhongBan}</option>
                        ))}
                      </select>
                    </div>
                    <div className="hr-profile-form-field">
                      <label>Chức vụ</label>
                      <select
                        value={form.chucVu}
                        onChange={(e) => setForm({ ...form, chucVu: e.target.value })}
                      >
                        <option value="">— Chọn chức vụ —</option>
                        {options.cv.map((x) => (
                          <option key={x._id} value={x._id}>{x.tenChucVu}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="hr-profile-form-row">
                    <div className="hr-profile-form-field">
                      <label>Nhóm</label>
                      <select
                        value={form.nhom}
                        onChange={(e) => setForm({ ...form, nhom: e.target.value })}
                      >
                        <option value="">— Chọn nhóm —</option>
                        {options.nh.map((x) => (
                          <option key={x._id} value={x._id}>{x.tenNhom}</option>
                        ))}
                      </select>
                    </div>
                    <div className="hr-profile-form-field">
                      <label>Bảng lương</label>
                      <select
                        value={form.bangLuong}
                        onChange={(e) => setForm({ ...form, bangLuong: e.target.value })}
                      >
                        <option value="">— Chọn bảng lương —</option>
                        {options.bl.map((x) => (
                          <option key={x._id} value={x._id}>{x.tenChucVu || x._id}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="hr-profile-form-actions">
                  <button type="button" className="hr-profile-btn-secondary">
                    Hủy
                  </button>
                  <button type="submit" className="hr-profile-btn-primary" disabled={saving}>
                    {saving ? <i className="fa-solid fa-spinner fa-spin" /> : null}
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>

            {/* Lịch sử công tác bên phải */}
            <div className="hr-profile-history-section">
              <div className="hr-profile-section-header">
                <i className="fa-solid fa-timeline" />
                <span>Lịch sử công tác</span>
              </div>

              <div className="hr-profile-timeline">
                {lichSu.length === 0 ? (
                  <div className="hr-profile-timeline-empty">
                    <i className="fa-solid fa-inbox" />
                    <p>Chưa có lịch sử công tác</p>
                  </div>
                ) : (
                  lichSu.map((item, idx) => (
                    <div key={item._id} className="hr-profile-timeline-item">
                      <div className="hr-profile-timeline-marker" />
                      <div className="hr-profile-timeline-content">
                        <div className="hr-profile-timeline-date">{formatDate(item.ngay)}</div>
                        <span className={`hr-profile-badge ${getLoaiBadgeClass(item.loai)}`}>
                          {item.loai}
                        </span>
                        <div className="hr-profile-timeline-text">{item.noiDung}</div>
                        {item.tu && item.den && (
                          <div className="hr-profile-timeline-change">
                            Từ {item.tu} → {item.den}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder cho các tab khác */}
      {activeTab !== 'nhanvien' && (
        <div className="hr-profile-content">
          <div className="hr-profile-empty-tab">
            <i className="fa-solid fa-helmet-safety" />
            <p>Tính năng đang được phát triển</p>
          </div>
        </div>
      )}
    </HrChrome>
  );
}
