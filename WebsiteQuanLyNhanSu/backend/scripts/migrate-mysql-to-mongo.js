/**
 * Đọc dữ liệu từ MySQL (schema hrm_system) và ghi sang MongoDB (collection trùng tên bảng).
 * Chạy: npm run migrate  (cần MYSQL_* và MONGODB_URI trong .env)
 */
import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerModels } from '../src/models/schemas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

function d(v) {
  if (v == null) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return new Date(v);
  return v;
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm_system';
  registerModels();
  await mongoose.connect(mongoUri);
  await mongoose.connection.dropDatabase();

  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'hrm_system',
  });

  const [rowsChi] = await conn.query('SELECT * FROM chi_nhanh');
  for (const r of rowsChi) {
    await mongoose.model('ChiNhanh').create({
      _id: r.id,
      tenChiNhanh: r.ten_chi_nhanh,
      diaChi: r.dia_chi,
    });
  }
  console.log('chi_nhanh:', rowsChi.length);

  const [rowsPb] = await conn.query('SELECT * FROM phong_ban');
  for (const r of rowsPb) {
    await mongoose.model('PhongBan').create({
      _id: r.id,
      tenPhongBan: r.ten_phong_ban,
      chiNhanh: r.chi_nhanh_id || undefined,
    });
  }
  console.log('phong_ban:', rowsPb.length);

  const [rowsNhom] = await conn.query('SELECT * FROM nhom');
  for (const r of rowsNhom) {
    await mongoose.model('Nhom').create({
      _id: r.id,
      tenNhom: r.ten_nhom,
      phongBan: r.phong_ban_id || undefined,
    });
  }
  console.log('nhom:', rowsNhom.length);

  const [rowsCv] = await conn.query('SELECT * FROM chuc_vu');
  for (const r of rowsCv) {
    await mongoose.model('ChucVu').create({
      _id: r.id,
      tenChucVu: r.ten_chuc_vu,
    });
  }
  console.log('chuc_vu:', rowsCv.length);

  const [rowsBl] = await conn.query('SELECT * FROM bang_luong');
  for (const r of rowsBl) {
    await mongoose.model('BangLuong').create({
      _id: r.id,
      tenChucVu: r.ten_chuc_vu,
      luongCoBan: r.luong_co_ban,
      phuCapDinhMuc: r.phu_cap_dinh_muc,
    });
  }
  console.log('bang_luong:', rowsBl.length);

  const [rowsNv] = await conn.query('SELECT * FROM nhan_vien');
  for (const r of rowsNv) {
    await mongoose.model('NhanVien').create({
      _id: r.id,
      hoTen: r.ho_ten,
      gioiTinh: r.gioi_tinh,
      soCccd: r.so_cccd,
      ngayCap: d(r.ngay_cap),
      noiCap: r.noi_cap,
      ngaySinh: d(r.ngay_sinh),
      soDienThoai: r.so_dien_thoai,
      emailCongViec: r.email_cong_viec,
      diaChiTamTru: r.dia_chi_tam_tru,
      anhDaiDienUrl: r.anh_dai_dien_url,
      ngayVaoLam: d(r.ngay_vao_lam),
      soNgayPhepConLai: r.so_ngay_phep_con_lai,
      trangThaiHoatDong: r.trang_thai_hoat_dong,
      heSoLuong: r.he_so_luong,
      phongBan: r.phong_ban_id || undefined,
      nhom: r.nhom_id || undefined,
      chucVu: r.chuc_vu_id || undefined,
      bangLuong: r.bang_luong_id || undefined,
      nguoiQuanLyTruocTiep: r.nguoi_quan_ly_truoc_tiep_id || undefined,
    });
  }
  console.log('nhan_vien:', rowsNv.length);

  const [rowsTk] = await conn.query('SELECT * FROM taikhoan');
  for (const r of rowsTk) {
    await mongoose.model('TaiKhoan').create({
      _id: r.ma_tai_khoan,
      username: r.username,
      password: r.password,
      role: r.role,
      resetToken: r.reset_token,
      resetTokenExpiry: d(r.reset_token_expiry),
      trangThaiTaiKhoan: !!r.trang_thai_tai_khoan,
      ngayTao: d(r.ngay_tao),
      nhanVien: r.id_nhan_vien || undefined,
    });
  }
  console.log('taikhoan:', rowsTk.length);

  const [rowsPl] = await conn.query('SELECT * FROM phieu_luong');
  for (const r of rowsPl) {
    await mongoose.model('PhieuLuong').create({
      _id: r.id,
      thangNam: r.thang_nam,
      luongCoBan: r.luong_co_ban,
      phuCap: r.phu_cap,
      phatMuon: r.phat_muon,
      nghiKhongPhep: r.nghi_khong_phep,
      tongLuong: r.tong_luong,
      trangThaiThanhToan: r.trang_thai_thanh_toan,
      nhanVien: r.nhan_vien_id,
    });
  }
  console.log('phieu_luong:', rowsPl.length);

  const [rowsCc] = await conn.query('SELECT * FROM cham_cong');
  for (const r of rowsCc) {
    await mongoose.model('ChamCong').create({
      _id: r.id,
      nhanVien: r.nhan_vien_id,
      ngay: d(r.ngay_cham_cong),
      gioVao: r.gio_vao ? String(r.gio_vao).slice(0, 8) : undefined,
      gioRa: r.gio_ra ? String(r.gio_ra).slice(0, 8) : undefined,
      trangThai: r.trang_thai,
    });
  }
  console.log('cham_cong:', rowsCc.length);

  const [rowsDn] = await conn.query('SELECT * FROM don_nghi_phep');
  for (const r of rowsDn) {
    await mongoose.model('DonNghiPhep').create({
      _id: r.id,
      nhanVien: r.nhan_vien_id,
      loaiNghi: r.loai_nghi,
      tuNgay: d(r.tu_ngay),
      denNgay: d(r.den_ngay),
      lyDo: r.ly_do,
      trangThai: r.trang_thai,
      nguoiDuyet: r.nguoi_duyet_id || undefined,
    });
  }
  console.log('don_nghi_phep:', rowsDn.length);

  const [rowsTb] = await conn.query('SELECT * FROM thong_bao');
  for (const r of rowsTb) {
    await mongoose.model('ThongBao').create({
      _id: r.id,
      nguoiNhan: r.nguoi_nhan,
      tieuDe: r.tieu_de,
      noiDung: r.noi_dung,
      loai: r.loai,
      daDoc: !!r.da_doc,
      ngayTao: d(r.ngay_tao),
      refPayload: r.ref_payload,
    });
  }
  console.log('thong_bao:', rowsTb.length);

  const [rowsQd] = await conn.query('SELECT * FROM quyet_dinh');
  for (const r of rowsQd) {
    await mongoose.model('QuyetDinh').create({
      _id: r.so_quyet_dinh,
      nhanVien: r.nhan_vien_id,
      loaiQuyetDinh: r.loai_quyet_dinh,
      ngayKy: d(r.ngay_ky),
      noiDungQuyetDinh: r.noi_dung_quyet_dinh,
      nguoiKy: r.nguoi_ky,
      noiDung: r.noi_dung,
      soTien: r.so_tien,
    });
  }
  console.log('quyet_dinh:', rowsQd.length);

  const [rowsLs] = await conn.query('SELECT * FROM lich_su_cong_tac');
  for (const r of rowsLs) {
    await mongoose.model('LichSuCongTac').create({
      _id: r.id,
      nhanVien: r.nhan_vien_id,
      tuNgay: d(r.tu_ngay),
      denNgay: d(r.den_ngay),
      phongBanCu: r.phong_ban_cu,
      phongBanMoi: r.phong_ban_moi,
      chucVuCu: r.chuc_vu_cu,
      chucVuMoi: r.chuc_vu_moi,
      ghiChu: r.ghi_chu,
    });
  }
  console.log('lich_su_cong_tac:', rowsLs.length);

  const [rowsYc] = await conn.query('SELECT * FROM yeu_cau_tuyen_dung');
  for (const r of rowsYc) {
    const id = r.id_yeu_cau;
    await mongoose.model('YeuCauTuyenDung').create({
      _id: id,
      idYeuCau: id,
      viTriCanTuyen: r.vi_tri_can_tuyen,
      soLuong: r.so_luong,
      trinhDoYeuCau: r.trinh_do_yeu_cau,
      trangThai: r.trang_thai,
      moTa: r.mo_ta,
      ngayYeuCau: d(r.ngay_yeu_cau),
      phongBan: r.phong_ban_id || undefined,
    });
  }
  console.log('yeu_cau_tuyen_dung:', rowsYc.length);

  let rowsHs;
  try {
    ;[rowsHs] = await conn.query(
      'SELECT id, ho_ten, email, `so_dien-thoai` AS sdt, cv_url, trang_thai, ngay_nop, id_yeu_cau FROM ho_so_ung_vien'
    );
  } catch {
    ;[rowsHs] = await conn.query('SELECT * FROM ho_so_ung_vien');
    rowsHs = rowsHs.map((r) => ({
      ...r,
      sdt: r.sdt ?? r['so_dien-thoai'] ?? r.so_dien_thoai,
    }));
  }
  const hoSoMongoIdByMysqlId = new Map();
  for (const r of rowsHs) {
    const sdt = r.sdt ?? r['so_dien-thoai'] ?? r.so_dien_thoai;
    const doc = await mongoose.model('HoSoUngVien').create({
      _id: r.id,
      hoTen: r.ho_ten,
      email: r.email,
      soDienThoai: sdt,
      cvUrl: r.cv_url,
      trangThai: r.trang_thai,
      ngayNop: d(r.ngay_nop),
      yeuCauTuyenDung: r.id_yeu_cau || undefined,
    });
    hoSoMongoIdByMysqlId.set(String(r.id), doc._id);
  }
  console.log('ho_so_ung_vien:', rowsHs.length);

  const [rowsLp] = await conn.query('SELECT * FROM lich_phong_van');
  for (const r of rowsLp) {
    const uvKey = r.id_ung_vien != null ? String(r.id_ung_vien) : '';
    const ungVienOid = hoSoMongoIdByMysqlId.get(uvKey) || r.id_ung_vien;
    await mongoose.model('LichPhongVan').create({
      _id: r.id_lich,
      idLich: r.id_lich,
      thoiGian: d(r.thoi_gian),
      diaDiem: r.dia_diem,
      ghiChu: r.ghi_chu,
      ungVien: ungVienOid,
      nguoiPhongVan: r.nguoi_phong_van,
    });
  }
  console.log('lich_phong_van:', rowsLp.length);

  await conn.end();
  await mongoose.disconnect();
  console.log('Done. MongoDB tại', mongoUri);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
