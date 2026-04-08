import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { generateToken } from '../jwt.js';
import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { SITE_TITLE } from '../constants/brand.js';

export async function login(username, password) {
  const tk = await mongoose.model('TaiKhoan').findOne({ username });
  if (!tk || !bcrypt.compareSync(password, tk.password)) {
    throw new Error('AUTH');
  }
  if (tk.trangThaiTaiKhoan === false) {
    throw new Error('AUTH');
  }
  const token = generateToken(tk.username, tk.role);
  return { token, role: tk.role, username: tk.username };
}

export async function processForgotPassword(username) {
  const tk = await mongoose.model('TaiKhoan').findOne({ username }).populate('nhanVien');
  if (!tk?.nhanVien) return false;
  const token = String(Math.floor(Math.random() * 900000 + 100000));
  tk.resetToken = token;
  tk.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
  await tk.save();
  const nv = await mongoose.model('NhanVien').findById(tk.nhanVien);
  const email = nv?.emailCongViec;
  if (!email?.trim()) return false;
  if (config.smtp.user && config.smtp.pass) {
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: false,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
    try {
      await transporter.sendMail({
        from: config.smtp.user,
        to: email,
        subject: `Mã khôi phục mật khẩu — ${SITE_TITLE}`,
        text: `Mã xác nhận của bạn là: ${token}\nMã này có hiệu lực trong 15 phút.`,
      });
    } catch (e) {
      console.error('Mail error', e.message);
    }
  }
  return true;
}

export async function resetPasswordBody(username, otp, newPassword) {
  const tk = await mongoose.model('TaiKhoan').findOne({ username });
  if (
    !tk ||
    !tk.resetToken ||
    !tk.resetTokenExpiry ||
    tk.resetToken !== otp ||
    new Date(tk.resetTokenExpiry) < new Date()
  ) {
    throw new Error('OTP');
  }
  tk.password = bcrypt.hashSync(newPassword, 10);
  tk.resetToken = null;
  tk.resetTokenExpiry = null;
  await tk.save();
}

export async function confirmResetBody(username, token, newPassword) {
  await resetPasswordBody(username, token, newPassword);
}
