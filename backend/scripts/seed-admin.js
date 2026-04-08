/**
 * Tạo tài khoản ADMIN đầu tiên khi collection taikhoan đang trống.
 * Chạy: npm run seed:admin  (cần MongoDB + MONGODB_URI trong .env)
 *
 * Mặc định: username admin / mật khẩu Admin@123
 * Đổi bằng biến môi trường: SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD
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
const username = (process.env.SEED_ADMIN_USERNAME || 'admin').trim();
const rawPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

async function main() {
  registerModels();
  await mongoose.connect(mongoUri);
  const TaiKhoan = mongoose.model('TaiKhoan');

  const exists = await TaiKhoan.findOne({ username });
  if (exists) {
    console.log(`Đã có tài khoản "${username}". Bỏ qua (xóa trong Compass nếu muốn tạo lại).`);
    await mongoose.disconnect();
    return;
  }

  const ma = `TK_SEED_${Date.now()}`;
  await TaiKhoan.create({
    _id: ma,
    username,
    password: bcrypt.hashSync(rawPassword, 10),
    role: 'ADMIN',
    trangThaiTaiKhoan: true,
    ngayTao: new Date(),
  });

  console.log('Đã tạo tài khoản ADMIN:');
  console.log(`  Username: ${username}`);
  console.log(`  Mật khẩu:  ${rawPassword}`);
  console.log('Đăng nhập tại /login — đổi mật khẩu sau khi vào hệ thống.');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
