<<<<<<< HEAD
# Website Quản lý Nhân sự HRM - Chill

Hệ thống quản lý nhân sự toàn diện, hỗ trợ nắm rõ tình hình nhân sự, lịch làm việc và các quy trình HR trong công ty. Xây dựng theo mô hình Role-Based Access Control (RBAC) với 4 vai trò: ADMIN, HR, DIRECTOR, EMPLOYEE.

---

## 🚀 Công nghệ sử dụng

### Backend
- **Node.js** + **Express.js** - Framework REST API
- **MongoDB** + **Mongoose** - Database NoSQL
- **JWT** - Xác thực và phân quyền
- **Socket.io** - Real-time notifications
- **Nodemailer** - Gửi email (OTP, thông báo)
- **bcryptjs** - Mã hóa mật khẩu
- **Chart.js** (backend hỗ trợ data) - Báo cáo thống kê
- **PDFKit** - Xuất phiếu lương PDF

### Frontend
- **React 18** + **Vite** - UI framework và build tool
- **React Router v6** - Điều hướng SPA
- **Chart.js** + **react-chartjs-2** - Biểu đồ thống kê
- **FontAwesome** - Icons
- **CSS Modules** - Styling (không dùng Tailwind)
- **Socket.io-client** - Real-time updates

### DevOps & Tools
- **ESLint** - Linting code
- **Concurrently** - Chạy đồng thời frontend + backend

---

## 📋 Danh sách 25 chức năng chính (có thể click/thao tác)

| # | Chức năng | Mô tả | Vai trò | Loại |
|---|-----------|-------|---------|------|
| 1 | **Đăng nhập/Đăng xuất** | Xác thực JWT, đăng xuất an toàn | Tất cả | Cơ bản |
| 2 | **Quên mật khẩu (OTP)** | Gửi OTP qua email để reset mật khẩu | Tất cả | Nâng cao |
| 3 | **Dashboard tổng quan** | Xem thống kê nhanh theo vai trò | Tất cả | Cơ bản |
| 4 | **Quản lý tài khoản** | Tạo, khóa/mở khóa, đổi role, gán nhân viên | ADMIN | Cơ bản |
| 5 | **Xem nhật ký đăng nhập** | Audit log đăng nhập thành công/thất bại | ADMIN | Nâng cao |
| 6 | **Quản lý nhân viên (CRUD + Profile)** | Thêm, sửa, xóa, tìm kiếm, xem hồ sơ chi tiết | HR | Cơ bản |
| 7 | **Quản lý cấp dưới** | Gán/quản lý nhân viên cho người quản lý trực tiếp | HR/DIRECTOR | Nâng cao |
| 8 | **Cài đặt hệ thống** | Cấu hình SMTP, thông báo | ADMIN | Cơ bản |
| 9 | **Quản lý phòng ban** | Sơ đồ tổ chức, chi nhánh, chức vụ | HR | Cơ bản |
| 10 | **Quản lý tuyển dụng** | Đăng tin tuyển dụng, quản lý ứng viên | HR | Nâng cao |
| 11 | **Quyết định nhân sự** | Tạo quyết định điều chuyển, thăng chức, kỷ luật | HR | Nâng cao |
| 12 | **Chấm công** | Check-in/check-out, xem lịch sử chấm công | EMPLOYEE/HR | Cơ bản |
| 13 | **Xin nghỉ phép** | Tạo đơn nghỉ, theo dõi trạng thái đơn | EMPLOYEE | Cơ bản |
| 14 | **Phê duyệt đơn nghỉ phép** | Duyệt/từ chối đơn phép của cấp dưới | DIRECTOR/HR | Nâng cao |
| 15 | **Xác nhận đơn nghỉ (HR)** | Xác nhận đơn sau khi quản lý duyệt | HR | Cơ bản |
| 16 | **Tính lương** | Tính lương tháng, khấu trừ, thưởng | HR | Nâng cao |
| 17 | **Xem phiếu lương** | Xem chi tiết lương tháng, tải PDF | EMPLOYEE | Nâng cao |
| 18 | **Danh sách nhân viên** | Xem toàn bộ nhân viên công ty | DIRECTOR/HR | Cơ bản |
| 19 | **Báo cáo chấm công** | Thống kê đi muộn, vắng theo phòng ban | DIRECTOR | Nâng cao |
| 20 | **Báo cáo KPI** | Biểu đồ headcount, quỹ lương, xu hướng | DIRECTOR | Nâng cao |
| 21 | **Hồ sơ cá nhân** | Xem, cập nhật thông tin cá nhân | EMPLOYEE | Cơ bản |
| 22 | **Thông báo real-time** | Xem, đánh dấu đã đọc thông báo | Tất cả | Nâng cao |
| 23 | **Tìm kiếm & Lọc dữ liệu & phân trang** | Tìm kiếm và lọc trong bảng dữ liệu và phân trang | Tất cả | Cơ bản |
| 24 | **Phát thông báo Broadcast** | Gửi thông báo toàn hệ thống real-time | ADMIN | Nâng cao |
| 25 | **Phân quyền hệ thống** | Quản lý quyền truy cập các chức năng | ADMIN | Cơ bản |

