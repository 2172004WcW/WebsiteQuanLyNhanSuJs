import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import * as notificationService from './notificationService.js';

// ─── Helper ────────────────────────────────────────────────────────────────
function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function genReqId() {
  return `REQ_${Date.now()}`;
}

function genIntId() {
  return `IVW_${Date.now()}`;
}

// ─── YEU CAU TUYEN DUNG (Hiring Requests) ─────────────────────────────────
export async function listRequests(month) {
  const YeuCauTuyenDung = mongoose.model('YeuCauTuyenDung');
  let filter = {};
  if (month?.trim()) {
    const [y, m] = month.split('-').map(Number);
    if (y && m) {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      filter.ngayYeuCau = { $gte: start, $lt: end };
    }
  }
  const list = await YeuCauTuyenDung.find(filter).populate('phongBan').sort({ ngayYeuCau: -1 }).lean();
  return list.map(toRequestDto);
}

export async function getRequestById(id) {
  const r = await mongoose.model('YeuCauTuyenDung').findById(id).populate('phongBan').lean();
  if (!r) throw httpError(404, 'Không tìm thấy yêu cầu tuyển dụng');
  return toRequestDto(r);
}

export async function createRequest(body) {
  const YeuCauTuyenDung = mongoose.model('YeuCauTuyenDung');
  const id = body.idYeuCau || body._id || genReqId();
  const doc = await YeuCauTuyenDung.create({
    _id: id,
    idYeuCau: id,
    viTriCanTuyen: body.viTriCanTuyen,
    soLuong: body.soLuong || 1,
    trinhDoYeuCau: body.trinhDoYeuCau || '',
    moTa: body.moTa || '',
    trangThai: body.trangThai || 'PENDING',
    ngayYeuCau: body.ngayYeuCau ? new Date(body.ngayYeuCau) : new Date(),
    phongBan: body.phongBan?.id || body.phongBan || null,
  });
  const full = await mongoose.model('YeuCauTuyenDung').findById(doc._id).populate('phongBan').lean();
  return toRequestDto(full);
}

export async function updateRequest(id, body) {
  const r = await mongoose.model('YeuCauTuyenDung').findById(id);
  if (!r) throw httpError(404, 'Không tìm thấy yêu cầu tuyển dụng');
  if (body.viTriCanTuyen != null) r.viTriCanTuyen = body.viTriCanTuyen;
  if (body.soLuong != null) r.soLuong = body.soLuong;
  if (body.trinhDoYeuCau != null) r.trinhDoYeuCau = body.trinhDoYeuCau;
  if (body.moTa != null) r.moTa = body.moTa;
  if (body.trangThai != null) r.trangThai = body.trangThai;
  if (body.phongBan != null) r.phongBan = body.phongBan?.id || body.phongBan;
  await r.save();
  const full = await mongoose.model('YeuCauTuyenDung').findById(id).populate('phongBan').lean();
  return toRequestDto(full);
}

export async function deleteRequest(id) {
  const r = await mongoose.model('YeuCauTuyenDung').findById(id);
  if (!r) throw httpError(404, 'Không tìm thấy yêu cầu tuyển dụng');
  await mongoose.model('HoSoUngVien').deleteMany({ yeuCauTuyenDung: id });
  await r.deleteOne();
}

function toRequestDto(r) {
  return {
    id: r._id,
    idYeuCau: r._id,
    viTriCanTuyen: r.viTriCanTuyen,
    soLuong: r.soLuong,
    trinhDoYeuCau: r.trinhDoYeuCau,
    moTa: r.moTa,
    trangThai: r.trangThai,
    ngayYeuCau: r.ngayYeuCau ? new Date(r.ngayYeuCau).toISOString().slice(0, 10) : null,
    phongBan: r.phongBan?._id || r.phongBan || null,
    tenPhongBan: r.phongBan?.tenPhongBan || null,
  };
}

// ─── HO SO UNG VIEN (Candidates) ──────────────────────────────────────────
export async function listCandidates({ month, yeuCauId } = {}) {
  const HoSoUngVien = mongoose.model('HoSoUngVien');
  let filter = {};
  if (month?.trim()) {
    const [y, m] = month.split('-').map(Number);
    if (y && m) {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      filter.ngayNop = { $gte: start, $lt: end };
    }
  }
  if (yeuCauId?.trim()) filter.yeuCauTuyenDung = yeuCauId.trim();
  const list = await HoSoUngVien.find(filter)
    .populate({ path: 'yeuCauTuyenDung', select: 'viTriCanTuyen' })
    .sort({ ngayNop: -1 })
    .lean();
  return list.map(toCandidateDto);
}

