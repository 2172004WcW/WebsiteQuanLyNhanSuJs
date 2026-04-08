import mongoose from 'mongoose';
import * as notificationService from './notificationService.js';

const CHO_QL_DUYET = 'CHO_QL_DUYET';
const CHO_HR_XAC_NHAN = 'CHO_HR_XAC_NHAN';
const LEGACY_CHO_DUYET = 'CHO_DUYET';
const DA_DUYET = 'DA_DUYET';
const TU_CHOI = 'TU_CHOI';

/** Đơn chờ HR xử lý (bỏ bước quản lý: NV nộp → HR duyệt; gồm cả legacy CHO_QL / CHO_DUYET) */
const PENDING_HR_STATUSES = [CHO_HR_XAC_NHAN, LEGACY_CHO_DUYET, CHO_QL_DUYET];

function isPendingHrStatus(trangThai) {
  const u = String(trangThai || '').toUpperCase();
  return PENDING_HR_STATUSES.some((s) => s.toUpperCase() === u);
}

function daysBetween(tu, den) {
  if (!tu || !den) return 0;
  const a = new Date(tu);
  const b = new Date(den);
  return Math.floor((b - a) / 86400000) + 1;
}

function mapLeaveType(loaiNghi) {
  if (!loaiNghi) return 'KHAC';
  const u = String(loaiNghi).toUpperCase();
  if (u === 'PH_NAM' || u === 'PHEP_NAM') return 'PHEP_NAM';
  if (u === 'NGHI_OM' || u === 'PHEP_OM') return 'PHEP_OM';
  if (u === 'NGHI_LE') return 'NGHI_LE';
  return 'KHAC';
}

function buildHrLeaveDto(doc, opts = {}) {
  const nv = doc.nhanVien;
  const tenNV = nv?.hoTen || '';
  const tenPhong = nv?.phongBan?.tenPhongBan || '—';
  const chucVu = nv?.chucVu?.tenChucVu || '—';
  const soNgay = daysBetween(doc.tuNgay, doc.denNgay);
  const ngayTu = doc.tuNgay ? new Date(doc.tuNgay).toISOString().slice(0, 10) : '';
  const ngayDen = doc.denNgay ? new Date(doc.denNgay).toISOString().slice(0, 10) : '';
  const mappedLoai = mapLeaveType(doc.loaiNghi);
  /** Danh sách chờ quản lý (Director): chỉ CHO_QL — coi như chưa qua bước QL */
  const deptHeadStatus = opts.hrQueue ? 'APPROVED' : 'PENDING';
  const maNhanVien = nv?.maNhanVien || nv?._id || '';
  const hoTenNhanVien = nv?.hoTen || '';
  return {
    id: doc._id,
    maNhanVien,
    hoTenNhanVien,
    tenNV,
    tenPhong,
    chucVu,
    loaiPhep: mappedLoai,
    loaiNghi: mappedLoai,
    tuNgay: ngayTu,
    denNgay: ngayDen,
    soNgay,
    ngayGui: ngayTu,
    deptHeadStatus,
    trangThai: doc.trangThai,
    lyDo: doc.lyDo || '',
  };
}

export async function createLeaveRequest(nv, body) {
  if (!nv?._id) throw new Error('Employee is required');
  const NhanVien = mongoose.model('NhanVien');
  const DonNghiPhep = mongoose.model('DonNghiPhep');

  // Load full NhanVien with manager populated
  const fullNv = await NhanVien.findById(nv._id || nv).populate('nguoiQuanLyTruocTiep');
  if (!fullNv) throw new Error('Nhân viên không tồn tại');

  const empName = fullNv.hoTen || String(fullNv._id);
  const manager = fullNv.nguoiQuanLyTruocTiep;

  if (manager?._id) {
    // Có quản lý trực tiếp → CHO_QL_DUYET
    const don = await DonNghiPhep.create({
      nhanVien: fullNv._id,
      loaiNghi: body.loaiNghi,
      tuNgay: body.tuNgay,
      denNgay: body.denNgay,
      lyDo: body.lyDo,
      nguoiDuyet: manager._id,
      trangThai: CHO_QL_DUYET,
    });
    const managerUsername = await notificationService.findUsernameByNhanVienId(String(manager._id));
    if (managerUsername) {
      await notificationService.notifyPrivate(
        managerUsername,
        'LEAVE_PENDING_MANAGER',
        'Đơn nghỉ phép chờ quản lý duyệt',
        `${empName} vừa gửi đơn nghỉ phép chờ bạn duyệt.`,
        `{"leaveId":"${don._id}"}`
      );
    }
    return don.toObject();
  }

  // Không có quản lý trực tiếp → CHO_HR_XAC_NHAN
  const don = await DonNghiPhep.create({
    nhanVien: fullNv._id,
    loaiNghi: body.loaiNghi,
    tuNgay: body.tuNgay,
    denNgay: body.denNgay,
    lyDo: body.lyDo,
    trangThai: CHO_HR_XAC_NHAN,
  });
  await notificationService.notifyAllHr(
    'LEAVE_PENDING_HR',
    'Đơn nghỉ phép chờ HR xác nhận',
    `${empName} vừa gửi đơn nghỉ phép (không có quản lý trực tiếp).`,
    `{"leaveId":"${don._id}"}`
  );
  return don.toObject();
}

export async function getManagerPendingLeaves(manager) {
  if (!manager?.id) return [];
  const list = await mongoose
    .model('DonNghiPhep')
    .find({ nguoiDuyet: manager.id || manager._id, trangThai: CHO_QL_DUYET })
    .sort({ tuNgay: -1 })
    .populate({ path: 'nhanVien', populate: ['phongBan', 'chucVu'] })
    .lean();
  return list.map((d) => buildHrLeaveDto(d, { hrQueue: false }));
}

