/**
 * Utility functions for Employee display labels and formatting
 */

export function trangThaiChamCongLabel(status) {
  const map = {
    'DI_LAM': 'Đi làm',
    'DI_MUON': 'Đi muộn',
    'NGHI_PHEP': 'Nghỉ phép',
    'NGHI_KHONG_PHEP': 'Nghỉ không phép',
    'NGHI_OM': 'Nghỉ ốm',
    'NGHI_LE': 'Nghỉ lễ',
  };
  return map[status] || status || '—';
}

export function trangThaiChamCongBadge(status) {
  const u = String(status || '').toUpperCase();
  switch (u) {
    case 'DI_LAM':
      return { class: 'badge-success', label: 'Đi làm', icon: 'fa-check' };
    case 'DI_MUON':
      return { class: 'badge-warning', label: 'Đi muộn', icon: 'fa-clock' };
    case 'NGHI_PHEP':
      return { class: 'badge-info', label: 'Nghỉ phép', icon: 'fa-calendar-check' };
    case 'NGHI_KHONG_PHEP':
      return { class: 'badge-danger', label: 'Nghỉ không phép', icon: 'fa-times' };
    case 'NGHI_OM':
      return { class: 'badge-warning', label: 'Nghỉ ốm', icon: 'fa-medkit' };
    case 'NGHI_LE':
      return { class: 'badge-success', label: 'Nghỉ lễ', icon: 'fa-flag' };
    default:
      return { class: 'badge-muted', label: status || '—', icon: 'fa-question' };
  }
}
