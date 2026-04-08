/**
 * Nạp dữ liệu mẫu cho TẤT CẢ collection MongoDB (theo `src/models/schemas.js`).
 *
 * Cách chạy:
 *   npm run seed:demo
 *
 * Xóa hết collection liên quan rồi nạp lại (MẤT DỮ LIỆU CŨ):
 *   npm run seed:demo:reset
 *   hoặc: SEED_DEMO_RESET=1 npm run seed:demo   (Linux/macOS)
 *
 * Cần MongoDB + file `backend/.env` có MONGODB_URI
 * (mặc định: mongodb://127.0.0.1:27017/hrm_system)
 *
 * ── Tài khoản sau khi seed ──
 *   admin      / Admin@123   → ADMIN     (không gán nhân viên)
 *   director   / Demo@123    → DIRECTOR  (NV001 Nguyễn Giám Đốc)
 *   hr         / Demo@123    → HR        (NV002 Trần Nhân Sự)
 *   nhanvien   / Demo@123    → EMPLOYEE  (NV003 Lê Nhân Viên)
 *
 * (Mật khẩu role thường đổi bằng biến DEMO_PASSWORD, mặc định Demo@123)
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerModels } from '../src/models/schemas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm_system';
const demoPassword = (process.env.DEMO_PASSWORD || 'Demo@123').trim();
const adminPassword = (process.env.SEED_ADMIN_PASSWORD || 'Admin@123').trim();
const reset =
  process.env.SEED_DEMO_RESET === '1' ||
  process.env.SEED_DEMO_RESET === 'true' ||
  process.argv.includes('--reset');

const COLLECTIONS_CLEAR_ORDER = [
  'login_log',
  'lich_phong_van',
  'ho_so_ung_vien',
  'yeu_cau_tuyen_dung',
  'lich_su_cong_tac',
  'quyet_dinh',
  'thong_bao',
  'don_nghi_phep',
  'cham_cong',
  'phieu_luong',
  'taikhoan',
  'nhan_vien',
  'bang_luong',
  'chuc_vu',
  'nhom',
  'phong_ban',
  'chi_nhanh',
];

function hash(p) {
  return bcrypt.hashSync(p, 10);
}

async function clearAll(db) {
  for (const name of COLLECTIONS_CLEAR_ORDER) {
    try {
      await db.collection(name).deleteMany({});
      console.log('  Đã xóa:', name);
    } catch (e) {
      if (e.codeName !== 'NamespaceNotFound') console.warn('  ', name, e.message);
    }
  }
}

async function main() {
  registerModels();
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  const ChiNhanh = mongoose.model('ChiNhanh');
  if (!reset && (await ChiNhanh.countDocuments()) > 0) {
    console.log('Database đã có dữ liệu (chi_nhanh).');
    console.log('Chạy: npm run seed:demo:reset  để xóa và nạp lại toàn bộ.');
    await mongoose.disconnect();
    return;
  }

  if (reset) {
    console.log('SEED_DEMO_RESET: xóa các collection…');
    await clearAll(db);
  }

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const thangHienTai = `${y}-${String(m).padStart(2, '0')}`;
  const thangTruoc = new Date(y, m - 2, 1);
  const thangTruocStr = `${thangTruoc.getFullYear()}-${String(thangTruoc.getMonth() + 1).padStart(2, '0')}`;

  await ChiNhanh.create({
    _id: 'CN01',
    tenChiNhanh: 'Chi nhánh Hà Nội',
    diaChi: '123 Đường Láng, Đống Đa, Hà Nội',
  });
  await ChiNhanh.create({
    _id: 'CN02',
    tenChiNhanh: 'Chi nhánh TP.HCM',
    diaChi: '456 Nguyễn Huệ, Q.1, TP.HCM',
  });
  await ChiNhanh.create({ _id: 'CN03', tenChiNhanh: 'Chi nhánh Đà Nẵng', diaChi: '789 Nguyễn Văn Linh, Hải Châu, Đà Nẵng' });
  await ChiNhanh.create({ _id: 'CN04', tenChiNhanh: 'Chi nhánh Hải Phòng', diaChi: '12 Lê Hồng Phong, Ngô Quyền, Hải Phòng' });
  await ChiNhanh.create({ _id: 'CN05', tenChiNhanh: 'Chi nhánh Cần Thơ', diaChi: '34 Nguyễn Trãi, Ninh Kiều, Cần Thơ' });
  await ChiNhanh.create({ _id: 'CN06', tenChiNhanh: 'Chi nhánh Nha Trang', diaChi: '56 Trần Phú, Lộc Thọ, Nha Trang' });
  await ChiNhanh.create({ _id: 'CN07', tenChiNhanh: 'Chi nhánh Huế', diaChi: '78 Hùng Vương, Phú Nhuận, Huế' });
  await ChiNhanh.create({ _id: 'CN08', tenChiNhanh: 'Chi nhánh Vũng Tàu', diaChi: '90 Lê Lợi, Thắng Tam, Vũng Tàu' });
  await ChiNhanh.create({ _id: 'CN09', tenChiNhanh: 'Chi nhánh Biên Hòa', diaChi: '11 Võ Thị Sáu, Quyết Thắng, Biên Hòa' });
  await ChiNhanh.create({ _id: 'CN10', tenChiNhanh: 'Chi nhánh Bình Dương', diaChi: '22 Phú Lợi, Thủ Dầu Một, Bình Dương' });
  await ChiNhanh.create({ _id: 'CN11', tenChiNhanh: 'Chi nhánh Long An', diaChi: '33 Hùng Vương, Tân An, Long An' });
  await ChiNhanh.create({ _id: 'CN12', tenChiNhanh: 'Chi nhánh Bà Rịa', diaChi: '44 Lý Thường Kiệt, Phước Trung, Bà Rịa' });
  console.log('chi_nhanh: 12');

  await mongoose.model('PhongBan').create({
    _id: 'PB01',
    tenPhongBan: 'Phòng Nhân sự',
    chiNhanh: 'CN01',
  });
  await mongoose.model('PhongBan').create({
    _id: 'PB02',
    tenPhongBan: 'Phòng Kinh doanh',
    chiNhanh: 'CN01',
  });
  await mongoose.model('PhongBan').create({ _id: 'PB03', tenPhongBan: 'Phòng Kỹ thuật', chiNhanh: 'CN01' });
  await mongoose.model('PhongBan').create({ _id: 'PB04', tenPhongBan: 'Phòng Marketing', chiNhanh: 'CN02' });
  await mongoose.model('PhongBan').create({ _id: 'PB05', tenPhongBan: 'Phòng Tài chính', chiNhanh: 'CN02' });
  await mongoose.model('PhongBan').create({ _id: 'PB06', tenPhongBan: 'Phòng Kế toán', chiNhanh: 'CN03' });
  await mongoose.model('PhongBan').create({ _id: 'PB07', tenPhongBan: 'Phòng IT', chiNhanh: 'CN03' });
  await mongoose.model('PhongBan').create({ _id: 'PB08', tenPhongBan: 'Phòng Pháp chế', chiNhanh: 'CN04' });
  await mongoose.model('PhongBan').create({ _id: 'PB09', tenPhongBan: 'Phòng R&D', chiNhanh: 'CN04' });
  await mongoose.model('PhongBan').create({ _id: 'PB10', tenPhongBan: 'Phòng CSKH', chiNhanh: 'CN05' });
  await mongoose.model('PhongBan').create({ _id: 'PB11', tenPhongBan: 'Phòng Logistics', chiNhanh: 'CN05' });
  await mongoose.model('PhongBan').create({ _id: 'PB12', tenPhongBan: 'Phòng QA/QC', chiNhanh: 'CN06' });
  console.log('phong_ban: 12');

  await mongoose.model('Nhom').create({
    _id: 'NH01',
    tenNhom: 'Nhóm Tuyển dụng',
    phongBan: 'PB01',
  });
  await mongoose.model('Nhom').create({ _id: 'NH02', tenNhom: 'Nhóm Đào tạo', phongBan: 'PB01' });
  await mongoose.model('Nhom').create({ _id: 'NH03', tenNhom: 'Nhóm Lập trình', phongBan: 'PB03' });
  await mongoose.model('Nhom').create({ _id: 'NH04', tenNhom: 'Nhóm Mobile', phongBan: 'PB07' });
  await mongoose.model('Nhom').create({ _id: 'NH05', tenNhom: 'Nhóm Web', phongBan: 'PB07' });
  await mongoose.model('Nhom').create({ _id: 'NH06', tenNhom: 'Nhóm Digital Marketing', phongBan: 'PB04' });
  await mongoose.model('Nhom').create({ _id: 'NH07', tenNhom: 'Nhóm Content', phongBan: 'PB04' });
  await mongoose.model('Nhom').create({ _id: 'NH08', tenNhom: 'Nhóm Bán hàng', phongBan: 'PB02' });
  await mongoose.model('Nhom').create({ _id: 'NH09', tenNhom: 'Nhóm Kế toán', phongBan: 'PB06' });
  await mongoose.model('Nhom').create({ _id: 'NH10', tenNhom: 'Nhóm Kiểm toán', phongBan: 'PB06' });
  await mongoose.model('Nhom').create({ _id: 'NH11', tenNhom: 'Nhóm Nghiên cứu', phongBan: 'PB09' });
  console.log('nhom: 11');

  await mongoose.model('ChucVu').create({ _id: 'CV_GD', tenChucVu: 'Giám đốc' });
  await mongoose.model('ChucVu').create({ _id: 'CV_HR', tenChucVu: 'Nhân viên HR' });
  await mongoose.model('ChucVu').create({ _id: 'CV_NV', tenChucVu: 'Nhân viên' });
  await mongoose.model('ChucVu').create({ _id: 'CV_TP', tenChucVu: 'Trưởng phòng' });
  await mongoose.model('ChucVu').create({ _id: 'CV_PP', tenChucVu: 'Phó phòng' });
  await mongoose.model('ChucVu').create({ _id: 'CV_TN', tenChucVu: 'Trưởng nhóm' });
  await mongoose.model('ChucVu').create({ _id: 'CV_LT', tenChucVu: 'Lập trình viên' });
  await mongoose.model('ChucVu').create({ _id: 'CV_KT', tenChucVu: 'Kế toán trưởng' });
  await mongoose.model('ChucVu').create({ _id: 'CV_KD', tenChucVu: 'Trưởng KD' });
  await mongoose.model('ChucVu').create({ _id: 'CV_MKT', tenChucVu: 'Marketing Manager' });
  await mongoose.model('ChucVu').create({ _id: 'CV_CS', tenChucVu: 'Chuyên viên CSKH' });
  await mongoose.model('ChucVu').create({ _id: 'CV_TH', tenChucVu: 'Thực tập sinh' });
  await mongoose.model('ChucVu').create({ _id: 'CV_KT2', tenChucVu: 'Kiểm toán viên' });
  console.log('chuc_vu: 13');

  await mongoose.model('BangLuong').create({
    _id: 'BL01',
    tenChucVu: 'Nhân viên',
    luongCoBan: 15000000,
    phuCapDinhMuc: 1000000,
  });
  await mongoose.model('BangLuong').create({
    _id: 'BL02',
    tenChucVu: 'Giám đốc',
    luongCoBan: 35000000,
    phuCapDinhMuc: 5000000,
  });
  await mongoose.model('BangLuong').create({ _id: 'BL03', tenChucVu: 'Trưởng phòng', luongCoBan: 25000000, phuCapDinhMuc: 3000000 });
  await mongoose.model('BangLuong').create({ _id: 'BL04', tenChucVu: 'Phó phòng', luongCoBan: 20000000, phuCapDinhMuc: 2500000 });
  await mongoose.model('BangLuong').create({ _id: 'BL05', tenChucVu: 'Trưởng nhóm', luongCoBan: 18000000, phuCapDinhMuc: 2000000 });
  await mongoose.model('BangLuong').create({ _id: 'BL06', tenChucVu: 'Lập trình viên', luongCoBan: 22000000, phuCapDinhMuc: 2500000 });
  await mongoose.model('BangLuong').create({ _id: 'BL07', tenChucVu: 'Kế toán trưởng', luongCoBan: 24000000, phuCapDinhMuc: 3000000 });
  await mongoose.model('BangLuong').create({ _id: 'BL08', tenChucVu: 'Trưởng KD', luongCoBan: 26000000, phuCapDinhMuc: 3500000 });
  await mongoose.model('BangLuong').create({ _id: 'BL09', tenChucVu: 'Marketing Manager', luongCoBan: 23000000, phuCapDinhMuc: 2800000 });
  await mongoose.model('BangLuong').create({ _id: 'BL10', tenChucVu: 'Chuyên viên CSKH', luongCoBan: 12000000, phuCapDinhMuc: 800000 });
  await mongoose.model('BangLuong').create({ _id: 'BL11', tenChucVu: 'Thực tập sinh', luongCoBan: 5000000, phuCapDinhMuc: 500000 });
  await mongoose.model('BangLuong').create({ _id: 'BL12', tenChucVu: 'Kiểm toán viên', luongCoBan: 21000000, phuCapDinhMuc: 2200000 });
  console.log('bang_luong: 12');

  const ngayVaoLam = new Date(y - 1, 5, 1);
  await mongoose.model('NhanVien').create({
    _id: 'NV001',
    hoTen: 'Nguyễn Giám Đốc',
    gioiTinh: 'Nam',
    soDienThoai: '0901000001',
    emailCongViec: 'giamdoc@company.vn',
    ngaySinh: new Date(1980, 2, 15),
    ngayVaoLam,
    soNgayPhepConLai: 12,
    trangThaiHoatDong: 'DANG_LAM_VIEC',
    heSoLuong: 3.0,
    phongBan: 'PB02',
    nhom: 'NH01',
    chucVu: 'CV_GD',
    bangLuong: 'BL02',
  });
  await mongoose.model('NhanVien').create({
    _id: 'NV002',
    hoTen: 'Trần Nhân Sự',
    gioiTinh: 'Nữ',
    soDienThoai: '0901000002',
    emailCongViec: 'hr@company.vn',
    ngaySinh: new Date(1990, 7, 20),
    ngayVaoLam: new Date(y - 2, 0, 10),
    soNgayPhepConLai: 10,
    trangThaiHoatDong: 'DANG_LAM_VIEC',
    heSoLuong: 2.2,
    phongBan: 'PB01',
    nhom: 'NH01',
    chucVu: 'CV_HR',
    bangLuong: 'BL01',
    nguoiQuanLyTruocTiep: 'NV001',
  });
  await mongoose.model('NhanVien').create({
    _id: 'NV003',
    hoTen: 'Lê Nhân Viên',
    gioiTinh: 'Nam',
    soDienThoai: '0901000003',
    emailCongViec: 'nhanvien@company.vn',
    ngaySinh: new Date(1995, 10, 5),
    ngayVaoLam: new Date(y - 1, 3, 1),
    soNgayPhepConLai: 8,
    trangThaiHoatDong: 'DANG_LAM_VIEC',
    heSoLuong: 1.8,
    phongBan: 'PB02',
    chucVu: 'CV_NV',
    bangLuong: 'BL01',
    nguoiQuanLyTruocTiep: 'NV001',
  });
  await mongoose.model('NhanVien').create({
    _id: 'NV004',
    hoTen: 'Phạm Thị B',
    gioiTinh: 'Nữ',
    soDienThoai: '0901000004',
    emailCongViec: 'phamthib@company.vn',
    ngayVaoLam: new Date(y - 1, 8, 1),
    soNgayPhepConLai: 11,
    trangThaiHoatDong: 'DANG_LAM_VIEC',
    heSoLuong: 1.8,
    phongBan: 'PB02',
    chucVu: 'CV_NV',
    bangLuong: 'BL01',
    nguoiQuanLyTruocTiep: 'NV001',
  });
  await mongoose.model('NhanVien').create({ _id: 'NV005', hoTen: 'Hoàng Văn C', gioiTinh: 'Nam', soDienThoai: '0901000005', emailCongViec: 'hoangvanc@company.vn', ngaySinh: new Date(1988, 4, 12), ngayVaoLam: new Date(y - 3, 2, 15), soNgayPhepConLai: 15, trangThaiHoatDong: 'DANG_LAM_VIEC', heSoLuong: 2.5, phongBan: 'PB03', nhom: 'NH03', chucVu: 'CV_TP', bangLuong: 'BL03', nguoiQuanLyTruocTiep: 'NV001' });
  await mongoose.model('NhanVien').create({ _id: 'NV006', hoTen: 'Vũ Thị D', gioiTinh: 'Nữ', soDienThoai: '0901000006', emailCongViec: 'vuthid@company.vn', ngaySinh: new Date(1992, 8, 25), ngayVaoLam: new Date(y - 2, 5, 10), soNgayPhepConLai: 12, trangThaiHoatDong: 'DANG_LAM_VIEC', heSoLuong: 2.0, phongBan: 'PB03', nhom: 'NH03', chucVu: 'CV_LT', bangLuong: 'BL06', nguoiQuanLyTruocTiep: 'NV005' });
  await mongoose.model('NhanVien').create({ _id: 'NV007', hoTen: 'Đặng Văn E', gioiTinh: 'Nam', soDienThoai: '0901000007', emailCongViec: 'dangvane@company.vn', ngaySinh: new Date(1993, 11, 8), ngayVaoLam: new Date(y - 1, 6, 20), soNgayPhepConLai: 10, trangThaiHoatDong: 'DANG_LAM_VIEC', heSoLuong: 1.9, phongBan: 'PB04', nhom: 'NH06', chucVu: 'CV_MKT', bangLuong: 'BL09', nguoiQuanLyTruocTiep: 'NV001' });
  await mongoose.model('NhanVien').create({ _id: 'NV008', hoTen: 'Bùi Thị F', gioiTinh: 'Nữ', soDienThoai: '0901000008', emailCongViec: 'buithif@company.vn', ngaySinh: new Date(1991, 2, 18), ngayVaoLam: new Date(y - 2, 8, 5), soNgayPhepConLai: 13, trangThaiHoatDong: 'DANG_LAM_VIEC', heSoLuong: 2.3, phongBan: 'PB06', nhom: 'NH09', chucVu: 'CV_KT', bangLuong: 'BL07', nguoiQuanLyTruocTiep: 'NV001' });
  await mongoose.model('NhanVien').create({ _id: 'NV009', hoTen: 'Lý Văn G', gioiTinh: 'Nam', soDienThoai: '0901000009', emailCongViec: 'lyvang@company.vn', ngaySinh: new Date(1985, 6, 30), ngayVaoLam: new Date(y - 4, 0, 10), soNgayPhepConLai: 18, trangThaiHoatDong: 'DANG_LAM_VIEC', heSoLuong: 2.8, phongBan: 'PB07', nhom: 'NH04', chucVu: 'CV_TN', bangLuong: 'BL05', nguoiQuanLyTruocTiep: 'NV005' });
  await mongoose.model('NhanVien').create({ _id: 'NV010', hoTen: 'Ngô Thị H', gioiTinh: 'Nữ', soDienThoai: '0901000010', emailCongViec: 'ngothih@company.vn', ngaySinh: new Date(1994, 9, 14), ngayVaoLam: new Date(y - 1, 4, 12), soNgayPhepConLai: 9, trangThaiHoatDong: 'DANG_LAM_VIEC', heSoLuong: 1.7, phongBan: 'PB02', nhom: 'NH08', chucVu: 'CV_KD', bangLuong: 'BL08', nguoiQuanLyTruocTiep: 'NV001' });
  await mongoose.model('NhanVien').create({ _id: 'NV011', hoTen: 'Dương Văn I', gioiTinh: 'Nam', soDienThoai: '0901000011', emailCongViec: 'duongvani@company.vn', ngaySinh: new Date(1996, 0, 5), ngayVaoLam: new Date(y - 1, 9, 1), soNgayPhepConLai: 7, trangThaiHoatDong: 'DANG_LAM_VIEC', heSoLuong: 1.6, phongBan: 'PB10', nhom: 'NH08', chucVu: 'CV_CS', bangLuong: 'BL10', nguoiQuanLyTruocTiep: 'NV010' });
  await mongoose.model('NhanVien').create({ _id: 'NV012', hoTen: 'Trịnh Thị K', gioiTinh: 'Nữ', soDienThoai: '0901000012', emailCongViec: 'trinhthik@company.vn', ngaySinh: new Date(1997, 3, 22), ngayVaoLam: new Date(y - 1, 10, 15), soNgayPhepConLai: 6, trangThaiHoatDong: 'DANG_LAM_VIEC', heSoLuong: 1.5, phongBan: 'PB07', nhom: 'NH05', chucVu: 'CV_TH', bangLuong: 'BL11', nguoiQuanLyTruocTiep: 'NV009' });
  await mongoose.model('NhanVien').create({ _id: 'NV013', hoTen: 'Phan Văn L', gioiTinh: 'Nam', soDienThoai: '0901000013', emailCongViec: 'phanvanl@company.vn', ngaySinh: new Date(1989, 7, 10), ngayVaoLam: new Date(y - 3, 3, 8), soNgayPhepConLai: 14, trangThaiHoatDong: 'DANG_LAM_VIEC', heSoLuong: 2.4, phongBan: 'PB06', nhom: 'NH10', chucVu: 'CV_KT2', bangLuong: 'BL12', nguoiQuanLyTruocTiep: 'NV008' });
  await mongoose.model('NhanVien').create({ _id: 'NV014', hoTen: 'Tạ Thị M', gioiTinh: 'Nữ', soDienThoai: '0901000014', emailCongViec: 'tathim@company.vn', ngaySinh: new Date(1990, 11, 28), ngayVaoLam: new Date(y - 2, 7, 20), soNgayPhepConLai: 11, trangThaiHoatDong: 'NGHI_THAI_SAN', heSoLuong: 2.1, phongBan: 'PB09', nhom: 'NH11', chucVu: 'CV_PP', bangLuong: 'BL04', nguoiQuanLyTruocTiep: 'NV001' });
  console.log('nhan_vien: 14');

  await mongoose.model('TaiKhoan').create({
    _id: 'TK_ADMIN',
    username: 'admin',
    password: hash(adminPassword),
    role: 'ADMIN',
    trangThaiTaiKhoan: true,
    ngayTao: now,
  });
  await mongoose.model('TaiKhoan').create({
    _id: 'TK_DIR',
    username: 'director',
    password: hash(demoPassword),
    role: 'DIRECTOR',
    trangThaiTaiKhoan: true,
    ngayTao: now,
    nhanVien: 'NV001',
  });
  await mongoose.model('TaiKhoan').create({
    _id: 'TK_HR',
    username: 'hr',
    password: hash(demoPassword),
    role: 'HR',
    trangThaiTaiKhoan: true,
    ngayTao: now,
    nhanVien: 'NV002',
  });
  await mongoose.model('TaiKhoan').create({
    _id: 'TK_NV1',
    username: 'nhanvien',
    password: hash(demoPassword),
    role: 'EMPLOYEE',
    trangThaiTaiKhoan: true,
    ngayTao: now,
    nhanVien: 'NV003',
  });
  await mongoose.model('TaiKhoan').create({ _id: 'TK_NV2', username: 'hoangvanc', password: hash(demoPassword), role: 'EMPLOYEE', trangThaiTaiKhoan: true, ngayTao: now, nhanVien: 'NV005' });
  await mongoose.model('TaiKhoan').create({ _id: 'TK_NV3', username: 'vuthid', password: hash(demoPassword), role: 'EMPLOYEE', trangThaiTaiKhoan: true, ngayTao: now, nhanVien: 'NV006' });
  await mongoose.model('TaiKhoan').create({ _id: 'TK_NV4', username: 'dangvane', password: hash(demoPassword), role: 'EMPLOYEE', trangThaiTaiKhoan: true, ngayTao: now, nhanVien: 'NV007' });
  await mongoose.model('TaiKhoan').create({ _id: 'TK_NV5', username: 'buithif', password: hash(demoPassword), role: 'EMPLOYEE', trangThaiTaiKhoan: true, ngayTao: now, nhanVien: 'NV008' });
  await mongoose.model('TaiKhoan').create({ _id: 'TK_NV6', username: 'lyvang', password: hash(demoPassword), role: 'EMPLOYEE', trangThaiTaiKhoan: true, ngayTao: now, nhanVien: 'NV009' });
  await mongoose.model('TaiKhoan').create({ _id: 'TK_NV7', username: 'ngothih', password: hash(demoPassword), role: 'EMPLOYEE', trangThaiTaiKhoan: true, ngayTao: now, nhanVien: 'NV010' });
  await mongoose.model('TaiKhoan').create({ _id: 'TK_NV8', username: 'duongvani', password: hash(demoPassword), role: 'EMPLOYEE', trangThaiTaiKhoan: true, ngayTao: now, nhanVien: 'NV011' });
  await mongoose.model('TaiKhoan').create({ _id: 'TK_NV9', username: 'trinhthik', password: hash(demoPassword), role: 'EMPLOYEE', trangThaiTaiKhoan: true, ngayTao: now, nhanVien: 'NV012' });
  await mongoose.model('TaiKhoan').create({ _id: 'TK_NV10', username: 'phanvanl', password: hash(demoPassword), role: 'EMPLOYEE', trangThaiTaiKhoan: true, ngayTao: now, nhanVien: 'NV013' });
  await mongoose.model('TaiKhoan').create({ _id: 'TK_NV11', username: 'tathim', password: hash(demoPassword), role: 'EMPLOYEE', trangThaiTaiKhoan: true, ngayTao: now, nhanVien: 'NV014' });
  console.log('taikhoan: 14');

  await mongoose.model('PhieuLuong').create({
    _id: 'PL001',
    thangNam: thangTruocStr,
    luongCoBan: 15000000,
    phuCap: 1000000,
    phatMuon: 0,
    nghiKhongPhep: 0,
    tongLuong: 16000000,
    trangThaiThanhToan: 'DA_THANH_TOAN',
    nhanVien: 'NV003',
  });
  await mongoose.model('PhieuLuong').create({
    _id: 'PL002',
    thangNam: thangHienTai,
    luongCoBan: 15000000,
    phuCap: 1000000,
    phatMuon: 50000,
    nghiKhongPhep: 0,
    tongLuong: 15950000,
    trangThaiThanhToan: 'CHUA_THANH_TOAN',
    nhanVien: 'NV003',
  });
  await mongoose.model('PhieuLuong').create({
    _id: 'PL003',
    thangNam: thangHienTai,
    luongCoBan: 15000000,
    phuCap: 1000000,
    phatMuon: 0,
    nghiKhongPhep: 0,
    tongLuong: 16000000,
    trangThaiThanhToan: 'CHUA_THANH_TOAN',
    nhanVien: 'NV004',
  });
  await mongoose.model('PhieuLuong').create({ _id: 'PL004', thangNam: thangHienTai, luongCoBan: 25000000, phuCap: 3000000, phatMuon: 0, nghiKhongPhep: 0, tongLuong: 28000000, trangThaiThanhToan: 'DA_THANH_TOAN', nhanVien: 'NV005' });
  await mongoose.model('PhieuLuong').create({ _id: 'PL005', thangNam: thangHienTai, luongCoBan: 22000000, phuCap: 2500000, phatMuon: 100000, nghiKhongPhep: 0, tongLuong: 24400000, trangThaiThanhToan: 'CHUA_THANH_TOAN', nhanVien: 'NV006' });
  await mongoose.model('PhieuLuong').create({ _id: 'PL006', thangNam: thangTruocStr, luongCoBan: 23000000, phuCap: 2800000, phatMuon: 0, nghiKhongPhep: 0, tongLuong: 25800000, trangThaiThanhToan: 'DA_THANH_TOAN', nhanVien: 'NV007' });
  await mongoose.model('PhieuLuong').create({ _id: 'PL007', thangNam: thangHienTai, luongCoBan: 24000000, phuCap: 3000000, phatMuon: 0, nghiKhongPhep: 0, tongLuong: 27000000, trangThaiThanhToan: 'CHUA_THANH_TOAN', nhanVien: 'NV008' });
  await mongoose.model('PhieuLuong').create({ _id: 'PL008', thangNam: thangHienTai, luongCoBan: 18000000, phuCap: 2000000, phatMuon: 0, nghiKhongPhep: 0, tongLuong: 20000000, trangThaiThanhToan: 'DA_THANH_TOAN', nhanVien: 'NV009' });
  await mongoose.model('PhieuLuong').create({ _id: 'PL009', thangNam: thangTruocStr, luongCoBan: 26000000, phuCap: 3500000, phatMuon: 0, nghiKhongPhep: 0, tongLuong: 29500000, trangThaiThanhToan: 'DA_THANH_TOAN', nhanVien: 'NV010' });
  await mongoose.model('PhieuLuong').create({ _id: 'PL010', thangNam: thangHienTai, luongCoBan: 12000000, phuCap: 800000, phatMuon: 50000, nghiKhongPhep: 0, tongLuong: 12750000, trangThaiThanhToan: 'CHUA_THANH_TOAN', nhanVien: 'NV011' });
  await mongoose.model('PhieuLuong').create({ _id: 'PL011', thangNam: thangHienTai, luongCoBan: 5000000, phuCap: 500000, phatMuon: 0, nghiKhongPhep: 0, tongLuong: 5500000, trangThaiThanhToan: 'CHUA_THANH_TOAN', nhanVien: 'NV012' });
  await mongoose.model('PhieuLuong').create({ _id: 'PL012', thangNam: thangTruocStr, luongCoBan: 21000000, phuCap: 2200000, phatMuon: 0, nghiKhongPhep: 0, tongLuong: 23200000, trangThaiThanhToan: 'DA_THANH_TOAN', nhanVien: 'NV013' });
  await mongoose.model('PhieuLuong').create({ _id: 'PL013', thangNam: thangHienTai, luongCoBan: 20000000, phuCap: 2500000, phatMuon: 0, nghiKhongPhep: 0, tongLuong: 22500000, trangThaiThanhToan: 'CHUA_THANH_TOAN', nhanVien: 'NV014' });
  console.log('phieu_luong: 13');

  /** Chấm công tháng hiện tại — đủ loại trạng thái cho biểu đồ HR */
  const startM = new Date(y, m - 1, 1);
  const endM = new Date(y, m, 0);
  const samples = [];
  let seq = 0;
  for (let d = new Date(startM); d <= endM; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (wd === 0 || wd === 6) continue;
    const day = new Date(d);
    const tag = String(++seq).padStart(3, '0');
    const stCycle = seq % 7;
    let st = 'DI_LAM';
    if (stCycle === 1) st = 'DI_MUON';
    else if (stCycle === 2) st = 'PHEP';
    else if (stCycle === 3) st = 'NGHI_PHEP';
    else if (stCycle === 4) st = 'DI_VANG';
    samples.push({
      nhanVien: 'NV003',
      ngay: day,
      gioVao: st === 'DI_MUON' ? '08:45:00' : '07:55:00',
      gioRa: '17:30:00',
      trangThai: st,
    });
    samples.push({
      nhanVien: 'NV004',
      ngay: day,
      gioVao: '08:00:00',
      gioRa: '17:00:00',
      trangThai: seq % 5 === 0 ? 'DI_MUON' : 'DI_LAM',
    });
  }
  await mongoose.model('ChamCong').insertMany(samples);
  console.log('cham_cong:', samples.length);

  await mongoose.model('DonNghiPhep').create({
    nhanVien: 'NV003',
    loaiNghi: 'PHEP_NAM',
    tuNgay: new Date(y, m - 1, 20),
    denNgay: new Date(y, m - 1, 22),
    lyDo: 'Nghỉ phép năm',
    trangThai: 'CHO_HR_XAC_NHAN',
  });
  await mongoose.model('DonNghiPhep').create({
    nhanVien: 'NV004',
    loaiNghi: 'PHEP_NAM',
    tuNgay: new Date(y, m - 1, 10),
    denNgay: new Date(y, m - 1, 12),
    lyDo: 'Việc riêng',
    trangThai: 'CHO_HR_XAC_NHAN',
  });
  await mongoose.model('DonNghiPhep').create({
    nhanVien: 'NV003',
    loaiNghi: 'PHEP_OM',
    tuNgay: new Date(y, m - 2, 5),
    denNgay: new Date(y, m - 2, 6),
    lyDo: 'Ốm',
    trangThai: 'DA_DUYET',
    nguoiDuyet: 'NV001',
  });
  await mongoose.model('DonNghiPhep').create({ nhanVien: 'NV005', loaiNghi: 'PHEP_NAM', tuNgay: new Date(y, m - 1, 5), denNgay: new Date(y, m - 1, 7), lyDo: 'Du lịch', trangThai: 'DA_DUYET', nguoiDuyet: 'NV001' });
  await mongoose.model('DonNghiPhep').create({ nhanVien: 'NV006', loaiNghi: 'PHEP_NAM', tuNgay: new Date(y, m - 1, 15), denNgay: new Date(y, m - 1, 17), lyDo: 'Việc gia đình', trangThai: 'CHO_HR_XAC_NHAN' });
  await mongoose.model('DonNghiPhep').create({ nhanVien: 'NV007', loaiNghi: 'PHEP_OM', tuNgay: new Date(y, m - 2, 10), denNgay: new Date(y, m - 2, 12), lyDo: 'Sốt', trangThai: 'DA_DUYET', nguoiDuyet: 'NV001' });
  await mongoose.model('DonNghiPhep').create({ nhanVien: 'NV008', loaiNghi: 'PHEP_NAM', tuNgay: new Date(y, m - 3, 1), denNgay: new Date(y, m - 3, 3), lyDo: 'Nghỉ Tết', trangThai: 'DA_DUYET', nguoiDuyet: 'NV001' });
  await mongoose.model('DonNghiPhep').create({ nhanVien: 'NV009', loaiNghi: 'NGHI_THAI_SAN', tuNgay: new Date(y, m - 2, 15), denNgay: new Date(y, m - 2, 25), lyDo: 'Thai sản', trangThai: 'DA_DUYET', nguoiDuyet: 'NV001' });
  await mongoose.model('DonNghiPhep').create({ nhanVien: 'NV010', loaiNghi: 'PHEP_NAM', tuNgay: new Date(y, m - 1, 25), denNgay: new Date(y, m - 1, 27), lyDo: 'Nghỉ mát', trangThai: 'CHO_HR_XAC_NHAN' });
  await mongoose.model('DonNghiPhep').create({ nhanVien: 'NV011', loaiNghi: 'PHEP_OM', tuNgay: new Date(y, m - 2, 20), denNgay: new Date(y, m - 2, 21), lyDo: 'Cảm cúm', trangThai: 'DA_DUYET', nguoiDuyet: 'NV001' });
  await mongoose.model('DonNghiPhep').create({ nhanVien: 'NV012', loaiNghi: 'PHEP_NAM', tuNgay: new Date(y, m - 1, 8), denNgay: new Date(y, m - 1, 9), lyDo: 'Việc cá nhân', trangThai: 'CHO_HR_XAC_NHAN' });
  await mongoose.model('DonNghiPhep').create({ nhanVien: 'NV013', loaiNghi: 'PHEP_NAM', tuNgay: new Date(y, m - 3, 15), denNgay: new Date(y, m - 3, 18), lyDo: 'Du lịch', trangThai: 'DA_DUYET', nguoiDuyet: 'NV001' });
  await mongoose.model('DonNghiPhep').create({ nhanVien: 'NV014', loaiNghi: 'NGHI_THAI_SAN', tuNgay: new Date(y, m - 1, 1), denNgay: new Date(y, m, 0), lyDo: 'Thai sản dài hạn', trangThai: 'DA_DUYET', nguoiDuyet: 'NV001' });
  console.log('don_nghi_phep: 13');

  await mongoose.model('ThongBao').create({
    nguoiNhan: null,
    tieuDe: 'Chào mừng dùng hệ thống',
    noiDung: 'Dữ liệu demo đã được nạp. Đăng nhập các role để kiểm tra.',
    loai: 'SYSTEM',
    daDoc: false,
    ngayTao: now,
  });
  await mongoose.model('ThongBao').create({
    nguoiNhan: 'nhanvien',
    tieuDe: 'Nhắc chấm công',
    noiDung: 'Vui lòng chấm công đầy đủ trong tháng.',
    loai: 'REMINDER',
    daDoc: false,
    ngayTao: now,
  });
  await mongoose.model('ThongBao').create({ nguoiNhan: 'hr', tieuDe: 'Phê duyệt đơn nghỉ phép', noiDung: 'Có 5 đơn nghỉ phép cần phê duyệt.', loai: 'TASK', daDoc: false, ngayTao: now });
  await mongoose.model('ThongBao').create({ nguoiNhan: 'director', tieuDe: 'Báo cáo tài chính Q1', noiDung: 'Báo cáo tài chính quý 1 đã sẵn sàng.', loai: 'REPORT', daDoc: false, ngayTao: now });
  await mongoose.model('ThongBao').create({ nguoiNhan: 'hoangvanc', tieuDe: 'Meeting dự án', noiDung: 'Họp dự án vào 14:00 chiều nay.', loai: 'MEETING', daDoc: false, ngayTao: now });
  await mongoose.model('ThongBao').create({ nguoiNhan: 'vuthid', tieuDe: 'Deadline báo cáo', noiDung: 'Hoàn thành báo cáo trước thứ 6.', loai: 'DEADLINE', daDoc: false, ngayTao: now });
  await mongoose.model('ThongBao').create({ nguoiNhan: null, tieuDe: 'Thông báo nghỉ lễ', noiDung: 'Công ty nghỉ lễ 30/4 - 1/5.', loai: 'HOLIDAY', daDoc: false, ngayTao: now });
  await mongoose.model('ThongBao').create({ nguoiNhan: 'dangvane', tieuDe: 'KPI tháng', noiDung: 'KPI tháng này đạt 95%.', loai: 'KPI', daDoc: true, ngayTao: now });
  await mongoose.model('ThongBao').create({ nguoiNhan: 'buithif', tieuDe: 'Yêu cầu bổ sung chứng từ', noiDung: 'Vui lòng bổ sung hóa đơn.', loai: 'REQUEST', daDoc: false, ngayTao: now });
  await mongoose.model('ThongBao').create({ nguoiNhan: 'lyvang', tieuDe: 'Đào tạo mới', noiDung: 'Lớp đào tạo React vào tuần sau.', loai: 'TRAINING', daDoc: false, ngayTao: now });
  await mongoose.model('ThongBao').create({ nguoiNhan: 'ngothih', tieuDe: 'Khen thưởng', noiDung: 'Đạt thành tích xuất sắc tháng 3.', loai: 'REWARD', daDoc: true, ngayTao: now });
  await mongoose.model('ThongBao').create({ nguoiNhan: null, tieuDe: 'Cập nhật hệ thống', noiDung: 'Hệ thống sẽ bảo trì tối nay.', loai: 'SYSTEM', daDoc: false, ngayTao: now });
  console.log('thong_bao: 12');

  await mongoose.model('QuyetDinh').create({
    _id: 'QD001',
    nhanVien: 'NV003',
    loaiQuyetDinh: 'KHEN_THUONG',
    ngayKy: new Date(y, m - 1, 1),
    noiDungQuyetDinh: 'Khen thưởng hoàn thành tốt nhiệm vụ Q1',
    nguoiKy: 'Nguyễn Giám Đốc',
    soTien: 2000000,
  });
  await mongoose.model('QuyetDinh').create({ _id: 'QD002', nhanVien: 'NV005', loaiQuyetDinh: 'KHEN_THUONG', ngayKy: new Date(y, m - 1, 5), noiDungQuyetDinh: 'Hoàn thành xuất sắc dự án A', nguoiKy: 'Nguyễn Giám Đốc', soTien: 3000000 });
  await mongoose.model('QuyetDinh').create({ _id: 'QD003', nhanVien: 'NV006', loaiQuyetDinh: 'KY_LUAT', ngayKy: new Date(y, m - 2, 10), noiDungQuyetDinh: 'Vi phạm nội quy công ty', nguoiKy: 'Trần Nhân Sự', soTien: 500000 });
  await mongoose.model('QuyetDinh').create({ _id: 'QD004', nhanVien: 'NV007', loaiQuyetDinh: 'KHEN_THUONG', ngayKy: new Date(y, m - 1, 15), noiDungQuyetDinh: 'Ý tưởng marketing xuất sắc', nguoiKy: 'Nguyễn Giám Đốc', soTien: 1500000 });
  await mongoose.model('QuyetDinh').create({ _id: 'QD005', nhanVien: 'NV008', loaiQuyetDinh: 'KHEN_THUONG', ngayKy: new Date(y, m - 2, 20), noiDungQuyetDinh: 'Tiết kiệm chi phí tài chính', nguoiKy: 'Nguyễn Giám Đốc', soTien: 2500000 });
  await mongoose.model('QuyetDinh').create({ _id: 'QD006', nhanVien: 'NV009', loaiQuyetDinh: 'KY_LUAT', ngayKy: new Date(y, m - 3, 8), noiDungQuyetDinh: 'Đi làm muộn nhiều lần', nguoiKy: 'Hoàng Văn C', soTien: 200000 });
  await mongoose.model('QuyetDinh').create({ _id: 'QD007', nhanVien: 'NV010', loaiQuyetDinh: 'KHEN_THUONG', ngayKy: new Date(y, m - 1, 25), noiDungQuyetDinh: 'Đạt doanh số cao nhất tháng', nguoiKy: 'Nguyễn Giám Đốc', soTien: 5000000 });
  await mongoose.model('QuyetDinh').create({ _id: 'QD008', nhanVien: 'NV011', loaiQuyetDinh: 'KHEN_THUONG', ngayKy: new Date(y, m - 2, 12), noiDungQuyetDinh: 'Chăm sóc khách hàng tốt', nguoiKy: 'Ngô Thị H', soTien: 1000000 });
  await mongoose.model('QuyetDinh').create({ _id: 'QD009', nhanVien: 'NV012', loaiQuyetDinh: 'KY_LUAT', ngayKy: new Date(y, m - 1, 18), noiDungQuyetDinh: 'Không hoàn thành task đúng hạn', nguoiKy: 'Lý Văn G', soTien: 100000 });
  await mongoose.model('QuyetDinh').create({ _id: 'QD010', nhanVien: 'NV013', loaiQuyetDinh: 'KHEN_THUONG', ngayKy: new Date(y, m - 2, 28), noiDungQuyetDinh: 'Kiểm toán chính xác', nguoiKy: 'Bùi Thị F', soTien: 2000000 });
  await mongoose.model('QuyetDinh').create({ _id: 'QD011', nhanVien: 'NV014', loaiQuyetDinh: 'THANG_CHUC', ngayKy: new Date(y, m - 3, 1), noiDungQuyetDinh: 'Thăng chức Phó phòng R&D', nguoiKy: 'Nguyễn Giám Đốc', soTien: 0 });
  console.log('quyet_dinh: 11');

  await mongoose.model('LichSuCongTac').create({
    nhanVien: 'NV003',
    tuNgay: new Date(y - 2, 0, 1),
    denNgay: new Date(y - 1, 2, 31),
    phongBanCu: 'PB01',
    phongBanMoi: 'PB02',
    chucVuCu: 'Nhân viên',
    chucVuMoi: 'Nhân viên',
    ghiChu: 'Luân chuyển phòng ban',
  });
  await mongoose.model('LichSuCongTac').create({ nhanVien: 'NV005', tuNgay: new Date(y - 5, 0, 1), denNgay: new Date(y - 3, 2, 28), phongBanCu: 'PB04', phongBanMoi: 'PB03', chucVuCu: 'Nhân viên', chucVuMoi: 'Trưởng phòng', ghiChu: 'Thăng chức' });
  await mongoose.model('LichSuCongTac').create({ nhanVien: 'NV006', tuNgay: new Date(y - 3, 3, 1), denNgay: new Date(y - 2, 5, 9), phongBanCu: 'PB07', phongBanMoi: 'PB03', chucVuCu: 'Thực tập sinh', chucVuMoi: 'Lập trình viên', ghiChu: 'Chuyển công tác' });
  await mongoose.model('LichSuCongTac').create({ nhanVien: 'NV007', tuNgay: new Date(y - 4, 6, 1), denNgay: new Date(y - 1, 6, 19), phongBanCu: 'PB08', phongBanMoi: 'PB04', chucVuCu: 'Nhân viên', chucVuMoi: 'Marketing Manager', ghiChu: 'Thăng chức' });
  await mongoose.model('LichSuCongTac').create({ nhanVien: 'NV008', tuNgay: new Date(y - 6, 0, 1), denNgay: new Date(y - 3, 3, 7), phongBanCu: 'PB09', phongBanMoi: 'PB06', chucVuCu: 'Kế toán viên', chucVuMoi: 'Kế toán trưởng', ghiChu: 'Thăng chức' });
  await mongoose.model('LichSuCongTac').create({ nhanVien: 'NV009', tuNgay: new Date(y - 5, 2, 1), denNgay: new Date(y - 4, 0, 9), phongBanCu: 'PB03', phongBanMoi: 'PB07', chucVuCu: 'Lập trình viên', chucVuMoi: 'Trưởng nhóm', ghiChu: 'Chuyển nhóm' });
  await mongoose.model('LichSuCongTac').create({ nhanVien: 'NV010', tuNgay: new Date(y - 3, 5, 1), denNgay: new Date(y - 1, 4, 11), phongBanCu: 'PB05', phongBanMoi: 'PB02', chucVuCu: 'Nhân viên', chucVuMoi: 'Trưởng KD', ghiChu: 'Luân chuyển và thăng chức' });
  await mongoose.model('LichSuCongTac').create({ nhanVien: 'NV011', tuNgay: new Date(y - 2, 8, 1), denNgay: new Date(y - 1, 8, 31), phongBanCu: 'PB11', phongBanMoi: 'PB10', chucVuCu: 'Nhân viên', chucVuMoi: 'Chuyên viên CSKH', ghiChu: 'Chuyển phòng ban' });
  await mongoose.model('LichSuCongTac').create({ nhanVien: 'NV012', tuNgay: new Date(y - 2, 0, 1), denNgay: new Date(y - 1, 10, 14), phongBanCu: 'PB12', phongBanMoi: 'PB07', chucVuCu: 'Nhân viên QA', chucVuMoi: 'Thực tập sinh', ghiChu: 'Chuyển công tác' });
  await mongoose.model('LichSuCongTac').create({ nhanVien: 'NV013', tuNgay: new Date(y - 5, 5, 1), denNgay: new Date(y - 3, 3, 7), phongBanCu: 'PB06', phongBanMoi: 'PB06', chucVuCu: 'Nhân viên kiểm toán', chucVuMoi: 'Kiểm toán viên', ghiChu: 'Thăng chức trong phòng' });
  await mongoose.model('LichSuCongTac').create({ nhanVien: 'NV014', tuNgay: new Date(y - 4, 0, 1), denNgay: new Date(y - 2, 7, 19), phongBanCu: 'PB01', phongBanMoi: 'PB09', chucVuCu: 'Nhân viên HR', chucVuMoi: 'Phó phòng', ghiChu: 'Thăng chức và chuyển phòng' });
  console.log('lich_su_cong_tac: 11');

  await mongoose.model('YeuCauTuyenDung').create({
    _id: 'YCTD01',
    idYeuCau: 'YCTD01',
    viTriCanTuyen: 'Lập trình viên Frontend',
    soLuong: 2,
    trinhDoYeuCau: 'Đại học CNTT',
    trangThai: 'OPEN',
    moTa: 'React, Node.js',
    ngayYeuCau: now,
    phongBan: 'PB02',
  });
  await mongoose.model('YeuCauTuyenDung').create({ _id: 'YCTD02', idYeuCau: 'YCTD02', viTriCanTuyen: 'Backend Developer', soLuong: 3, trinhDoYeuCau: 'Đại học CNTT', trangThai: 'OPEN', moTa: 'Node.js, MongoDB, REST API', ngayYeuCau: now, phongBan: 'PB03' });
  await mongoose.model('YeuCauTuyenDung').create({ _id: 'YCTD03', idYeuCau: 'YCTD03', viTriCanTuyen: 'Mobile Developer', soLuong: 2, trinhDoYeuCau: 'Đại học CNTT', trangThai: 'OPEN', moTa: 'React Native, Flutter', ngayYeuCau: now, phongBan: 'PB07' });
  await mongoose.model('YeuCauTuyenDung').create({ _id: 'YCTD04', idYeuCau: 'YCTD04', viTriCanTuyen: 'Marketing Executive', soLuong: 1, trinhDoYeuCau: 'Đại học Marketing', trangThai: 'CLOSED', moTa: 'Digital Marketing, SEO', ngayYeuCau: new Date(y, m - 2, 15), phongBan: 'PB04' });
  await mongoose.model('YeuCauTuyenDung').create({ _id: 'YCTD05', idYeuCau: 'YCTD05', viTriCanTuyen: 'Kế toán viên', soLuong: 2, trinhDoYeuCau: 'Đại học Kinh tế', trangThai: 'OPEN', moTa: 'Kế toán thuế, báo cáo tài chính', ngayYeuCau: now, phongBan: 'PB06' });
  await mongoose.model('YeuCauTuyenDung').create({ _id: 'YCTD06', idYeuCau: 'YCTD06', viTriCanTuyen: 'Sales Manager', soLuong: 1, trinhDoYeuCau: 'Đại học Kinh tế', trangThai: 'OPEN', moTa: 'Quản lý đội ngũ bán hàng', ngayYeuCau: now, phongBan: 'PB02' });
  await mongoose.model('YeuCauTuyenDung').create({ _id: 'YCTD07', idYeuCau: 'YCTD07', viTriCanTuyen: 'Chăm sóc khách hàng', soLuong: 5, trinhDoYeuCau: 'Cao đẳng trở lên', trangThai: 'OPEN', moTa: 'Giao tiếp tốt, chịu được áp lực', ngayYeuCau: now, phongBan: 'PB10' });
  await mongoose.model('YeuCauTuyenDung').create({ _id: 'YCTD08', idYeuCau: 'YCTD08', viTriCanTuyen: 'DevOps Engineer', soLuong: 1, trinhDoYeuCau: 'Đại học CNTT', trangThai: 'OPEN', moTa: 'Docker, Kubernetes, CI/CD', ngayYeuCau: now, phongBan: 'PB07' });
  await mongoose.model('YeuCauTuyenDung').create({ _id: 'YCTD09', idYeuCau: 'YCTD09', viTriCanTuyen: 'Product Owner', soLuong: 1, trinhDoYeuCau: 'Đại học', trangThai: 'CLOSED', moTa: 'Agile, Scrum, quản lý sản phẩm', ngayYeuCau: new Date(y, m - 3, 10), phongBan: 'PB03' });
  await mongoose.model('YeuCauTuyenDung').create({ _id: 'YCTD10', idYeuCau: 'YCTD10', viTriCanTuyen: 'UI/UX Designer', soLuong: 2, trinhDoYeuCau: 'Đại học Mỹ thuật', trangThai: 'OPEN', moTa: 'Figma, Adobe XD, thiết kế giao diện', ngayYeuCau: now, phongBan: 'PB04' });
  await mongoose.model('YeuCauTuyenDung').create({ _id: 'YCTD11', idYeuCau: 'YCTD11', viTriCanTuyen: 'Thực tập sinh IT', soLuong: 10, trinhDoYeuCau: 'Sinh viên năm 3,4', trangThai: 'OPEN', moTa: 'Hỗ trợ lập trình, test', ngayYeuCau: now, phongBan: 'PB03' });
  console.log('yeu_cau_tuyen_dung: 11');

  const uvDemo = await mongoose.model('HoSoUngVien').create({
    hoTen: 'Nguyễn Ứng Viên',
    email: 'ungvien@email.com',
    soDienThoai: '0912345678',
    trangThai: 'CHO_DUYET',
    ngayNop: now,
    yeuCauTuyenDung: 'YCTD01',
  });
  const uv2 = await mongoose.model('HoSoUngVien').create({ hoTen: 'Trần Văn A', email: 'tranvana@email.com', soDienThoai: '0912345679', trangThai: 'DA_TIEP_NHAN', ngayNop: now, yeuCauTuyenDung: 'YCTD02' });
  const uv3 = await mongoose.model('HoSoUngVien').create({ hoTen: 'Lê Thị B', email: 'lethib@email.com', soDienThoai: '0912345680', trangThai: 'CHO_DUYET', ngayNop: now, yeuCauTuyenDung: 'YCTD02' });
  const uv4 = await mongoose.model('HoSoUngVien').create({ hoTen: 'Phạm Văn C', email: 'phamvanc@email.com', soDienThoai: '0912345681', trangThai: 'TU_CHOI', ngayNop: new Date(y, m - 2, 10), yeuCauTuyenDung: 'YCTD03' });
  const uv5 = await mongoose.model('HoSoUngVien').create({ hoTen: 'Hoàng Thị D', email: 'hoangthid@email.com', soDienThoai: '0912345682', trangThai: 'DA_TIEP_NHAN', ngayNop: now, yeuCauTuyenDung: 'YCTD04' });
  const uv6 = await mongoose.model('HoSoUngVien').create({ hoTen: 'Vũ Văn E', email: 'vuvane@email.com', soDienThoai: '0912345683', trangThai: 'CHO_DUYET', ngayNop: now, yeuCauTuyenDung: 'YCTD05' });
  const uv7 = await mongoose.model('HoSoUngVien').create({ hoTen: 'Đặng Thị F', email: 'dangthif@email.com', soDienThoai: '0912345684', trangThai: 'CHO_DUYET', ngayNop: now, yeuCauTuyenDung: 'YCTD06' });
  const uv8 = await mongoose.model('HoSoUngVien').create({ hoTen: 'Bùi Văn G', email: 'buivang@email.com', soDienThoai: '0912345685', trangThai: 'DA_TIEP_NHAN', ngayNop: now, yeuCauTuyenDung: 'YCTD07' });
  const uv9 = await mongoose.model('HoSoUngVien').create({ hoTen: 'Lý Thị H', email: 'lythih@email.com', soDienThoai: '0912345686', trangThai: 'CHO_DUYET', ngayNop: now, yeuCauTuyenDung: 'YCTD08' });
  const uv10 = await mongoose.model('HoSoUngVien').create({ hoTen: 'Ngô Văn I', email: 'ngovani@email.com', soDienThoai: '0912345687', trangThai: 'TU_CHOI', ngayNop: new Date(y, m - 1, 5), yeuCauTuyenDung: 'YCTD09' });
  const uv11 = await mongoose.model('HoSoUngVien').create({ hoTen: 'Dương Thị K', email: 'duongthik@email.com', soDienThoai: '0912345688', trangThai: 'CHO_DUYET', ngayNop: now, yeuCauTuyenDung: 'YCTD10' });
  console.log('ho_so_ung_vien: 11');

  await mongoose.model('LichPhongVan').create({
    _id: 'LPV01',
    idLich: 'LPV01',
    thoiGian: new Date(y, m - 1, 15, 9, 30),
    diaDiem: 'Phòng họp tầng 3',
    ghiChu: 'PV vòng 1',
    ungVien: uvDemo._id,
    nguoiPhongVan: 'NV002',
  });
  await mongoose.model('LichPhongVan').create({ _id: 'LPV02', idLich: 'LPV02', thoiGian: new Date(y, m - 1, 16, 10, 0), diaDiem: 'Phòng họp tầng 2', ghiChu: 'PV vòng 1 Backend', ungVien: uv2._id, nguoiPhongVan: 'NV005' });
  await mongoose.model('LichPhongVan').create({ _id: 'LPV03', idLich: 'LPV03', thoiGian: new Date(y, m - 1, 17, 14, 0), diaDiem: 'Phòng họp tầng 3', ghiChu: 'PV vòng 1 Backend', ungVien: uv3._id, nguoiPhongVan: 'NV006' });
  await mongoose.model('LichPhongVan').create({ _id: 'LPV04', idLich: 'LPV04', thoiGian: new Date(y, m - 2, 20, 9, 0), diaDiem: 'Phòng họp tầng 1', ghiChu: 'PV vòng 2 Mobile (đã từ chối)', ungVien: uv4._id, nguoiPhongVan: 'NV009' });
  await mongoose.model('LichPhongVan').create({ _id: 'LPV05', idLich: 'LPV05', thoiGian: new Date(y, m - 2, 25, 10, 30), diaDiem: 'Phòng họp tầng 2', ghiChu: 'PV Marketing', ungVien: uv5._id, nguoiPhongVan: 'NV007' });
  await mongoose.model('LichPhongVan').create({ _id: 'LPV06', idLich: 'LPV06', thoiGian: new Date(y, m - 1, 18, 9, 0), diaDiem: 'Phòng họp tầng 3', ghiChu: 'PV Kế toán', ungVien: uv6._id, nguoiPhongVan: 'NV008' });
  await mongoose.model('LichPhongVan').create({ _id: 'LPV07', idLich: 'LPV07', thoiGian: new Date(y, m - 1, 19, 14, 0), diaDiem: 'Phòng họp tầng 2', ghiChu: 'PV Sales Manager', ungVien: uv7._id, nguoiPhongVan: 'NV010' });
  await mongoose.model('LichPhongVan').create({ _id: 'LPV08', idLich: 'LPV08', thoiGian: new Date(y, m - 1, 20, 9, 30), diaDiem: 'Phòng CSKH', ghiChu: 'PV CSKH', ungVien: uv8._id, nguoiPhongVan: 'NV011' });
  await mongoose.model('LichPhongVan').create({ _id: 'LPV09', idLich: 'LPV09', thoiGian: new Date(y, m - 1, 21, 10, 0), diaDiem: 'Phòng họp tầng 3', ghiChu: 'PV DevOps', ungVien: uv9._id, nguoiPhongVan: 'NV009' });
  await mongoose.model('LichPhongVan').create({ _id: 'LPV10', idLich: 'LPV10', thoiGian: new Date(y, m - 1, 5, 9, 0), diaDiem: 'Phòng họp tầng 2', ghiChu: 'PV PO (đã từ chối)', ungVien: uv10._id, nguoiPhongVan: 'NV005' });
  await mongoose.model('LichPhongVan').create({ _id: 'LPV11', idLich: 'LPV11', thoiGian: new Date(y, m - 1, 22, 14, 0), diaDiem: 'Phòng họp tầng 3', ghiChu: 'PV UI/UX', ungVien: uv11._id, nguoiPhongVan: 'NV007' });
  console.log('lich_phong_van: 11');

  await mongoose.model('LoginLog').create({
    username: 'admin',
    thoiGian: now,
    ip: '127.0.0.1',
    userAgent: 'seed-demo',
    thanhCong: true,
  });
  await mongoose.model('LoginLog').create({ username: 'director', thoiGian: new Date(y, m - 1, 1, 8, 30), ip: '192.168.1.10', userAgent: 'Chrome/Windows', thanhCong: true });
  await mongoose.model('LoginLog').create({ username: 'hr', thoiGian: new Date(y, m - 1, 2, 9, 0), ip: '192.168.1.11', userAgent: 'Firefox/Mac', thanhCong: true });
  await mongoose.model('LoginLog').create({ username: 'nhanvien', thoiGian: new Date(y, m - 1, 3, 8, 45), ip: '192.168.1.12', userAgent: 'Chrome/Android', thanhCong: true });
  await mongoose.model('LoginLog').create({ username: 'hoangvanc', thoiGian: new Date(y, m - 1, 4, 7, 55), ip: '192.168.1.13', userAgent: 'Edge/Windows', thanhCong: true });
  await mongoose.model('LoginLog').create({ username: 'vuthid', thoiGian: new Date(y, m - 1, 5, 8, 15), ip: '192.168.1.14', userAgent: 'Safari/Mac', thanhCong: true });
  await mongoose.model('LoginLog').create({ username: 'admin', thoiGian: new Date(y, m - 2, 10, 22, 0), ip: '10.0.0.5', userAgent: 'curl', thanhCong: false });
  await mongoose.model('LoginLog').create({ username: 'dangvane', thoiGian: new Date(y, m - 1, 6, 9, 30), ip: '192.168.1.15', userAgent: 'Chrome/Windows', thanhCong: true });
  await mongoose.model('LoginLog').create({ username: 'buithif', thoiGian: new Date(y, m - 1, 7, 8, 0), ip: '192.168.1.16', userAgent: 'Firefox/Windows', thanhCong: true });
  await mongoose.model('LoginLog').create({ username: 'lyvang', thoiGian: new Date(y, m - 1, 8, 8, 20), ip: '192.168.1.17', userAgent: 'Chrome/Linux', thanhCong: true });
  await mongoose.model('LoginLog').create({ username: 'unknown', thoiGian: new Date(y, m - 1, 9, 23, 0), ip: '203.0.113.1', userAgent: 'bot', thanhCong: false });
  console.log('login_log: 11');

  console.log('\n✓ Hoàn tất seed demo tại', mongoUri);
  console.log('  admin /', adminPassword, '— ADMIN');
  console.log('  director, hr, nhanvien /', demoPassword);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
