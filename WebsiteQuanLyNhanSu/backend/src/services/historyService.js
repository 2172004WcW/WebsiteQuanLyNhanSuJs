import mongoose from 'mongoose';

export async function banHanhQuyetDinh(qd, phongBanMoiId, chucVuMoiId) {
  const NhanVien = mongoose.model('NhanVien');
  const nvId = qd.nhanVien?.id || qd.nhanVien?._id || qd.nhanVien;
  const nv = await NhanVien.findById(nvId).populate(['phongBan', 'chucVu']);
  if (!nv) throw new Error('Nhân viên không tồn tại');

  const loaiQd = String(qd.loaiQuyetDinh || '');
  const LichSuCongTac = mongoose.model('LichSuCongTac');

  if (loaiQd.toUpperCase() === 'DIEU_CHUYEN') {
    const lsData = {
      nhanVien: nv._id,
      tuNgay: qd.ngayKy || new Date(),
      phongBanCu: nv.phongBan?.tenPhongBan || 'Chưa có',
      chucVuCu: nv.chucVu?.tenChucVu || 'Chưa có',
      ghiChu: `Theo quyết định: ${qd.soQuyetDinh}`,
    };
    if (phongBanMoiId) {
      const pb = await mongoose.model('PhongBan').findById(phongBanMoiId);
      if (pb) {
        nv.phongBan = pb._id;
        lsData.phongBanMoi = pb.tenPhongBan;
      }
    }
    if (chucVuMoiId) {
      const cv = await mongoose.model('ChucVu').findById(chucVuMoiId);
      if (cv) {
        nv.chucVu = cv._id;
        lsData.chucVuMoi = cv.tenChucVu;
      }
    }
    await LichSuCongTac.create(lsData);
    await nv.save();
  } else if (loaiQd.toUpperCase() === 'THOI_VIEC') {
    nv.trangThaiHoatDong = 'DA_NGHI_VIEC';
    await nv.save();
  } else if (loaiQd.toUpperCase() === 'KHEN_THUONG' || loaiQd.toUpperCase() === 'KY_LUAT') {
    await LichSuCongTac.create({
      nhanVien: nv._id,
      tuNgay: qd.ngayKy || new Date(),
      ghiChu: `[${loaiQd}] ${qd.noiDungQuyetDinh || ''}`,
    });
  }

  const id = qd.soQuyetDinh;
  return mongoose.model('QuyetDinh').findOneAndUpdate(
    { _id: id },
    {
      $set: {
        nhanVien: nv._id,
        loaiQuyetDinh: qd.loaiQuyetDinh,
        ngayKy: qd.ngayKy,
        noiDungQuyetDinh: qd.noiDungQuyetDinh,
        nguoiKy: qd.nguoiKy,
        noiDung: qd.noiDung,
        soTien: qd.soTien,
      },
    },
    { upsert: true, new: true }
  );
}

export async function getLichSuByNhanVien(nhanVienId) {
  return mongoose.model('LichSuCongTac').find({ nhanVien: nhanVienId }).populate('nhanVien');
}

export async function getAllQuyetDinh(nhanVienId) {
  const q = nhanVienId?.trim() ? { nhanVien: nhanVienId } : {};
  const list = await mongoose.model('QuyetDinh').find(q).populate('nhanVien').lean();
  list.sort((a, b) => {
    const da = a.ngayKy ? new Date(a.ngayKy).getTime() : 0;
    const db = b.ngayKy ? new Date(b.ngayKy).getTime() : 0;
    return db - da;
  });
  return list.map((qd) => ({
    soQuyetDinh: qd._id,
    loaiQuyetDinh: qd.loaiQuyetDinh,
    ngayKy: qd.ngayKy,
    noiDungQuyetDinh: qd.noiDungQuyetDinh,
    nguoiKy: qd.nguoiKy,
    noiDung: qd.noiDung,
    soTien: qd.soTien,
    nhanVienId: qd.nhanVien?._id || qd.nhanVien,
    tenNhanVien: qd.nhanVien?.hoTen || null,
  }));
}
