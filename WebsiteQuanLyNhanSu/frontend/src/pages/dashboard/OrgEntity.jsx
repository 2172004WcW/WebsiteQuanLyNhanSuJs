import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiJson, apiJsonBody } from '../../api/client.js';
import HrChrome from '../../components/hr/HrChrome.jsx';

const TYPES = {
  'chi-nhanh': {
    bannerTitle: 'Quản lý chi nhánh',
    bannerIcon: 'fa-solid fa-building',
    bannerSubtitle: 'Thêm, sửa, xóa chi nhánh (REST /api/organizations/chi-nhanh).',
    title: 'Chi nhánh',
    base: '/api/organizations/chi-nhanh',
    columns: [
      { key: '_id', label: 'Mã' },
      { key: 'tenChiNhanh', label: 'Tên' },
      { key: 'diaChi', label: 'Địa chỉ' },
    ],
    createFields: [
      { key: 'tenChiNhanh', label: 'Tên chi nhánh', required: true },
      { key: 'diaChi', label: 'Địa chỉ' },
    ],
    buildCreate: (f) => ({ tenChiNhanh: f.tenChiNhanh, diaChi: f.diaChi }),
    buildUpdate: (f) => ({ tenChiNhanh: f.tenChiNhanh, diaChi: f.diaChi }),
  },
  'phong-ban': {
    bannerTitle: 'Quản lý phòng ban',
    bannerIcon: 'fa-solid fa-folder-tree',
    bannerSubtitle: 'Gán phòng ban theo chi nhánh.',
    title: 'Phòng ban',
    base: '/api/organizations/phong-ban',
    columns: [
      { key: '_id', label: 'Mã' },
      { key: 'tenPhongBan', label: 'Tên' },
      {
        key: 'chiNhanh',
        label: 'Chi nhánh',
        render: (r) => (typeof r.chiNhanh === 'object' ? r.chiNhanh?.tenChiNhanh : r.chiNhanh) || '—',
      },
    ],
    createFields: [
      { key: 'tenPhongBan', label: 'Tên phòng ban', required: true },
      { key: 'chiNhanhId', label: 'Thuộc chi nhánh', required: true, type: 'select', ref: 'chi-nhanh', refLabel: 'tenChiNhanh' },
    ],
    extraLoad: ['/api/organizations/chi-nhanh'],
    buildCreate: (f) => ({ tenPhongBan: f.tenPhongBan, chiNhanh: f.chiNhanhId }),
    buildUpdate: (f) => ({ tenPhongBan: f.tenPhongBan, chiNhanh: { id: f.chiNhanhId } }),
  },
  nhom: {
    bannerTitle: 'Quản lý nhóm / tổ',
    bannerIcon: 'fa-solid fa-people-group',
    bannerSubtitle: 'Gán nhóm theo phòng ban.',
    title: 'Nhóm',
    base: '/api/organizations/nhom',
    columns: [
      { key: '_id', label: 'Mã' },
      { key: 'tenNhom', label: 'Tên' },
      {
        key: 'phongBan',
        label: 'Phòng ban',
        render: (r) => (typeof r.phongBan === 'object' ? r.phongBan?.tenPhongBan : r.phongBan) || '—',
      },
    ],
    createFields: [
      { key: 'tenNhom', label: 'Tên nhóm', required: true },
      { key: 'phongBanId', label: 'Thuộc phòng ban', required: true, type: 'select', ref: 'phong-ban', refLabel: 'tenPhongBan' },
    ],
    extraLoad: ['/api/organizations/phong-ban'],
    buildCreate: (f) => ({ tenNhom: f.tenNhom, phongBan: f.phongBanId }),
    buildUpdate: (f) => ({ tenNhom: f.tenNhom, phongBan: { id: f.phongBanId } }),
  },
  'chuc-vu': {
    bannerTitle: 'Quản lý chức vụ',
    bannerIcon: 'fa-solid fa-id-badge',
    bannerSubtitle: 'Danh mục chức vụ dùng cho nhân sự và lương.',
    title: 'Chức vụ',
    base: '/api/organizations/chuc-vu',
    columns: [
      { key: '_id', label: 'Mã' },
      { key: 'tenChucVu', label: 'Tên' },
    ],
    createFields: [{ key: 'tenChucVu', label: 'Tên chức vụ', required: true }],
    buildCreate: (f) => ({ tenChucVu: f.tenChucVu }),
    buildUpdate: (f) => ({ tenChucVu: f.tenChucVu }),
  },
};

