/**
 * Giống PhieuLuong.normalizeThangNam (Java).
 */
export function normalizeThangNam(value) {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return raw;

  const iso = raw.match(/^(\d{4})[-/](\d{1,2})$/);
  if (iso) {
    const year = parseInt(iso[1], 10);
    const month = parseInt(iso[2], 10);
    if (month >= 1 && month <= 12) return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
  }

  const legacy = raw.match(/^(\d{1,2})[-/](\d{4})$/);
  if (legacy) {
    const month = parseInt(legacy[1], 10);
    const year = parseInt(legacy[2], 10);
    if (month >= 1 && month <= 12) return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
  }

  return raw;
}

export function monthAliases(monthYear) {
  const canonical = normalizeThangNam(monthYear);
  if (!canonical || !canonical.includes('-')) return canonical ? [canonical] : [];
  const p = canonical.split('-');
  const legacy = `${p[1]}/${p[0]}`;
  return [canonical, legacy];
}
