import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

function gen4() {
  return randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
}

export const listChiNhanh = () => mongoose.model('ChiNhanh').find({});
export const listPhongBan = () => mongoose.model('PhongBan').find({}).populate('chiNhanh');
export const listNhom = () => mongoose.model('Nhom').find({}).populate('phongBan');
export const listChucVu = () => mongoose.model('ChucVu').find({});

export async function createChiNhanh(cn) {
  if (!cn.id && !cn._id) cn._id = `CN-${gen4()}`;
  const id = cn.id || cn._id;
  return mongoose.model('ChiNhanh').create({ _id: id, tenChiNhanh: cn.tenChiNhanh, diaChi: cn.diaChi });
}

export async function updateChiNhanh(id, body) {
  const e = await mongoose.model('ChiNhanh').findById(id);
  if (!e) throw new Error(`Không tìm thấy chi nhánh: ${id}`);
  if (body.tenChiNhanh != null) e.tenChiNhanh = body.tenChiNhanh;
  if (body.diaChi != null) e.diaChi = body.diaChi;
  await e.save();
  return e;
}

export async function deleteChiNhanh(id) {
  await mongoose.model('ChiNhanh').deleteOne({ _id: id });
}

export async function createPhongBan(pb) {
  if (!pb.id && !pb._id) pb._id = `PB-${gen4()}`;
  const id = pb.id || pb._id;
  let chi = null;
  if (pb.chiNhanh?.id) chi = pb.chiNhanh.id;
  if (typeof pb.chiNhanh === 'string') chi = pb.chiNhanh;
  return mongoose.model('PhongBan').create({ _id: id, tenPhongBan: pb.tenPhongBan, chiNhanh: chi });
}

export async function updatePhongBan(id, body) {
  const e = await mongoose.model('PhongBan').findById(id);
  if (!e) throw new Error(`Không tìm thấy phòng ban: ${id}`);
  if (body.tenPhongBan != null) e.tenPhongBan = body.tenPhongBan;
  if (body.chiNhanh?.id) {
    const cn = await mongoose.model('ChiNhanh').findById(body.chiNhanh.id);
    if (!cn) throw new Error('Chi nhánh không tồn tại');
    e.chiNhanh = cn._id;
  }
  await e.save();
  return e;
}

export async function deletePhongBan(id) {
  await mongoose.model('PhongBan').deleteOne({ _id: id });
}

export async function createNhom(nhom) {
  if (!nhom.id && !nhom._id) nhom._id = `NH-${gen4()}`;
  const id = nhom.id || nhom._id;
  let pb = null;
  if (nhom.phongBan?.id) pb = nhom.phongBan.id;
  if (typeof nhom.phongBan === 'string') pb = nhom.phongBan;
  return mongoose.model('Nhom').create({ _id: id, tenNhom: nhom.tenNhom, phongBan: pb });
}

export async function updateNhom(id, body) {
  const e = await mongoose.model('Nhom').findById(id);
  if (!e) throw new Error(`Không tìm thấy nhóm: ${id}`);
  if (body.tenNhom != null) e.tenNhom = body.tenNhom;
  if (body.phongBan?.id) {
    const pb = await mongoose.model('PhongBan').findById(body.phongBan.id);
    if (!pb) throw new Error('Phòng ban không tồn tại');
    e.phongBan = pb._id;
  }
  await e.save();
  return e;
}

export async function deleteNhom(id) {
  await mongoose.model('Nhom').deleteOne({ _id: id });
}

export async function createChucVu(cv) {
  if (!cv.id && !cv._id) cv._id = `CV-${gen4()}`;
  const id = cv.id || cv._id;
  return mongoose.model('ChucVu').create({ _id: id, tenChucVu: cv.tenChucVu });
}

export async function updateChucVu(id, body) {
  const e = await mongoose.model('ChucVu').findById(id);
  if (!e) throw new Error(`Không tìm thấy chức vụ: ${id}`);
  if (body.tenChucVu != null) e.tenChucVu = body.tenChucVu;
  await e.save();
  return e;
}

export async function deleteChucVu(id) {
  await mongoose.model('ChucVu').deleteOne({ _id: id });
}
