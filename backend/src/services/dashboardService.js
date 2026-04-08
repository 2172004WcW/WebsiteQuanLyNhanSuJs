import mongoose from 'mongoose';
import { monthAliases, normalizeThangNam } from '../utils/thangNam.js';
import * as notificationService from './notificationService.js';

const ACTIVE_NV = { trangThaiHoatDong: { $ne: 'DA_NGHI_VIEC' } };

function ymNow(d = new Date()) {
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}

function countWeekdaysInMonth(year, month) {
  const last = new Date(year, month, 0).getDate();
  let n = 0;
  for (let day = 1; day <= last; day++) {
    const wd = new Date(year, month - 1, day).getDay();
    if (wd >= 1 && wd <= 5) n++;
  }
  return n;
}

function countWeekdaysFromMonthStartToDate(d) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const lastDay = d.getDate();
  let n = 0;
  for (let day = 1; day <= lastDay; day++) {
    const wd = new Date(y, m - 1, day).getDay();
    if (wd >= 1 && wd <= 5) n++;
  }
  return n;
}

function countWeekdaysBetweenDates(from, to) {
  let n = 0;
  for (let t = from.getTime(); t <= to.getTime(); t += 86400000) {
    const wd = new Date(t).getDay();
    if (wd !== 0 && wd !== 6) n++;
  }
  return n;
}

function parseThangNamToYm(thangNam) {
  const n = normalizeThangNam(thangNam);
  if (!n?.includes('-')) return null;
  const [a, b] = n.split('-').map((x) => parseInt(x, 10));
  if (a > 1000) return { y: a, m: b };
  return null;
}

function matchesYearMonthFilter(thangNam, year, month) {
  const noY = !year || String(year).trim() === '';
  const noM = !month || String(month).trim() === '';
  if (noY && noM) return true;
  const ym = parseThangNamToYm(thangNam);
  if (!ym) return false;
  const mm = String(ym.m).padStart(2, '0');
  const yy = String(ym.y);
  if (!noY && yy !== String(year).trim()) return false;
  if (!noM) {
    let m = String(month).trim();
    if (m.length === 1) m = `0${m}`;
    if (mm !== m) return false;
  }
  return true;
}

function lateMinutesFromGioVao(gioVao) {
  if (!gioVao) return 0;
  const p = String(gioVao).split(':').map(Number);
  const h = p[0] || 0;
  const m = p[1] || 0;
  const sec = h * 3600 + m * 60 + (p[2] || 0);
  const th = 8 * 3600;
  return sec > th ? Math.floor((sec - th) / 60) : 0;
}

export async function getEmployeeStats(nv) {
  const ChamCong = mongoose.model('ChamCong');
  const PhieuLuong = mongoose.model('PhieuLuong');
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const startOfMonth = new Date(y, m - 1, 1);
  const endOfMonth = new Date(y, m, 0);

  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

  const ccToday = await ChamCong.findOne({
    nhanVien: nv._id || nv.id,
    ngay: { $gte: dayStart, $lte: dayEnd },
  }).lean();

  const checkinInfo = ccToday
    ? {
        status: ccToday.trangThai,
        gioVao: ccToday.gioVao,
        gioRa: ccToday.gioRa,
        canCheckIn: false,
        canCheckOut: !ccToday.gioRa,
      }
    : { status: 'CHUA_CHECKIN', canCheckIn: true, canCheckOut: false };

  const monthCcs = await ChamCong.find({
    nhanVien: nv._id || nv.id,
    ngay: { $gte: startOfMonth, $lte: endOfMonth },
  }).lean();

  const todayStart = new Date(y, m - 1, today.getDate(), 0, 0, 0, 0);

  let ngayCoMat = 0;
  let diMuon = 0;
  for (const c of monthCcs) {
    const d = new Date(c.ngay);
    d.setHours(0, 0, 0, 0);
    if (d > todayStart) continue;
    const st = (c.trangThai || '').toUpperCase();
    if (st === 'DI_LAM' || st === 'DI_MUON') ngayCoMat++;
    if (st === 'DI_MUON') diMuon++;
  }

  const tongNgayCong = countWeekdaysInMonth(y, m);

  const lastM = m === 1 ? 12 : m - 1;
  const lastY = m === 1 ? y - 1 : y;
  const lastMonthStr = `${String(lastY).padStart(4, '0')}-${String(lastM).padStart(2, '0')}`;
  const aliases = monthAliases(lastMonthStr);
  const plLast = await PhieuLuong.find({
    nhanVien: nv._id || nv.id,
    thangNam: { $in: aliases },
  }).lean();
  let luongThangTruoc = 0;
  if (plLast.length) luongThangTruoc = plLast[0].tongLuong || 0;

  return {
    checkinToday: checkinInfo,
    ngayCoMat,
    tongNgayCong,
    diMuon,
    phepConLai: nv.soNgayPhepConLai,
    maxPhep: 12,
    luongThangTruoc,
  };
}