export async function getHrPendingLeaves() {
  const DonNghiPhep = mongoose.model('DonNghiPhep');
  const list = await DonNghiPhep.find({ trangThai: { $in: PENDING_HR_STATUSES } })
    .sort({ tuNgay: -1 })
    .populate({ path: 'nhanVien', populate: ['phongBan', 'chucVu'] })
    .lean();
  return list.map((d) => buildHrLeaveDto(d, { hrQueue: true }));
}

export async function approveByManager(leaveId, manager) {
  if (!leaveId) throw new Error('leaveId is required');
  if (!manager?.id) throw new Error('Forbidden');
  const DonNghiPhep = mongoose.model('DonNghiPhep');
  const don = await DonNghiPhep.findById(leaveId);
  if (!don) throw new Error('Không tìm thấy đơn nghỉ phép');
  if (String(don.trangThai).toUpperCase() !== CHO_QL_DUYET.toUpperCase()) {
    throw new Error('Leave request is not pending for manager');
  }
  if (!don.nguoiDuyet || String(don.nguoiDuyet) !== String(manager.id || manager._id)) {
    throw new Error('Forbidden');
  }
  don.trangThai = CHO_HR_XAC_NHAN;
  await don.save();
  const nv = await mongoose.model('NhanVien').findById(don.nhanVien);
  const empName = nv?.hoTen || nv?.id || 'NV';
  await notificationService.notifyAllHr(
    'LEAVE_PENDING_HR',
    'Đơn nghỉ phép chờ HR xác nhận',
    `${empName} vừa được quản lý duyệt. Chờ HR xác nhận.`,
    `{"leaveId":${don._id}}`
  );
  return don.toObject();
}

export async function confirmByHr(leaveId) {
  if (!leaveId) throw new Error('leaveId is required');
  const DonNghiPhep = mongoose.model('DonNghiPhep');
  const NhanVien = mongoose.model('NhanVien');
  const don = await DonNghiPhep.findById(leaveId);
  if (!don) throw new Error('Không tìm thấy đơn nghỉ phép');
  if (!isPendingHrStatus(don.trangThai)) {
    throw new Error('Leave request is not pending for HR');
  }
  let nv = await NhanVien.findById(don.nhanVien);
  if (!nv) throw new Error('Leave request missing employee');
  const soNgay = daysBetween(don.tuNgay, don.denNgay);
  if (String(don.loaiNghi || '').toUpperCase() === 'PH_NAM') {
    const cap = nv.soNgayPhepConLai || 0;
    if (cap < soNgay) throw new Error('Nhân viên không đủ ngày phép');
    nv.soNgayPhepConLai = cap - soNgay;
    await nv.save();
  }
  don.trangThai = DA_DUYET;
  await don.save();
  const un = await notificationService.findUsernameByNhanVienId(String(nv._id));
  if (un) {
    await notificationService.notifyPrivate(
      un,
      'LEAVE_APPROVED',
      'Đơn nghỉ phép đã được duyệt',
      `Đơn từ ${don.tuNgay} đến ${don.denNgay} đã được HR xác nhận.`,
      `{"leaveId":${don._id}}`
    );
  }
  // Thông báo cho Director: tổng hợp sau khi HR duyệt
  await notificationService.notifyAllDirectors(
    'LEAVE_APPROVED_SUMMARY',
    'Nhân viên nghỉ phép đã xác nhận',
    `${nv.hoTen || nv._id} đã được duyệt nghỉ phép từ ${don.tuNgay} đến ${don.denNgay}.`,
    `{"leaveId":${don._id}}`
  );
  return don.toObject();
}

export async function rejectLeave(leaveId, reason, actor, rejectedByManager) {
  if (!leaveId) throw new Error('leaveId is required');
  const rs = (reason || '').trim();
  const DonNghiPhep = mongoose.model('DonNghiPhep');
  const don = await DonNghiPhep.findById(leaveId);
  if (!don) throw new Error('Không tìm thấy đơn nghỉ phép');

  if (rejectedByManager) {
    if (String(don.trangThai).toUpperCase() !== CHO_QL_DUYET.toUpperCase()) {
      throw new Error('Leave request is not pending for manager');
    }
    if (!actor?.id) throw new Error('Forbidden');
    if (!don.nguoiDuyet || String(don.nguoiDuyet) !== String(actor.id || actor._id)) {
      throw new Error('Forbidden');
    }
    don.trangThai = TU_CHOI;
    don.lyDo = buildLyDo(don.lyDo, `Manager từ chối: ${rs}`);
  } else {
    if (!isPendingHrStatus(don.trangThai)) {
      throw new Error('Leave request is not pending for HR');
    }
    don.trangThai = TU_CHOI;
    don.lyDo = buildLyDo(don.lyDo, `HR từ chối: ${rs}`);
  }
  await don.save();
  const nvDoc = await mongoose.model('NhanVien').findById(don.nhanVien);
  if (nvDoc) {
    const un = await notificationService.findUsernameByNhanVienId(String(nvDoc._id));
    if (un) {
      await notificationService.notifyPrivate(
        un,
        'LEAVE_REJECTED',
        'Đơn nghỉ phép bị từ chối',
        `Đơn của ${nvDoc.hoTen || nvDoc._id} đã bị từ chối. ${rs ? `Lý do: ${rs}` : ''}`,
        `{"leaveId":${don._id}}`
      );
    }
  }
  return don.toObject();
}

function buildLyDo(existing, append) {
  const ex = (existing || '').trim();
  if (!ex) return append;
  if (!append) return ex;
  return `${ex}\n${append}`;
}
