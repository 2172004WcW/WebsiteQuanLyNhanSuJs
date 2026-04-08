import { useEffect, useState, useCallback, useMemo } from 'react';
import { apiJson } from '../../api/client.js';
import AdminChrome from '../../components/admin/AdminChrome.jsx';

// Parse User-Agent to "Browser — OS" format
function parseUserAgent(ua) {
  if (!ua) return '—';
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows NT')) os = 'Windows';
  else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  // Detect Browser (priority order)
  let browser = 'Unknown';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Opera/') || ua.includes('OPR/')) browser = 'Opera';
  
  // Detect bots
  if (ua.toLowerCase().includes('bot') || ua.toLowerCase().includes('crawler')) {
    return 'Bot / Unknown';
  }
  
  return `${browser} — ${os}`;
}

// Format time: "15:01 — 06/04/2026"
function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${time} — ${date}`;
}

// Status Badge component
function StatusBadge({ success }) {
  return (
    <span className={`status-badge ${success ? 'status-badge-success' : 'status-badge-fail'}`}>
      {success ? 'Thành công' : 'Thất bại'}
    </span>
  );
}

export default function AdminLoginLogs() {
  const [allRows, setAllRows] = useState([]);
  const [err, setErr] = useState('');
  
  // Filter states
  const [usernameFilter, setUsernameFilter] = useState('');
  const [resultFilter, setResultFilter] = useState(''); // '' | 'true' | 'false'
  const [dateFilter, setDateFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch data
  useEffect(() => {
    (async () => {
      try {
        setErr('');
        const data = await apiJson('/api/dashboard/admin/login-logs?limit=300');
        setAllRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  // Filter logic (client-side)
  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      // Username filter
      if (usernameFilter && !r.username?.toLowerCase().includes(usernameFilter.toLowerCase())) {
        return false;
      }
      // Result filter
      if (resultFilter !== '') {
        const isSuccess = r.thanhCong === true;
        if (resultFilter === 'true' && !isSuccess) return false;
        if (resultFilter === 'false' && isSuccess) return false;
      }
      // Date filter
      if (dateFilter && r.thoiGian) {
        const rowDate = new Date(r.thoiGian).toISOString().split('T')[0];
        if (rowDate !== dateFilter) return false;
      }
      return true;
    });
  }, [allRows, usernameFilter, resultFilter, dateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [usernameFilter, resultFilter, dateFilter]);

  const hasActiveFilters = usernameFilter || resultFilter || dateFilter;

  function clearFilters() {
    setUsernameFilter('');
    setResultFilter('');
    setDateFilter('');
    setPage(1);
  }

  return (
    <AdminChrome
      iconClass="fa-solid fa-clipboard-list"
      title="Nhật ký đăng nhập"
      subtitle="Ghi nhận mỗi lần đăng nhập (thành công & thất bại)."
    >
      {err && (
        <div className="err" style={{ marginBottom: '16px' }}>
          {err}
        </div>
      )}

      {/* Filter Bar */}
      <div className="dash-card" style={{ marginBottom: '16px', padding: '16px 20px' }}>
        <div className="admin-logs-filter">
          <input
            type="text"
            placeholder="Tìm username..."
            value={usernameFilter}
            onChange={(e) => setUsernameFilter(e.target.value)}
          />
          <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)}>
            <option value="">Tất cả kết quả</option>
            <option value="true">Thành công</option>
            <option value="false">Thất bại</option>
          </select>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="admin-logs-clear">
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="dash-card admin-logs-card">
        <div className="dash-table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table className="dash-table admin-logs-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Username</th>
                <th>IP</th>
                <th>Trình duyệt</th>
                <th>Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((r, idx) => (
                <tr
                  key={r.id || idx}
                  className={!r.thanhCong ? 'admin-logs-row-fail' : ''}
                  style={{ background: idx % 2 === 1 && r.thanhCong ? '#f9fafb' : undefined }}
                >
                  <td>{formatTime(r.thoiGian)}</td>
                  <td>{r.username}</td>
                  <td style={{ color: 'var(--txt2)' }}>{r.ip || '—'}</td>
                  <td style={{ color: 'var(--txt2)' }}>
                    <span title={r.userAgent || ''} className="admin-logs-help">
                      {parseUserAgent(r.userAgent)}
                    </span>
                  </td>
                  <td>
                    <StatusBadge success={r.thanhCong} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="admin-logs-pagination">
          <span className="admin-logs-page-info">
            Trang {page} / {totalPages} ({filteredRows.length} bản ghi)
          </span>
          <div className="admin-logs-page-buttons">
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

      {!filteredRows.length && !err && (
        <p className="admin-logs-empty">
          {hasActiveFilters ? 'Không có bản ghi phù hợp với bộ lọc.' : 'Chưa có bản ghi (đăng nhập để tạo log).'}
        </p>
      )}
    </AdminChrome>
  );
}
