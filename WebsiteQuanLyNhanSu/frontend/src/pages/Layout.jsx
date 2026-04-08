export default function Layout({ title }) {
  return (
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>{title}</h1>
      <p>React 19 + Vite — URL giữ như dự án Thymeleaf; gọi API qua <code>/api/...</code></p>
    </div>
  );
}
