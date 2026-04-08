import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as notificationService from './notificationService.js';

const ROLES = new Set(['DIRECTOR', 'ADMIN', 'HR', 'EMPLOYEE']);

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

export async function countNewAccountsThisMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const all = await mongoose.model('TaiKhoan').find({}).lean();
  return all.filter((t) => t.ngayTao && new Date(t.ngayTao) >= start && new Date(t.ngayTao) < end).length;
}

function toResponse(t) {
  return {
    maTaiKhoan: t._id,
    username: t.username,
    role: t.role,
    trangThaiTaiKhoan: t.trangThaiTaiKhoan,
    nhanVienId: t.nhanVien?._id || t.nhanVien || null,
    hoTenNhanVien: t.nhanVien?.hoTen || null,
    directManagerId: t.nhanVien?.nguoiQuanLyTruocTiep?._id || t.nhanVien?.nguoiQuanLyTruocTiep || null,
    emailCongViec: t.nhanVien?.emailCongViec || null,
    ngayTao: t.ngayTao,
  };
}

function parseQueryBool(v) {
  if (v === undefined || v === null || v === '') return null;
  if (v === true || v === false) return v;
  const s = String(v).toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return null;
}

export async function listAccounts(q, roleFilter, activeOnly) {
  const qn = q?.trim()?.toLowerCase();
  const rfn = roleFilter?.trim()?.toUpperCase();
  const activeFilter = parseQueryBool(activeOnly);
  let list = await mongoose.model('TaiKhoan').find({}).populate({
    path: 'nhanVien',
    populate: { path: 'nguoiQuanLyTruocTiep', select: 'id hoTen' },
  });
  list = list.filter((t) => (qn ? t.username.toLowerCase().includes(qn) : true));
  list = list.filter((t) => (rfn ? (t.role || '').toUpperCase() === rfn : true));
  list = list.filter((t) => (activeFilter != null ? t.trangThaiTaiKhoan === activeFilter : true));
  return list.map((t) => toResponse(t.toObject ? t.toObject({ virtuals: true }) : t));
}

export async function listTaiKhoanChuaGanNhanVien() {
  const list = await mongoose.model('TaiKhoan').find({ nhanVien: { $in: [null, undefined] } });
  return list.map((t) => toResponse(t.toObject()));
}

export async function listNhanVienChuaCoTaiKhoanBrief() {
  const assigned = await mongoose.model('TaiKhoan').distinct('nhanVien');
  const ids = assigned.filter(Boolean);
  const nv = await mongoose
    .model('NhanVien')
    .find({ _id: { $nin: ids }, ...{ trangThaiHoatDong: { $ne: 'DA_NGHI_VIEC' } } })
    .lean();
  return nv.map((n) => ({
    id: n._id,
    hoTen: n.hoTen || '',
    emailCongViec: n.emailCongViec || '',
  }));
}

export async function createAccount(username, rawPassword, role, nhanVienId, actorUsername) {
  if (!role || !ROLES.has(role.trim().toUpperCase())) throw httpError(400, 'Role không hợp lệ');
  const r = role.trim().toUpperCase();
  const isAdminRole = r === 'ADMIN';
  if (!username?.trim()) throw httpError(400, 'username bắt buộc');
  if (!rawPassword || rawPassword.length < 6) throw httpError(400, 'Mật khẩu tối thiểu 6 ký tự');
  const exists = await mongoose.model('TaiKhoan').findOne({ username: username.trim() });
  if (exists) throw httpError(409, 'Username đã tồn tại');

  const ma = `TK_${cryptoRandom(20)}`;
  const tk = await mongoose.model('TaiKhoan').create({
    _id: ma,
    username: username.trim(),
    password: bcrypt.hashSync(rawPassword, 10),
    role: r,
    trangThaiTaiKhoan: true,
    ngayTao: new Date(),
  });

  if (!isAdminRole && !nhanVienId?.trim()) {
    throw httpError(400, 'Gán nhân viên là bắt buộc với role không phải ADMIN');
  }

  if (nhanVienId?.trim()) {
    const nv = await mongoose.model('NhanVien').findById(nhanVienId.trim());
    if (!nv) throw httpError(404, 'Không có nhân viên');
    const other = await mongoose.model('TaiKhoan').findOne({ nhanVien: nv._id });
    if (other && String(other._id) !== String(tk._id)) throw httpError(409, 'Nhân viên đã được gán tài khoản khác');
    tk.nhanVien = nv._id;
    await tk.save();
  }

  await notificationService.notifyPrivate(
    tk.username,
    'ACCOUNT_CREATED',
    'Tài khoản đã được tạo',
    `Tài khoản ${tk.username} (${tk.role}) đã sẵn sàng đăng nhập.`,
    null
  );
  await notificationService.notifyAllHr(
    'ACCOUNT_CREATED',
    'Tài khoản mới trong hệ thống',
    `Admin vừa tạo tài khoản: ${tk.username} (${tk.role}).`,
    null
  );

  const full = await mongoose.model('TaiKhoan').findById(tk._id).populate('nhanVien');
  return toResponse(full.toObject());
}

