import { Link } from 'react-router-dom';
import AdminChrome from '../../components/admin/AdminChrome.jsx';

const permissionItems = [
  {
    icon: 'fa-solid fa-user-shield',
    title: 'Đổi vai trò / gán QL trực tiếp',
    desc: 'Thay đổi role và gán quản lý trực tiếp cho nhân viên.',
    link: '/dashboard/admin/accounts',
    linkText: 'Tài khoản → Đổi role',
    api: '/api/dashboard/admin/accounts/{id}/role',
  },
  {
    icon: 'fa-solid fa-user-plus',
    title: 'Gán nhân viên cho tài khoản',
    desc: 'Chọn mã nhân viên trong danh sách chưa có tài khoản hoặc nhập tay.',
    link: '/dashboard/admin/accounts',
    linkText: 'Gán NV',
    api: '/assign',
  },
  {
    icon: 'fa-solid fa-users-gear',
    title: 'Cấp dưới (đơn nghỉ chờ QL)',
    desc: 'Với tài khoản EMPLOYEE đã gán NV, quản lý nhân viên cấp dưới.',
    link: '/dashboard/admin/accounts',
    linkText: 'Cấp dưới',
    api: '/manage-subordinates',
  },
  {
    icon: 'fa-solid fa-clock-rotate-left',
    title: 'Nhật ký đăng nhập',
    desc: 'Xem lịch sử đăng nhập của tất cả tài khoản trong hệ thống.',
    link: '/dashboard/admin/login-logs',
    linkText: 'Nhật ký đăng nhập',
    api: null,
  },
];

export default function AdminPermissions() {
  return (
    <AdminChrome
      iconClass="fa-solid fa-shield-halved"
      title="Phân quyền & quy trình"
      subtitle="Vai trò ADMIN, HR, DIRECTOR, EMPLOYEE — mỗi tài khoản gắn tối đa một nhân viên (trừ ADMIN thuần quản trị)."
    >
      <div className="perm-container">
        <div className="perm-grid">
          {permissionItems.map((item, idx) => (
            <div key={idx} className="perm-card">
              <div className="perm-card-icon">
                <i className={item.icon} />
              </div>
              <div className="perm-card-content">
                <h3 className="perm-card-title">{item.title}</h3>
                <p className="perm-card-desc">{item.desc}</p>
                <div className="perm-card-footer">
                  <Link to={item.link} className="perm-card-link">
                    {item.linkText} <i className="fa-solid fa-arrow-right" />
                  </Link>
                  {item.api && (
                    <code className="perm-card-api">{item.api}</code>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="perm-info-box">
          <div className="perm-info-icon">
            <i className="fa-solid fa-circle-info" />
          </div>
          <div className="perm-info-content">
            <h4>Lưu ý về phân quyền</h4>
            <ul className="perm-info-list">
              <li><strong>ADMIN:</strong> Quyền cao nhất, quản trị toàn hệ thống.</li>
              <li><strong>HR:</strong> Quản lý nhân sự, tuyển dụng, lương, chấm công.</li>
              <li><strong>DIRECTOR:</strong> Xem báo cáo, phê duyệt đơn cấp dưới.</li>
              <li><strong>EMPLOYEE:</strong> Nhân viên thường, có thể được gán quản lý cấp dưới.</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminChrome>
  );
}
