import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson, apiJsonBody } from '../../api/client.js';
import HrChrome from '../../components/hr/HrChrome.jsx';

const ORG_LINKS = [
  { to: '/dashboard/hr/org/chi-nhanh', label: 'Chi nhánh' },
  { to: '/dashboard/hr/org/phong-ban', label: 'Phòng ban' },
  { to: '/dashboard/hr/org/nhom', label: 'Nhóm' },
  { to: '/dashboard/hr/org/chuc-vu', label: 'Chức vụ' },
];

export default function HrOrganization() {
  const [month, setMonth] = useState('');
  const [req, setReq] = useState([]);
  const [pb, setPb] = useState([]);
  const [err, setErr] = useState('');
  const [hire, setHire] = useState({
    viTriCanTuyen: '',
    soLuong: 1,
    phongBan: '',
    trinhDoYeuCau: '',
    moTa: '',
  });

  const monthOptions = useMemo(() => {
    const out = [{ value: '', label: '— Tất cả —' }];
    const now = new Date();
    for (let i = 0; i < 8; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      out.push({ value: val, label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}` });
    }
    return out;
  }, []);

  async function loadReq() {
    const q = month ? `?month=${encodeURIComponent(month)}` : '';
    const data = await apiJson(`/api/dashboard/hr/recruitment/requests${q}`);
    setReq(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    (async () => {
      try {
        setErr('');
        const p = await apiJson('/api/organizations/phong-ban');
        setPb(Array.isArray(p) ? p : []);
        await loadReq();
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  useEffect(() => {
    loadReq().catch(() => { });
  }, [month]);

  async function submitHire(e) {
    e.preventDefault();
    try {
      setErr('');
      await apiJsonBody('POST', '/api/recruitment/hiring-request', {
        viTriCanTuyen: hire.viTriCanTuyen,
        soLuong: Number(hire.soLuong) || 1,
        phongBan: hire.phongBan || undefined,
        moTa: hire.moTa,
        trinhDoYeuCau: hire.trinhDoYeuCau || '',
      });
      setHire({ viTriCanTuyen: '', soLuong: 1, phongBan: '', trinhDoYeuCau: '', moTa: '' });
      await loadReq();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function deleteReq(id) {
    if (!window.confirm('Bạn có chắc muốn xóa yêu cầu tuyển dụng này?')) return;
    try {
      await apiJson(`/api/recruitment/hiring-request/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await loadReq();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <HrChrome
      iconClass="fa-solid fa-sitemap"
      title="Tổ chức"
      subtitle="Tổng quan yêu cầu tuyển dụng. Chi nhánh / Phòng ban / Nhóm / Chức vụ: CRUD đầy đủ ở từng tab."
      showOrgSubnav
    >
      {err && <p className="err">{err}</p>}

      <div className="hr-card" style={{ marginBottom: 16 }}>
        <div className="hr-card-hd">
          <div className="hr-card-title">
            <i className="fa-solid fa-table-list" style={{ color: 'var(--hr)' }} aria-hidden />
            Yêu cầu tuyển dụng theo phòng ban
          </div>
          <div className="hr-filter-row" style={{ marginBottom: 0, flexWrap: 'wrap' }}>
            <label htmlFor="org-req-month">Tháng yêu cầu:</label>
            <select
              id="org-req-month"
              className="hr-filter-select"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {monthOptions.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button type="button" className="hr-btn-pri" onClick={() => loadReq()}>
              Tải lại
            </button>
          </div>
        </div>

        <form className="dash-form" style={{ maxWidth: 560, marginBottom: 16 }} onSubmit={submitHire}>
          <div className="hr-card-hd" style={{ marginBottom: 8 }}>
            <div className="hr-card-title" style={{ fontSize: 13 }}>
              <i className="fa-solid fa-plus" style={{ color: 'var(--ok)' }} aria-hidden />
              Tạo yêu cầu tuyển dụng
            </div>
          </div>
          <div className="field-grid">
            <label>
              Vị trí cần tuyển
              <input
                value={hire.viTriCanTuyen}
                onChange={(e) => setHire({ ...hire, viTriCanTuyen: e.target.value })}
                required
              />
            </label>
            <label>
              Phòng ban
              <select value={hire.phongBan} onChange={(e) => setHire({ ...hire, phongBan: e.target.value })}>
                <option value="">—</option>
                {pb.map((x) => (
                  <option key={x._id} value={x._id}>
                    {x.tenPhongBan}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="field-grid">
            <label>
              Số lượng
              <input
                type="number"
                min={1}
                value={hire.soLuong}
                onChange={(e) => setHire({ ...hire, soLuong: e.target.value })}
              />
            </label>
            <label>
              Trình độ yêu cầu
              <input value={hire.trinhDoYeuCau} onChange={(e) => setHire({ ...hire, trinhDoYeuCau: e.target.value })} />
            </label>
          </div>
          <label className="field-full">
            Mô tả
            <textarea rows={3} value={hire.moTa} onChange={(e) => setHire({ ...hire, moTa: e.target.value })} />
          </label>
          <div className="dash-card-footer" style={{ padding: 0 }}>
            <button type="submit" className="hr-btn-pri hr-btn-ok">
              Gửi yêu cầu
            </button>
          </div>
        </form>

        <div className="dash-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="hr-rank-table">
            <thead>
              <tr>
                <th>Mã YC</th>
                <th>Vị trí</th>
                <th>Phòng ban</th>
                <th>Số lượng</th>
                <th>Ngày yêu cầu</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {req.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="hr-empty">
                      <i className="fa-solid fa-inbox" />
                      <p>Chưa có yêu cầu tuyển dụng</p>
                    </div>
                  </td>
                </tr>
              ) : (
                req.map((r) => (
                  <tr key={r.idYeuCau}>
                    <td>{r.idYeuCau}</td>
                    <td>{r.viTriCanTuyen}</td>
                    <td>{r.phongBan}</td>
                    <td>{r.soLuong}</td>
                    <td>{r.ngayYeuCau}</td>
                    <td>{r.trangThai}</td>
                    <td>
                      <button
                        type="button"
                        className="dash-btn danger"
                        onClick={() => deleteReq(r.idYeuCau)}
                        title="Xóa"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="hr-card">
        <div className="hr-card-title" style={{ marginBottom: 12 }}>
          <i className="fa-solid fa-link" style={{ color: 'var(--hr)' }} aria-hidden />
          Đi tới màn hình quản trị tổ chức chi tiết
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {ORG_LINKS.map((x) => (
            <Link key={x.to} to={x.to} className="hr-card-link" style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 10 }}>
              {x.label}
            </Link>
          ))}
          <Link to="/dashboard/hr/employees" className="hr-card-link" style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 10 }}>
            Nhân viên
          </Link>
        </div>
      </div>
    </HrChrome>
  );
}