export async function getCandidateById(id) {
  const c = await mongoose.model('HoSoUngVien')
    .findById(id)
    .populate({ path: 'yeuCauTuyenDung', select: 'viTriCanTuyen phongBan' })
    .lean();
  if (!c) throw httpError(404, 'Không tìm thấy hồ sơ ứng viên');
  const interviews = await mongoose.model('LichPhongVan')
    .find({ ungVien: id })
    .sort({ thoiGian: 1 })
    .lean();
  return { ...toCandidateDto(c), lichPhongVan: interviews.map(toInterviewDto) };
}

export async function createCandidate(body) {
  const HoSoUngVien = mongoose.model('HoSoUngVien');
  if (!body.hoTen?.trim()) throw httpError(400, 'Họ tên là bắt buộc');
  if (!body.email?.trim()) throw httpError(400, 'Email là bắt buộc');
  const doc = await HoSoUngVien.create({
    hoTen: body.hoTen.trim(),
    email: body.email.trim(),
    soDienThoai: body.soDienThoai || '',
    cvUrl: body.cvUrl || '',
    trangThai: body.trangThai || 'CHO_DUYET',
    ngayNop: body.ngayNop ? new Date(body.ngayNop) : new Date(),
    yeuCauTuyenDung: body.yeuCauTuyenDung || null,
  });
  return toCandidateDto(doc.toObject());
}

export async function updateCandidate(id, body) {
  const c = await mongoose.model('HoSoUngVien').findById(id);
  if (!c) throw httpError(404, 'Không tìm thấy hồ sơ ứng viên');
  if (body.hoTen != null) c.hoTen = body.hoTen;
  if (body.email != null) c.email = body.email;
  if (body.soDienThoai != null) c.soDienThoai = body.soDienThoai;
  if (body.cvUrl != null) c.cvUrl = body.cvUrl;
  if (body.trangThai != null) c.trangThai = body.trangThai;
  if (body.yeuCauTuyenDung != null) c.yeuCauTuyenDung = body.yeuCauTuyenDung;
  await c.save();
  const full = await mongoose.model('HoSoUngVien').findById(id).populate({ path: 'yeuCauTuyenDung', select: 'viTriCanTuyen' }).lean();
  return toCandidateDto(full);
}

export async function deleteCandidate(id) {
  const c = await mongoose.model('HoSoUngVien').findById(id);
  if (!c) throw httpError(404, 'Không tìm thấy hồ sơ ứng viên');
  await mongoose.model('LichPhongVan').deleteMany({ ungVien: id });
  await c.deleteOne();
}

/**
 * Onboard: chuyển ứng viên TRUNG_TUYEN → tạo NhanVien mới
 */
export async function onboardCandidate(id) {
  const c = await mongoose.model('HoSoUngVien')
    .findById(id)
    .populate({ path: 'yeuCauTuyenDung', populate: 'phongBan' })
    .lean();
  if (!c) throw httpError(404, 'Không tìm thấy hồ sơ ứng viên');

  const NhanVien = mongoose.model('NhanVien');
  const nvId = `NV${Math.floor(Date.now() / 1000)}`;
  const nv = await NhanVien.create({
    _id: nvId,
    hoTen: c.hoTen,
    emailCongViec: c.email,
    soDienThoai: c.soDienThoai || '',
    ngayVaoLam: new Date(),
    trangThaiHoatDong: 'DANG_LAM_VIEC',
    soNgayPhepConLai: 12,
    phongBan: c.yeuCauTuyenDung?.phongBan?._id || c.yeuCauTuyenDung?.phongBan || null,
  });

  // Đánh dấu ứng viên đã trúng tuyển
  await mongoose.model('HoSoUngVien').updateOne({ _id: id }, { $set: { trangThai: 'TRUNG_TUYEN' } });

  // Thông báo HR về nhân viên mới
  await notificationService.notifyAllHr(
    'CANDIDATE_ONBOARDED',
    'Ứng viên đã được onboard',
    `${c.hoTen} đã được chuyển thành nhân viên mới (${nvId}). Vui lòng gán tài khoản.`,
    `{"nhanVienId":"${nvId}"}`
  );

  return { message: `Onboard thành công! Nhân viên mới: ${nv.hoTen}`, nhanVienId: nvId };
}