export async function getEmployeeLeaves(nhanVienId, limit) {
  const list = await mongoose
    .model('DonNghiPhep')
    .find({ nhanVien: nhanVienId })
    .sort({ tuNgay: -1 })
    .lean();
  if (limit != null && limit > 0 && list.length > limit) return list.slice(0, limit);
  return list;
}

export async function getAttendanceSummary(nv) {
  const ChamCong = mongoose.model('ChamCong');
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const startOfMonth = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
  const todayStart = new Date(y, m - 1, today.getDate(), 0, 0, 0, 0);

  const rows = await ChamCong.find({
    nhanVien: nv._id || nv.id,
    ngay: { $gte: startOfMonth, $lte: endOfMonth },
  }).lean();

  const rowsUpToToday = rows.filter((c) => {
    const d = new Date(c.ngay);
    d.setHours(0, 0, 0, 0);
    return d <= todayStart;
  });

  let dungGio = 0;
  let diMuon = 0;
  for (const c of rowsUpToToday) {
    const st = (c.trangThai || '').toUpperCase();
    if (st === 'DI_LAM') dungGio++;
    else if (st === 'DI_MUON') diMuon++;
  }

  let ngayDaQua = 0;
  for (let i = 1; i <= today.getDate(); i++) {
    const wd = new Date(y, m - 1, i).getDay();
    if (wd >= 1 && wd <= 5) ngayDaQua++;
  }

  const vangMat = Math.max(0, ngayDaQua - dungGio - diMuon);
  if (ngayDaQua === 0) {
    return { pctDungGio: 0, pctDiMuon: 0, pctVangMat: 0 };
  }
  const pct = (n) => Math.min(100, Math.floor((n * 100) / ngayDaQua));
  return {
    pctDungGio: pct(dungGio),
    pctDiMuon: pct(diMuon),
    pctVangMat: pct(vangMat),
  };
}

/** Resolve tên chức vụ / phòng ban khi populate không nở (ref còn là string). */
export async function resolveChucVuPhongBanFromNvLean(nvDoc) {
  if (!nvDoc) return { chucVu: '', phongBan: '' };
  const ChucVu = mongoose.model('ChucVu');
  const PhongBan = mongoose.model('PhongBan');
  let chucVu = '';
  let phongBan = '';
  const cv = nvDoc.chucVu;
  const pb = nvDoc.phongBan;
  if (cv != null && typeof cv === 'object' && 'tenChucVu' in cv) chucVu = cv.tenChucVu || '';
  else if (cv) {
    const doc = await ChucVu.findById(cv).lean();
    chucVu = doc?.tenChucVu || '';
  }
  if (pb != null && typeof pb === 'object' && 'tenPhongBan' in pb) phongBan = pb.tenPhongBan || '';
  else if (pb) {
    const doc = await PhongBan.findById(pb).lean();
    phongBan = doc?.tenPhongBan || '';
  }
  return { chucVu, phongBan };
}

function kyLuongDisplayFromThangNam(thangNorm) {
  const n = normalizeThangNam(thangNorm);
  if (!n?.includes('-')) return '';
  const [yy, mm] = n.split('-').map((x) => parseInt(x, 10));
  if (!yy || !mm) return '';
  return `Tháng ${mm}/${yy}`;
}

function maPhieuLuong(nhanVienId, thangNorm) {
  const n = normalizeThangNam(thangNorm);
  if (!n?.includes('-')) return `PL_${nhanVienId}`;
  const [yy, mm] = n.split('-');
  return `PL_${nhanVienId}_${String(mm).padStart(2, '0')}${yy}`;
}

export async function getEmployeeProfilePayload(nvId) {
  const NhanVien = mongoose.model('NhanVien');
  const full = await NhanVien.findById(nvId).populate(['chucVu', 'phongBan']).lean();
  if (!full) return null;
  const { chucVu, phongBan } = await resolveChucVuPhongBanFromNvLean(full);
  return {
    hoTen: full.hoTen,
    email: full.emailCongViec,
    chucVu: chucVu || '—',
    phongBan: phongBan || '—',
    phone: full.soDienThoai,
    address: full.diaChiTamTru,
    city: '',
    notes: '',
    ngayVaoLam: full.ngayVaoLam ? new Date(full.ngayVaoLam).toISOString().slice(0, 10) : '',
    avatarUrl: full.anhDaiDienUrl,
  };
}

