import { useEffect, useState } from 'react';

export function formatVnDateTime(d = new Date()) {
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return (
    `${days[d.getDay()]}, ` +
    `${String(d.getDate()).padStart(2, '0')}/` +
    `${String(d.getMonth() + 1).padStart(2, '0')}/` +
    `${d.getFullYear()} — ` +
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  );
}

export function useDashboardClock() {
  const [s, setS] = useState(() => formatVnDateTime());
  useEffect(() => {
    const tick = () => setS(formatVnDateTime());
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);
  return s;
}
