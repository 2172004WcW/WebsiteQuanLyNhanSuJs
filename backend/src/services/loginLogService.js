import mongoose from 'mongoose';

/**
 * Nhật ký đăng nhập — lưu MongoDB để admin xem và audit.
 */
export async function recordLoginSuccess(username, { ip, userAgent } = {}) {
  if (!username?.trim()) return;
  await mongoose.model('LoginLog').create({
    username: username.trim(),
    thoiGian: new Date(),
    ip: ip || null,
    userAgent: userAgent ? String(userAgent).slice(0, 500) : null,
    thanhCong: true,
  });
}

export async function listLoginLogs(limit = 200) {
  const cap = Math.min(Math.max(Number(limit) || 200, 1), 500);
  return mongoose
    .model('LoginLog')
    .find({})
    .sort({ thoiGian: -1 })
    .limit(cap)
    .lean()
    .then((rows) =>
      rows.map((r) => ({
        id: r._id,
        username: r.username,
        thoiGian: r.thoiGian,
        ip: r.ip || null,
        userAgent: r.userAgent || null,
        thanhCong: r.thanhCong !== false,
      }))
    );
}
