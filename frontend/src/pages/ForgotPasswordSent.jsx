import { Link } from 'react-router-dom';

export default function ForgotPasswordSent() {
  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="login-header">
          <h3>Đã gửi</h3>
          <p>Nếu tài khoản tồn tại, mã OTP đã được gửi tới email công việc.</p>
        </div>
        <div className="auth-inner" style={{ textAlign: 'center' }}>
          <p style={{ marginTop: 0, color: 'var(--txt2)', fontSize: 14 }}>
            Kiểm tra hộp thư và nhập mã tại bước tiếp theo.
          </p>
          <p style={{ marginBottom: 8 }}>
            <Link to="/reset-password" className="forgot-link">
              Đặt lại mật khẩu với OTP
            </Link>
          </p>
          <p style={{ marginTop: 0 }}>
            <Link to="/login" className="forgot-link">
              ← Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