**Phân loại:**
- **Cơ bản (12)**: #1, #3, #4, #6, #8, #9, #12, #14, #15, #18, #21, #23, #25
- **Nâng cao (13)**: #2, #5, #7, #10, #11, #13, #16, #17, #19, #20, #22, #24

**Theo Module:**
- **Module 1 (Auth)**: #1, #2, #4, #5, #24, #25 (6 features)
- **Module 2 (Org & Employee)**: #6, #7, #9, #10, #11, #18 (6 features)
- **Module 3 (Attendance & Leave)**: #12, #13, #14, #15, #19 (5 features)
- **Module 4 (Recruitment)**: #10 (shared), #11 (shared) (cùng Module 2)
- **Module 5 (Payroll)**: #16, #17 (2 features)
- **Module 6 (Dashboard & Notification)**: #3, #20, #21, #22, #23 (5 features)

---

## 🏗️ Kiến trúc hệ thống

### Cơ chế phân quyền (RBAC)
- **ADMIN**: Toàn quyền hệ thống, quản lý tài khoản, cấu hình
- **HR**: Quản lý nhân sự, tuyển dụng, lương, chấm công
- **DIRECTOR**: Xem báo cáo, phê duyệt đơn phép cấp dưới
- **EMPLOYEE**: Xem thông tin cá nhân, xin phép, xem lương

### Luồng phê duyệt nghỉ phép
1. Employee tạo đơn → Status: `CHO_QL_DUYET`
2. Manager (DIRECTOR/EMPLOYEE có cấp dưới) duyệt → Status: `CHO_HR_XAC_NHAN`
3. HR xác nhận → Status: `DA_DUYET` hoặc `TU_CHOI`

### Real-time Notifications
- Socket.io server trên backend
- Broadcast notifications tới tất cả user online
- Private notifications tới từng user cụ thể
- Unread count badge trên UI

---

## 📁 Cấu trúc thư mục

```
WebsiteQuanLyNhanSu/
├── backend/                     # Node.js API
│   ├── src/
│   │   ├── services/           # 11 business services
│   │   ├── models/             # MongoDB schemas
│   │   ├── middleware/           # Auth middleware
│   │   ├── utils/              # Helpers
│   │   ├── authRoutes.js       # Public routes
│   │   ├── protectedRoutes.js  # JWT protected routes
│   │   └── socketService.js    # Real-time service
│   └── .env                    # Config
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── pages/dashboard/    # 24 page components
│   │   ├── components/         # Shared + role components
│   │   ├── api/               # Client API + storage
│   │   ├── utils/             # Display helpers
│   │   └── styles/app.css     # Global styles
│   └── .env                   # Vite config
└── README.md
```

---

## ⚙️ Cài đặt và chạy

### Yêu cầu
- Node.js 18+
- MongoDB 5.0+

### Bước 1: Backend
```bash
cd backend
cp .env.example .env
# Cấu hình MONGO_URI, JWT_SECRET trong .env
npm install
npm run dev          # Chạy trên port 8082
```

### Bước 2: Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev          # Chạy trên port 5173
```

### Chạy đồng thời (dev)
```bash
npm run dev          # Root folder - chạy cả 2
```

---

## 🔐 Môi trường (.env)

### Backend
```env
PORT=8082
MONGO_URI=mongodb://localhost:27017/hrm
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend
```env
VITE_API_BASE_URL=http://localhost:8082
```

---

## 🎯 Tính năng nâng cao đáng chú ý

1. **Phê duyệt 2 cấp** - Manager → HR cho đơn nghỉ phép
2. **Real-time notifications** - Socket.io cho thông báo tức thì
3. **PDF Export** - Xuất phiếu lương PDF động
4. **Dashboard analytics** - Biểu đồ Chart.js cho KPI
5. **Audit logging** - Ghi nhận mọi đăng nhập (thành công/thất bại)

---

## 📝 License

MIT License - Hệ thống mã nguồn mở cho cộng đồng.

---

**Phiên bản:** 1.0.0  
**Cập nhật:** Tháng 4/2026  

=======
# WebsiteQuanLyNhanSuJs
Website tạo ra nhằm mục đích nắm rõ được tình hình nhân sự trong công ty cũng như lịch làm việc ..
>>>>>>> d2079c8522d5162ee2063b5b968bd939a79f530c
