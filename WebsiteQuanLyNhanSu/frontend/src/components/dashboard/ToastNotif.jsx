/**
 * ToastNotif.jsx — Pop-up thông báo realtime góc dưới-phải
 *
 * Props:
 *   toasts: Array<{ id, tieuDe, noiDung, loai }>
 *   onDismiss: (id) => void
 */
import { useEffect } from 'react';
import './ToastNotif.css';

export default function ToastNotif({ toasts = [], onDismiss }) {
  // Tự dismiss sau 4 giây
  useEffect(() => {
    if (!toasts.length) return;
    const latest = toasts[toasts.length - 1];
    const timer = setTimeout(() => onDismiss?.(latest.id), 4000);
    return () => clearTimeout(timer);
  }, [toasts, onDismiss]);

  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${(t.loai || 'info').toLowerCase()}`}>
          <div className="toast-icon">
            <i className="fas fa-bell" />
          </div>
          <div className="toast-body">
            <p className="toast-title">{t.tieuDe}</p>
            {t.noiDung && <p className="toast-msg">{t.noiDung}</p>}
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => onDismiss?.(t.id)}
            aria-label="Đóng"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      ))}
    </div>
  );
}