export async function getEmployeePayslips(nhanVienId, limit, year, month) {
  const PhieuLuong = mongoose.model('PhieuLuong');
  let payslips = await PhieuLuong.find({ nhanVien: nhanVienId }).lean();
  payslips = payslips.map((p) => ({ ...p, thangNam: normalizeThangNam(p.thangNam) }));
  payslips = payslips.filter((p) => matchesYearMonthFilter(p.thangNam, year, month));
  payslips.sort((a, b) => {
    const ya = parseThangNamToYm(a.thangNam);
    const yb = parseThangNamToYm(b.thangNam);
    if (!ya && !yb) return 0;
    if (!ya) return 1;
    if (!yb) return -1;
    if (ya.y !== yb.y) return yb.y - ya.y;
    return yb.m - ya.m;
  });
  if (limit != null && limit > 0 && payslips.length > limit) return payslips.slice(0, limit);
  return payslips;
}

export async function getEmployeePayslipDetail(id, nv) {
  const PhieuLuong = mongoose.model('PhieuLuong');
  const NhanVien = mongoose.model('NhanVien');
  const p = await PhieuLuong.findById(id).lean();
  if (!p?.nhanVien) return null;
  const nvid = p.nhanVien;
  if (String(nvid) !== String(nv._id || nv.id)) return null;
  const nvDoc = await NhanVien.findById(nvid).populate(['phongBan', 'chucVu']).lean();
  if (!nvDoc) return null;
  const { chucVu, phongBan } = await resolveChucVuPhongBanFromNvLean(nvDoc);
  const thangNam = normalizeThangNam(p.thangNam);
  return {
    id: p._id,
    thangNam,
    kyLuongLabel: kyLuongDisplayFromThangNam(thangNam),
    maPhieu: maPhieuLuong(nvDoc._id, thangNam),
    tongLuong: p.tongLuong,
    trangThaiThanhToan: p.trangThaiThanhToan,
    phatMuon: p.phatMuon,
    nghiKhongPhep: p.nghiKhongPhep,
    hoTen: nvDoc.hoTen,
    maNhanVien: nvDoc._id,
    chucVu: chucVu || '—',
    phongBan: phongBan || '—',
  };
}