export default function OrgEntity() {
  const { pathname } = useLocation();
  const segment = pathname.split('/').pop() || '';
  const cfg = TYPES[segment];
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  // Store reference data for dropdowns (chi-nhanh list, phong-ban list)
  const [refData, setRefData] = useState({});

  const title = cfg?.title || segment;

  async function load() {
    if (!cfg) return;
    const urls = [cfg.base, ...(cfg.extraLoad || [])];
    const res = await Promise.all(urls.map((u) => apiJson(u)));
    setRows(Array.isArray(res[0]) ? res[0] : []);
    // Store reference data for dropdowns
    const newRefData = {};
    if (cfg.extraLoad) {
      cfg.extraLoad.forEach((url, idx) => {
        const data = res[idx + 1];
        if (Array.isArray(data)) {
          // Extract entity type from URL (e.g., /api/organizations/chi-nhanh -> chi-nhanh)
          const match = url.match(/\/([^\/]+)$/);
          if (match) {
            newRefData[match[1]] = data;
          }
        }
      });
    }
    setRefData(newRefData);
  }

  useEffect(() => {
    if (!cfg) return;
    (async () => {
      try {
        setErr('');
        await load();
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [segment]);

  if (!cfg) {
    return (
      <div className="dash-page">
        <h1>Không rõ loại danh mục</h1>
      </div>
    );
  }

  function openCreate() {
    setEdit(null);
    setForm({});
    setShow(true);
  }

  function openEdit(row) {
    setEdit(row._id);
    const f = { ...row };
    if (segment === 'phong-ban') {
      f.chiNhanhId = row.chiNhanh?._id || row.chiNhanh || '';
    }
    if (segment === 'nhom') {
      f.phongBanId = row.phongBan?._id || row.phongBan || '';
    }
    setForm(f);
    setShow(true);
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (edit) {
        await apiJsonBody('PUT', `${cfg.base}/${encodeURIComponent(edit)}`, cfg.buildUpdate(form));
      } else {
        await apiJsonBody('POST', cfg.base, cfg.buildCreate(form));
      }
      setShow(false);
      await load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function del(id) {
    if (!window.confirm('Xóa?')) return;
    await apiJson(`${cfg.base}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  return (
    <HrChrome
      iconClass={cfg.bannerIcon}
      title={cfg.bannerTitle}
      subtitle={cfg.bannerSubtitle}
      showOrgSubnav
    >
      {err && <p className="err">{err}</p>}
      <div className="hr-card">
        <div className="hr-card-hd">
          <div className="hr-card-title">
            <i className="fa-solid fa-table-list" style={{ color: 'var(--hr)' }} aria-hidden />
            Danh mục: {title}
          </div>
          <button type="button" className="hr-btn-pri" onClick={openCreate}>
            + Thêm
          </button>
        </div>
        <div className="dash-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
        <table className="hr-rank-table">
          <thead>
            <tr>
              {cfg.columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                {cfg.columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>
                ))}
                <td className="dash-row">
                  <button type="button" className="dash-btn secondary" onClick={() => openEdit(r)}>
                    Sửa
                  </button>
                  <button type="button" className="dash-btn danger" onClick={() => del(r._id)}>
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {show && (
        <div className="dash-modal-bg" onClick={() => setShow(false)} role="presentation">
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{edit ? 'Cập nhật' : 'Thêm mới'}</h2>
            <form className="dash-form" style={{ maxWidth: '100%' }} onSubmit={save}>
              {cfg.createFields.map((f) => (
                <label key={f.key}>
                  {f.label}
                  {f.type === 'select' ? (
                    <select
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      required={f.required}
                    >
                      <option value="">— Chọn {f.label.toLowerCase()} —</option>
                      {refData[f.ref]?.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item[f.refLabel] || item._id}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      required={f.required}
                    />
                  )}
                </label>
              ))}
              <div className="dash-row">
                <button type="submit" className="dash-btn">
                  Lưu
                </button>
                <button type="button" className="dash-btn secondary" onClick={() => setShow(false)}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </HrChrome>
  );
}
