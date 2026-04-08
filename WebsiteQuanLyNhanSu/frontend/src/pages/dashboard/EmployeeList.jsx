import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson, apiJsonBody } from '../../api/client.js';
import EmployeeChrome from '../../components/employee/EmployeeChrome.jsx';

const TABS = [
  { id: 'nhanvien', label: 'Nhân viên', icon: 'fa-user', active: true },
  { id: 'chamcong', label: 'Chấm công', icon: 'fa-clock' },
  { id: 'donphep', label: 'Đơn phép', icon: 'fa-calendar-minus' },
  { id: 'luong', label: 'Lương', icon: 'fa-money-bill' },
  { id: 'tochuc', label: 'Tổ chức', icon: 'fa-building' },
  { id: 'quyetdinh', label: 'Quyết định', icon: 'fa-file-signature' },
  { id: 'tuyendung', label: 'Tuyển dụng', icon: 'fa-briefcase' },
];

const FILTER_PILLS = [
  { id: 'all', label: 'Tổng quan' },
  { id: 'chi-nhanh', label: 'Chi nhánh' },
  { id: 'phong-ban', label: 'Phòng ban' },
  { id: 'nhom', label: 'Nhóm' },
  { id: 'chuc-vu', label: 'Chức vụ' },
];

const TRANG_THAI_LABEL = {
  DANG_LAM_VIEC: 'Đang làm việc',
  DA_NGHI_VIEC: 'Đã nghỉ việc',
  NGHI_PHEP: 'Nghỉ phép',
  TAM_NGHI: 'Tạm nghỉ',
};

const TRANG_THAI_BADGE = {
  DANG_LAM_VIEC: 'emp-list-badge--active',
  DA_NGHI_VIEC: 'emp-list-badge--inactive',
  NGHI_PHEP: 'emp-list-badge--leave',
  TAM_NGHI: 'emp-list-badge--suspend',
};

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [activeTab, setActiveTab] = useState('nhanvien');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhongBan, setFilterPhongBan] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('');
  
  // Options for filters
  const [phongBanList, setPhongBanList] = useState([]);
  
  // Last updated time
  const [lastUpdated, setLastUpdated] = useState(new Date());

  async function loadData() {
    setLoading(true);
    try {
      const [emps, pbs] = await Promise.all([
        apiJson('/api/dashboard/hr/employees'),
        apiJson('/api/organizations/phong-ban'),
      ]);
      setEmployees(Array.isArray(emps) ? emps : []);
      setFilteredEmployees(Array.isArray(emps) ? emps : []);
      setPhongBanList(Array.isArray(pbs) ? pbs : []);
      setLastUpdated(new Date());
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...employees];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(emp => 
        (emp.hoTen?.toLowerCase().includes(term)) ||
        (emp._id?.toLowerCase().includes(term)) ||
        (emp.emailCongViec?.toLowerCase().includes(term)) ||
        (emp.soDienThoai?.includes(term))
      );
    }
    
    if (filterPhongBan) {
      result = result.filter(emp => {
        const pbId = emp.phongBan?._id || emp.phongBan;
        return pbId === filterPhongBan;
      });
    }
    
    if (filterTrangThai) {
      result = result.filter(emp => emp.trangThaiHoatDong === filterTrangThai);
    }
    
    setFilteredEmployees(result);
  }, [searchTerm, filterPhongBan, filterTrangThai, employees]);

  async function deleteEmployee(id) {
    if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    try {
      await apiJson(`/api/dashboard/hr/employees/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await loadData();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  const lastUpdatedStr = lastUpdated.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', ' —');

  return (
    <EmployeeChrome
      iconClass="fa-solid fa-users"
      title="Danh sách nhân viên"
      subtitle="Quản lý và tra cứu thông tin nhân viên"
      showSubnav={true}
    >
      {/* Purple Header */}
      <div className="emp-list-header">
        <div className="emp-list-header-content">
          <div className="emp-list-header-title">
            <i className="fa-solid fa-address-card" />
            <span>Hồ sơ nhân viên</span>
          </div>
          <div className="emp-list-header-subtitle">
            Cập nhật thông tin và xem danh sách nhân viên.
          </div>
          <div className="emp-list-header-meta">
            Chỉnh sửa: {lastUpdatedStr}
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="emp-list-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`emp-list-tab ${activeTab === tab.id ? 'emp-list-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fa-solid ${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {err && <div className="emp-list-alert emp-list-alert--error">{err}</div>}

      {/* Content - Employee List Tab */}
      {activeTab === 'nhanvien' && (
        <div className="emp-list-content">
          {/* Filter Pills */}
          <div className="emp-list-filter-pills">
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill.id}
                className={`emp-list-pill ${activeFilter === pill.id ? 'emp-list-pill--active' : ''}`}
                onClick={() => setActiveFilter(pill.id)}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="emp-list-search-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="emp-list-table-container">
            <table className="emp-list-table">
              <thead>
                <tr>
                  <th className="col-number">#</th>
                  <th>MÃ</th>
                  <th>HỌ TÊN</th>
                  <th>GIỚI TÍNH</th>
                  <th>NGÀY SINH</th>
                  <th>EMAIL</th>
                  <th>SỐ ĐIỆN THOẠI</th>
                  <th>NƠI LÀM VIỆC</th>
                  <th>TRẠNG THÁI</th>
                  <th className="col-action">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="emp-list-loading">
                      <i className="fa-solid fa-spinner fa-spin" /> Đang tải...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="emp-list-empty">
                      <i className="fa-solid fa-inbox" />
                      <p>Không tìm thấy nhân viên nào</p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp, idx) => {
                    const status = emp.trangThaiHoatDong || 'DANG_LAM_VIEC';
                    const statusLabel = TRANG_THAI_LABEL[status] || status;
                    const statusClass = TRANG_THAI_BADGE[status] || 'emp-list-badge--default';
                    return (
                      <tr key={emp._id}>
                        <td className="emp-list-number">{idx + 1}</td>
                        <td className="emp-list-code">{emp._id}</td>
                        <td className="emp-list-name">{emp.hoTen}</td>
                        <td>{emp.gioiTinh || '—'}</td>
                        <td>{formatDate(emp.ngaySinh)}</td>
                        <td>{emp.emailCongViec || '—'}</td>
                        <td>{emp.soDienThoai || '—'}</td>
                        <td>{emp.phongBan?.tenPhongBan || emp.phongBan || '—'}</td>
                        <td>
                          <span className={`emp-list-badge ${statusClass}`}>{statusLabel}</span>
                        </td>
                        <td className="col-action">
                          <Link
                            to={`/dashboard/employee/profile?id=${encodeURIComponent(emp._id)}`}
                            className="btn-pill btn-pill-primary"
                            title="Xem chi tiết"
                          >
                            <i className="fa-solid fa-eye" /> Xem
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Placeholder for other tabs */}
      {activeTab !== 'nhanvien' && (
        <div className="emp-list-content">
          <div className="emp-list-empty-tab">
            <i className="fa-solid fa-helmet-safety" />
            <p>Tính năng đang được phát triển</p>
          </div>
        </div>
      )}
    </EmployeeChrome>
  );
}
