import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Trang chủ</h1>
      <Link to="/login">Đăng nhập</Link>
    </div>
  );
}
