import { useEffect, useMemo, useState } from 'react';
import { apiJson, apiJsonBody } from '../../api/client.js';
import HrChrome from '../../components/hr/HrChrome.jsx';

// ─── Components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const styles = {
    DAT: { background: '#dcfce7', color: '#166534' },
    DA_TIEP_NHAN: { background: '#dcfce7', color: '#166534' },
    LOAI: { background: '#fee2e2', color: '#991b1b' },
    TU_CHOI: { background: '#fee2e2', color: '#991b1b' },
    CHO_DUYET: { background: '#fef3c7', color: '#92400e' },
    TRUNG_TUYEN: { background: '#dbeafe', color: '#1e40af' },
  };
  const labels = {
    DAT: 'Đạt',
    DA_TIEP_NHAN: 'Đạt',
    LOAI: 'Loại',
    TU_CHOI: 'Từ chối',
    CHO_DUYET: 'Chờ duyệt',
    TRUNG_TUYEN: 'Trúng tuyển',
  };
  const style = styles[status] || { background: '#f3f4f6', color: '#374151' };
  const label = labels[status] || status;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      borderRadius: '9999px',
      fontSize: '11px',
      fontWeight: 500,
      ...style
    }}>
      {label}
    </span>
  );
}

function TruncateCell({ text, maxWidth = '100%' }) {
  const displayText = text || '—';
  return (
    <div
      style={{
        maxWidth,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={displayText}
    >
      {displayText}
    </div>
  );
}

function ActionButton({ icon, color, onClick, title }) {
  const colorStyles = {
    blue: { color: '#2563eb', hoverBg: '#eff6ff' },
    red: { color: '#dc2626', hoverBg: '#fef2f2' },
  };
  const c = colorStyles[color] || colorStyles.blue;
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '6px',
        borderRadius: '6px',
        border: 'none',
        background: isHovered ? c.hoverBg : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <i className={`fa-solid ${icon}`} style={{ color: c.color, fontSize: '14px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
    </button>
  );
}

function CandidateStatusBadge({ status }) {
  const styles = {
    DAT: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
    LOAI: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
    CHO_DUYET: { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
    TRUNG_TUYEN: { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
  };
  const labels = {
    DAT: 'Đạt',
    LOAI: 'Loại',
    CHO_DUYET: 'Chờ duyệt',
    TRUNG_TUYEN: 'Trúng tuyển',
  };
  const style = styles[status] || { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
  const label = labels[status] || status;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '9999px',
      fontSize: '10px',
      fontWeight: 600,
      ...style
    }}>
      {label}
    </span>
  );
}

function CandidateActionBtn({ icon, text, color, onClick, title }) {
  const colorStyles = {
    blue: { bg: '#3b82f6', hoverBg: '#2563eb', text: '#fff' },
    emerald: { bg: '#10b981', hoverBg: '#059669', text: '#fff' },
    green: { bg: '#22c55e', hoverBg: '#16a34a', text: '#fff' },
    red: { bg: '#ef4444', hoverBg: '#dc2626', text: '#fff' },
    rose: { bg: '#f43f5e', hoverBg: '#e11d48', text: '#fff' },
    purple: { bg: '#8b5cf6', hoverBg: '#7c3aed', text: '#fff' },
  };
  const c = colorStyles[color] || colorStyles.blue;
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: icon ? '4px 6px' : '3px 8px',
        borderRadius: '4px',
        border: 'none',
        background: isHovered ? c.hoverBg : c.bg,
        color: c.text,
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: icon ? '11px' : '10px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <i className={`fa-solid ${icon}`} style={{ fontSize: '11px' }} />}
      {text && <span>{text}</span>}
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────
const BASE = '/api/dashboard/hr/recruitment';

const CANDIDATE_STATUS = {
  CHO_DUYET: { label: 'Chờ duyệt', cls: 'hr-st-warn' },
  DAT: { label: 'Đạt', cls: 'hr-st-ok' },
  LOAI: { label: 'Loại', cls: 'hr-st-err' },
  TRUNG_TUYEN: { label: 'Trúng tuyển', cls: 'hr-st-ok' },
};

function stBadge(map, val) {
  const s = map[val] || { label: val, cls: 'hr-st-muted' };
  return <span className={`hr-st-badge ${s.cls}`}>{s.label}</span>;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN');
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN');
}

// ─── Empty state ──────────────────────────────────────────────────────────
function EmptyRow({ cols, text }) {
  return (
    <tr>
      <td colSpan={cols}>
        <div className="hr-empty">
          <i className="fa-solid fa-inbox" />
          <p>{text}</p>
        </div>
      </td>
    </tr>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────
function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  
  const pages = [];
  for (let i = 1; i <= total; i++) {
    pages.push(i);
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      gap: '4px',
      padding: '16px',
      borderTop: '1px solid #e2e8f0'
    }}>
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        style={{
          padding: '6px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          background: current === 1 ? '#f3f4f6' : '#ffffff',
          color: current === 1 ? '#9ca3af' : '#374151',
          cursor: current === 1 ? 'not-allowed' : 'pointer',
          fontSize: '13px',
        }}
      >
        <i className="fa-solid fa-chevron-left" />
      </button>
      
      {pages.map(page => (
        <button
          key={page}
          type="button"
          onClick={() => onChange(page)}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: current === page ? '#3b82f6' : '#ffffff',
            color: current === page ? '#ffffff' : '#374151',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: current === page ? 600 : 400,
          }}
        >
          {page}
        </button>
      ))}
      
      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        style={{
          padding: '6px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          background: current === total ? '#f3f4f6' : '#ffffff',
          color: current === total ? '#9ca3af' : '#374151',
          cursor: current === total ? 'not-allowed' : 'pointer',
          fontSize: '13px',
        }}
      >
        <i className="fa-solid fa-chevron-right" />
      </button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '28px 32px',
        minWidth: '420px',
        maxWidth: '600px',
        width: '95%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,.3)',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>{title}</h3>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'candidates', label: 'Ứng viên', icon: 'fa-solid fa-user-group' },
  { id: 'interviews', label: 'Lịch phỏng vấn', icon: 'fa-solid fa-calendar-check' },
];

// ══════════════════════════════════════════════════════════════════════════
export default function HrRecruitment() {
  const [tab, setTab] = useState('candidates');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [sortOrder, setSortOrder] = useState('asc');
  const [err, setErr] = useState('');

  // Pagination states (10 items per page)
  const [candPage, setCandPage] = useState(1);
  const [ivPage, setIvPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Data
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);

  // Sorted interviews based on sortOrder
  const sortedInterviews = useMemo(() => {
    return [...interviews].sort((a, b) => {
      const timeA = new Date(a.thoiGian || 0).getTime();
      const timeB = new Date(b.thoiGian || 0).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [interviews, sortOrder]);

  // Modal states
  const [modal, setModal] = useState(null); // null | 'newCandidate' | 'editCandidate' | 'newInterview' | 'candidateDetail'
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);

  const monthOptions = useMemo(() => {
    const out = [{ value: '', label: '— Tất cả —' }];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      out.push({ value: val, label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}` });
    }
    return out;
  }, []);

  // ── Loaders ──────────────────────────────────────────────────────────────
  async function loadCandidates() {
    const data = await apiJson(`${BASE}/candidates?month=${encodeURIComponent(month)}`);
    setCandidates(Array.isArray(data) ? data : []);
  }
  async function loadInterviews() {
    const data = await apiJson(`${BASE}/interviews`);
    setInterviews(Array.isArray(data) ? data : []);
  }

  async function loadAll() {
    setErr('');
    await Promise.all([loadCandidates(), loadInterviews()]);
  }

  useEffect(() => {
    (async () => {
      try { await loadAll(); } catch (e) { setErr(e.message); }
    })();
  }, [month]);

  // Reset pagination when month changes
  useEffect(() => {
    setCandPage(1);
    setIvPage(1);
  }, [month]);

  // ── Candidate actions ─────────────────────────────────────────────────────
  async function saveCandidate(body, id) {
    if (id) await apiJsonBody('PUT', `${BASE}/candidates/${id}`, body);
    else await apiJsonBody('POST', `${BASE}/candidates`, body);
    await loadCandidates();
    setModal(null);
  }

  async function deleteCandidate(id) {
    if (!window.confirm('Xóa hồ sơ ứng viên này?')) return;
    try {
      await apiJson(`${BASE}/candidates/${id}`, { method: 'DELETE' });
      await loadCandidates();
    } catch (e) { setErr(e.message); }
  }

  async function onboard(id, name) {
    if (!window.confirm(`Onboard "${name}" thành nhân viên chính thức?`)) return;
    try {
      const result = await apiJsonBody('POST', `${BASE}/candidates/${id}/onboard`, {});
      alert(result.message || 'Onboard thành công!');
      await loadAll();
    } catch (e) { setErr(e.message); }
  }

  async function updateCandidateStatus(id, status) {
    const statusLabels = { DAT: 'Đạt', LOAI: 'Loại', CHO_DUYET: 'Chờ duyệt', TRUNG_TUYEN: 'Trúng tuyển' };
    if (!window.confirm(`Đánh dấu ứng viên này là "${statusLabels[status]}"?`)) return;
    try {
      await apiJsonBody('PUT', `${BASE}/candidates/${id}`, { trangThai: status });
      await loadCandidates();
    } catch (e) { setErr(e.message); }
  }

  async function viewCandidateDetail(id) {
    try {
      const data = await apiJson(`${BASE}/candidates/${id}`);
      setDetail(data);
      setModal('candidateDetail');
    } catch (e) { setErr(e.message); }
  }

  // ── Interview actions ─────────────────────────────────────────────────────
  async function saveInterview(body, id) {
    if (id) await apiJsonBody('PUT', `${BASE}/interviews/${id}`, body);
    else await apiJsonBody('POST', `${BASE}/interviews`, body);
    await loadInterviews();
    setModal(null);
  }

  async function deleteInterview(id) {
    if (!window.confirm('Xóa lịch phỏng vấn này?')) return;
    try {
      await apiJson(`${BASE}/interviews/${id}`, { method: 'DELETE' });
      await loadInterviews();
    } catch (e) { setErr(e.message); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <HrChrome
      iconClass="fa-solid fa-handshake"
      title="Tuyển dụng"
      subtitle="Quản lý yêu cầu tuyển dụng, hồ sơ ứng viên và lịch phỏng vấn."
    >
      {err && <p className="err" style={{ marginBottom: 12 }}>{err}</p>}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, padding: '0 0 16px 0', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={tab === t.id ? 'hr-btn-pri hr-btn-ok' : 'dash-btn secondary'}
            style={{ gap: 6, display: 'flex', alignItems: 'center' }}
          >
            <i className={t.icon} aria-hidden />
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <label htmlFor="rec-sort" style={{ whiteSpace: 'nowrap', fontSize: '0.88rem', color: 'var(--text-muted)' }}>Sắp xếp:</label>
          <select
            id="rec-sort"
            className="hr-filter-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{ minWidth: '140px' }}
          >
            <option value="asc">Thời gian ↑</option>
            <option value="desc">Thời gian ↓</option>
          </select>
          <label htmlFor="rec-month" style={{ whiteSpace: 'nowrap', fontSize: '0.88rem', color: 'var(--text-muted)' }}>Tháng:</label>
          <select
            id="rec-month"
            className="hr-filter-select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {monthOptions.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Tab: Ứng viên ── */}
      {tab === 'candidates' && (
        <div className="hr-card">
          <div className="hr-card-hd" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div className="hr-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fa-solid fa-user-group" style={{ color: 'var(--inf)' }} aria-hidden />
              Danh sách ứng viên
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
              <label htmlFor="cand-month" style={{ whiteSpace: 'nowrap', fontSize: '0.88rem', color: 'var(--text-muted)' }}>Tháng nộp hồ sơ:</label>
              <select
                id="cand-month"
                className="hr-filter-select"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {monthOptions.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                type="button"
                className="hr-btn-pri hr-btn-ok"
                style={{ gap: 6, display: 'flex', alignItems: 'center' }}
                onClick={() => { setEditing(null); setModal('newCandidate'); }}
              >
                <i className="fa-solid fa-user-plus" aria-hidden />
                Thêm ứng viên
              </button>
            </div>
          </div>
          <div className="dash-table-wrap" style={{ border: 'none', boxShadow: 'none', padding: '0 16px 16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <colgroup>
                <col style={{ width: '4%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'center', padding: '10px 6px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>STT</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Họ tên</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>SĐT</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Vị trí</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Phòng ban</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>CV</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Ngày nộp</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Trạng thái</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {candidates.length === 0
                  ? <EmptyRow cols={10} text="Chưa có hồ sơ ứng viên" />
                  : candidates.slice((candPage - 1) * ITEMS_PER_PAGE, candPage * ITEMS_PER_PAGE).map((c, idx) => (
                    <tr
                      key={c.id}
                      style={{
                        background: ((candPage - 1) * ITEMS_PER_PAGE + idx) % 2 === 0 ? '#ffffff' : '#f8fafc',
                        transition: 'background 0.15s',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fff7ed'}
                      onMouseLeave={(e) => e.currentTarget.style.background = ((candPage - 1) * ITEMS_PER_PAGE + idx) % 2 === 0 ? '#ffffff' : '#f8fafc'}
                    >
                      <td style={{ textAlign: 'center', padding: '8px 6px', color: '#64748b', fontWeight: 500 }}>{(candPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                      <td style={{ padding: '8px', fontWeight: 600, color: '#1e293b' }}>{c.hoTen}</td>
                      <td style={{ padding: '8px', color: '#475569', fontSize: '12px' }}>{c.email}</td>
                      <td style={{ padding: '8px', color: '#475569', fontSize: '12px' }}>{c.soDienThoai || '—'}</td>
                      <td style={{ padding: '8px', color: '#475569' }}>{c.viTri || '—'}</td>
                      <td style={{ padding: '8px', color: '#475569' }}>{c.tenPhongBan || c.phongBan || '—'}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        {c.cvUrl ? (
                          <a
                            href={c.cvUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              background: '#3b82f6',
                              color: '#fff',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 500,
                              textDecoration: 'none',
                            }}
                          >
                            <i className="fa-solid fa-file-lines" style={{ fontSize: '10px' }} />
                            Mở CV
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px', color: '#475569', fontSize: '12px' }}>{fmtDate(c.ngayNop)}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <CandidateStatusBadge status={c.trangThai} />
                      </td>
                      <td style={{ padding: '6px 4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', flexWrap: 'nowrap' }}>
                          <CandidateActionBtn icon="fa-eye" color="blue" title="Chi tiết" onClick={() => viewCandidateDetail(c.id)} />
                          <CandidateActionBtn text="Đạt" color="green" title="Đánh dấu đạt" onClick={() => updateCandidateStatus(c.id, 'DAT')} />
                          <CandidateActionBtn text="Loại" color="red" title="Đánh dấu loại" onClick={() => updateCandidateStatus(c.id, 'LOAI')} />
                          {c.trangThai === 'DAT' && (
                            <CandidateActionBtn text="Onboard" color="purple" title="Onboard nhân viên" onClick={() => onboard(c.id, c.hoTen)} />
                          )}
                          <CandidateActionBtn icon="fa-trash" color="rose" title="Xóa" onClick={() => deleteCandidate(c.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {candidates.length > 0 && (
            <Pagination
              current={candPage}
              total={Math.ceil(candidates.length / ITEMS_PER_PAGE)}
              onChange={setCandPage}
            />
          )}
        </div>
      )}

      {/* ── Tab: Lịch phỏng vấn ── */}
      {tab === 'interviews' && (
        <div className="hr-card">
          <div className="hr-card-hd">
            <div className="hr-card-title">
              <i className="fa-solid fa-calendar-check" style={{ color: 'var(--ok)' }} aria-hidden />
              Lịch phỏng vấn
            </div>
            <button
              type="button"
              className="hr-btn-pri hr-btn-ok"
              style={{ gap: 6, display: 'flex', alignItems: 'center' }}
              onClick={() => { setEditing(null); setModal('newInterview'); }}
            >
              <i className="fa-solid fa-plus" aria-hidden />
              Đặt lịch
            </button>
          </div>
          <div className="dash-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <colgroup>
                <col style={{ width: '16%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '7%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ứng viên</th>
                  <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vị trí</th>
                  <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thời gian</th>
                  <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Địa điểm</th>
                  <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Người PV</th>
                  <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ghi chú</th>
                  <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái UV</th>
                  <th style={{ textAlign: 'center', padding: '12px 10px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sortedInterviews.length === 0
                  ? <EmptyRow cols={8} text="Chưa có lịch phỏng vấn" />
                  : sortedInterviews.slice((ivPage - 1) * ITEMS_PER_PAGE, ivPage * ITEMS_PER_PAGE).map((iv, idx) => (
                    <tr
                      key={iv.id}
                      style={{
                        background: ((ivPage - 1) * ITEMS_PER_PAGE + idx) % 2 === 0 ? '#ffffff' : '#f8fafc',
                        transition: 'background 0.15s',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fff7ed'}
                      onMouseLeave={(e) => e.currentTarget.style.background = ((ivPage - 1) * ITEMS_PER_PAGE + idx) % 2 === 0 ? '#ffffff' : '#f8fafc'}
                    >
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{iv.tenUngVien || '—'}</span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>{iv.viTriUngTuyen || '—'}</td>
                      <td style={{ padding: '8px 10px', color: '#475569', fontSize: '13px' }}>{fmtDateTime(iv.thoiGian)}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <TruncateCell text={iv.diaDiem} maxWidth="120px" />
                      </td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>{iv.nguoiPhongVan || '—'}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <TruncateCell text={iv.ghiChu} maxWidth="140px" />
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <StatusBadge status={iv.trangThaiUngVien || 'CHO_DUYET'} />
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          <ActionButton
                            icon="fa-pen"
                            color="blue"
                            title="Sửa"
                            onClick={() => { setEditing(iv); setModal('editInterview'); }}
                          />
                          <ActionButton
                            icon="fa-trash"
                            color="red"
                            title="Xóa"
                            onClick={() => deleteInterview(iv.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {sortedInterviews.length > 0 && (
            <Pagination
              current={ivPage}
              total={Math.ceil(sortedInterviews.length / ITEMS_PER_PAGE)}
              onChange={setIvPage}
            />
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {(modal === 'newCandidate' || modal === 'editCandidate') && (
        <CandidateModal
          initial={editing}
          onSave={(b) => saveCandidate(b, editing?.id)}
          onClose={() => setModal(null)}
        />
      )}

      {(modal === 'newInterview' || modal === 'editInterview') && (
        <InterviewModal
          initial={editing}
          candidates={candidates}
          onSave={(b) => saveInterview(b, editing?.id)}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'candidateDetail' && detail && (
        <CandidateDetailModal
          data={detail}
          onClose={() => { setModal(null); setDetail(null); }}
        />
      )}
    </HrChrome>
  );
}

// ─── Form Modals ───────────────────────────────────────────────────────────

function CandidateModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    hoTen: initial?.hoTen || '',
    email: initial?.email || '',
    soDienThoai: initial?.soDienThoai || '',
    cvUrl: initial?.cvUrl || '',
    trangThai: initial?.trangThai || 'CHO_DUYET',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={initial ? 'Sửa hồ sơ ứng viên' : 'Thêm ứng viên'} onClose={onClose}>
      <form className="dash-form" onSubmit={handleSubmit}>
        {err && <p className="err">{err}</p>}
        <div className="field-grid">
          <label>
            Họ tên *
            <input value={form.hoTen} required
              onChange={(e) => setForm({ ...form, hoTen: e.target.value })} />
          </label>
          <label>
            Email *
            <input type="email" value={form.email} required
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label>
            Số điện thoại
            <input value={form.soDienThoai}
              onChange={(e) => setForm({ ...form, soDienThoai: e.target.value })} />
          </label>
          <label>
            Trạng thái
            <select value={form.trangThai}
              onChange={(e) => setForm({ ...form, trangThai: e.target.value })}>
              <option value="CHO_DUYET">Chờ duyệt</option>
              <option value="DAT">Đạt</option>
              <option value="LOAI">Loại</option>
              <option value="TRUNG_TUYEN">Trúng tuyển</option>
            </select>
          </label>
          <label className="field-full">
            Link CV
            <input value={form.cvUrl} placeholder="https://..."
              onChange={(e) => setForm({ ...form, cvUrl: e.target.value })} />
          </label>
        </div>
        <div className="dash-card-footer" style={{ padding: 0, marginTop: 16 }}>
          <button type="submit" className="hr-btn-pri hr-btn-ok" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button type="button" className="dash-btn secondary" onClick={onClose}>Hủy</button>
        </div>
      </form>
    </Modal>
  );
}

function InterviewModal({ initial, candidates, onSave, onClose }) {
  const [form, setForm] = useState({
    ungVien: initial?.ungVienId || '',
    thoiGian: initial?.thoiGian ? new Date(initial.thoiGian).toISOString().slice(0, 16) : '',
    diaDiem: initial?.diaDiem || '',
    nguoiPhongVan: initial?.nguoiPhongVan || '',
    ghiChu: initial?.ghiChu || '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); }
    catch (ex) { setErr(ex.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal title={initial ? 'Sửa lịch phỏng vấn' : 'Đặt lịch phỏng vấn'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {err && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
            {err}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Ứng viên *</span>
            <select
              value={form.ungVien}
              required
              onChange={(e) => setForm({ ...form, ungVien: e.target.value })}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#ffffff',
                color: '#1f2937',
              }}
            >
              <option value="">— Chọn ứng viên —</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>{c.hoTen} — {c.viTri || 'Chưa gán vị trí'}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Thời gian *</span>
            <input
              type="datetime-local"
              value={form.thoiGian}
              required
              onChange={(e) => setForm({ ...form, thoiGian: e.target.value })}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#ffffff',
                color: '#1f2937',
              }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Địa điểm</span>
            <input
              value={form.diaDiem}
              onChange={(e) => setForm({ ...form, diaDiem: e.target.value })}
              placeholder="Nhập địa điểm..."
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#ffffff',
                color: '#1f2937',
              }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Người phỏng vấn</span>
            <input
              value={form.nguoiPhongVan}
              onChange={(e) => setForm({ ...form, nguoiPhongVan: e.target.value })}
              placeholder="Nhập tên người phỏng vấn..."
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#ffffff',
                color: '#1f2937',
              }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Ghi chú</span>
            <textarea
              rows={2}
              value={form.ghiChu}
              onChange={(e) => setForm({ ...form, ghiChu: e.target.value })}
              placeholder="Nhập ghi chú..."
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#ffffff',
                color: '#1f2937',
                resize: 'vertical',
                minHeight: '60px',
              }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '10px 20px',
              background: saving ? '#9ca3af' : '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-check" />
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CandidateDetailModal({ data, onClose }) {
  return (
    <Modal title={`Hồ sơ: ${data.hoTen}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          ['Email', data.email],
          ['Điện thoại', data.soDienThoai || '—'],
          ['Vị trí ứng tuyển', data.viTri || '—'],
          ['Ngày nộp', data.ngayNop ? new Date(data.ngayNop).toLocaleDateString('vi-VN') : '—'],
          ['Trạng thái', data.trangThai],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 8 }}>
            <span style={{ minWidth: 140, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{k}:</span>
            <span>{v}</span>
          </div>
        ))}
        {data.cvUrl && (
          <div>
            <a href={data.cvUrl} target="_blank" rel="noreferrer" className="hr-btn-pri hr-btn-ok" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', textDecoration: 'none', padding: '6px 14px', borderRadius: 6, marginTop: 4 }}>
              <i className="fa-solid fa-file-arrow-down" /> Xem CV
            </a>
          </div>
        )}
        {data.lichPhongVan?.length > 0 && (
          <>
            <hr style={{ borderColor: 'var(--border)', margin: '8px 0' }} />
            <strong style={{ fontSize: '0.9rem' }}>Lịch phỏng vấn</strong>
            {data.lichPhongVan.map((iv) => (
              <div key={iv.id} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem' }}>
                <div><i className="fa-solid fa-clock" style={{ marginRight: 6, color: 'var(--inf)' }} />{iv.thoiGian ? new Date(iv.thoiGian).toLocaleString('vi-VN') : '—'}</div>
                <div><i className="fa-solid fa-location-dot" style={{ marginRight: 6, color: 'var(--hr)' }} />{iv.diaDiem || '—'}</div>
                {iv.nguoiPhongVan && <div><i className="fa-solid fa-user" style={{ marginRight: 6 }} />{iv.nguoiPhongVan}</div>}
                {iv.ghiChu && <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>{iv.ghiChu}</div>}
              </div>
            ))}
          </>
        )}
      </div>
    </Modal>
  );
}
