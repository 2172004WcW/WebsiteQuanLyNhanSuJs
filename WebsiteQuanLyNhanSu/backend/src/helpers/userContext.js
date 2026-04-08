import mongoose from 'mongoose';

const POP_NV = [
  { path: 'phongBan' },
  { path: 'chucVu' },
  { path: 'nhom' },
  { path: 'bangLuong' },
  { path: 'nguoiQuanLyTruocTiep', select: 'id hoTen' },
];

export async function findTaiKhoanByUsername(username) {
  if (!username) return null;
  return mongoose
    .model('TaiKhoan')
    .findOne({ username })
    .populate({ path: 'nhanVien', populate: POP_NV });
}

export async function findNhanVienByUsername(username) {
  const tk = await findTaiKhoanByUsername(username);
  return tk?.nhanVien || null;
}

export async function populateNhanVienDoc(nv) {
  if (!nv) return null;
  return mongoose.model('NhanVien').findById(nv._id || nv.id || nv).populate(POP_NV);
}
