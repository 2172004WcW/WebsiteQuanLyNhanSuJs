import { Router } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { findNhanVienByUsername } from './helpers/userContext.js';
import { extractJwt } from './middleware/auth.js';
import { verifyToken } from './jwt.js';
import { config } from './config.js';
import { monthAliases, normalizeThangNam } from './utils/thangNam.js';
import { buildPayslipPdf } from './utils/payslipPdf.js';
import * as dashboardService from './services/dashboardService.js';
import * as donNghiPhepService from './services/donNghiPhepService.js';
import * as notificationService from './services/notificationService.js';
import * as adminService from './services/adminService.js';
import * as employeeService from './services/employeeService.js';
import * as organizationService from './services/organizationService.js';
import * as payrollService from './services/payrollService.js';
import * as historyService from './services/historyService.js';
import * as loginLogService from './services/loginLogService.js';
import * as recruitmentService from './services/recruitmentService.js';

const upload = multer({ storage: multer.memoryStorage() });

function role(req) {
  return req.jwtPayload?.role;
}

function requireRoles(...roles) {
  const u = roles.map((r) => r.toUpperCase());
  return (req, res, next) => {
    const r0 = String(role(req) || '').toUpperCase();
    if (!u.includes(r0)) {
      res.status(403).json({ message: 'Không đủ quyền' });
      return;
    }
    next();
  };
}

async function currentNhanVien(req) {
  const u = req.jwtPayload?.sub;
  return findNhanVienByUsername(u);
}

async function currentTaiKhoan(req) {
  const { findTaiKhoanByUsername } = await import('./helpers/userContext.js');
  return findTaiKhoanByUsername(req.jwtPayload?.sub);
}

/** Giống DashboardController.getTokenFromCookie + JWT */
async function nvFromDashboardStyle(req) {
  const raw = extractJwt(req);
  if (!raw) return null;
  try {
    const payload = verifyToken(raw);
    return findNhanVienByUsername(payload.sub);
  } catch {
    return null;
  }
}

