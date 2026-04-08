import { useEffect, useState } from 'react';
import { apiJson, apiJsonBody, getToken } from '../../api/client.js';
import EmployeeChrome from '../../components/employee/EmployeeChrome.jsx';

export default function EmployeeProfile() {
  const [p, setP] = useState(null);
  const [form, setForm] = useState({});
  const [err, setErr] = useState('');

  async function load() {
    const data = await apiJson('/api/dashboard/employee/profile');
    setP(data);
    setForm({
      email: data.email,
      phone: data.phone,
      address: data.address,
      startDate: data.ngayVaoLam,
    });
  }

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  async function save(e) {
    e.preventDefault();
    try {
      await apiJsonBody('PUT', '/api/dashboard/employee/profile', {
        email: form.email,
        phone: form.phone,
        address: form.address,
        startDate: form.startDate,
      });
      await load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function onAvatar(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    const token = getToken();
    const r = await fetch('/api/dashboard/employee/profile/avatar', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!r.ok) {
      setErr('Upload ảnh thất bại');
      return;
    }
    await load();
  }

  return (
    <EmployeeChrome title="Hồ sơ cá nhân" subtitle="Cập nhật thông tin liên hệ và ảnh đại diện.">
      {err && <p className="err">{err}</p>}
      {p && (
        <>
          <div className="dash-card emp-profile-hero">
            <div className="emp-profile-hero-inner">
              {p.avatarUrl ? (
                <img className="emp-profile-avatar-lg" src={p.avatarUrl} alt="Ảnh đại diện" />
              ) : (
                <div className="emp-profile-avatar-lg emp-profile-avatar-placeholder">
                  {p.hoTen?.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="emp-profile-hero-text">
                <h3 className="emp-profile-name">{p.hoTen}</h3>
                <p className="emp-profile-email">{p.email}</p>
                <dl className="emp-profile-dl">
                  <div>
                    <dt>Chức vụ</dt>
                    <dd>{p.chucVu || '—'}</dd>
                  </div>
                  <div>
                    <dt>Bộ phận</dt>
                    <dd>{p.phongBan || '—'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <div className="dash-card emp-profile-upload-card">
            <div className="dash-card-title">Ảnh đại diện</div>
            <div className="emp-profile-upload-row">
              <label className="emp-profile-file">
                <span className="emp-profile-file-btn">Chọn tệp</span>
                <input type="file" accept="image/*" onChange={onAvatar} />
              </label>
              <span className="sub">JPG, PNG — tối đa 5MB</span>
            </div>
          </div>

          <div className="dash-card emp-profile-form-card">
            <div className="dash-card-title">Thông tin cá nhân</div>
            <form className="dash-form emp-profile-form" onSubmit={save}>
              <div className="field-grid">
                <label>
                  Email
                  <input value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </label>
                <label>
                  Số điện thoại
                  <input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </label>
              </div>
              <div className="field-grid">
                <label className="field-full">
                  Địa chỉ
                  <input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </label>
              </div>
              <div className="field-grid">
                <label>
                  Ngày tham gia
                  <input
                    type="date"
                    value={form.startDate ?? ''}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </label>
              </div>
              <div className="emp-profile-form-actions">
                <button type="submit" className="dash-btn">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </EmployeeChrome>
  );
}
