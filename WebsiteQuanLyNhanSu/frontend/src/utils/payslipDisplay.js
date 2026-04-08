/**
 * Stub utilities for payslip display
 */

export function formatMoneyVnd(amount) {
  if (typeof amount !== 'number') return '0 VNĐ';
  return amount.toLocaleString('vi-VN') + ' VNĐ';
}

export function isPayslipNotFuture(thangNam) {
  if (!thangNam) return false;
  const [year, month] = thangNam.split('-').map(Number);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return year < currentYear || (year === currentYear && month <= currentMonth);
}

export function kyLuongLabelFromThangNam(thangNam) {
  if (!thangNam) return '';
  const [year, month] = thangNam.split('-');
  return `Kỳ ${month}/${year}`;
}

export function trangThaiThanhToanLabel(status) {
  const labels = {
    'CHO_THANH_TOAN': 'Chờ thanh toán',
    'DA_THANH_TOAN': 'Đã thanh toán',
    'CHO_DUYET': 'Chờ duyệt',
  };
  return labels[status] || status;
}

export function maPhieuFromRow(row) {
  return row?.maPhieu || row?._id || '';
}

export function parseThangNamYm(thangNam) {
  if (!thangNam) return null;
  const [year, month] = thangNam.split('-').map(Number);
  return { year, month };
}