function toCandidateDto(c) {
  return {
    id: c._id,
    hoTen: c.hoTen,
    email: c.email,
    soDienThoai: c.soDienThoai,
    cvUrl: c.cvUrl,
    trangThai: c.trangThai,
    ngayNop: c.ngayNop ? new Date(c.ngayNop).toISOString().slice(0, 10) : null,
    yeuCauTuyenDung: c.yeuCauTuyenDung?._id || c.yeuCauTuyenDung || null,
    viTri: c.yeuCauTuyenDung?.viTriCanTuyen || null,
  };
}

// ─── LICH PHONG VAN (Interviews) ───────────────────────────────────────────
export async function listInterviews(ungVienId) {
  const LichPhongVan = mongoose.model('LichPhongVan');
  const filter = ungVienId?.trim() ? { ungVien: ungVienId.trim() } : {};
  const list = await LichPhongVan.find(filter)
    .populate({ path: 'ungVien', select: 'hoTen trangThai yeuCauTuyenDung', populate: { path: 'yeuCauTuyenDung', select: 'viTriCanTuyen' } })
    .populate({ path: 'nguoiPhongVan', select: 'hoTen', model: 'NhanVien' })
    .sort({ thoiGian: 1 })
    .lean();
  return list.map(toInterviewDto);
}

export async function createInterview(body) {
  const LichPhongVan = mongoose.model('LichPhongVan');
  const id = body.idLich || body._id || genIntId();
  if (!body.ungVien) throw httpError(400, 'Ứng viên là bắt buộc');
  const ungVienExists = await mongoose.model('HoSoUngVien').findById(body.ungVien);
  if (!ungVienExists) throw httpError(404, 'Ứng viên không tồn tại');
  const doc = await LichPhongVan.create({
    _id: id,
    idLich: id,
    thoiGian: body.thoiGian ? new Date(body.thoiGian) : null,
    diaDiem: body.diaDiem || '',
    ghiChu: body.ghiChu || '',
    ungVien: body.ungVien,
    nguoiPhongVan: body.nguoiPhongVan || '',
  });
  const full = await LichPhongVan.findById(doc._id)
    .populate({ path: 'ungVien', select: 'hoTen trangThai' })
    .populate({ path: 'nguoiPhongVan', select: 'hoTen', model: 'NhanVien' })
    .lean();
  return toInterviewDto(full);
}

export async function updateInterview(id, body) {
  const iv = await mongoose.model('LichPhongVan').findById(id);
  if (!iv) throw httpError(404, 'Không tìm thấy lịch phỏng vấn');
  if (body.thoiGian != null) iv.thoiGian = new Date(body.thoiGian);
  if (body.diaDiem != null) iv.diaDiem = body.diaDiem;
  if (body.ghiChu != null) iv.ghiChu = body.ghiChu;
  if (body.nguoiPhongVan != null) iv.nguoiPhongVan = body.nguoiPhongVan;
  await iv.save();
  const full = await mongoose.model('LichPhongVan').findById(id)
    .populate({ path: 'ungVien', select: 'hoTen trangThai' })
    .populate({ path: 'nguoiPhongVan', select: 'hoTen', model: 'NhanVien' })
    .lean();
  return toInterviewDto(full);
}

export async function deleteInterview(id) {
  const iv = await mongoose.model('LichPhongVan').findById(id);
  if (!iv) throw httpError(404, 'Không tìm thấy lịch phỏng vấn');
  await iv.deleteOne();
}

function toInterviewDto(iv) {
  const nguoiPV = iv.nguoiPhongVan;
  return {
    id: iv._id,
    idLich: iv._id,
    thoiGian: iv.thoiGian ? new Date(iv.thoiGian).toISOString() : null,
    diaDiem: iv.diaDiem,
    ghiChu: iv.ghiChu,
    nguoiPhongVan: nguoiPV?.hoTen || nguoiPV || '—',
    nguoiPhongVanId: nguoiPV?._id || nguoiPV || null,
    ungVienId: iv.ungVien?._id || iv.ungVien || null,
    tenUngVien: iv.ungVien?.hoTen || null,
    trangThaiUngVien: iv.ungVien?.trangThai || null,
    viTriUngTuyen: iv.ungVien?.yeuCauTuyenDung?.viTriCanTuyen || null,
  };
}