function localDateKeyFromDate(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/**
 * Lịch sử chấm công trong tháng: chỉ các ngày đến hôm nay (không hiển thị ngày tương lai).
 * Query: month=YYYY-MM, page, pageSize, sort=date_desc|date_asc, status=ALL|DI_LAM|...
 */
export async function getAttendanceHistory(nv, query = {}) {
  const ChamCong = mongoose.model('ChamCong');
  const monthParam = query.month != null ? query.month : query.monthYear;
  let y;
  let m;
  if (monthParam && String(monthParam).trim()) {
    const [yy, mm] = String(monthParam).split('-').map(Number);
    y = yy;
    m = mm;
  } else {
    const n = new Date();
    y = n.getFullYear();
    m = n.getMonth() + 1;
  }

  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(50, Math.max(5, Number(query.pageSize) || 10));
  const sortDir = String(query.sort || 'date_desc').toLowerCase() === 'date_asc' ? 'asc' : 'desc';
  const statusFilter = query.status && String(query.status).toUpperCase() !== 'ALL' ? String(query.status).toUpperCase() : null;

  const lastDay = new Date(y, m, 0).getDate();
  const rangeStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const rangeEnd = new Date(y, m - 1, lastDay, 23, 59, 59, 999);

  const records = await ChamCong.find({
    nhanVien: nv._id || nv.id,
    ngay: { $gte: rangeStart, $lte: rangeEnd },
  })
    .sort({ ngay: 1 })
    .lean();

  const byDay = new Map();
  for (const c of records) {
    const key = localDateKeyFromDate(c.ngay);
    if (!byDay.has(key)) byDay.set(key, c);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = [];
  for (let day = 1; day <= lastDay; day++) {
    const d0 = new Date(y, m - 1, day);
    d0.setHours(0, 0, 0, 0);
    if (d0 > today) continue;

    const key = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const wd = d0.getDay();
    const cc = byDay.get(key);

    let trangThai;
    let gioVao = null;
    let gioRa = null;
    let id = null;
    if (cc) {
      trangThai = (cc.trangThai || '').toUpperCase() || 'CHUA_XAC_DINH';
      gioVao = cc.gioVao || null;
      gioRa = cc.gioRa || null;
      id = cc._id;
    } else if (wd === 0 || wd === 6) {
      trangThai = 'CUOI_TUAN';
    } else {
      trangThai = 'CHUA_CHAM_CONG';
    }

    if (statusFilter && trangThai !== statusFilter) continue;

    rows.push({
      _id: id,
      ngay: d0.toISOString(),
      gioVao: gioVao || '—',
      gioRa: gioRa || '—',
      trangThai,
      ghiChu: '',
    });
  }

  rows.sort((a, b) => {
    const ta = new Date(a.ngay).getTime();
    const tb = new Date(b.ngay).getTime();
    return sortDir === 'asc' ? ta - tb : tb - ta;
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);

  return {
    year: y,
    month: m,
    monthLabel: `Tháng ${m}/${y}`,
    page,
    pageSize,
    total,
    totalPages,
    rows: slice,
  };
}

export async function getEmployeeAttendanceTrend(nv) {
  const ChamCong = mongoose.model('ChamCong');
  const today = new Date();
  const ty = today.getFullYear();
  const tm = today.getMonth() + 1;
  const tday = today.getDate();
  const todayStart = new Date(ty, tm - 1, tday, 0, 0, 0, 0);

  const labels = [];
  const onTime = [];
  const late = [];
  const absent = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const ym = ymNow(d);
    labels.push(`T${ym.m}/${ym.y}`);

    const start = new Date(ym.y, ym.m - 1, 1, 0, 0, 0, 0);
    const lastDay = new Date(ym.y, ym.m, 0).getDate();
    const monthEnd = new Date(ym.y, ym.m - 1, lastDay, 23, 59, 59, 999);

    const isCurrentMonth = ym.y === ty && ym.m === tm;
    const rangeEnd = isCurrentMonth ? new Date(ty, tm - 1, tday, 23, 59, 59, 999) : monthEnd;
    const rangeEndDay = isCurrentMonth ? todayStart : new Date(ym.y, ym.m - 1, lastDay, 0, 0, 0, 0);

    const rows = await ChamCong.find({
      nhanVien: nv._id || nv.id,
      ngay: { $gte: start, $lte: rangeEnd },
    }).lean();

    let o = 0;
    let l = 0;
    for (const c of rows) {
      const st = (c.trangThai || '').toUpperCase();
      if (st === 'DI_LAM') o++;
      else if (st === 'DI_MUON') l++;
    }

    const wdEff = countWeekdaysBetweenDates(start, rangeEndDay);
    const ab = Math.max(0, wdEff - o - l);
    onTime.push(o);
    late.push(l);
    absent.push(ab);
  }
  return { labels, onTime, late, absent };
}

export async function getDirectorKpi(director) {
  const NhanVien = mongoose.model('NhanVien');
  const DonNghiPhep = mongoose.model('DonNghiPhep');
  const PhieuLuong = mongoose.model('PhieuLuong');
  const YeuCauTuyenDung = mongoose.model('YeuCauTuyenDung');

  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const startOfMonth = new Date(y, m - 1, 1);
  const endOfMonth = new Date(y, m, 0);

  const totalEmployees = await NhanVien.countDocuments(ACTIVE_NV);

  const allNv = await NhanVien.find(ACTIVE_NV).lean();
  const newThisMonth = allNv.filter(
    (n) => n.ngayVaoLam && new Date(n.ngayVaoLam) >= startOfMonth && new Date(n.ngayVaoLam) <= endOfMonth
  ).length;

  const openPositions = await YeuCauTuyenDung.countDocuments({
    trangThai: new RegExp('^pending$', 'i'),
  });

  const pendingAll = await DonNghiPhep.find({ trangThai: 'CHO_QL_DUYET' }).lean();
  let pendingLeaves;
  if (director) {
    pendingLeaves = pendingAll.filter(
      (d) => d.nguoiDuyet && String(d.nguoiDuyet) === String(director._id || director.id)
    ).length;
  } else {
    pendingLeaves = pendingAll.length;
  }

  const unclosedPayroll = await PhieuLuong.countDocuments({ trangThaiThanhToan: 'CHUA_THANH_TOAN' });

  return {
    totalActive: totalEmployees,
    newThisMonth,
    turnoverRate: 0,
    openPositions,
    pendingLeaves,
    unclosedPayroll,
  };
}

export async function getDirectorHeadcountTrend() {
  const NhanVien = mongoose.model('NhanVien');
  const today = new Date();
  const actives = await NhanVien.find(ACTIVE_NV).lean();
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const ym = ymNow(d);
    const endOfMonth = new Date(ym.y, ym.m, 0);
    const totalAsOfMonth = actives.filter(
      (nv) => nv.ngayVaoLam && new Date(nv.ngayVaoLam) <= endOfMonth
    ).length;
    const newJoined = actives.filter((nv) => {
      if (!nv.ngayVaoLam) return false;
      const nd = new Date(nv.ngayVaoLam);
      return nd.getFullYear() === ym.y && nd.getMonth() + 1 === ym.m;
    }).length;
    trend.push({
      label: `${String(ym.m).padStart(2, '0')}/${ym.y}`,
      totalActive: totalAsOfMonth,
      newJoined,
      left: 0,
    });
  }
  return trend;
}

export async function getDirectorAttendanceByDept(month, year) {
  const NhanVien = mongoose.model('NhanVien');
  const ChamCong = mongoose.model('ChamCong');
  const now = new Date();
  let targetY = now.getFullYear();
  let targetM = now.getMonth() + 1;
  if (month != null && year != null) {
    targetM = month;
    targetY = year;
  }
  const start = new Date(targetY, targetM - 1, 1);
  const end = new Date(targetY, targetM, 0);
  const weekdays = countWeekdaysBetweenDates(start, end);

  const employees = await NhanVien.find(ACTIVE_NV).populate('phongBan').lean();
  const employeeIdsByDept = new Map();
  for (const nv of employees) {
    const dept = nv.phongBan?.tenPhongBan || '—';
    if (!employeeIdsByDept.has(dept)) employeeIdsByDept.set(dept, new Set());
    employeeIdsByDept.get(dept).add(nv._id);
  }

  const allCc = await ChamCong.find({ ngay: { $gte: start, $lte: end } })
    .populate({ path: 'nhanVien', populate: 'phongBan' })
    .lean();

  const presentPairs = new Set();
  for (const cc of allCc) {
    const st = (cc.trangThai || '').toUpperCase();
    if (!['DI_LAM', 'DI_MUON', 'PHEP', 'NGHI_PHEP'].includes(st)) continue;
    const nv = cc.nhanVien;
    if (!nv) continue;
    const deptName = nv.phongBan?.tenPhongBan || '—';
    const dayStr = new Date(cc.ngay).toISOString().slice(0, 10);
    presentPairs.add(`${deptName}|${nv._id}|${dayStr}`);
  }

  const presentByDept = new Map();
  for (const k of presentPairs) {
    const dept = k.split('|')[0];
    presentByDept.set(dept, (presentByDept.get(dept) || 0) + 1);
  }

  const out = [];
  for (const [dept, idSet] of employeeIdsByDept) {
    const empCount = idSet.size;
    const expected = empCount * weekdays;
    const present = presentByDept.get(dept) || 0;
    let rate = expected === 0 ? 0 : Math.round((present * 100) / expected);
    rate = Math.max(0, Math.min(100, rate));
    out.push({ departmentName: dept, attendanceRate: rate });
  }
  out.sort((a, b) => String(a.departmentName).localeCompare(String(b.departmentName)));
  return out;
}

export async function getDirectorSalaryTrend() {
  const PhieuLuong = mongoose.model('PhieuLuong');
  const today = new Date();
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const thangNam = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const payslips = await PhieuLuong.find({ thangNam: { $in: monthAliases(thangNam) } }).lean();
    let total = 0;
    for (const p of payslips) {
      if (p.tongLuong != null) total += p.tongLuong;
    }
    trend.push({
      label: thangNam,
      total,
      averagePerEmployee: payslips.length ? total / payslips.length : 0,
    });
  }
  return trend;
}

