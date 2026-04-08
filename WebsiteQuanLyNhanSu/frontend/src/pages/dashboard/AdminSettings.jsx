import { useState } from 'react';
import AdminChrome from '../../components/admin/AdminChrome.jsx';
import { apiJson } from '../../api/client.js';

export default function AdminSettings() {
  const [bcTitle, setBcTitle] = useState('');
  const [bcBody, setBcBody] = useState('');
  const [bcMsg, setBcMsg] = useState('');
  const [bcBusy, setBcBusy] = useState(false);

  async function sendBroadcast(e) {
    e.preventDefault();
    setBcMsg('');
    setBcBusy(true);
    try {
      const title = bcTitle.trim() || 'Thông báo hệ thống';
      const content = bcBody.trim();
      await apiJson('/api/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      });
      setBcMsg('Đã gửi thông báo chung — mọi user đang mở dashboard sẽ nhận realtime.');
      setBcBody('');
    } catch (err) {
      setBcMsg(err.message || 'Gửi thất bại');
    } finally {
      setBcBusy(false);
    }
  }

  return (
    <AdminChrome
      iconClass="fa-solid fa-gear"
      title="Cấu hình hệ thống"
      subtitle="SMTP, MongoDB, JWT trong backend/.env. Admin có thể phát thông báo chung (broadcast)."
    >
      <div className="adm-card" style={{ marginBottom: 16 }}>
        <h3 className="adm-card-title" style={{ marginTop: 0 }}>
          <i className="fa-solid fa-bullhorn" style={{ color: 'var(--adm)', marginRight: 8 }} aria-hidden />
          Thông báo chung (broadcast)
        </h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--txt2)', lineHeight: 1.55 }}>
          Lưu vào DB (<code>nguoiNhan</code> trống) và đẩy qua Socket.io tới mọi client đang kết nối. Tin riêng vẫn chỉ
          tới từng user.
        </p>
        <form onSubmit={sendBroadcast} style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            placeholder="Tiêu đề"
            value={bcTitle}
            onChange={(e) => setBcTitle(e.target.value)}
            autoComplete="off"
            style={{
              padding: '9px 12px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontFamily: 'inherit',
              fontSize: 14,
            }}
          />
          <textarea
            rows={3}
            placeholder="Nội dung"
            value={bcBody}
            onChange={(e) => setBcBody(e.target.value)}
            style={{
              padding: '9px 12px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontFamily: 'inherit',
              fontSize: 14,
              resize: 'vertical',
            }}
          />
          <button type="submit" className="dash-btn primary" disabled={bcBusy} style={{ alignSelf: 'flex-start' }}>
            {bcBusy ? 'Đang gửi…' : 'Gửi thông báo'}
          </button>
        </form>
        {bcMsg && (
          <p
            className="sub"
            style={{
              marginTop: 12,
              marginBottom: 0,
              color: bcMsg.includes('thất bại') || bcMsg.includes('Lỗi') ? 'var(--err)' : 'var(--ok)',
            }}
          >
            {bcMsg}
          </p>
        )}
      </div>

      <div className="adm-card">
        <p style={{ margin: 0, fontSize: 14, color: 'var(--txt2)', lineHeight: 1.6 }}>
          Chỉnh sửa biến trong thư mục <code>backend/.env</code> rồi khởi động lại server Node.
        </p>
      </div>
    </AdminChrome>
  );
}