export function buildProtectedRouter() {
  const r = Router();

  r.get('/profile/me', async (req, res) => {
    const tk = await currentTaiKhoan(req);
    if (!tk?.nhanVien) return res.status(404).send('Không tìm thấy thông tin nhân viên');
    const nv = await mongoose.model('NhanVien').findById(tk.nhanVien).populate(['phongBan', 'chucVu', 'nhom']);
    return res.json(nv);
  });

  r.get('/employees', async (_req, res) => {
    const list = await employeeService.getAllEmployees();
    res.json(list);
  });

  r.post('/employees/onboard', requireRoles('ADMIN'), async (req, res) => {
    try {
      const nv = await employeeService.onboardEmployee(req.body);
      res.json(nv);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  });

  r.put('/employees/:id/update-profile', async (req, res) => {
    try {
      const nv = await employeeService.updateProfile(req.params.id, req.body);
      res.json(nv);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  });

  r.get('/employees/:id', async (req, res) => {
    try {
      const nv = await employeeService.getEmployeeById(req.params.id);
      res.json(nv);
    } catch (e) {
      res.status(404).json({ message: e.message });
    }
  });

  r.put('/employees/:id/bang-luong', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try {
      await employeeService.setBangLuongForEmployee(req.params.id, req.body?.bangLuongId);
      res.json({ message: 'Gán bảng lương thành công' });
    } catch (ex) {
      const msg = ex.message || 'Lỗi';
      if (msg.includes('nhân viên')) return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
      if (msg.includes('bảng lương')) return res.status(404).json({ message: 'Không tìm thấy bảng lương' });
      res.status(400).json({ message: msg });
    }
  });

  r.get('/payroll/structure', requireRoles('HR', 'ADMIN'), async (_req, res) => {
    res.json(await mongoose.model('BangLuong').find({}));
  });

  r.delete('/payroll/structure/:id', requireRoles('HR', 'ADMIN'), async (req, res) => {
    const employees = await mongoose.model('NhanVien').find({ bangLuong: req.params.id });
    if (employees.length) {
      return res.status(400).json({ message: 'Không thể xóa vì đang có nhân viên sử dụng bảng lương này' });
    }
    await mongoose.model('BangLuong').deleteOne({ _id: req.params.id });
    res.json({ message: 'Xóa bảng lương thành công' });
  });

  r.get('/payroll/my-payslips', async (req, res) => {
    const tk = await currentTaiKhoan(req);
    if (!tk?.nhanVien) return res.status(404).send('Không tìm thấy thông tin nhân viên');
    const nvId = tk.nhanVien._id || tk.nhanVien;
    let list = await mongoose.model('PhieuLuong').find({ nhanVien: nvId }).lean();
    list = list.map((p) => ({ ...p, thangNam: normalizeThangNam(p.thangNam) }));
    res.json(list);
  });

  r.post('/payroll/structure', async (req, res) => {
    const bl = await mongoose.model('BangLuong').create(req.body);
    res.json(bl);
  });

  r.post('/payroll/generate', async (req, res) => {
    try {
      await payrollService.scanAndCalculatePayroll(req.query.thangNam);
      res.send(`Tổng hợp lương tháng ${req.query.thangNam} thành công`);
    } catch (e) {
      res.status(500).send(`Lỗi: ${e.message}`);
    }
  });

  r.patch('/payroll/status/:id', async (req, res) => {
    const pl = await mongoose.model('PhieuLuong').findById(req.params.id);
    if (!pl) return res.status(404).send('Không tìm thấy phiếu lương');
    pl.trangThaiThanhToan = req.query.status;
    await pl.save();
    res.send('Cập nhật trạng thái thành công');
  });

  r.get('/payroll/all', requireRoles('HR', 'ADMIN'), async (req, res) => {
    const thang = req.query.thang;
    let list;
    if (!thang || !thang.trim()) {
      list = await mongoose.model('PhieuLuong').find({}).populate('nhanVien', 'hoTen').lean();
    } else {
      const n = normalizeThangNam(thang);
      list = await mongoose.model('PhieuLuong').find({ thangNam: { $in: monthAliases(n) } }).populate('nhanVien', 'hoTen').lean();
    }
    list = list.map((p) => ({ 
      ...p, 
      thangNam: normalizeThangNam(p.thangNam),
      nhanVien: (p.nhanVien && p.nhanVien._id) ? p.nhanVien._id : p.nhanVien,
      hoTen: (p.nhanVien && p.nhanVien.hoTen) ? p.nhanVien.hoTen : null
    }));
    res.json(list);
  });

  r.put('/payroll/:id/approve', requireRoles('HR', 'ADMIN'), async (req, res) => {
    const pl = await mongoose.model('PhieuLuong').findById(req.params.id);
    if (!pl) return res.status(404).send('Không tìm thấy phiếu lương');
    pl.trangThaiThanhToan = 'DA_THANH_TOAN';
    await pl.save();
    res.send('Phê duyệt phiếu lương thành công');
  });

  r.get('/payroll/summary', requireRoles('DIRECTOR', 'ADMIN', 'HR'), async (req, res) => {
    const normalized = normalizeThangNam(req.query.thang);
    const list = await mongoose.model('PhieuLuong').find({ thangNam: { $in: monthAliases(normalized) } }).lean();
    const tongQuyLuong = list.reduce((s, p) => s + (p.tongLuong || 0), 0);
    const daDuyet = list.filter((p) => String(p.trangThaiThanhToan).toUpperCase() === 'DA_THANH_TOAN').length;
    const chuaDuyet = list.filter((p) => String(p.trangThaiThanhToan).toUpperCase() === 'CHUA_THANH_TOAN').length;
    res.json({
      thang: normalized,
      tongNhanVien: list.length,
      tongQuyLuong,
      daDuyet,
      chuaDuyet,
    });
  });

  r.get(`/organizations/chi-nhanh`, async (_req, res) => res.json(await organizationService.listChiNhanh()));
    r.post(`/organizations/chi-nhanh`, async (req, res) => {
      try {
        res.json(await organizationService.createChiNhanh(req.body));
      } catch (e) {
        res.status(400).json({ message: e.message });
      }
    });
    r.put(`/organizations/chi-nhanh/:id`, async (req, res) => {
      try {
        res.json(await organizationService.updateChiNhanh(req.params.id, req.body));
      } catch (e) {
        res.status(400).json({ message: e.message });
      }
    });
    r.delete(`/organizations/chi-nhanh/:id`, async (req, res) => {
      await organizationService.deleteChiNhanh(req.params.id);
      res.json({ ok: true });
    });
    r.get(`/organizations/phong-ban`, async (_req, res) => res.json(await organizationService.listPhongBan()));
    r.post(`/organizations/phong-ban`, async (req, res) => {
      try {
        res.json(await organizationService.createPhongBan(req.body));
      } catch (e) {
        res.status(400).json({ message: e.message });
      }
    });
    r.put(`/organizations/phong-ban/:id`, async (req, res) => {
      try {
        res.json(await organizationService.updatePhongBan(req.params.id, req.body));
      } catch (e) {
        res.status(400).json({ message: e.message });
      }
    });
    r.delete(`/organizations/phong-ban/:id`, async (req, res) => {
      await organizationService.deletePhongBan(req.params.id);
      res.json({ ok: true });
    });
    r.get(`/organizations/nhom`, async (_req, res) => res.json(await organizationService.listNhom()));
    r.post(`/organizations/nhom`, async (req, res) => {
      try {
        res.json(await organizationService.createNhom(req.body));
      } catch (e) {
        res.status(400).json({ message: e.message });
      }
    });
    r.put(`/organizations/nhom/:id`, async (req, res) => {
      try {
        res.json(await organizationService.updateNhom(req.params.id, req.body));
      } catch (e) {
        res.status(400).json({ message: e.message });
      }
    });
    r.delete(`/organizations/nhom/:id`, async (req, res) => {
      await organizationService.deleteNhom(req.params.id);
      res.json({ ok: true });
    });
    r.get(`/organizations/chuc-vu`, async (_req, res) => res.json(await organizationService.listChucVu()));
    r.post(`/organizations/chuc-vu`, async (req, res) => {
      try {
        res.json(await organizationService.createChucVu(req.body));
      } catch (e) {
        res.status(400).json({ message: e.message });
      }
    });
    r.put(`/organizations/chuc-vu/:id`, async (req, res) => {
      try {
        res.json(await organizationService.updateChucVu(req.params.id, req.body));
      } catch (e) {
        res.status(400).json({ message: e.message });
      }
    });
    r.delete(`/organizations/chuc-vu/:id`, async (req, res) => {
      await organizationService.deleteChucVu(req.params.id);
      res.json({ ok: true });
    });

  r.get('/notifications', requireRoles('ADMIN', 'HR', 'EMPLOYEE', 'DIRECTOR'), async (req, res) => {
    const u = req.jwtPayload.sub;
    res.json(await notificationService.listForUser(u, Number(req.query.limit || 50)));
  });

  r.get('/notifications/unread-count', requireRoles('ADMIN', 'HR', 'EMPLOYEE', 'DIRECTOR'), async (req, res) => {
    const u = req.jwtPayload.sub;
    res.json({ unread: await notificationService.countUnreadPrivate(u) });
  });

  r.put('/notifications/:id/read', requireRoles('ADMIN', 'HR', 'EMPLOYEE', 'DIRECTOR'), async (req, res) => {
    const ok = await notificationService.markRead(req.params.id, req.jwtPayload.sub);
    if (!ok) return res.status(404).end();
    res.json({});
  });

  r.put('/notifications/read-all', requireRoles('ADMIN', 'HR', 'EMPLOYEE', 'DIRECTOR'), async (req, res) => {
    const n = await notificationService.markAllReadPrivate(req.jwtPayload.sub);
    res.json({ updated: n });
  });

  r.post('/notifications/broadcast', requireRoles('ADMIN'), async (req, res) => {
    await notificationService.notifyBroadcast(
      'SYSTEM_BROADCAST',
      req.body?.title || 'Thông báo hệ thống',
      req.body?.content || '',
      null
    );
    res.status(202).end();
  });

  r.post('/history/quyet-dinh', requireRoles('ADMIN', 'HR'), async (req, res) => {
    try {
      const out = await historyService.banHanhQuyetDinh(req.body, req.query.phongBanMoiId, req.query.chucVuMoiId);
      res.json(out);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  });

  r.get('/history/cong-tac/:nhanVienId', async (req, res) => {
    res.json(await historyService.getLichSuByNhanVien(req.params.nhanVienId));
  });

  r.get('/history/quyet-dinh', requireRoles('ADMIN', 'HR'), async (req, res) => {
    res.json(await historyService.getAllQuyetDinh(req.query.nhanVienId));
  });

  r.post('/attendance/check-in/:nhanVienId', async (req, res) => {
    try {
      const ChamCong = mongoose.model('ChamCong');
      const NhanVien = mongoose.model('NhanVien');
      const today = new Date();
      const dayStart = new Date(today);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(today);
      dayEnd.setHours(23, 59, 59, 999);
      const exists = await ChamCong.findOne({
        nhanVien: req.params.nhanVienId,
        ngay: { $gte: dayStart, $lte: dayEnd },
      });
      if (exists) return res.status(400).send('Bạn đã check-in ngày hôm nay rồi!');
      const nv = await NhanVien.findById(req.params.nhanVienId);
      if (!nv) throw new Error('Không tìm thấy nhân viên');
      const now = new Date();
      const hh = now.getHours();
      const mm = now.getMinutes();
      const ss = now.getSeconds();
      const gioVao = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
      const after815 = hh > 8 || (hh === 8 && mm > 15);
      const cc = await ChamCong.create({
        nhanVien: nv._id,
        ngay: now,
        gioVao,
        trangThai: after815 ? 'DI_MUON' : 'DI_LAM',
      });
      res.send(`Check-in thành công! Trạng thái: ${cc.trangThai}`);
    } catch (e) {
      res.status(400).send(`Lỗi: ${e.message}`);
    }
  });

  r.post('/attendance/check-out/:nhanVienId', async (req, res) => {
    try {
      const ChamCong = mongoose.model('ChamCong');
      const today = new Date();
      const dayStart = new Date(today);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(today);
      dayEnd.setHours(23, 59, 59, 999);
      const cc = await ChamCong.findOne({
        nhanVien: req.params.nhanVienId,
        ngay: { $gte: dayStart, $lte: dayEnd },
      });
      if (!cc) return res.status(400).send('Chưa có bản ghi check-in hôm nay!');
      const now = new Date();
      cc.gioRa = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      await cc.save();
      res.send(`Check-out thành công lúc ${cc.gioRa}`);
    } catch (e) {
      res.status(400).send(`Lỗi: ${e.message}`);
    }
  });

  r.put('/attendance/record/:id', async (req, res) => {
    const cc = await mongoose.model('ChamCong').findById(req.params.id);
    if (!cc) return res.status(404).end();
    Object.assign(cc, req.body);
    await cc.save();
    res.json(cc);
  });

  // POST /attendance/leave-request — routes qua donNghiPhepService (có QL → CHO_QL_DUYET, không có → CHO_HR_XAC_NHAN)
  r.post('/attendance/leave-request', async (req, res) => {
    try {
      const NhanVien = mongoose.model('NhanVien');
      const nvId = req.body.nhanVien?.id || req.body.nhanVien?._id || req.body.nhanVien;
      const nv = await NhanVien.findById(nvId);
      if (!nv) throw new Error('Nhân viên không tồn tại');
      const don = await donNghiPhepService.createLeaveRequest(nv, req.body);
      res.json({ message: 'Gửi đơn thành công!', don });
    } catch (e) {
      res.status(400).send(`Lỗi: ${e.message}`);
    }
  });

  // POST /attendance/approve-leave đã bị xóa (dư thừa — dùng donNghiPhepService.confirmByHr qua route HR dashboard thay thế)

  r.delete('/attendance/leave-request/:id', async (req, res) => {
    try {
      const don = await mongoose.model('DonNghiPhep').findById(req.params.id);
      if (!don) throw new Error('Không tìm thấy đơn');
      const st1 = String(don.trangThai || '').toUpperCase();
      if (!['CHO_DUYET', 'CHO_HR_XAC_NHAN', 'CHO_QL_DUYET'].includes(st1)) {
        return res.status(400).send('Không thể xóa đơn đã được phê duyệt!');
      }
      await don.deleteOne();
      res.send(`Đã xóa đơn nghỉ phép ID: ${req.params.id}`);
    } catch (e) {
      res.status(400).send(`Lỗi: ${e.message}`);
    }
  });

  r.get('/attendance/report/:nhanVienId', async (req, res) => {
    try {
      const ChamCong = mongoose.model('ChamCong');
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      const records = await ChamCong.find({
        nhanVien: req.params.nhanVienId,
        ngay: { $gte: start, $lte: end },
      }).lean();
      const diMuon = records.filter((x) => x.trangThai === 'DI_MUON').length;
      const dungGio = records.filter((x) => x.trangThai === 'DI_LAM').length;
      res.json({
        nhanVienId: req.params.nhanVienId,
        thang: new Date().getMonth() + 1,
        tongBuoiChamCong: records.length,
        diMuon,
        dungGio,
        lichSuChiTiet: records,
      });
    } catch (e) {
      res.status(400).send(`Lỗi báo cáo: ${e.message}`);
    }
  });

  r.get('/dashboard/employee/profile', async (req, res) => {
    const nv = await currentNhanVien(req);
    if (!nv) return res.status(401).json({ message: 'Chưa xác thực' });
    const payload = await dashboardService.getEmployeeProfilePayload(nv._id);
    if (!payload) return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });
    res.json(payload);
  });

  r.put('/dashboard/employee/profile', async (req, res) => {
    let nv = await currentNhanVien(req);
    if (!nv) return res.status(401).json({ message: 'Chưa xác thực' });
    nv = await mongoose.model('NhanVien').findById(nv._id);
    const b = req.body || {};
    if (b.email != null) nv.emailCongViec = b.email?.trim() || nv.emailCongViec;
    if (b.phone != null) nv.soDienThoai = b.phone?.trim() || nv.soDienThoai;
    if (b.address != null) nv.diaChiTamTru = b.address?.trim() || nv.diaChiTamTru;
    if (b.city || b.notes) {
      let base = (nv.diaChiTamTru || '').trim();
      if (b.city?.trim()) base = base ? `${base}, ${b.city.trim()}` : b.city.trim();
      if (b.notes?.trim()) base = base ? `${base}\nGhi chú: ${b.notes.trim()}` : `Ghi chú: ${b.notes.trim()}`;
      nv.diaChiTamTru = base;
    }
    if (b.startDate?.trim()) {
      nv.ngayVaoLam = new Date(b.startDate);
    }
    await nv.save();
    const payload = await dashboardService.getEmployeeProfilePayload(nv._id);
    if (!payload) return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });
    res.json(payload);
  });

  r.post('/dashboard/employee/profile/avatar', upload.single('avatar'), async (req, res) => {
    const nv = await currentNhanVien(req);
    if (!nv) return res.status(401).json({ message: 'Chưa xác thực' });
    if (!req.file) return res.status(400).json({ message: 'Chưa chọn file' });
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(req.file.mimetype)) return res.status(400).json({ message: 'Định dạng ảnh không hợp lệ' });
    if (req.file.size > 5 * 1024 * 1024) return res.status(400).json({ message: 'Kích thước file vượt quá 5MB' });
    const fs = await import('fs/promises');
    const path = await import('path');
    const dir = path.resolve(config.uploadAvatarDir);
    await fs.mkdir(dir, { recursive: true });
    const ext =
      req.file.mimetype === 'image/jpeg'
        ? 'jpg'
        : req.file.mimetype === 'image/png'
          ? 'png'
          : req.file.mimetype === 'image/gif'
            ? 'gif'
            : 'webp';
    const filename = `${nv._id}_${Date.now()}.${ext}`;
    await fs.writeFile(path.join(dir, filename), req.file.buffer);
    const avatarUrl = `/uploads/avatars/${filename}`;
    await mongoose.model('NhanVien').updateOne({ _id: nv._id }, { $set: { anhDaiDienUrl: avatarUrl } });
    res.json({ avatarUrl });
  });

  r.get('/dashboard/employee/stats', async (req, res) => {
    const nv = await currentNhanVien(req);
    if (!nv) return res.status(401).json({ message: 'Chưa xác thực' });
    const full = await mongoose.model('NhanVien').findById(nv._id);
    res.json(await dashboardService.getEmployeeStats(full));
  });

  r.get('/dashboard/employee/leaves', async (req, res) => {
    const nv = await currentNhanVien(req);
    if (!nv) return res.status(401).json({ message: 'Chưa xác thực' });
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const list = await dashboardService.getEmployeeLeaves(nv._id, limit);
    const out = list.map((d) => ({
      id: d._id,
      loaiNghi: d.loaiNghi,
      tuNgay: d.tuNgay ? new Date(d.tuNgay).toISOString().slice(0, 10) : null,
      denNgay: d.denNgay ? new Date(d.denNgay).toISOString().slice(0, 10) : null,
      lyDo: d.lyDo,
      trangThai: d.trangThai,
    }));
    res.json(out);
  });

  // POST /dashboard/employee/leaves — routes đúng qua donNghiPhepService.createLeaveRequest
  r.post('/dashboard/employee/leaves', async (req, res) => {
    const nv = await currentNhanVien(req);
    if (!nv) return res.status(401).json({ message: 'Chưa xác thực' });
    const b = req.body || {};
    if (!b.loaiNghi?.trim()) return res.status(400).json({ message: 'loaiNghi là bắt buộc' });
    let tuNgay;
    let denNgay;
    try {
      tuNgay = new Date(b.tuNgay);
      denNgay = new Date(b.denNgay);
    } catch {
      return res.status(400).json({ message: 'tuNgay/denNgay phải theo định dạng yyyy-MM-dd' });
    }
    if (isNaN(tuNgay) || isNaN(denNgay)) return res.status(400).json({ message: 'tuNgay/denNgay không hợp lệ' });
    if (tuNgay > denNgay) return res.status(400).json({ message: 'tuNgay phải nhỏ hơn hoặc bằng denNgay' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (tuNgay < today) return res.status(400).json({ message: 'tuNgay không được nhỏ hơn ngày hiện tại' });
    try {
      const don = await donNghiPhepService.createLeaveRequest(nv, {
        loaiNghi: b.loaiNghi,
        tuNgay,
        denNgay,
        lyDo: b.lyDo,
      });
      res.status(201).json({
        id: don._id,
        loaiNghi: don.loaiNghi,
        tuNgay: don.tuNgay ? new Date(don.tuNgay).toISOString().slice(0, 10) : null,
        denNgay: don.denNgay ? new Date(don.denNgay).toISOString().slice(0, 10) : null,
        lyDo: don.lyDo,
        trangThai: don.trangThai,
      });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  });

  r.delete('/dashboard/employee/leaves/:id', async (req, res) => {
    const nv = await currentNhanVien(req);
    if (!nv) return res.status(401).json({ message: 'Chưa xác thực' });
    const d = await mongoose.model('DonNghiPhep').findById(req.params.id);
    if (!d) return res.status(404).json({ message: 'Không tìm thấy đơn' });
    if (String(d.nhanVien) !== String(nv._id)) return res.status(403).json({ message: 'Không có quyền thao tác đơn này' });
    const st = String(d.trangThai || '').toUpperCase();
    const coTheHuy =
      st === 'CHO_QL_DUYET' || st === 'CHO_HR_XAC_NHAN' || st === 'CHO_DUYET';
    if (!coTheHuy) {
      return res.status(400).json({ message: 'Không thể hủy đơn ở trạng thái hiện tại' });
    }
    await d.deleteOne();
    res.json({ message: 'Đã hủy đơn' });
  });

  r.get('/dashboard/employee/attendance-summary', async (req, res) => {
    const nv = await nvFromDashboardStyle(req);
    if (!nv) return res.status(401).send('Unauthorized');
    res.json(await dashboardService.getAttendanceSummary(nv));
  });

  r.get('/dashboard/employee/payslips', async (req, res) => {
    const nv = await nvFromDashboardStyle(req);
    if (!nv) return res.status(401).send('Unauthorized');
    const payslips = await dashboardService.getEmployeePayslips(
      nv._id,
      req.query.limit ? Number(req.query.limit) : undefined,
      req.query.year,
      req.query.month
    );
    res.json(payslips);
  });

  r.get('/dashboard/employee/payslips/:id', async (req, res) => {
    const nv = await nvFromDashboardStyle(req);
    if (!nv) return res.status(401).send('Unauthorized');
    const detail = await dashboardService.getEmployeePayslipDetail(req.params.id, nv);
    if (!detail) return res.status(404).send('Not found');
    res.json(detail);
  });

  r.get('/dashboard/employee/payslips/:id/download', async (req, res) => {
    const nv = await nvFromDashboardStyle(req);
    if (!nv) return res.status(401).end();
    const detail = await dashboardService.getEmployeePayslipDetail(req.params.id, nv);
    if (!detail) return res.status(404).end();
    const pdf = buildPayslipPdf(detail);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip-${req.params.id}.pdf`);
    res.send(pdf);
  });

  r.get('/dashboard/employee/attendance-history', async (req, res) => {
    const nv = await nvFromDashboardStyle(req);
    if (!nv) return res.status(401).send('Unauthorized');
    res.json(await dashboardService.getAttendanceHistory(nv, req.query));
  });

  r.get('/dashboard/employee/attendance-trend', async (req, res) => {
    const nv = await nvFromDashboardStyle(req);
    if (!nv) return res.status(401).send('Unauthorized');
    res.json(await dashboardService.getEmployeeAttendanceTrend(nv));
  });

  r.get('/dashboard/director/kpi', requireRoles('DIRECTOR'), async (req, res) => {
    const nv = await nvFromDashboardStyle(req);
    if (!nv) return res.status(401).send('Unauthorized');
    res.json(await dashboardService.getDirectorKpi(nv));
  });

  r.get('/dashboard/director/headcount-trend', requireRoles('DIRECTOR'), async (req, res) => {
    res.json(await dashboardService.getDirectorHeadcountTrend());
  });

  r.get('/dashboard/director/attendance-by-dept', requireRoles('DIRECTOR'), async (req, res) => {
    res.json(
      await dashboardService.getDirectorAttendanceByDept(
        req.query.month ? Number(req.query.month) : undefined,
        req.query.year ? Number(req.query.year) : undefined
      )
    );
  });

  r.get('/dashboard/director/salary-trend', requireRoles('DIRECTOR'), async (req, res) => {
    res.json(await dashboardService.getDirectorSalaryTrend());
  });

  r.get('/dashboard/director/leaves/pending', async (req, res) => {
    const nv = await nvFromDashboardStyle(req);
    if (!nv) return res.status(401).send('Unauthorized');
    res.json(await donNghiPhepService.getManagerPendingLeaves(nv));
  });

  r.put('/dashboard/director/leaves/:id/approve', async (req, res) => {
    const nv = await nvFromDashboardStyle(req);
    if (!nv) return res.status(401).send('Unauthorized');
    try {
      const out = await donNghiPhepService.approveByManager(req.params.id, nv);
      res.json(out);
    } catch (e) {
      res.status(400).send(e.message);
    }
  });

  r.put('/dashboard/director/leaves/:id/reject', async (req, res) => {
    const nv = await nvFromDashboardStyle(req);
    if (!nv) return res.status(401).send('Unauthorized');
    try {
      const out = await donNghiPhepService.rejectLeave(
        req.params.id,
        req.body?.reason || '',
        nv,
        true
      );
      res.json(out);
    } catch (e) {
      res.status(400).send(e.message);
    }
  });

  r.get('/dashboard/hr/stats', requireRoles('HR'), async (_req, res) => {
    try {
      res.json(await dashboardService.getHrStats());
    } catch (e) {
      res.status(403).json({ message: e.message });
    }
  });

  r.get('/dashboard/hr/employees', requireRoles('HR'), async (_req, res) => {
    res.json(await dashboardService.getAllEmployees());
  });

  r.get('/dashboard/hr/employees/:id', requireRoles('HR'), async (req, res) => {
    const nv = await dashboardService.getEmployeeById(req.params.id);
    return nv ? res.json(nv) : res.status(404).send('Employee not found');
  });

  r.post('/dashboard/hr/employees', requireRoles('HR'), async (req, res) => {
    try {
      const body = req.body;
      const id = body.id || body._id;
      const doc = {
        _id: id,
        hoTen: body.hoTen,
        gioiTinh: body.gioiTinh,
        soCccd: body.soCccd,
        emailCongViec: body.emailCongViec,
        soDienThoai: body.soDienThoai,
        diaChiTamTru: body.diaChiTamTru,
        ngayVaoLam: body.ngayVaoLam,
        phongBan: body.phongBan?.id || body.phongBan,
        chucVu: body.chucVu?.id || body.chucVu,
        nhom: body.nhom?.id || body.nhom,
        bangLuong: body.bangLuong?.id || body.bangLuong,
        soNgayPhepConLai: body.soNgayPhepConLai,
        trangThaiHoatDong: body.trangThaiHoatDong,
      };
      const created = await dashboardService.createEmployee(doc);
      res.json(created);
    } catch (e) {
      res.status(400).send(`Failed to create employee: ${e.message}`);
    }
  });

  r.put('/dashboard/hr/employees/:id', requireRoles('HR'), async (req, res) => {
    try {
      const updated = await dashboardService.updateEmployee(req.params.id, req.body);
      return updated ? res.json(updated) : res.status(404).send('Employee not found');
    } catch (e) {
      res.status(400).send(`Failed to update employee: ${e.message}`);
    }
  });

  r.delete('/dashboard/hr/employees/:id', requireRoles('HR'), async (req, res) => {
    const ok = await dashboardService.deleteEmployee(req.params.id);
    return ok ? res.send('Deleted') : res.status(404).send('Employee not found');
  });

  r.get('/dashboard/hr/leaves/pending', requireRoles('HR'), async (_req, res) => {
    res.json(await donNghiPhepService.getHrPendingLeaves());
  });

  r.get('/dashboard/hr/leaves', requireRoles('HR'), async (_req, res) => {
    res.json(await dashboardService.getAllLeaves());
  });

  r.put('/dashboard/hr/leaves/:id/approve', requireRoles('HR'), async (req, res) => {
    try {
      const out = await donNghiPhepService.confirmByHr(req.params.id);
      res.json(out);
    } catch (e) {
      res.status(400).send(e.message);
    }
  });

  r.put('/dashboard/hr/leaves/:id/reject', requireRoles('HR'), async (req, res) => {
    try {
      const hr = await nvFromDashboardStyle(req);
      const out = await donNghiPhepService.rejectLeave(req.params.id, req.body?.reason || '', hr, false);
      res.json(out);
    } catch (e) {
      res.status(400).send(e.message);
    }
  });

  r.delete('/dashboard/hr/leaves/:id', requireRoles('HR'), async (req, res) => {
    const ok = await dashboardService.deleteLeaveRequest(req.params.id);
    return ok ? res.send('Deleted') : res.status(404).send('Leave not found');
  });

  r.get('/dashboard/hr/payslips', requireRoles('HR'), async (req, res) => {
    res.json(await dashboardService.getAllPayslips(req.query.month));
  });

  r.put('/dashboard/hr/payslips/:id/confirm', requireRoles('HR'), async (req, res) => {
    const pl = await dashboardService.confirmPayslip(req.params.id);
    return pl ? res.json(pl) : res.status(404).send('Payslip not found');
  });

  r.get('/dashboard/hr/attendance/summary', requireRoles('HR'), async (req, res) => {
    res.json(await dashboardService.getHrAttendanceSummary(req.query.month));
  });

  r.get('/dashboard/hr/attendance/top-late', requireRoles('HR'), async (req, res) => {
    res.json(await dashboardService.getTopLateEmployees(req.query.month, Number(req.query.limit || 5)));
  });

  r.get('/dashboard/hr/recruitment/candidates', requireRoles('HR'), async (req, res) => {
    res.json(await dashboardService.getRecruitmentCandidates(req.query.month));
  });

  r.get('/dashboard/hr/recruitment/requests', requireRoles('HR'), async (req, res) => {
    res.json(await dashboardService.getRecruitmentRequests(req.query.month));
  });

  r.get('/dashboard/admin/stats', requireRoles('ADMIN'), async (_req, res) => {
    res.json(await dashboardService.getAdminStats());
  });

  r.get('/dashboard/admin/accounts', requireRoles('ADMIN'), async (req, res) => {
    res.json(await adminService.listAccounts(req.query.q, req.query.role, req.query.active));
  });

  r.get('/dashboard/admin/accounts/unassigned', requireRoles('ADMIN'), async (_req, res) => {
    res.json(await adminService.listTaiKhoanChuaGanNhanVien());
  });

  r.get('/dashboard/admin/employees/unassigned', requireRoles('ADMIN'), async (_req, res) => {
    res.json(await adminService.listNhanVienChuaCoTaiKhoanBrief());
  });

  r.get('/dashboard/admin/login-logs', requireRoles('ADMIN'), async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 200;
    res.json(await loginLogService.listLoginLogs(limit));
  });

  r.post('/dashboard/admin/accounts', requireRoles('ADMIN'), async (req, res) => {
    try {
      const b = req.body || {};
      const out = await adminService.createAccount(
        b.username,
        b.password,
        b.role,
        b.nhanVienId,
        req.jwtPayload.sub
      );
      res.json(out);
    } catch (e) {
      res.status(e.status || 400).json({ message: e.message });
    }
  });

  r.put('/dashboard/admin/accounts/:maTaiKhoan/toggle-status', requireRoles('ADMIN'), async (req, res) => {
    try {
      res.json(await adminService.toggleStatus(req.params.maTaiKhoan, req.jwtPayload.sub));
    } catch (e) {
      res.status(e.status || 400).json({ message: e.message });
    }
  });

  r.put('/dashboard/admin/accounts/:maTaiKhoan/role', requireRoles('ADMIN'), async (req, res) => {
    try {
      const b = req.body || {};
      res.json(
        await adminService.updateRoleAndDirectManager(
          req.params.maTaiKhoan,
          b.role,
          b.directManagerId,
          req.jwtPayload.sub
        )
      );
    } catch (e) {
      res.status(e.status || 400).json({ message: e.message });
    }
  });

  r.get('/dashboard/admin/employees/direct-managers', requireRoles('ADMIN'), async (_req, res) => {
    res.json(await adminService.listDirectManagerCandidates());
  });

  r.get('/dashboard/admin/employees/with-accounts', requireRoles('ADMIN'), async (_req, res) => {
    res.json(await adminService.listEmployeesWithAccountsBrief());
  });

  r.get('/dashboard/admin/employees/subordinates', requireRoles('ADMIN'), async (req, res) => {
    res.json(await adminService.listSubordinatesBrief(req.query.managerId));
  });

  r.get('/dashboard/admin/employees/subordinate-candidates', requireRoles('ADMIN'), async (req, res) => {
    res.json(await adminService.listUngVienSubordinateBrief(req.query.managerId));
  });

  r.put('/dashboard/admin/accounts/:maTaiKhoan/manage-subordinates', requireRoles('ADMIN'), async (req, res) => {
    try {
      await adminService.updateManagedSubordinates(
        req.params.maTaiKhoan,
        req.body?.employeeIds,
        req.jwtPayload.sub
      );
      res.status(204).end();
    } catch (e) {
      res.status(e.status || 400).json({ message: e.message });
    }
  });

  r.put('/dashboard/admin/accounts/:maTaiKhoan/assign', requireRoles('ADMIN'), async (req, res) => {
    try {
      res.json(
        await adminService.assignNhanVien(req.params.maTaiKhoan, req.body?.nhanVienId, req.jwtPayload.sub)
      );
    } catch (e) {
      res.status(e.status || 400).json({ message: e.message });
    }
  });

  r.delete('/dashboard/admin/accounts/:maTaiKhoan', requireRoles('ADMIN'), async (req, res) => {
    try {
      await adminService.deleteAccount(req.params.maTaiKhoan, req.jwtPayload.sub);
      res.status(204).end();
    } catch (e) {
      res.status(e.status || 400).json({ message: e.message });
    }
  });

  r.post('/dashboard/admin/accounts/:maTaiKhoan/reset-password', requireRoles('ADMIN'), async (req, res) => {
    try {
      const raw = await adminService.resetPassword(req.params.maTaiKhoan, req.body?.newPassword);
      res.json({ message: 'Đã đặt mật khẩu mới', temporaryPassword: raw });
    } catch (e) {
      res.status(e.status || 400).json({ message: e.message });
    }
  });

  r.post('/recruitment/hiring-request', async (req, res) => {
    try {
      const body = req.body;
      if (!body.idYeuCau) body._id = `REQ_${Date.now()}`;
      else body._id = body.idYeuCau;
      const y = await mongoose.model('YeuCauTuyenDung').create({
        _id: body._id,
        idYeuCau: body.idYeuCau || body._id,
        viTriCanTuyen: body.viTriCanTuyen,
        soLuong: body.soLuong,
        trinhDoYeuCau: body.trinhDoYeuCau,
        trangThai: body.trangThai || 'PENDING',
        moTa: body.moTa,
        ngayYeuCau: body.ngayYeuCau || new Date(),
        phongBan: body.phongBan?.id || body.phongBan,
      });
      res.json(y);
    } catch (e) {
      res.status(400).send(`Lỗi gửi yêu cầu: ${e.message}`);
    }
  });

  r.get('/recruitment/all-requests', async (_req, res) => {
    res.json(await mongoose.model('YeuCauTuyenDung').find({}).populate('phongBan'));
  });

  r.post('/recruitment/apply', async (req, res) => {
    try {
      const c = await mongoose.model('HoSoUngVien').create({
        ...req.body,
        yeuCauTuyenDung: req.body.yeuCauTuyenDung?.id || req.body.idYeuCau,
        ngayNop: new Date(),
      });
      res.send(`Nộp hồ sơ thành công! ID ứng viên: ${c._id}`);
    } catch (e) {
      res.status(400).send(`Lỗi nộp hồ sơ: ${e.message}`);
    }
  });

  r.get('/recruitment/candidates', async (_req, res) => {
    res.json(await mongoose.model('HoSoUngVien').find({}).populate('yeuCauTuyenDung'));
  });

  r.post('/recruitment/schedule-interview', async (req, res) => {
    try {
      const b = req.body;
      const idLich = b.idLich || `IVW_${Date.now()}`;
      await mongoose.model('LichPhongVan').create({
        _id: idLich,
        idLich,
        thoiGian: b.thoiGian,
        diaDiem: b.diaDiem,
        ghiChu: b.ghiChu,
        ungVien: b.ungVien?.id || b.ungVien,
        nguoiPhongVan: b.nguoiPhongVan,
      });
      res.send(`Lên lịch phỏng vấn thành công! ID Lịch: ${idLich}`);
    } catch (e) {
      res.status(400).send(`Lỗi khi lập lịch phỏng vấn: ${e.message}`);
    }
  });

  r.post('/recruitment/approve/:id', async (req, res) => {
    try {
      const c = await mongoose.model('HoSoUngVien').findById(req.params.id).populate('yeuCauTuyenDung');
      if (!c) throw new Error(`Không tìm thấy ứng viên ID: ${req.params.id}`);
      const nvId = `NV${Math.floor(Date.now() / 1000)}`;
      let pb = null;
      if (c.yeuCauTuyenDung?.phongBan) pb = c.yeuCauTuyenDung.phongBan;
      await mongoose.model('NhanVien').create({
        _id: nvId,
        hoTen: c.hoTen,
        emailCongViec: c.email,
        soDienThoai: c.soDienThoai,
        ngayVaoLam: new Date(),
        trangThaiHoatDong: 'DANG_LAM_VIEC',
        heSoLuong: 1,
        phongBan: pb,
      });
      c.trangThai = 'TRUNG_TUYEN';
      await c.save();
      res.send(`Đã phê duyệt Onboarding thành công cho: ${c.hoTen}`);
    } catch (e) {
      res.status(400).send(`Lỗi Onboarding: ${e.message}`);
    }
  });

  r.put('/recruitment/candidate/:id', async (req, res) => {
    const c = await mongoose.model('HoSoUngVien').findByIdAndUpdate(req.params.id, req.body, { new: true });
    return c ? res.json(c) : res.status(404).end();
  });

  r.get('/recruitment/candidate/:id', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try {
      const uv = await mongoose.model('HoSoUngVien').findById(req.params.id).populate('yeuCauTuyenDung');
      if (!uv) throw new Error('Không tìm thấy ứng viên');
      const interviews = await mongoose.model('LichPhongVan').find({ ungVien: req.params.id }).lean();
      res.json({
        id: uv._id,
        hoTen: uv.hoTen,
        email: uv.email,
        soDienThoai: uv.soDienThoai,
        cvUrl: uv.cvUrl,
        trangThai: uv.trangThai,
        ngayNop: uv.ngayNop,
        yeuCauTuyenDung: uv.yeuCauTuyenDung,
        interviews: interviews.map((iv) => ({
          idLich: iv.idLich,
          thoiGian: iv.thoiGian,
          diaDiem: iv.diaDiem,
          nguoiPhongVan: iv.nguoiPhongVan,
          ghiChu: iv.ghiChu,
        })),
      });
    } catch (e) {
      res.status(404).json({ message: e.message });
    }
  });

  r.delete('/recruitment/candidate/:id', async (req, res) => {
    await mongoose.model('HoSoUngVien').deleteOne({ _id: req.params.id });
    res.send(`Đã xóa ứng viên ID: ${req.params.id}`);
  });

  r.delete('/recruitment/hiring-request/:id', async (req, res) => {
    await mongoose.model('YeuCauTuyenDung').deleteOne({ _id: req.params.id });
    res.send(`Đã xóa yêu cầu: ${req.params.id}`);
  });

  r.get('/recruitment/interviews', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try {
      let list;
      if (req.query.ungVienId) {
        list = await mongoose.model('LichPhongVan').find({ ungVien: req.query.ungVienId }).populate('ungVien');
      } else {
        list = await mongoose.model('LichPhongVan').find({}).populate({
          path: 'ungVien',
          populate: { path: 'yeuCauTuyenDung' },
        });
      }
      const fmt = (d) => {
        if (!d) return null;
        const x = new Date(d);
        const dd = String(x.getDate()).padStart(2, '0');
        const mm = String(x.getMonth() + 1).padStart(2, '0');
        const yyyy = x.getFullYear();
        const hh = String(x.getHours()).padStart(2, '0');
        const mi = String(x.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
      };
      const response = list.map((iv) => {
        const m = {
          idLich: iv.idLich,
          thoiGian: fmt(iv.thoiGian),
          diaDiem: iv.diaDiem,
          nguoiPhongVan: iv.nguoiPhongVan,
          ghiChu: iv.ghiChu,
        };
        if (iv.ungVien) {
          m.tenUngVien = iv.ungVien.hoTen;
          m.trangThaiUngVien = iv.ungVien.trangThai;
          m.viTriUngTuyen = iv.ungVien.yeuCauTuyenDung?.viTriCanTuyen || null;
        } else {
          m.tenUngVien = null;
          m.viTriUngTuyen = null;
          m.trangThaiUngVien = null;
        }
        return m;
      });
      res.json(response);
    } catch (e) {
      res.status(400).json({ message: `Lỗi khi tải lịch phỏng vấn: ${e.message}` });
    }
  });


  // ── RECRUITMENT ────────────────────────────────────────────────────────────
  // Yêu cầu tuyển dụng
  r.get('/dashboard/hr/recruitment/requests', requireRoles('HR', 'ADMIN', 'DIRECTOR'), async (req, res) => {
    try { res.json(await recruitmentService.listRequests(req.query.month)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  });

  r.get('/dashboard/hr/recruitment/requests/:id', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try { res.json(await recruitmentService.getRequestById(req.params.id)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  });

  r.post('/dashboard/hr/recruitment/requests', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try { res.status(201).json(await recruitmentService.createRequest(req.body)); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
  });

  r.put('/dashboard/hr/recruitment/requests/:id', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try { res.json(await recruitmentService.updateRequest(req.params.id, req.body)); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
  });

  r.delete('/dashboard/hr/recruitment/requests/:id', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try { await recruitmentService.deleteRequest(req.params.id); res.json({ ok: true }); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
  });

  // Legacy alias (giữ cho backwards compat)
  r.post('/recruitment/hiring-request', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try { res.json(await recruitmentService.createRequest(req.body)); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
  });

  // Hồ sơ ứng viên
  r.get('/dashboard/hr/recruitment/candidates', requireRoles('HR', 'ADMIN', 'DIRECTOR'), async (req, res) => {
    try {
      res.json(await recruitmentService.listCandidates({
        month: req.query.month,
        yeuCauId: req.query.yeuCauId,
      }));
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  });

  r.get('/dashboard/hr/recruitment/candidates/:id', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try { res.json(await recruitmentService.getCandidateById(req.params.id)); }
    catch (e) { res.status(e.status || 404).json({ message: e.message }); }
  });

  r.post('/dashboard/hr/recruitment/candidates', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try { res.status(201).json(await recruitmentService.createCandidate(req.body)); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
  });

  r.put('/dashboard/hr/recruitment/candidates/:id', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try { res.json(await recruitmentService.updateCandidate(req.params.id, req.body)); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
  });

  r.delete('/dashboard/hr/recruitment/candidates/:id', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try { await recruitmentService.deleteCandidate(req.params.id); res.json({ ok: true }); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
  });

  r.post('/dashboard/hr/recruitment/candidates/:id/onboard', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try { res.json(await recruitmentService.onboardCandidate(req.params.id)); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
  });

  // Lịch phỏng vấn
  r.get('/dashboard/hr/recruitment/interviews', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try { res.json(await recruitmentService.listInterviews(req.query.ungVienId)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
  });

  r.post('/dashboard/hr/recruitment/interviews', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try { res.status(201).json(await recruitmentService.createInterview(req.body)); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
  });

  r.put('/dashboard/hr/recruitment/interviews/:id', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try { res.json(await recruitmentService.updateInterview(req.params.id, req.body)); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
  });

  r.delete('/dashboard/hr/recruitment/interviews/:id', requireRoles('HR', 'ADMIN'), async (req, res) => {
    try { await recruitmentService.deleteInterview(req.params.id); res.json({ ok: true }); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
  });

  return r;
}

