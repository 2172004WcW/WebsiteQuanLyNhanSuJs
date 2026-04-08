import mongoose from 'mongoose';
import { emitToUser, emitBroadcast } from '../socketService.js';

export async function findUsernameByNhanVienId(nhanVienId) {
  const tk = await mongoose.model('TaiKhoan').findOne({ nhanVien: nhanVienId });
  return tk?.username || null;
}

export async function listForUser(username, limit) {
  const cap = Math.min(Math.max(limit || 50, 1), 200);
  const ThongBao = mongoose.model('ThongBao');
  const rows = await ThongBao.find({
    $or: [{ nguoiNhan: null }, { nguoiNhan: username }],
  })
    .sort({ ngayTao: -1 })
    .limit(cap)
    .lean();
  return rows.map(toDto);
}

function toDto(tb) {
  return {
    id: tb._id,
    nguoiNhan: tb.nguoiNhan,
    tieuDe: tb.tieuDe,
    noiDung: tb.noiDung,
    loai: tb.loai,
    daDoc: tb.daDoc,
    ngayTao: tb.ngayTao,
    refPayload: tb.refPayload,
  };
}

export async function countUnreadPrivate(username) {
  return mongoose.model('ThongBao').countDocuments({
    nguoiNhan: username,
    daDoc: false,
  });
}

export async function markRead(id, username) {
  const r = await mongoose.model('ThongBao').updateOne(
    { _id: id, nguoiNhan: username },
    { $set: { daDoc: true } }
  );
  return r.modifiedCount > 0 || r.matchedCount > 0;
}

export async function markAllReadPrivate(username) {
  const r = await mongoose.model('ThongBao').updateMany(
    { nguoiNhan: username, daDoc: false },
    { $set: { daDoc: true } }
  );
  return r.modifiedCount;
}

export async function notifyPrivate(username, loai, tieuDe, noiDung, refPayload) {
  if (!username?.trim()) return;
  const doc = await mongoose.model('ThongBao').create({
    nguoiNhan: username.trim(),
    loai,
    tieuDe,
    noiDung,
    refPayload,
    daDoc: false,
    ngayTao: new Date(),
  });
  // Real-time push nếu user đang online
  emitToUser(username.trim(), 'new_notification', toDto(doc.toObject()));
}

export async function notifyBroadcast(loai, tieuDe, noiDung, refPayload) {
  const doc = await mongoose.model('ThongBao').create({
    nguoiNhan: null,
    loai,
    tieuDe,
    noiDung,
    refPayload,
    daDoc: false,
    ngayTao: new Date(),
  });
  // Real-time push tới tất cả client đang kết nối
  emitBroadcast('new_notification', toDto(doc.toObject()));
}

export async function notifyAllHr(loai, tieuDe, noiDung, refPayload) {
  const hrs = await mongoose.model('TaiKhoan').find({ role: /^HR$/i });
  for (const tk of hrs) {
    if (tk.username) {
      await notifyPrivate(tk.username, loai, tieuDe, noiDung, refPayload);
    }
  }
}

export async function notifyAllDirectors(loai, tieuDe, noiDung, refPayload) {
  const directors = await mongoose.model('TaiKhoan').find({ role: /^DIRECTOR$/i });
  for (const tk of directors) {
    if (tk.username) {
      await notifyPrivate(tk.username, loai, tieuDe, noiDung, refPayload);
    }
  }
}
