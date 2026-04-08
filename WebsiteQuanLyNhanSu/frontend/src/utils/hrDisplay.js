/**
 * Utility functions for HR display labels and formatting
 */

export function loaiPhepLabel(code) {
  const u = String(code || '').toUpperCase();
  const map = {
    PHEP_NAM: 'Phép năm',
    PHEP_OM: 'Nghỉ ốm',
    NGHI_LE: 'Nghỉ lễ',
    KHONG_LUONG: 'Không lương',
    KHAC: 'Khác',
  };
  return map[u] || code || '—';
}

export function leaveStatusLabel(st) {
  const u = String(st || '').toUpperCase();
  const map = {
    'DA_DUYET': 'Đã phê duyệt',
    'CHO_QL_DUYET': 'Chờ quản lý duyệt',
    'CHO_HR_XAC_NHAN': 'Chờ HR xác nhận',
    'CHO_DUYET': 'Chờ duyệt',
    'TU_CHOI': 'Bị từ chối',
  };
  return map[u] || st || '—';
}

export function leaveStatusBadge(st) {
  const u = String(st || '').toUpperCase();
  switch (u) {
    case 'DA_DUYET':
      return { class: 'emp-leave-badge--approved', label: 'Đã phê duyệt', icon: 'fa-check-circle' };
    case 'CHO_QL_DUYET':
      return { class: 'emp-leave-badge--pending-manager', label: 'Chờ quản lý duyệt', icon: 'fa-clock' };
    case 'CHO_HR_XAC_NHAN':
    case 'CHO_DUYET':
      return { class: 'emp-leave-badge--pending-hr', label: 'Chờ HR xác nhận', icon: 'fa-hourglass-half' };
    case 'TU_CHOI':
      return { class: 'emp-leave-badge--rejected', label: 'Bị từ chối', icon: 'fa-times-circle' };
    default:
      return { class: 'emp-leave-badge--default', label: st || '—', icon: 'fa-question-circle' };
  }
}
