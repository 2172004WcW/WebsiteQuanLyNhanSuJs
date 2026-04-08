import { useEffect, useMemo, useState } from 'react';
import { apiJson, apiJsonBody } from '../../api/client.js';
import EmployeeChrome from '../../components/employee/EmployeeChrome.jsx';

const TYPES = [
  { value: 'PHEP_NAM', label: 'Phép năm' },
  { value: 'PHEP_OM', label: 'Nghỉ ốm' },
  { value: 'NGHI_LE', label: 'Nghỉ lễ' },
  { value: 'KHONG_LUONG', label: 'Không lương' },
  { value: 'KHAC', label: 'Khác' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'CHO_QL_DUYET', label: 'Chờ quản lý duyệt' },
  { value: 'CHO_HR_XAC_NHAN', label: 'Chờ HR xác nhận' },
  { value: 'DA_DUYET', label: 'Đã phê duyệt' },
  { value: 'TU_CHOI', label: 'Bị từ chối' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Từ ngày mới nhất' },
  { value: 'oldest', label: 'Từ ngày cũ nhất' },
];

const PAGE_SIZE_OPTIONS = [5, 8, 10, 20, 50];

function loaiPhepLabel(code) {
  const u = String(code || '').toUpperCase();
  const map = {
    PHEP_NAM: 'Phép năm',
    PHEP_OM: 'Nghỉ ốm',
    NGHI_LE: 'Nghỉ lễ',
    KHONG_LUONG: 'Không lương',
    KHAC: 'Khác',
  };
  return map[u] || code || '—';
}

function statusBadge(st) {
  const u = String(st || '').toUpperCase();
  switch (u) {
    case 'DA_DUYET':
      return { class: 'emp-leave-badge--approved', label: 'Đã phê duyệt', icon: 'fa-check-circle' };
    case 'CHO_QL_DUYET':
      return { class: 'emp-leave-badge--pending-manager', label: 'Chờ quản lý duyệt', icon: 'fa-clock' };
    case 'CHO_HR_XAC_NHAN':
    case 'CHO_DUYET':
      return { class: 'emp-leave-badge--pending-hr', label: 'Chờ HR xác nhận', icon: 'fa-hourglass-half' };
    case 'TU_CHOI':
      return { class: 'emp-leave-badge--rejected', label: 'Bị từ chối', icon: 'fa-times-circle' };
    default:
      return { class: 'emp-leave-badge--default', label: st || '—', icon: 'fa-question' };
  }
}

function daysBetween(tu, den) {
  if (!tu || !den) return 0;
  const a = new Date(tu);
  const b = new Date(den);
  return Math.floor((b - a) / 86400000) + 1;
}

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export default function EmployeeLeaves() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ phepConLai: 12 });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  // Manager approval state
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    loaiNghi: 'PHEP_NAM',
    tuNgay: '',
    denNgay: '',
    lyDo: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Filter, sort, pagination state
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [pageSize, setPageSize] = useState(8);
  const [page, setPage] = useState(1);

  // Load data
  async function load() {
    setLoading(true);
    try {
      const [leavesData, statsData] = await Promise.all([
        apiJson('/api/dashboard/employee/leaves'),
        apiJson('/api/dashboard/employee/stats'),
      ]);
      setRows(Array.isArray(leavesData) ? leavesData : []);
      setStats(statsData || { phepConLai: 12 });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Load pending approvals for manager
  async function loadPendingApprovals() {
    setLoadingApprovals(true);
    try {
      const data = await apiJson('/api/dashboard/director/leaves/pending');
      setPendingApprovals(Array.isArray(data) ? data : []);
    } catch (e) {
      // Silently fail - user might not be a manager
      setPendingApprovals([]);
    } finally {
      setLoadingApprovals(false);
    }
  }

  useEffect(() => {
    load();
    loadPendingApprovals();
  }, []);

  // Computed stats
  const computedStats = useMemo(() => {
    const choDuyet = rows.filter(r => ['CHO_QL_DUYET', 'CHO_HR_XAC_NHAN', 'CHO_DUYET'].includes(String(r.trangThai).toUpperCase())).length;
    const daDuyet = rows.filter(r => String(r.trangThai).toUpperCase() === 'DA_DUYET').length;
    const tuChoi = rows.filter(r => String(r.trangThai).toUpperCase() === 'TU_CHOI').length;
    return {
      choDuyet,
      daDuyet,
      tuChoi,
      phepConLai: stats.phepConLai ?? 12,
    };
  }, [rows, stats]);

  // Filtered and sorted rows
  const processedRows = useMemo(() => {
    let result = [...rows];

    // Filter by status
    if (filterStatus !== 'ALL') {
      result = result.filter(r => String(r.trangThai).toUpperCase() === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.tuNgay || 0);
      const dateB = new Date(b.tuNgay || 0);
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [rows, filterStatus, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, page, pageSize]);

  // Submit form
  async function submit(e) {
    e.preventDefault();
    if (!form.tuNgay || !form.denNgay) {
      setErr('Vui lòng chọn ngày bắt đầu và kết thúc');
      return;
    }
    if (new Date(form.tuNgay) > new Date(form.denNgay)) {
      setErr('Ngày bắt đầu không được sau ngày kết thúc');
      return;
    }

    setSubmitting(true);
    setErr('');
    try {
      await apiJsonBody('POST', '/api/dashboard/employee/leaves', {
        loaiNghi: form.loaiNghi,
        tuNgay: form.tuNgay,
        denNgay: form.denNgay,
        lyDo: form.lyDo,
      });
      setForm({ loaiNghi: 'PHEP_NAM', tuNgay: '', denNgay: '', lyDo: '' });
      setShowForm(false);
      await load();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Approve leave request
  async function approveLeave(id) {
    if (!window.confirm('Bạn có chắc muốn duyệt đơn này?')) return;
    try {
      await apiJsonBody('PUT', `/api/dashboard/director/leaves/${encodeURIComponent(id)}/approve`, {});
      await loadPendingApprovals();
      setErr('');
    } catch (ex) {
      setErr(ex.message);
    }
  }

  // Reject leave request
  async function rejectLeave(id) {
    if (!rejectReason.trim()) {
      setErr('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await apiJsonBody('PUT', `/api/dashboard/director/leaves/${encodeURIComponent(id)}/reject`, { reason: rejectReason });
      setRejectModal(null);
      setRejectReason('');
      await loadPendingApprovals();
      setErr('');
    } catch (ex) {
      setErr(ex.message);
    }
  }

  // Cancel/Hủy đơn
  async function cancel(id) {
    if (!window.confirm('Bạn có chắc muốn hủy đơn này?')) return;
    try {
      await apiJson(`/api/dashboard/employee/leaves/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  // Reset page when filter/sort/pageSize changes
  useEffect(() => {
    setPage(1);
  }, [filterStatus, sortBy, pageSize]);

  const canCancel = (status) => {
    const s = String(status).toUpperCase();
    return ['CHO_QL_DUYET', 'CHO_HR_XAC_NHAN', 'CHO_DUYET'].includes(s);
  };

  return (
    <EmployeeChrome
      title="Đơn Phép"
      subtitle="Gửi đơn nghỉ và theo dõi trạng thái duyệt."
      showSubnav={true}
    >
      {/* Manager Approval Section */}
      {pendingApprovals.length > 0 && (
        <div className="emp-leave-approval-section">
          <div className="emp-leave-section-header" style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: 0, color: 'var(--pri)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-clipboard-check" />
              Đơn chờ bạn duyệt ({pendingApprovals.length})
            </h4>
            <button className="emp-leave-link" onClick={loadPendingApprovals}>
              <i className="fa-solid fa-rotate" /> Làm mới
            </button>
          </div>
          
          <div className="emp-leave-table-container" style={{ marginBottom: '24px' }}>
            <table className="emp-leave-table">
              <thead>
                <tr style={{ background: '#fff7ed' }}>
                  <th>NHÂN VIÊN</th>
                  <th>LOẠI PHÉP</th>
                  <th>TỪ NGÀY</th>
                  <th>ĐẾN NGÀY</th>
                  <th>NGÀY PHÉP</th>
                  <th>LÝ DO</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {loadingApprovals ? (
                  <tr>
                    <td colSpan={7} className="emp-leave-loading">
                      <i className="fa-solid fa-spinner fa-spin" /> Đang tải...
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map((r) => {
                    const soNgay = daysBetween(r.tuNgay, r.denNgay);
                    return (
                      <tr key={r.id} style={{ background: '#fff' }}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 500 }}>{r.hoTenNhanVien}</span>
                            <span style={{ fontSize: '12px', color: 'var(--txt2)' }}>{r.maNhanVien}</span>
                          </div>
                        </td>
                        <td>{loaiPhepLabel(r.loaiNghi)}</td>
                        <td>{formatDate(r.tuNgay)}</td>
                        <td>{formatDate(r.denNgay)}</td>
                        <td>{soNgay} ngày</td>
                        <td style={{ maxWidth: '200px', fontSize: '13px' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {r.lyDo || '—'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => approveLeave(r.id)}
                              style={{
                                background: '#dcfce7',
                                color: '#15803d',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <i className="fa-solid fa-check" /> Duyệt
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectModal(r)}
                              style={{
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <i className="fa-solid fa-times" /> Từ chối
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
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="emp-leave-modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="emp-leave-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-leave-modal-header">
              <h3>Từ chối đơn nghỉ phép</h3>
              <button type="button" className="emp-leave-modal-close" onClick={() => setRejectModal(null)}>
                <i className="fa-solid fa-times" />
              </button>
            </div>
            <div style={{ padding: '16px 0' }}>
              <p style={{ marginBottom: '12px', fontSize: '14px' }}>
                <strong>Nhân viên:</strong> {rejectModal.hoTenNhanVien} ({rejectModal.maNhanVien})
              </p>
              <p style={{ marginBottom: '12px', fontSize: '14px' }}>
                <strong>Loại phép:</strong> {loaiPhepLabel(rejectModal.loaiNghi)} ({formatDate(rejectModal.tuNgay)} - {formatDate(rejectModal.denNgay)})
              </p>
              <div className="emp-leave-form-field">
                <label>Lý do từ chối *</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối đơn nghỉ phép"
                />
              </div>
            </div>
            <div className="emp-leave-form-actions">
              <button type="button" className="emp-leave-btn-secondary" onClick={() => setRejectModal(null)}>
                Hủy
              </button>
              <button
                type="button"
                className="emp-leave-btn-danger"
                onClick={() => rejectLeave(rejectModal.id)}
                style={{ background: '#dc2626', color: '#fff' }}
              >
                <i className="fa-solid fa-times" /> Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="emp-leave-stats">
        <div className="emp-leave-stat-card">
          <div className="emp-leave-stat-label">CHỜ DUYỆT</div>
          <div className="emp-leave-stat-value">{computedStats.choDuyet}</div>
        </div>
        <div className="emp-leave-stat-card">
          <div className="emp-leave-stat-label">ĐÃ PHÊ DUYỆT</div>
          <div className="emp-leave-stat-value emp-leave-stat-value--success">{computedStats.daDuyet}</div>
        </div>
        <div className="emp-leave-stat-card">
          <div className="emp-leave-stat-label">BỊ TỪ CHỐI</div>
          <div className="emp-leave-stat-value emp-leave-stat-value--danger">{computedStats.tuChoi}</div>
        </div>
        <div className="emp-leave-stat-card">
          <div className="emp-leave-stat-label">NGÀY PHÉP CÒN LẠI</div>
          <div className="emp-leave-stat-value emp-leave-stat-value--info">{computedStats.phepConLai} ngày</div>
        </div>
      </div>

      {/* Create Button */}
      <div className="emp-leave-toolbar">
        <button
          type="button"
          className="emp-leave-btn-primary"
          onClick={() => setShowForm(true)}
        >
          <i className="fa-solid fa-plus" /> Tạo Đơn Phép Mới
        </button>
      </div>

      {/* Error */}
      {err && <div className="emp-leave-alert emp-leave-alert--error">{err}</div>}

      {/* Create Form Modal */}
      {showForm && (
        <div className="emp-leave-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="emp-leave-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-leave-modal-header">
              <h3>Gửi đơn nghỉ phép mới</h3>
              <button type="button" className="emp-leave-modal-close" onClick={() => setShowForm(false)}>
                <i className="fa-solid fa-times" />
              </button>
            </div>
            <form onSubmit={submit} className="emp-leave-form">
              <div className="emp-leave-form-row">
                <div className="emp-leave-form-field">
                  <label>Loại phép</label>
                  <select
                    value={form.loaiNghi}
                    onChange={(e) => setForm({ ...form, loaiNghi: e.target.value })}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="emp-leave-form-field">
                  <label>Từ ngày *</label>
                  <input
                    type="date"
                    required
                    value={form.tuNgay}
                    onChange={(e) => setForm({ ...form, tuNgay: e.target.value })}
                  />
                </div>
              </div>
              <div className="emp-leave-form-row">
                <div className="emp-leave-form-field">
                  <label>Đến ngày *</label>
                  <input
                    type="date"
                    required
                    value={form.denNgay}
                    onChange={(e) => setForm({ ...form, denNgay: e.target.value })}
                  />
                </div>
                <div className="emp-leave-form-field">
                  <label>Số ngày</label>
                  <input
                    type="text"
                    readOnly
                    value={daysBetween(form.tuNgay, form.denNgay) > 0 ? `${daysBetween(form.tuNgay, form.denNgay)} ngày` : ''}
                  />
                </div>
              </div>
              <div className="emp-leave-form-field emp-leave-form-field--full">
                <label>Lý do</label>
                <textarea
                  rows={3}
                  value={form.lyDo}
                  onChange={(e) => setForm({ ...form, lyDo: e.target.value })}
                  placeholder="Nhập lý do nghỉ phép (không bắt buộc)"
                />
              </div>
              <div className="emp-leave-form-actions">
                <button type="button" className="emp-leave-btn-secondary" onClick={() => setShowForm(false)}>
                  Hủy
                </button>
                <button type="submit" className="emp-leave-btn-primary" disabled={submitting}>
                  {submitting ? 'Đang gửi...' : 'Gửi đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pending Manager Approval Section (if any) */}
      {rows.some(r => String(r.trangThai).toUpperCase() === 'CHO_QL_DUYET') && (
        <div className="emp-leave-section">
          <div className="emp-leave-section-header">
            <h4>Đơn chờ quản lý duyệt</h4>
            <button className="emp-leave-link" onClick={() => setFilterStatus('CHO_QL_DUYET')}>
              Làm mới
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="emp-leave-filters">
        <div className="emp-leave-filter-group">
          <label>Trạng thái</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="emp-leave-filter-group">
          <label>Sắp xếp</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="emp-leave-filter-group">
          <label>/ trang</label>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {PAGE_SIZE_OPTIONS.map((sz) => (
              <option key={sz} value={sz}>{sz}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="emp-leave-table-container">
        <table className="emp-leave-table">
          <thead>
            <tr>
              <th>LOẠI PHÉP</th>
              <th>TỪ NGÀY</th>
              <th>ĐẾN NGÀY</th>
              <th>NGÀY PHÉP</th>
              <th>TRẠNG THÁI</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="emp-leave-loading">
                  <i className="fa-solid fa-spinner fa-spin" /> Đang tải...
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="emp-leave-empty-row">
                  <i className="fa-solid fa-inbox" />
                  <p>Không có đơn nghỉ phép nào</p>
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => {
                const badge = statusBadge(r.trangThai);
                const soNgay = daysBetween(r.tuNgay, r.denNgay);
                return (
                  <tr key={r.id}>
                    <td>{loaiPhepLabel(r.loaiNghi)}</td>
                    <td>{formatDate(r.tuNgay)}</td>
                    <td>{formatDate(r.denNgay)}</td>
                    <td>{soNgay} ngày</td>
                    <td>
                      <span className={`emp-leave-badge ${badge.class}`}>
                        <i className={`fa-solid ${badge.icon}`} /> {badge.label}
                      </span>
                    </td>
                    <td>
                      <div className="emp-leave-actions">
                        <button
                          type="button"
                          className="emp-leave-btn-view"
                          onClick={() => alert(`Chi tiết đơn:\nLoại: ${loaiPhepLabel(r.loaiNghi)}\nTừ: ${formatDate(r.tuNgay)}\nĐến: ${formatDate(r.denNgay)}\nLý do: ${r.lyDo || 'Không có'}\nTrạng thái: ${badge.label}`)}
                        >
                          Xem
                        </button>
                        {canCancel(r.trangThai) && (
                          <button
                            type="button"
                            className="emp-leave-btn-cancel"
                            onClick={() => cancel(r.id)}
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="emp-leave-pagination">
        <div className="emp-leave-page-info">
          Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, processedRows.length)} / {processedRows.length}
        </div>
        <div className="emp-leave-page-controls">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            ← Trước
          </button>
          <span className="emp-leave-current-page">Trang {page}/{totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Sau →
          </button>
        </div>
      </div>
    </EmployeeChrome>
  );
}
