import { useEffect, useState, useCallback, useMemo } from 'react';
import { apiJson, apiJsonBody } from '../../api/client.js';
import AdminChrome from '../../components/admin/AdminChrome.jsx';

const roleBadgeStyles = {
  admin: { background: '#fef2f2', color: '#dc2626' },
  director: { background: '#fff7ed', color: '#ea580c' },
  hr: { background: '#eff6ff', color: '#2563eb' },
  employee: { background: '#f0fdf4', color: '#16a34a' },
};

const defaultRoleStyle = { background: '#f9fafb', color: '#6b7280' };

function RoleBadge({ role }) {
  const style = roleBadgeStyles[role?.toLowerCase()] || defaultRoleStyle;
  return (
    <span
      style={{
        ...style,
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        display: 'inline-block',
      }}
    >
      {role}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: active ? '#22c55e' : '#ef4444',
        }}
      />
      <span
        style={{
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 500,
          background: active ? '#f0fdf4' : '#fef2f2',
          color: active ? '#16a34a' : '#dc2626',
        }}
      >
        {active ? 'Hoạt động' : 'Bị khóa'}
      </span>
    </div>
  );
}

export default function AdminAccounts() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState(''); // '' | 'true' | 'false'
  const [err, setErr] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [unassignedTk, setUnassignedTk] = useState([]);
  const [unassignedNv, setUnassignedNv] = useState([]);

  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'EMPLOYEE',
    nhanVienId: '',
  });

  const [editRole, setEditRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ role: 'EMPLOYEE', directManagerIds: [] });

  const [assignModal, setAssignModal] = useState(null);
  const [assignNvId, setAssignNvId] = useState('');

  // Subordinates modal state
  const [subordinatesModal, setSubordinatesModal] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE) || 1;
  const paginatedRows = rows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const loadLists = useCallback(async () => {
    const [tk, nv] = await Promise.all([
      apiJson('/api/dashboard/admin/accounts/unassigned'),
      apiJson('/api/dashboard/admin/employees/unassigned'),
    ]);
    setUnassignedTk(Array.isArray(tk) ? tk : []);
    setUnassignedNv(Array.isArray(nv) ? nv : []);
  }, []);

  const load = useCallback(async () => {
    const u = new URLSearchParams();
    if (q.trim()) u.set('q', q.trim());
    if (roleFilter) u.set('role', roleFilter);
    if (activeFilter !== '') u.set('active', activeFilter);
    const data = await apiJson(`/api/dashboard/admin/accounts?${u.toString()}`);
    setRows(Array.isArray(data) ? data : []);
    setPage(1); // Reset to first page when filters change
  }, [q, roleFilter, activeFilter]);

  // Fetch data when filters change
  useEffect(() => {
    (async () => {
      try {
        setErr('');
        await load();
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [load]);

  // Initial load (including lists)
  useEffect(() => {
    (async () => {
      try {
        setErr('');
        await Promise.all([loadLists()]);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  async function createAccount(e) {
    e.preventDefault();
    try {
      setErr('');
      await apiJsonBody('POST', '/api/dashboard/admin/accounts', {
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        nhanVienId: form.role === 'ADMIN' ? null : form.nhanVienId.trim() || null,
      });
      setShowCreate(false);
      setForm({ username: '', password: '', role: 'EMPLOYEE', nhanVienId: '' });
      await Promise.all([load(), loadLists()]);
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function toggle(ma) {
    await apiJson(`/api/dashboard/admin/accounts/${encodeURIComponent(ma)}/toggle-status`, { method: 'PUT' });
    await Promise.all([load(), loadLists()]);
  }

  async function remove(ma) {
    if (!window.confirm('Xóa tài khoản này?')) return;
    await apiJson(`/api/dashboard/admin/accounts/${encodeURIComponent(ma)}`, { method: 'DELETE' });
    await Promise.all([load(), loadLists()]);
  }

  async function resetPw(ma) {
    const pw = window.prompt('Mật khẩu mới (để trống = server tạo):') ?? '';
    const r = await apiJsonBody('POST', `/api/dashboard/admin/accounts/${encodeURIComponent(ma)}/reset-password`, {
      newPassword: pw || undefined,
    });
    window.alert(r.temporaryPassword ? `Mật khẩu tạm: ${r.temporaryPassword}` : r.message || 'Đã đặt mật khẩu');
  }

  function openEditRole(row) {
    setEditRole(row);
    setRoleForm({
      role: row.role || 'EMPLOYEE',
      directManagerIds: row.directManagerIds || (row.directManagerId ? [row.directManagerId] : []),
    });
  }

  // Filter available employees for direct manager selection
  // Only show regular employees (not managers) who don't have a direct manager yet
  const availableDirectReports = useMemo(() => {
    if (!editRole || roleForm.role !== 'EMPLOYEE') return [];
    
    return rows.filter(r => {
      // Must be EMPLOYEE role
      if (r.role !== 'EMPLOYEE') return false;
      // Must have employee assigned
      if (!r.nhanVienId) return false;
      // Exclude self
      if (r.maTaiKhoan === editRole.maTaiKhoan) return false;
      // Must not already have a direct manager
      if (r.directManagerId) return false;
      // Must not be a manager of others (check if anyone has this as their manager)
      const isManager = rows.some(other => other.directManagerId === r.nhanVienId);
      if (isManager) return false;
      return true;
    });
  }, [rows, editRole, roleForm.role]);

  function toggleDirectManager(nhanVienId) {
    setRoleForm(prev => {
      const currentIds = prev.directManagerIds || [];
      const exists = currentIds.includes(nhanVienId);
      if (exists) {
        return { ...prev, directManagerIds: currentIds.filter(id => id !== nhanVienId) };
      } else {
        return { ...prev, directManagerIds: [...currentIds, nhanVienId] };
      }
    });
  }

  async function saveRole(e) {
    e.preventDefault();
    if (!editRole) return;
    try {
      setErr('');
      await apiJsonBody('PUT', `/api/dashboard/admin/accounts/${encodeURIComponent(editRole.maTaiKhoan)}/role`, {
        role: roleForm.role,
        directManagerIds: roleForm.role === 'EMPLOYEE' ? roleForm.directManagerIds : undefined,
      });
      setEditRole(null);
      await Promise.all([load(), loadLists()]);
    } catch (ex) {
      setErr(ex.message);
    }
  }

  // Calculate subordinates count for a manager
  function getSubordinatesCount(managerNhanVienId) {
    if (!managerNhanVienId) return 0;
    return rows.filter(r => r.directManagerId === managerNhanVienId).length;
  }

  // Get list of subordinates for a manager
  function getSubordinates(managerNhanVienId) {
    if (!managerNhanVienId) return [];
    return rows.filter(r => r.directManagerId === managerNhanVienId);
  }

  function openSubordinatesModal(row) {
    const subordinates = getSubordinates(row.nhanVienId);
    setSubordinatesModal({
      managerName: row.hoTenNhanVien || row.username,
      managerId: row.nhanVienId,
      subordinates: subordinates,
    });
  }

  function openAssign(row) {
    setAssignModal(row);
    setAssignNvId('');
  }

  async function saveAssign(e) {
    e.preventDefault();
    if (!assignModal) return;
    try {
      setErr('');
      await apiJsonBody('PUT', `/api/dashboard/admin/accounts/${encodeURIComponent(assignModal.maTaiKhoan)}/assign`, {
        nhanVienId: assignNvId.trim() || null,
      });
      setAssignModal(null);
      await Promise.all([load(), loadLists()]);
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <AdminChrome
      iconClass="fa-solid fa-users-gear"
      title="Quản lý tài khoản"
      subtitle="Tạo, khóa/mở, đổi role, gán nhân viên, đặt lại mật khẩu"
    >
      {err && (
        <div className="err" style={{ marginBottom: '16px' }}>
          {err}
        </div>
      )}

      {/* Main Card */}
      <div className="dash-card" style={{ marginBottom: '24px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--adm)' }}>
            <i className="fa-solid fa-list" style={{ fontSize: '18px' }} />
            <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--txt)' }}>Danh sách</span>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="dash-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fa-solid fa-plus" />
            Tạo tài khoản
          </button>
        </div>

        {/* Search & Filter - Instant filter, no button */}
        <div className="dash-card" style={{ marginBottom: '16px', padding: '16px 20px' }}>
          <div className="admin-logs-filter">
            <input
              type="text"
              placeholder="Tìm username..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">Tất cả role</option>
              <option value="ADMIN">ADMIN</option>
              <option value="DIRECTOR">DIRECTOR</option>
              <option value="HR">HR</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
            </select>
            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="true">Hoạt động</option>
              <option value="false">Bị khóa</option>
            </select>
            {(q || roleFilter || activeFilter) && (
              <button
                type="button"
                onClick={() => { setQ(''); setRoleFilter(''); setActiveFilter(''); }}
                className="admin-logs-clear"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="dash-table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Role</th>
                <th>Nhân viên</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Cấp dưới</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((r, idx) => (
                <tr key={r.maTaiKhoan} style={{ background: idx % 2 === 1 ? '#f9fafb' : '#fff' }}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: 'var(--txt)' }}>{r.username}</span>
                      {r.maTaiKhoan && (
                        <span style={{ fontSize: '12px', color: 'var(--txt2)', marginTop: '2px' }}>{r.maTaiKhoan}</span>
                      )}
                    </div>
                  </td>
                  <td><RoleBadge role={r.role} /></td>
                  <td style={{ fontSize: '14px', color: 'var(--txt2)' }}>
                    {r.hoTenNhanVien ? (
                      <span>{r.nhanVienId} — {r.hoTenNhanVien}</span>
                    ) : (
                      <span style={{ color: 'var(--txt2)' }}>—</span>
                    )}
                  </td>
                  <td><StatusBadge active={r.trangThaiTaiKhoan} /></td>
                  <td style={{ fontSize: '14px', color: 'var(--txt2)' }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td>
                    {r.nhanVienId ? (
                      <button
                        type="button"
                        onClick={() => openSubordinatesModal(r)}
                        style={{
                          background: 'var(--pri-l)',
                          color: 'var(--pri)',
                          border: 'none',
                          borderRadius: '9999px',
                          padding: '4px 12px',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>{getSubordinatesCount(r.nhanVienId)} NV</span>
                        <i className="fa-solid fa-users" style={{ fontSize: '11px' }} />
                      </button>
                    ) : (
                      <span style={{ color: 'var(--txt2)', fontSize: '14px' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        title={r.trangThaiTaiKhoan ? 'Khóa tài khoản' : 'Mở khóa'}
                        onClick={() => toggle(r.maTaiKhoan)}
                        className="ac-btn"
                        style={{
                          background: r.trangThaiTaiKhoan ? '#f0fdf4' : '#fef2f2',
                          color: r.trangThaiTaiKhoan ? '#16a34a' : '#dc2626',
                        }}
                      >
                        <i className={`fa-solid fa-${r.trangThaiTaiKhoan ? 'lock' : 'lock-open'}`} style={{ fontSize: '12px' }} />
                      </button>
                      <button
                        type="button"
                        title="Đổi role"
                        onClick={() => openEditRole(r)}
                        className="ac-btn"
                        style={{ background: '#eff6ff', color: '#2563eb' }}
                      >
                        <i className="fa-solid fa-user-shield" style={{ fontSize: '12px' }} />
                      </button>
                      <button
                        type="button"
                        title="Gán nhân viên"
                        onClick={() => openAssign(r)}
                        className="ac-btn"
                        style={{ background: '#eef2ff', color: 'var(--adm)' }}
                      >
                        <i className="fa-solid fa-user-plus" style={{ fontSize: '12px' }} />
                      </button>
                      <button
                        type="button"
                        title="Reset mật khẩu"
                        onClick={() => resetPw(r.maTaiKhoan)}
                        className="ac-btn"
                        style={{ background: '#fffbeb', color: '#d97706' }}
                      >
                        <i className="fa-solid fa-key" style={{ fontSize: '12px' }} />
                      </button>
                      <button
                        type="button"
                        title="Xóa tài khoản"
                        onClick={() => remove(r.maTaiKhoan)}
                        className="ac-btn"
                        style={{ background: '#fef2f2', color: '#dc2626' }}
                      >
                        <i className="fa-solid fa-trash" style={{ fontSize: '12px' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            background: '#f9fafb',
          }}
        >
          <span style={{ fontSize: '14px', color: 'var(--txt2)' }}>
            Trang {page} / {totalPages}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="dash-btn secondary"
              style={{ padding: '6px 12px', fontSize: '14px' }}
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="dash-btn secondary"
              style={{ padding: '6px 12px', fontSize: '14px' }}
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Login Log Card */}
        <div className="dash-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--adm)', marginBottom: '16px' }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '18px' }} />
            <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--txt)' }}>Log đăng nhập</span>
          </div>
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--txt2)' }}>
            <i className="fa-regular fa-clipboard" style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px' }}>
              Chưa có log audit (endpoint dự phòng).
              <br />
              Có thể bổ sung bảng lịch sử đăng nhập sau.
            </p>
          </div>
        </div>

        {/* Unassigned Accounts Card */}
        <div className="dash-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warn)' }}>
              <i className="fa-solid fa-link-slash" style={{ fontSize: '18px' }} />
              <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--txt)' }}>TK chưa gán NV</span>
            </div>
            <span
              style={{
                background: 'var(--warn)',
                color: '#fff',
                borderRadius: '9999px',
                padding: '2px 10px',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {unassignedTk.length}
            </span>
          </div>
          {unassignedTk.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--txt2)' }}>
              <i className="fa-solid fa-check-circle" style={{ fontSize: '36px', marginBottom: '12px', color: 'var(--ok)' }} />
              <p style={{ fontSize: '14px' }}>Không có tài khoản chưa gán</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '192px', overflowY: 'auto' }}>
              {unassignedTk.map((t) => (
                <li
                  key={t.maTaiKhoan}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--txt)' }}>{t.username}</span>
                    <RoleBadge role={t.role} />
                  </div>
                  <button
                    type="button"
                    onClick={() => openAssign(t)}
                    className="dash-btn"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    Gán NV
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="dash-modal-bg" role="presentation" onClick={() => setShowCreate(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Tạo tài khoản</h2>
            <form className="dash-form" onSubmit={createAccount} style={{ maxWidth: '100%' }}>
              <label>
                Username
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </label>
              <label>
                Mật khẩu
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </label>
              <label>
                Vai trò
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="HR">HR</option>
                  <option value="DIRECTOR">DIRECTOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              {form.role !== 'ADMIN' && (
                <label>
                  Mã nhân viên gán
                  <input
                    value={form.nhanVienId}
                    onChange={(e) => setForm({ ...form, nhanVienId: e.target.value })}
                    placeholder="VD: NV001"
                    required
                  />
                </label>
              )}
              <div className="dash-row">
                <button type="submit" className="dash-btn">
                  Tạo
                </button>
                <button type="button" className="dash-btn secondary" onClick={() => setShowCreate(false)}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editRole && (
        <div className="dash-modal-bg" role="presentation" onClick={() => setEditRole(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Đổi vai trò — {editRole.username}</h2>
            <form className="dash-form" style={{ maxWidth: '100%' }} onSubmit={saveRole}>
              <label>
                Role
                <select 
                  value={roleForm.role} 
                  onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value, directManagerIds: e.target.value === 'EMPLOYEE' ? roleForm.directManagerIds : [] })}
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="HR">HR</option>
                  <option value="DIRECTOR">DIRECTOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              
              {roleForm.role === 'EMPLOYEE' && (
                <label>
                  <div style={{ marginBottom: '8px' }}>
                    Nhân viên quản lý trực tiếp (có thể chọn nhiều)
                    <span style={{ color: 'var(--txt2)', fontSize: '12px', marginLeft: '4px' }}>
                      — Chỉ hiển thị nhân viên chưa có người quản lý
                    </span>
                  </div>
                  <div 
                    style={{ 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px', 
                      padding: '12px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      background: '#fff'
                    }}
                  >
                    {availableDirectReports.length === 0 ? (
                      <span style={{ color: 'var(--txt2)', fontSize: '13px' }}>
                        Không có nhân viên nào khả dụng
                      </span>
                    ) : (
                      availableDirectReports.map(r => (
                        <div 
                          key={r.nhanVienId}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            padding: '6px 0',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleDirectManager(r.nhanVienId)}
                        >
                          <input 
                            type="checkbox"
                            checked={(roleForm.directManagerIds || []).includes(r.nhanVienId)}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '14px' }}>
                            {r.nhanVienId} — {r.hoTenNhanVien || r.username}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  {(roleForm.directManagerIds || []).length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--ok)' }}>
                      Đã chọn: {(roleForm.directManagerIds || []).length} nhân viên
                    </div>
                  )}
                </label>
              )}
              
              <div className="dash-row">
                <button type="submit" className="dash-btn">
                  Lưu
                </button>
                <button type="button" className="dash-btn secondary" onClick={() => setEditRole(null)}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignModal && (
        <div className="dash-modal-bg" role="presentation" onClick={() => setAssignModal(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Gán nhân viên — {assignModal.username}</h2>
            <p className="sub" style={{ fontSize: 13 }}>
              Chọn mã NV trong danh sách &quot;chưa có tài khoản&quot; hoặc nhập tay nếu đã biết mã.
            </p>
            <form className="dash-form" style={{ maxWidth: '100%' }} onSubmit={saveAssign}>
              <label>
                Mã nhân viên
                <input list="nv-unassigned" value={assignNvId} onChange={(e) => setAssignNvId(e.target.value)} placeholder="NV001" />
                <datalist id="nv-unassigned">
                  {unassignedNv.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.hoTen}
                    </option>
                  ))}
                </datalist>
              </label>
              <p className="sub" style={{ fontSize: 12 }}>
                ADMIN: để trống và Lưu để gỡ gán NV.
              </p>
              <div className="dash-row">
                <button type="submit" className="dash-btn">
                  Lưu
                </button>
                <button type="button" className="dash-btn secondary" onClick={() => setAssignModal(null)}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subordinates Modal */}
      {subordinatesModal && (
        <div className="dash-modal-bg" role="presentation" onClick={() => setSubordinatesModal(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>
              <i className="fa-solid fa-users" style={{ marginRight: '8px', color: 'var(--pri)' }} />
              Cấp dưới của {subordinatesModal.managerName}
            </h2>
            <p className="sub" style={{ fontSize: 13 }}>
              Mã quản lý: {subordinatesModal.managerId} — {subordinatesModal.subordinates.length} nhân viên
            </p>
            
            {subordinatesModal.subordinates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--txt2)' }}>
                <i className="fa-solid fa-user-slash" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ fontSize: '14px' }}>Chưa có nhân viên cấp dưới</p>
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <table className="dash-table" style={{ margin: 0, border: 'none' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px' }}>Mã NV</th>
                      <th style={{ padding: '10px 12px' }}>Tên nhân viên</th>
                      <th style={{ padding: '10px 12px' }}>Tài khoản</th>
                      <th style={{ padding: '10px 12px' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subordinatesModal.subordinates.map((sub) => (
                      <tr key={sub.maTaiKhoan}>
                        <td style={{ padding: '10px 12px', fontSize: '14px' }}>{sub.nhanVienId}</td>
                        <td style={{ padding: '10px 12px', fontSize: '14px' }}>{sub.hoTenNhanVien || '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: '14px' }}>{sub.username}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              background: sub.trangThaiTaiKhoan ? '#dcfce7' : '#fee2e2',
                              color: sub.trangThaiTaiKhoan ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {sub.trangThaiTaiKhoan ? 'Hoạt động' : 'Bị khóa'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="dash-row" style={{ marginTop: '20px', justifyContent: 'flex-end' }}>
              <button type="button" className="dash-btn" onClick={() => setSubordinatesModal(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminChrome>
  );
}
