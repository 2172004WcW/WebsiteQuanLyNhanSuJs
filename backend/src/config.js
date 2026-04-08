import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 8081,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm_system',
  jwtSecret: process.env.JWT_SECRET || 'DayLaChuoiBiMatSieuCapVipPro_KhongDuocTietLo_2026',
  uploadAvatarDir: process.env.UPLOAD_AVATAR_DIR || 'uploads/avatars',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:8081,http://localhost:3000,http://127.0.0.1:8081,http://127.0.0.1:5173').split(','),
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};
