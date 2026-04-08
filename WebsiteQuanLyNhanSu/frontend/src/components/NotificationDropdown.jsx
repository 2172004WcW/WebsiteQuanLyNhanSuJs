import { useCallback, useEffect, useState } from 'react';
import { apiJson } from '../api/client.js';
import { isBroadcastNotif, notifId } from '../utils/notifications.js';

function formatTime(ngayTao) {
  if (ngayTao == null) return '';
  const s = String(ngayTao).replace('T', ' ');
  return s.length > 16 ? s.slice(0, 16) : s;
}

/**
 * Panel danh sách thông báo (dropdown) — phân loại chung / nội bộ, đọc từng tin, đọc hết.
 */
export default function NotificationDropdown({ open, listVersion, onUnreadSynced }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const loadList = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await apiJson('/api/notifications?limit=30');
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || 'Không tải được');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadList();
  }, [open, listVersion, loadList]);

  async function syncUnread() {
    try {
      const d = await apiJson('/api/notifications/unread-count');
      onUnreadSynced?.(d?.unread ?? 0);
    } catch {
      /* ignore */
    }
  }

  async function handleMarkAll(e) {
    e.stopPropagation();
    try {
      await apiJson('/api/notifications/read-all', { method: 'PUT' });
      setList((prev) => prev.map((x) => (isBroadcastNotif(x) ? x : { ...x, daDoc: true })));
      await syncUnread();
    } catch {
      /* ignore */
    }
  }

  function handleItemActivate(n) {
    if (isBroadcastNotif(n)) return;
    if (n.daDoc) return;
    const id = notifId(n);
    if (id == null) return;
    apiJson(`/api/notifications/${id}/read`, { method: 'PUT' })
      .then(() => {
        setList((prev) => prev.map((x) => (notifId(x) === id ? { ...x, daDoc: true } : x)));
        return syncUnread();
      })
      .catch(() => {});
  }

  if (!open) return null;

  return (
    <div className="notif-dropdown-panel" role="dialog" aria-label="Thông báo">
      <div className="notif-dropdown-hd">
        <span className="notif-dropdown-title">Thông báo</span>
        <button type="button" className="notif-mark-all" onClick={handleMarkAll}>
          Đánh dấu đã đọc (tin riêng)
        </button>
      </div>
      <div className="notif-dropdown-body">
        {loading && <div className="notif-item muted">Đang tải…</div>}
        {err && !loading && <div className="notif-item err">{err}</div>}
        {!loading && !err && list.length === 0 && (
          <div className="notif-item muted">Không có thông báo</div>
        )}
        {!loading &&
          !err &&
          list.map((n) => {
            const broadcast = isBroadcastNotif(n);
            const unread = !broadcast && !n.daDoc;
            return (
              <div
                key={String(notifId(n))}
                className={`notif-item${unread ? ' unread' : ''}${!broadcast ? ' clickable' : ''}`}
                onClick={() => handleItemActivate(n)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemActivate(n);
                  }
                }}
                role={broadcast ? undefined : 'button'}
                tabIndex={broadcast ? undefined : 0}
              >
                <div className="notif-item-title">
                  {n.tieuDe || 'Thông báo'}
                  {broadcast && (
                    <span className="notif-tag-chung" title="Thông báo chung">
                      chung
                    </span>
                  )}
                </div>
                {n.noiDung && <div className="notif-item-body">{n.noiDung}</div>}
                <div className="notif-item-meta">
                  <span>{n.loai || '—'}</span>
                  {formatTime(n.ngayTao) && <span> · {formatTime(n.ngayTao)}</span>}
                  {unread && <span className="notif-hint"> · Nhấn để đánh dấu đã đọc</span>}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