export async function getPendingLeavesForDirector(director) {
  if (!director?.id) return [];
  const list = await mongoose
    .model('DonNghiPhep')
    .find({ trangThai: 'CHO_DUYET', nguoiDuyet: director._id || director.id })
    .populate({ path: 'nhanVien', populate: ['phongBan', 'chucVu'] })
    .lean();
  return list.map((don) => buildHrLeaveDtoFromDon(don));
}

function buildHrLeaveDtoFromDon(don) {
  const nv = don.nhanVien;
  const tenNV = nv?.hoTen || '';
  const tenPhong = nv?.phongBan?.tenPhongBan || '—';
  const chucVu = nv?.chucVu?.tenChucVu || '—';
  const soNgay =
    don.tuNgay && don.denNgay
      ? Math.floor((new Date(don.denNgay) - new Date(don.tuNgay)) / 86400000) + 1
      : 0;
  const loaiPhep = mapLeaveTypeForDto(don.loaiNghi);
  return {
    id: don._id,
    tenNV,
    tenPhong,
    chucVu,
    loaiPhep,
    loaiNghi: loaiPhep,
    tuNgay: don.tuNgay ? new Date(don.tuNgay).toISOString().slice(0, 10) : '',
    denNgay: don.denNgay ? new Date(don.denNgay).toISOString().slice(0, 10) : '',
    soNgay,
    ngayGui: don.tuNgay ? new Date(don.tuNgay).toISOString().slice(0, 10) : '',
    deptHeadStatus: 'APPROVED',
    trangThai: don.trangThai,
  };
}

