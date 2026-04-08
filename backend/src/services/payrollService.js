import mongoose from 'mongoose';
import { monthAliases, normalizeThangNam } from '../utils/thangNam.js';

function normalizeMoneyScale(raw) {
  if (raw == null) return 0;
  let v = Number(raw);
  if (Number.isNaN(v) || !Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1_000_000_000) v /= 1000;
  return v;
}

function roundVnd(v) {
  return Math.round(v);
}

function ymFromDate(d) {
  return d.getFullYear() * 100 + (d.getMonth() + 1);
}

function eachWeekdayInRange(start, end) {
  const out = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    const wd = new Date(t).getDay();
    if (wd >= 1 && wd <= 5) out.push(new Date(t));
  }
  return out;
}

export async function scanAndCalculatePayroll(thangNamRaw) {
  const normalizedThangNam = normalizeThangNam(thangNamRaw);
  const [ys, ms] = normalizedThangNam.split('-').map(Number);
  const startOfMonth = new Date(ys, ms - 1, 1);
  const endOfMonth = new Date(ys, ms, 0);
  const today = new Date();
  const sameMonth = ys === today.getFullYear() && ms === today.getMonth() + 1;
  let effectiveEnd = endOfMonth;
  if (sameMonth) {
    effectiveEnd = today < endOfMonth ? today : endOfMonth;
  }

  const NhanVien = mongoose.model('NhanVien');
  const PhieuLuong = mongoose.model('PhieuLuong');
  const ChamCong = mongoose.model('ChamCong');
  const DonNghiPhep = mongoose.model('DonNghiPhep');

  const allEmployees = await NhanVien.find({ trangThaiHoatDong: { $ne: 'DA_NGHI_VIEC' } })
    .populate('bangLuong')
    .lean();

  for (const nv of allEmployees) {
    if (!nv.bangLuong) continue;
    if (nv.ngayVaoLam && ymFromDate(new Date(nv.ngayVaoLam)) > ymFromDate(startOfMonth)) continue;

    const aliases = monthAliases(normalizedThangNam);
    const existing = await PhieuLuong.find({
      nhanVien: nv._id,
      thangNam: { $in: aliases },
    });
    let phieu = existing[0] || null;

    const chamCongs = await ChamCong.find({
      nhanVien: nv._id,
      ngay: { $gte: startOfMonth, $lte: effectiveEnd },
    }).lean();

    const GIO_CHUAN_SEC = 8 * 3600;
    let tongPhutMuon = 0;
    for (const c of chamCongs) {
      if (String(c.trangThai) !== 'DI_MUON' || !c.gioVao) continue;
      const p = String(c.gioVao).split(':').map(Number);
      const sec = (p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0);
      if (sec > GIO_CHUAN_SEC) tongPhutMuon += (sec - GIO_CHUAN_SEC) / 60;
    }

    const ngayLamViecTrongThang = eachWeekdayInRange(startOfMonth, effectiveEnd);
    const ngayDaChamCong = new Set();
    for (const c of chamCongs) {
      const st = (c.trangThai || '').toUpperCase();
      if (st !== 'DI_LAM' && st !== 'DI_MUON') continue;
      const d = new Date(c.ngay);
      if (d >= startOfMonth && d <= effectiveEnd) {
        ngayDaChamCong.add(d.toISOString().slice(0, 10));
      }
    }

    const ngayPhepSet = new Set();
    const dons = await DonNghiPhep.find({ nhanVien: nv._id, trangThai: 'DA_DUYET' }).lean();
    for (const don of dons) {
      if (!don.tuNgay) continue;
      let from = new Date(don.tuNgay);
      let to = don.denNgay ? new Date(don.denNgay) : from;
      if (to < startOfMonth || from > effectiveEnd) continue;
      const os = from < startOfMonth ? startOfMonth : from;
      const oe = to > effectiveEnd ? effectiveEnd : to;
      for (const day of eachWeekdayInRange(os, oe)) {
        ngayPhepSet.add(day.toISOString().slice(0, 10));
      }
    }

    let soNgayVangKhongPhep = 0;
    for (const day of ngayLamViecTrongThang) {
      const key = day.toISOString().slice(0, 10);
      if (!ngayDaChamCong.has(key) && !ngayPhepSet.has(key)) soNgayVangKhongPhep++;
    }

    const bl = nv.bangLuong;
    const luongCB = normalizeMoneyScale(bl.luongCoBan);
    const phuCap = normalizeMoneyScale(bl.phuCapDinhMuc);
    const luongNgay = luongCB / 26.0;
    const tienPhatMuon = tongPhutMuon * 2000;
    const tienPhatNghi = Math.min(soNgayVangKhongPhep * luongNgay, luongCB);
    const tongLuong = Math.max(0, luongCB + phuCap - tienPhatMuon - tienPhatNghi);

    const pid =
      phieu?._id ||
      `PL_${nv._id}_${String(ms).padStart(2, '0')}${ys}`;

    await PhieuLuong.findOneAndUpdate(
      { _id: pid },
      {
        $set: {
          thangNam: normalizedThangNam,
          luongCoBan: luongCB,
          phuCap,
          phatMuon: roundVnd(tienPhatMuon),
          nghiKhongPhep: roundVnd(tienPhatNghi),
          tongLuong: roundVnd(tongLuong),
          nhanVien: nv._id,
          trangThaiThanhToan: phieu?.trangThaiThanhToan || 'CHUA_THANH_TOAN',
        },
      },
      { upsert: true }
    );
  }
}

export async function updatePaymentStatus(id, status) {
  const p = await mongoose.model('PhieuLuong').findById(id);
  if (!p) throw new Error(`Không tìm thấy phiếu lương với mã: ${id}`);
  p.trangThaiThanhToan = status;
  await p.save();
  return p;
}