function cryptoRandom(len) {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

export async function toggleStatus(maTaiKhoan, actorUsername) {
  const tk = await getTaiKhoanOr404(maTaiKhoan);
  forbidSelf(tk.username, actorUsername, 'Không thể khóa/mở chính tài khoản đang đăng nhập');
  tk.trangThaiTaiKhoan = !tk.trangThaiTaiKhoan;
  await tk.save();
  const full = await mongoose.model('TaiKhoan').findById(tk._id).populate('nhanVien');
  return toResponse(full.toObject());
}

export async function updateRoleAndDirectManager(maTaiKhoan, newRole, directManagerId, actorUsername) {
  await updateRole(maTaiKhoan, newRole, actorUsername);
  if (!directManagerId) {
    const full = await mongoose.model('TaiKhoan').findById(maTaiKhoan).populate({
      path: 'nhanVien',
      populate: 'nguoiQuanLyTruocTiep',
    });
    return toResponse(full.toObject());
  }
  const fullTk = await mongoose.model('TaiKhoan').findById(maTaiKhoan).populate('nhanVien');
  const subId = fullTk.nhanVien?._id || fullTk.nhanVien;
  if (!subId) return toResponse(fullTk.toObject());
  if (directManagerId === 'null' || directManagerId === '') return toResponse(fullTk.toObject());
  if (String(directManagerId).trim() === String(subId).trim()) {
    throw httpError(400, 'Không thể chọn chính mình làm người quản lý trực tiếp');
  }
  const sub = await mongoose.model('NhanVien').findById(subId);
  const manager = await mongoose.model('NhanVien').findById(directManagerId.trim());
  if (!sub || !manager) throw httpError(404, 'Không có nhân viên');
  const mTk = await mongoose.model('TaiKhoan').findOne({ nhanVien: manager._id });
  if (!mTk || String(mTk.role || '').toUpperCase() !== 'EMPLOYEE') {
    throw httpError(400, 'Người quản lý trực tiếp phải là tài khoản vai trò EMPLOYEE');
  }
  sub.nguoiQuanLyTruocTiep = manager._id;
  await sub.save();
  const out = await mongoose.model('TaiKhoan').findOne({ nhanVien: sub._id }).populate('nhanVien');
  return toResponse(out.toObject());
}

async function updateRole(maTaiKhoan, newRole, actorUsername) {
  if (!newRole || !ROLES.has(newRole.trim().toUpperCase())) throw httpError(400, 'Role không hợp lệ');
  const tk = await getTaiKhoanOr404(maTaiKhoan);
  const nr = newRole.toUpperCase();
  const old = (tk.role || '').toUpperCase();
  if (old === 'ADMIN' && nr !== 'ADMIN') {
    const admins = await mongoose.model('TaiKhoan').countDocuments({ role: /^ADMIN$/i });
    if (admins <= 1) throw httpError(400, 'Không thể đổi role — còn duy nhất một tài khoản ADMIN');
  }
  forbidSelf(tk.username, actorUsername, 'Không thể đổi role chính mình từ giao diện này');
  tk.role = nr;
  await tk.save();
}

export async function assignNhanVien(maTaiKhoan, nhanVienId, actorUsername) {
  const tk = await getTaiKhoanOr404(maTaiKhoan);
  if (!nhanVienId?.trim()) {
    if (String(tk.role || '').toUpperCase() !== 'ADMIN') {
      throw httpError(400, 'Bắt buộc gán nhân viên cho role không phải ADMIN');
    }
    tk.nhanVien = null;
    await tk.save();
    return toResponse((await mongoose.model('TaiKhoan').findById(maTaiKhoan)).toObject());
  }
  const nv = await mongoose.model('NhanVien').findById(nhanVienId.trim());
  if (!nv) throw httpError(404, 'Không có nhân viên');
  const other = await mongoose.model('TaiKhoan').findOne({ nhanVien: nv._id });
  if (other && String(other._id) !== String(tk._id)) throw httpError(409, 'Nhân viên đã gán cho tài khoản khác');
  tk.nhanVien = nv._id;
  await tk.save();
  const full = await mongoose.model('TaiKhoan').findById(tk._id).populate('nhanVien');
  return toResponse(full.toObject());
}

export async function deleteAccount(maTaiKhoan, actorUsername) {
  const tk = await getTaiKhoanOr404(maTaiKhoan);
  forbidSelf(tk.username, actorUsername, 'Không thể xóa chính tài khoản đang đăng nhập');
  if (String(tk.role || '').toUpperCase() === 'ADMIN') {
    const admins = await mongoose.model('TaiKhoan').countDocuments({ role: /^ADMIN$/i });
    if (admins <= 1) throw httpError(400, 'Không thể xóa — còn duy nhất một tài khoản ADMIN');
  }
  tk.nhanVien = null;
  await tk.save();
  await mongoose.model('TaiKhoan').deleteOne({ _id: tk._id });
}

export async function resetPassword(maTaiKhoan, optionalNewPassword) {
  const tk = await getTaiKhoanOr404(maTaiKhoan);
  let raw =
    optionalNewPassword && String(optionalNewPassword).trim()
      ? String(optionalNewPassword).trim()
      : randomPassword(10);
  if (raw.length < 6) throw httpError(400, 'Mật khẩu tối thiểu 6 ký tự');
  tk.password = bcrypt.hashSync(raw, 10);
  tk.resetToken = null;
  tk.resetTokenExpiry = null;
  await tk.save();
  return raw;
}

export async function listDirectManagerCandidates() {
  const list = await mongoose
    .model('TaiKhoan')
    .find({ role: /^EMPLOYEE$/i, nhanVien: { $ne: null } })
    .populate('nhanVien');
  return list.map((t) => ({
    id: t.nhanVien?._id,
    hoTen: t.nhanVien?.hoTen || '',
  }));
}

export async function listEmployeesWithAccountsBrief() {
  const list = await mongoose.model('TaiKhoan').find({ nhanVien: { $ne: null } }).populate('nhanVien');
  return list.map((t) => ({ id: t.nhanVien?._id, hoTen: t.nhanVien?.hoTen || '' }));
}

export async function listSubordinatesBrief(managerNhanVienId) {
  if (!managerNhanVienId?.trim()) return [];
  const list = await mongoose
    .model('NhanVien')
    .find({ nguoiQuanLyTruocTiep: managerNhanVienId.trim() })
    .lean();
  return list.map((n) => ({ id: n._id, hoTen: n.hoTen || '' }));
}

export async function listUngVienSubordinateBrief(managerNhanVienId) {
  if (!managerNhanVienId?.trim()) return [];
  const mids = managerNhanVienId.trim();
  const tks = await mongoose.model('TaiKhoan').find({ role: /^EMPLOYEE$/i, nhanVien: { $ne: null } }).lean();
  const empIds = new Set(tks.map((t) => String(t.nhanVien)));
  const all = await mongoose.model('NhanVien').find({ trangThaiHoatDong: { $ne: 'DA_NGHI_VIEC' } }).lean();
  return all
    .filter(
      (n) =>
        empIds.has(String(n._id)) &&
        String(n._id) !== mids &&
        (!n.nguoiQuanLyTruocTiep || String(n.nguoiQuanLyTruocTiep) === mids)
    )
    .map((n) => ({ id: n._id, hoTen: n.hoTen || '' }));
}

export async function updateManagedSubordinates(managerAccountId, subordinateIds, actorUsername) {
  const managerTk = await getTaiKhoanOr404(managerAccountId);
  const managerNvId = managerTk.nhanVien;
  if (!managerNvId) throw httpError(400, 'Tài khoản này chưa được gán nhân viên');
  const wanted = new Set((subordinateIds || []).map((x) => String(x).trim()).filter(Boolean));
  if (wanted.has(String(managerNvId))) throw httpError(400, 'Không thể chọn chính mình làm nhân viên quản lý');

  for (const subId of wanted) {
    const sub = await mongoose.model('NhanVien').findById(subId);
    if (!sub) throw httpError(404, `Không có nhân viên: ${subId}`);
    const tk = await mongoose.model('TaiKhoan').findOne({ nhanVien: sub._id });
    if (!tk) throw httpError(400, `Nhân viên ${subId} chưa có tài khoản`);
    sub.nguoiQuanLyTruocTiep = managerNvId;
    await sub.save();
  }

  const current = await mongoose.model('NhanVien').find({ nguoiQuanLyTruocTiep: managerNvId });
  for (const cur of current) {
    if (!wanted.has(String(cur._id))) {
      cur.nguoiQuanLyTruocTiep = null;
      await cur.save();
    }
  }
}

async function getTaiKhoanOr404(ma) {
  const tk = await mongoose.model('TaiKhoan').findById(ma).populate('nhanVien');
  if (!tk) throw httpError(404, 'Không tìm thấy tài khoản');
  return tk;
}

function forbidSelf(targetUsername, actorUsername, msg) {
  if (actorUsername && targetUsername?.toLowerCase() === actorUsername.toLowerCase()) {
    throw httpError(400, msg);
  }
}

function randomPassword(len) {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}