export async function approveLeaveAsDirector(leaveId, director) {
  const DonNghiPhep = mongoose.model('DonNghiPhep');
  const NhanVien = mongoose.model('NhanVien');
  if (!director?.id) throw new Error('Forbidden');
  const don = await DonNghiPhep.findById(leaveId);
  if (!don) throw new Error('Leave request not found');
  if (String(don.trangThai).toUpperCase() !== 'CHO_DUYET') throw new Error('Leave request already processed');
  if (!don.nguoiDuyet || String(don.nguoiDuyet) !== String(director._id || director.id)) {
    throw new Error('Forbidden');
  }
  const soNgay =
    don.tuNgay && don.denNgay
      ? Math.floor((new Date(don.denNgay) - new Date(don.tuNgay)) / 86400000) + 1
      : 0;
  if (String(don.loaiNghi || '').toUpperCase() === 'PH_NAM') {
    let nv = await NhanVien.findById(don.nhanVien);
    const cap = nv.soNgayPhepConLai || 0;
    if (cap < soNgay) throw new Error('Nhân viên không đủ ngày phép');
    nv.soNgayPhepConLai = cap - soNgay;
    await nv.save();
  }
  don.trangThai = 'DA_DUYET';
  await don.save();
  const un = await notificationService.findUsernameByNhanVienId(String(don.nhanVien));
  if (un) {
    await notificationService.notifyPrivate(
      un,
      'LEAVE_APPROVED',
      'Đơn nghỉ phép đã được duyệt',
      `Đơn từ ${don.tuNgay} đến ${don.denNgay} đã được Director duyệt.`,
      `{"leaveId":${don._id}}`
    );
  }
  return don.toObject();
}

export async function rejectLeaveAsDirector(leaveId, reason, director) {
  const DonNghiPhep = mongoose.model('DonNghiPhep');
  if (!director?.id) throw new Error('Forbidden');
  const don = await DonNghiPhep.findById(leaveId);
  if (!don) throw new Error('Leave request not found');
  if (String(don.trangThai).toUpperCase() !== 'CHO_DUYET') throw new Error('Leave request already processed');
  if (!don.nguoiDuyet || String(don.nguoiDuyet) !== String(director._id || director.id)) {
    throw new Error('Forbidden');
  }
  don.trangThai = 'TU_CHOI';
  if (reason?.trim()) {
    don.lyDo = (don.lyDo ? `${don.lyDo} \n` : '') + `Director từ chối: ${reason.trim()}`;
  }
  await don.save();
  const un = await notificationService.findUsernameByNhanVienId(String(don.nhanVien));
  if (un) {
    await notificationService.notifyPrivate(
      un,
      'LEAVE_REJECTED',
      'Đơn nghỉ phép bị từ chối',
      `Đơn từ ${don.tuNgay} đến ${don.denNgay} không được duyệt.${reason ? ` Lý do: ${reason}` : ''}`,
      `{"leaveId":${don._id}}`
    );
  }
  return don.toObject();
}

function mapLeaveTypeForDto(loaiNghi) {
  if (!loaiNghi) return 'KHAC';
  const u = String(loaiNghi).toUpperCase();
  if (u === 'PH_NAM' || u === 'PHEP_NAM') return 'PHEP_NAM';
  if (u === 'NGHI_OM' || u === 'PHEP_OM') return 'PHEP_OM';
  if (u === 'NGHI_LE') return 'NGHI_LE';
  return 'KHAC';
}

export async function getHrStats() {
  const NhanVien = mongoose.model('NhanVien');
  const PhongBan = mongoose.model('PhongBan');
  const DonNghiPhep = mongoose.model('DonNghiPhep');
  const ChamCong = mongoose.model('ChamCong');
  const PhieuLuong = mongoose.model('PhieuLuong');
  const HoSoUngVien = mongoose.model('HoSoUngVien');

  /** Giống Java `nhanVienRepo.count()` — tổng bản ghi, không lọc trạng thái */
  const totalEmployees = await NhanVien.countDocuments({});
  const totalDepartments = await PhongBan.countDocuments();
  /** Đồng bộ với `getHrPendingLeaves` (gồm legacy CHO_QL / CHO_DUYET) */
  const pendingLeaves = await DonNghiPhep.countDocuments({
    trangThai: { $in: ['CHO_HR_XAC_NHAN', 'CHO_DUYET', 'CHO_QL_DUYET'] },
  });
  const allCc = await ChamCong.find({}).lean();
  const missingAttendance = allCc.filter(
    (c) => !c.trangThai || String(c.trangThai).toUpperCase() === 'DI_VANG'
  ).length;
  const unconfirmedSalary = await PhieuLuong.countDocuments({ trangThaiThanhToan: 'CHUA_THANH_TOAN' });
  const pendingCv = await HoSoUngVien.countDocuments({ trangThai: 'CHO_DUYET' });

  return {
    totalEmployees,
    totalDepartments,
    pendingLeaves,
    missingAttendance,
    unconfirmedSalary,
    pendingCv,
  };
}

export async function getAllEmployees() {
  return mongoose.model('NhanVien').find(ACTIVE_NV).populate(['phongBan', 'chucVu', 'bangLuong']).lean();
}

export async function getEmployeeById(id) {
  return mongoose.model('NhanVien').findOne({ _id: id, ...ACTIVE_NV }).populate(['phongBan', 'chucVu']).lean();
}

