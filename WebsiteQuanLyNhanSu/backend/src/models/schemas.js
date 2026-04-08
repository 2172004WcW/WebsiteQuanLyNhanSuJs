import mongoose from 'mongoose';

const { Schema } = mongoose;

export const ChiNhanhSchema = new Schema(
  {
    _id: { type: String },
    tenChiNhanh: { type: String, required: true },
    diaChi: String,
  },
  { collection: 'chi_nhanh' }
);

export const PhongBanSchema = new Schema(
  {
    _id: { type: String },
    tenPhongBan: { type: String, required: true },
    chiNhanh: { type: String, ref: 'ChiNhanh' },
  },
  { collection: 'phong_ban' }
);

export const NhomSchema = new Schema(
  {
    _id: { type: String },
    tenNhom: { type: String, required: true },
    phongBan: { type: String, ref: 'PhongBan' },
  },
  { collection: 'nhom' }
);

export const ChucVuSchema = new Schema(
  {
    _id: { type: String },
    tenChucVu: { type: String, required: true },
  },
  { collection: 'chuc_vu' }
);

export const BangLuongSchema = new Schema(
  {
    _id: { type: String },
    tenChucVu: { type: String, required: true },
    luongCoBan: Number,
    phuCapDinhMuc: Number,
  },
  { collection: 'bang_luong' }
);

export const NhanVienSchema = new Schema(
  {
    _id: { type: String },
    hoTen: { type: String, required: true },
    gioiTinh: String,
    soCccd: String,
    ngayCap: Date,
    noiCap: String,
    ngaySinh: Date,
    soDienThoai: String,
    emailCongViec: String,
    diaChiTamTru: String,
    anhDaiDienUrl: String,
    ngayVaoLam: Date,
    soNgayPhepConLai: { type: Number, default: 12 },
    trangThaiHoatDong: { type: String, default: 'DANG_LAM_VIEC' },
    heSoLuong: Number,
    phongBan: { type: String, ref: 'PhongBan' },
    nhom: { type: String, ref: 'Nhom' },
    chucVu: { type: String, ref: 'ChucVu' },
    bangLuong: { type: String, ref: 'BangLuong' },
    nguoiQuanLyTruocTiep: { type: String, ref: 'NhanVien' },
  },
  { collection: 'nhan_vien' }
);

NhanVienSchema.virtual('phongBanId').get(function () {
  return this.phongBan || null;
});
NhanVienSchema.virtual('chucVuId').get(function () {
  return this.chucVu || null;
});
NhanVienSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const TaiKhoanSchema = new Schema(
  {
    _id: { type: String },
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: String,
    resetToken: String,
    resetTokenExpiry: Date,
    trangThaiTaiKhoan: { type: Boolean, default: true },
    ngayTao: Date,
    nhanVien: { type: String, ref: 'NhanVien' },
  },
  { collection: 'taikhoan' }
);

export const PhieuLuongSchema = new Schema(
  {
    _id: { type: String },
    thangNam: String,
    luongCoBan: Number,
    phuCap: Number,
    phatMuon: Number,
    nghiKhongPhep: Number,
    tongLuong: Number,
    trangThaiThanhToan: String,
    nhanVien: { type: String, ref: 'NhanVien' },
  },
  { collection: 'phieu_luong' }
);

export const ChamCongSchema = new Schema(
  {
    nhanVien: { type: String, ref: 'NhanVien', required: true },
    ngay: { type: Date, default: () => new Date() },
    gioVao: String,
    gioRa: String,
    trangThai: String,
  },
  { collection: 'cham_cong' }
);
ChamCongSchema.index({ nhanVien: 1, ngay: 1 });

export const DonNghiPhepSchema = new Schema(
  {
    nhanVien: { type: String, ref: 'NhanVien', required: true },
    loaiNghi: String,
    tuNgay: Date,
    denNgay: Date,
    lyDo: String,
    trangThai: { type: String, default: 'CHO_HR_XAC_NHAN' },
    nguoiDuyet: { type: String, ref: 'NhanVien' },
  },
  { collection: 'don_nghi_phep' }
);

