import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

export async function onboardEmployee(body) {
  let id = body.id || body._id;
  if (!id) id = `NV-${randomUUID().replace(/-/g, '').slice(0, 5).toUpperCase()}`;
  const doc = {
    _id: id,
    hoTen: body.hoTen,
    gioiTinh: body.gioiTinh,
    soCccd: body.soCccd,
    ngayCap: body.ngayCap,
    noiCap: body.noiCap,
    ngaySinh: body.ngaySinh,
    soDienThoai: body.soDienThoai,
    emailCongViec: body.emailCongViec,
    diaChiTamTru: body.diaChiTamTru,
    anhDaiDienUrl: body.anhDaiDienUrl,
    ngayVaoLam: body.ngayVaoLam,
    soNgayPhepConLai: body.soNgayPhepConLai || 12,
    trangThaiHoatDong: body.trangThaiHoatDong || 'DANG_LAM_VIEC',
    heSoLuong: body.heSoLuong,
    phongBan: body.phongBan?.id || body.phongBan,
    nhom: body.nhom?.id || body.nhom,
    chucVu: body.chucVu?.id || body.chucVu,
    bangLuong: body.bangLuong?.id || body.bangLuong,
    nguoiQuanLyTruocTiep: body.nguoiQuanLyTruocTiep?.id || body.nguoiQuanLyTruocTiep,
  };
  return mongoose.model('NhanVien').create(doc);
}

export async function updateProfile(id, updatedInfo) {
  const existing = await mongoose.model('NhanVien').findById(id);
  if (!existing) throw new Error('Không tìm thấy nhân viên');
  if (updatedInfo.soDienThoai != null) existing.soDienThoai = updatedInfo.soDienThoai;
  if (updatedInfo.emailCongViec != null) existing.emailCongViec = updatedInfo.emailCongViec;
  if (updatedInfo.diaChiTamTru != null) existing.diaChiTamTru = updatedInfo.diaChiTamTru;
  if (updatedInfo.anhDaiDienUrl != null) existing.anhDaiDienUrl = updatedInfo.anhDaiDienUrl;
  if (updatedInfo.soCccd != null) existing.soCccd = updatedInfo.soCccd;
  await existing.save();
  return existing;
}

export async function getEmployeeById(id) {
  const nv = await mongoose.model('NhanVien').findById(id).populate(['phongBan', 'chucVu']);
  if (!nv) throw new Error(`Không tìm thấy nhân viên với mã: ${id}`);
  return nv;
}

export async function getAllEmployees() {
  return mongoose.model('NhanVien').find({ trangThaiHoatDong: { $ne: 'DA_NGHI_VIEC' } }).populate(['phongBan', 'chucVu']);
}

export async function setBangLuongForEmployee(employeeId, bangLuongId) {
  const nv = await mongoose.model('NhanVien').findById(employeeId);
  if (!nv) throw new Error('Không tìm thấy nhân viên');
  if (!bangLuongId?.trim()) {
    nv.bangLuong = null;
    await nv.save();
    return;
  }
  const bl = await mongoose.model('BangLuong').findById(bangLuongId.trim());
  if (!bl) throw new Error('Không tìm thấy bảng lương');
  nv.bangLuong = bl._id;
  await nv.save();
}