export async function createEmployee(nv) {
  if (!nv.id && !nv._id) throw new Error('Employee ID is required');
  const id = nv.id || nv._id;
  const exists = await mongoose.model('NhanVien').findById(id);
  if (exists) throw new Error('Employee already exists');
  const { id: _i, _id: __i, ...rest } = nv;
  rest.trangThaiHoatDong = 'DANG_LAM_VIEC';
  if (rest.soNgayPhepConLai == null) rest.soNgayPhepConLai = 12;
  return mongoose.model('NhanVien').create({ _id: id, ...rest });
}

export async function updateEmployee(id, payload) {
  return mongoose.model('NhanVien').findOneAndUpdate({ _id: id }, { $set: payload }, { new: true });
}

export async function deleteEmployee(id) {
  const r = await mongoose.model('NhanVien').findOneAndUpdate(
    { _id: id },
    { $set: { trangThaiHoatDong: 'DA_NGHI_VIEC' } },
    { new: true }
  );
  return !!r;
}

export async function getPendingLeaves() {
  const list = await mongoose
    .model('DonNghiPhep')
    .find({ trangThai: { $in: ['CHO_HR_XAC_NHAN', 'CHO_DUYET', 'CHO_QL_DUYET'] } })
    .populate({ path: 'nhanVien', populate: ['phongBan', 'chucVu'] })
    .lean();
  return list.map((d) => buildHrLeaveDtoFromDon(d));
}

export async function getAllLeaves() {
  const list = await mongoose
    .model('DonNghiPhep')
    .find({})
    .populate({ path: 'nhanVien', populate: ['phongBan', 'chucVu'] })
    .lean();
  return list.map((d) => buildHrLeaveDtoFromDon(d));
}

export async function deleteLeaveRequest(id) {
  const r = await mongoose.model('DonNghiPhep').findByIdAndDelete(id);
  return !!r;
}

export async function getAllPayslips(monthYear) {
  const PhieuLuong = mongoose.model('PhieuLuong');
  if (!monthYear?.trim()) {
    let list = await PhieuLuong.find({}).lean();
    list = list.map((p) => ({ ...p, thangNam: normalizeThangNam(p.thangNam) }));
    return list;
  }
  const normalized = normalizeThangNam(monthYear);
  let list = await PhieuLuong.find({ thangNam: { $in: monthAliases(normalized) } }).lean();
  list = list.map((p) => ({ ...p, thangNam: normalizeThangNam(p.thangNam) }));
  return list;
}

export async function confirmPayslip(payslipId) {
  const PhieuLuong = mongoose.model('PhieuLuong');
  const p = await PhieuLuong.findById(payslipId);
  if (!p) return null;
  p.trangThaiThanhToan = 'DA_THANH_TOAN';
  await p.save();
  const un = await notificationService.findUsernameByNhanVienId(String(p.nhanVien));
  if (un) {
    await notificationService.notifyPrivate(
      un,
      'PAYSLIP_READY',
      'Phiếu lương đã chốt',
      `Phiếu lương tháng ${p.thangNam} đã được xác nhận thanh toán.`,
      `{"payslipId":"${p._id}"}`
    );
  }
  return p.toObject();
}

export async function getHrAttendanceSummary(monthYear) {
  const ChamCong = mongoose.model('ChamCong');
  const now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth() + 1;
  if (monthYear?.trim()) {
    const [yy, mm] = String(monthYear).split('-').map(Number);
    y = yy;
    m = mm;
  }
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 0);
  const all = await ChamCong.find({ ngay: { $gte: from, $lte: to } }).lean();
  let total = 0;
  let onTime = 0;
  let late = 0;
  let permitted = 0;
  let absent = 0;
  for (const cc of all) {
    total++;
    const st = (cc.trangThai || '').toUpperCase();
    if (st === 'DI_LAM') onTime++;
    else if (st === 'DI_MUON') late++;
    else if (st === 'PHEP' || st === 'NGHI_PHEP') permitted++;
    else absent++;
  }
  return {
    presentPct: total === 0 ? 0 : Math.round((onTime * 100) / total),
    latePct: total === 0 ? 0 : Math.round((late * 100) / total),
    permittedPct: total === 0 ? 0 : Math.round((permitted * 100) / total),
    absentPct: total === 0 ? 0 : Math.round((absent * 100) / total),
  };
}

