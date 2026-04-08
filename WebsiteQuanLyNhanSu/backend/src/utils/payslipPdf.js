import { SITE_TITLE_PDF_ASCII } from '../constants/brand.js';

/**
 * Tương đương buildPayslipPdf trong DashboardController.java (PDF tối giản).
 */
export function buildPayslipPdf(detail) {
  const safe = (v) => (v == null ? '' : String(v));
  const asciiSafe = (v) => {
    const s = safe(v);
    if (!s.trim()) return s;
    return s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  };
  const lines = [
    `PHIEU LUONG - ${SITE_TITLE_PDF_ASCII}`,
    `Ma phieu: ${safe(detail.maPhieu || detail.id)}`,
    `Ky luong: ${safe(detail.thangNam)}`,
    `Nhan vien: ${asciiSafe(detail.hoTen)} (${safe(detail.maNhanVien)})`,
    `Phat muon: ${safe(detail.phatMuon)}`,
    `Nghi khong phep: ${safe(detail.nghiKhongPhep)}`,
    `Tong luong: ${safe(detail.tongLuong)}`,
    `Trang thai thanh toan: ${safe(detail.trangThaiThanhToan)}`,
  ];
  function pdfEscape(s) {
    return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
  let stream = 'BT\n/F1 12 Tf\n12 TL\n50 800 Td\n';
  lines.forEach((line, i) => {
    if (i > 0) stream += 'T*\n';
    stream += `(${pdfEscape(line)}) Tj\n`;
  });
  stream += 'ET\n';
  const contentBytes = Buffer.from(stream, 'ascii');
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  const obj5Header = `5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`;
  const obj5Footer = 'endstream\nendobj\n';
  let pdf = '%PDF-1.4\n';
  const off1 = Buffer.byteLength(pdf, 'ascii');
  pdf += obj1;
  const off2 = Buffer.byteLength(pdf, 'ascii');
  pdf += obj2;
  const off3 = Buffer.byteLength(pdf, 'ascii');
  pdf += obj3;
  const off4 = Buffer.byteLength(pdf, 'ascii');
  pdf += obj4;
  const off5 = Buffer.byteLength(pdf, 'ascii');
  pdf += obj5Header;
  const headerPart = pdf;
  const headerBytes = Buffer.from(headerPart, 'ascii');
  const footerBytes = Buffer.from(obj5Footer, 'ascii');
  const xrefStart = headerBytes.length + contentBytes.length + footerBytes.length;
  const xref =
    `xref\n0 6\n0000000000 65535 f \n${String(off1).padStart(10, '0')} 00000 n \n` +
    `${String(off2).padStart(10, '0')} 00000 n \n${String(off3).padStart(10, '0')} 00000 n \n` +
    `${String(off4).padStart(10, '0')} 00000 n \n${String(off5).padStart(10, '0')} 00000 n \n` +
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.concat([headerBytes, contentBytes, footerBytes, Buffer.from(xref, 'ascii')]);
}