export const ThongBaoSchema = new Schema(
  {
    nguoiNhan: String,
    tieuDe: { type: String, required: true },
    noiDung: String,
    loai: String,
    daDoc: { type: Boolean, default: false },
    ngayTao: Date,
    refPayload: String,
  },
  { collection: 'thong_bao' }
);

export const QuyetDinhSchema = new Schema(
  {
    _id: { type: String },
    nhanVien: { type: String, ref: 'NhanVien', required: true },
    loaiQuyetDinh: { type: String, required: true },
    ngayKy: Date,
    noiDungQuyetDinh: String,
    nguoiKy: String,
    noiDung: String,
    soTien: Number,
  },
  { collection: 'quyet_dinh' }
);
QuyetDinhSchema.virtual('soQuyetDinh').get(function () {
  return this._id;
});
QuyetDinhSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.soQuyetDinh = ret._id;
    delete ret.__v;
    return ret;
  },
});

export const LichSuCongTacSchema = new Schema(
  {
    nhanVien: { type: String, ref: 'NhanVien', required: true },
    tuNgay: Date,
    denNgay: Date,
    phongBanCu: String,
    phongBanMoi: String,
    chucVuCu: String,
    chucVuMoi: String,
    ghiChu: String,
  },
  { collection: 'lich_su_cong_tac' }
);

export const YeuCauTuyenDungSchema = new Schema(
  {
    _id: { type: String },
    idYeuCau: { type: String },
    viTriCanTuyen: String,
    soLuong: Number,
    trinhDoYeuCau: String,
    trangThai: { type: String, default: 'PENDING' },
    moTa: String,
    ngayYeuCau: Date,
    phongBan: { type: String, ref: 'PhongBan' },
  },
  { collection: 'yeu_cau_tuyen_dung' }
);

export const HoSoUngVienSchema = new Schema(
  {
    hoTen: { type: String, required: true },
    email: { type: String, required: true },
    soDienThoai: String,
    cvUrl: String,
    trangThai: { type: String, default: 'CHO_DUYET' },
    ngayNop: Date,
    yeuCauTuyenDung: { type: String, ref: 'YeuCauTuyenDung' },
  },
  { collection: 'ho_so_ung_vien' }
);

export const LichPhongVanSchema = new Schema(
  {
    _id: { type: String },
    idLich: String,
    thoiGian: Date,
    diaDiem: String,
    ghiChu: String,
    ungVien: { type: Schema.Types.ObjectId, ref: 'HoSoUngVien' },
    nguoiPhongVan: { type: String, ref: 'NhanVien' },
  },
  { collection: 'lich_phong_van' }
);

/** Audit đăng nhập (Java không có bảng — endpoint trả []; Node lưu thật) */
export const LoginLogSchema = new Schema(
  {
    username: { type: String, required: true, index: true },
    thoiGian: { type: Date, default: Date.now, index: true },
    ip: String,
    userAgent: String,
    thanhCong: { type: Boolean, default: true },
  },
  { collection: 'login_log' }
);

export function registerModels() {
  mongoose.model('ChiNhanh', ChiNhanhSchema);
  mongoose.model('PhongBan', PhongBanSchema);
  mongoose.model('Nhom', NhomSchema);
  mongoose.model('ChucVu', ChucVuSchema);
  mongoose.model('BangLuong', BangLuongSchema);
  mongoose.model('NhanVien', NhanVienSchema);
  mongoose.model('TaiKhoan', TaiKhoanSchema);
  mongoose.model('PhieuLuong', PhieuLuongSchema);
  mongoose.model('ChamCong', ChamCongSchema);
  mongoose.model('DonNghiPhep', DonNghiPhepSchema);
  mongoose.model('ThongBao', ThongBaoSchema);
  mongoose.model('QuyetDinh', QuyetDinhSchema);
  mongoose.model('LichSuCongTac', LichSuCongTacSchema);
  mongoose.model('YeuCauTuyenDung', YeuCauTuyenDungSchema);
  mongoose.model('HoSoUngVien', HoSoUngVienSchema);
  mongoose.model('LichPhongVan', LichPhongVanSchema);
  mongoose.model('LoginLog', LoginLogSchema);
}