export async function getTopLateEmployees(monthYear, limit) {
  const ChamCong = mongoose.model('ChamCong');
  const NhanVien = mongoose.model('NhanVien');
  const now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth() + 1;
  if (monthYear?.trim()) {
    const [yy, mm] = String(monthYear).split('-').map(Number);
    y = yy;
    m = mm;
  }
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 0);
  const records = await ChamCong.find({
    ngay: { $gte: from, $lte: to },
    trangThai: 'DI_MUON',
  }).lean();

  const aggregate = new Map();
  for (const cc of records) {
    const nv = await NhanVien.findById(cc.nhanVien).populate(['phongBan', 'chucVu']).lean();
    if (!nv) continue;
    const id = String(nv._id);
    const muonPhut = lateMinutesFromGioVao(cc.gioVao);
    const tienPhat = Math.round(muonPhut * (50000.0 / 60.0));
    const cur = aggregate.get(id) || {
      nhanVienId: id,
      tenNV: nv.hoTen,
      tenPhong: nv.phongBan?.tenPhongBan || '—',
      chucVu: nv.chucVu?.tenChucVu || '—',
      soLanMuon: 0,
      tongPhutMuon: 0,
      tienPhat: 0,
    };
    cur.soLanMuon++;
    cur.tongPhutMuon += muonPhut;
    cur.tienPhat += tienPhat;
    aggregate.set(id, cur);
  }
  const list = [...aggregate.values()].sort((a, b) => b.soLanMuon - a.soLanMuon);
  return limit > 0 && list.length > limit ? list.slice(0, limit) : list;
}

export async function getRecruitmentCandidates(monthYear) {
  const HoSoUngVien = mongoose.model('HoSoUngVien');
  let ym = null;
  if (monthYear?.trim()) {
    const [yy, mm] = String(monthYear).split('-').map(Number);
    ym = { y: yy, m: mm };
  }
  const list = await HoSoUngVien.find({}).populate({ path: 'yeuCauTuyenDung', populate: 'phongBan' }).lean();
  return list
    .filter((c) => {
      if (!ym) return true;
      if (!c.ngayNop) return false;
      const d = new Date(c.ngayNop);
      return d.getFullYear() === ym.y && d.getMonth() + 1 === ym.m;
    })
    .map((c) => ({
      id: c._id,
      hoTen: c.hoTen,
      email: c.email,
      soDienThoai: c.soDienThoai,
      cvUrl: c.cvUrl,
      trangThai: c.trangThai,
      ngayNop: c.ngayNop ? new Date(c.ngayNop).toISOString().slice(0, 10) : '',
      viTri: c.yeuCauTuyenDung?.viTriCanTuyen || '',
      phongBan: c.yeuCauTuyenDung?.phongBan?.tenPhongBan || '',
    }));
}

export async function getRecruitmentRequests(monthYear) {
  const YeuCauTuyenDung = mongoose.model('YeuCauTuyenDung');
  let ym = null;
  if (monthYear?.trim()) {
    const [yy, mm] = String(monthYear).split('-').map(Number);
    ym = { y: yy, m: mm };
  }
  const list = await YeuCauTuyenDung.find({}).populate('phongBan').lean();
  return list
    .filter((r) => {
      if (!ym) return true;
      if (!r.ngayYeuCau) return false;
      const d = new Date(r.ngayYeuCau);
      return d.getFullYear() === ym.y && d.getMonth() + 1 === ym.m;
    })
    .map((r) => ({
      idYeuCau: r.idYeuCau || r._id,
      viTriCanTuyen: r.viTriCanTuyen,
      soLuong: r.soLuong,
      trangThai: r.trangThai,
      ngayYeuCau: r.ngayYeuCau ? new Date(r.ngayYeuCau).toISOString().slice(0, 10) : '',
      phongBan: r.phongBan?.tenPhongBan || '',
    }));
}

export async function getAdminStats() {
  const TaiKhoan = mongoose.model('TaiKhoan');
  const totalAccounts = await TaiKhoan.countDocuments();
  const all = await TaiKhoan.find({}).lean();
  const activeAccounts = all.filter((t) => t.trangThaiTaiKhoan).length;
  const lockedAccounts = totalAccounts - activeAccounts;
  const unassignedAccounts = all.filter((t) => !t.nhanVien).length;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const newThisMonth = all.filter((t) => t.ngayTao && new Date(t.ngayTao) >= start && new Date(t.ngayTao) < end)
    .length;
  return {
    totalAccounts,
    activeAccounts,
    lockedAccounts,
    unassignedAccounts,
    newThisMonth,
  };
}

export async function createLeaveFromDashboard(nv, request) {
  const DonNghiPhep = mongoose.model('DonNghiPhep');
  request.nhanVien = nv._id || nv.id;
  request.trangThai = 'CHO_HR_XAC_NHAN';
  const saved = await DonNghiPhep.create(request);
  const ten = nv.hoTen || nv.id;
  await notificationService.notifyAllHr(
    'LEAVE_PENDING_HR',
    'Đơn nghỉ phép chờ HR duyệt',
    `${ten} (${nv.id}) vừa gửi đơn nghỉ phép.`,
    `{"leaveId":"${saved._id}"}`
  );
  return saved.toObject();
}

export async function cancelLeaveRequest(requestId, nv) {
  const DonNghiPhep = mongoose.model('DonNghiPhep');
  const leave = await DonNghiPhep.findById(requestId);
  if (!leave) return false;
  if (String(leave.nhanVien) !== String(nv._id || nv.id)) return false;
  leave.trangThai = 'TU_CHOI';
  await leave.save();
  return true;
}
