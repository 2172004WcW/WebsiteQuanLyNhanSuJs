import { Router } from 'express';
import * as authService from './services/authService.js';
import * as loginLogService from './services/loginLogService.js';

function clientIp(req) {
  const x = req.headers['x-forwarded-for'];
  if (typeof x === 'string' && x.trim()) return x.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || '';
}

export function buildAuthRouter() {
  const r = Router();

  r.post('/login', async (req, res) => {
    try {
      const out = await authService.login(req.body.username, req.body.password);
      await loginLogService.recordLoginSuccess(out.username, {
        ip: clientIp(req),
        userAgent: req.headers['user-agent'],
      });
      res.json(out);
    } catch {
      res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }
  });

  r.post('/forgot-password', async (req, res) => {
    try {
      await authService.processForgotPassword(req.body.username);
    } catch {
      /* Không lộ lỗi để bảo mật */
    }
    res.json({ message: 'Nếu tài khoản tồn tại, mã OTP đã được gửi.' });
  });

  r.post('/reset-password', async (req, res) => {
    try {
      await authService.resetPasswordBody(req.body.username, req.body.otp, req.body.newPassword);
      res.json({ message: 'Mật khẩu đã được đặt lại thành công.' });
    } catch {
      res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }
  });

  r.post('/reset-password/confirm', async (req, res) => {
    try {
      await authService.confirmResetBody(req.body.username, req.body.token, req.body.newPassword);
      res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch {
      res.status(400).json({ message: 'Mã xác nhận không đúng hoặc đã hết hạn.' });
    }
  });

  return r;
}
