# Bảng Phân Công Unit Test - 5 Người / 25 Features

**Quy tắc phân công:**
- Mỗi người 1 nhóm (layer)
- Mỗi nhóm 5 chức năng = 5 file test
- Tổng 25 file test cho 25 UC
- Không trùng file giữa các người

---

## 👤 Người 1: Auth & Security Layer

**Chức năng phụ trách:** #1, #2, #4, #5, #25

| STT | UC | Chức năng | File Test | Source Files Cần Test |
|-----|-----|-----------|-----------|------------------------|
| 1 | #1 | Đăng nhập/Đăng xuất | `login.test.js` | `frontend/src/pages/Login.jsx`<br>`backend/src/services/authService.js` |
| 2 | #2 | Quên mật khẩu (OTP) | `forgotPassword.test.js` | `frontend/src/pages/ForgotPassword.jsx`<br>`frontend/src/pages/ResetPassword.jsx`<br>`backend/src/services/authService.js` |
| 3 | #4 | Quản lý tài khoản | `adminAccounts.test.js` | `frontend/src/pages/dashboard/AdminAccounts.jsx`<br>`backend/src/services/adminService.js` |
| 4 | #5 | Xem nhật ký đăng nhập | `loginLogs.test.js` | `frontend/src/pages/dashboard/AdminLoginLogs.jsx`<br>`backend/src/services/loginLogService.js` |
| 5 | #25 | Phân quyền hệ thống | `rolePermission.test.js` | `frontend/src/components/RequireRole.jsx`<br>`backend/src/middleware/auth.js`<br>`backend/src/jwt.js` |

**Tổng file:** 5 test files
**Thư mục lưu:**
- Frontend: `frontend/src/pages/__tests__/`, `frontend/src/components/__tests__/`
- Backend: `backend/tests/unit/auth/`

---

## 👤 Người 2: Employee & Organization Layer

**Chức năng phụ trách:** #6, #7, #9, #11, #18

| STT | UC | Chức năng | File Test | Source Files Cần Test |
|-----|-----|-----------|-----------|------------------------|
| 1 | #6 | Quản lý nhân viên (CRUD + Profile) | `employeeCrud.test.js` | `frontend/src/pages/dashboard/HrEmployees.jsx`<br>`frontend/src/pages/dashboard/HrEmployeeProfile.jsx`<br>`backend/src/services/employeeService.js` |
| 2 | #7 | Quản lý cấp dưới | `directManager.test.js` | `frontend/src/pages/dashboard/HrEmployees.jsx` (gán QL)<br>`backend/src/services/employeeService.js` (directManagerIds) |
| 3 | #9 | Quản lý phòng ban | `organization.test.js` | `frontend/src/pages/dashboard/HrOrganization.jsx`<br>`frontend/src/pages/dashboard/OrgEntity.jsx`<br>`backend/src/services/organizationService.js` |
| 4 | #11 | Quyết định nhân sự | `decisions.test.js` | `frontend/src/pages/dashboard/HrDecisions.jsx`<br>`backend/src/services/employeeService.js` (quyetDinh) |
| 5 | #18 | Danh sách nhân viên | `employeeList.test.js` | `frontend/src/pages/dashboard/EmployeeList.jsx`<br>`backend/src/services/employeeService.js` (list with filters) |

**Tổng file:** 5 test files
**Thư mục lưu:**
- Frontend: `frontend/src/pages/dashboard/__tests__/`
- Backend: `backend/tests/unit/employee/`

---

## 👤 Người 3: Attendance & Leave Layer

**Chức năng phụ trách:** #12, #13, #14, #15, #19

| STT | UC | Chức năng | File Test | Source Files Cần Test |
|-----|-----|-----------|-----------|------------------------|
| 1 | #12 | Chấm công | `attendance.test.js` | `frontend/src/pages/dashboard/EmployeeAttendance.jsx`<br>`frontend/src/pages/dashboard/HrAttendance.jsx`<br>`backend/src/services/dashboardService.js` (chấm công) |
| 2 | #13 | Xin nghỉ phép | `leaveRequest.test.js` | `frontend/src/pages/dashboard/EmployeeLeaves.jsx`<br>`backend/src/services/donNghiPhepService.js` (createLeave) |
| 3 | #14 | Phê duyệt đơn nghỉ phép | `leaveApprove.test.js` | `backend/src/services/donNghiPhepService.js` (approve/reject)<br>`frontend/src/pages/dashboard/DirectorHome.jsx` (pending leaves) |
| 4 | #15 | Xác nhận đơn nghỉ (HR) | `leaveConfirm.test.js` | `frontend/src/pages/dashboard/HrLeaves.jsx`<br>`backend/src/services/donNghiPhepService.js` (HR confirm) |
| 5 | #19 | Báo cáo chấm công | `attendanceReport.test.js` | `frontend/src/pages/dashboard/DirectorReports.jsx`<br>`backend/src/services/dashboardService.js` (attendance stats) |

**Tổng file:** 5 test files
**Thư mục lưu:**
- Frontend: `frontend/src/pages/dashboard/__tests__/`
- Backend: `backend/tests/unit/attendance/`

---

## 👤 Người 4: Payroll & Dashboard Layer

**Chức năng phụ trách:** #3, #16, #17, #20, #21

| STT | UC | Chức năng | File Test | Source Files Cần Test |
|-----|-----|-----------|-----------|------------------------|
| 1 | #3 | Dashboard tổng quan | `dashboard.test.js` | `frontend/src/pages/dashboard/AdminHome.jsx`<br>`frontend/src/pages/dashboard/HrHome.jsx`<br>`frontend/src/pages/dashboard/DirectorHome.jsx`<br>`frontend/src/pages/dashboard/EmployeeHome.jsx`<br>`backend/src/services/dashboardService.js` |
| 2 | #16 | Tính lương | `payrollCalculate.test.js` | `frontend/src/pages/dashboard/HrPayroll.jsx`<br>`backend/src/services/payrollService.js` (tinhLuong) |
| 3 | #17 | Xem phiếu lương | `payslipView.test.js` | `frontend/src/pages/dashboard/EmployeePayslip.jsx`<br>`backend/src/services/payrollService.js` (buildPayslip)<br>`backend/src/utils/payslipPdf.js` |
| 4 | #20 | Báo cáo KPI | `kpiReport.test.js` | `frontend/src/pages/dashboard/DirectorKpi.jsx`<br>`backend/src/services/dashboardService.js` (KPI stats) |
| 5 | #21 | Hồ sơ cá nhân | `employeeProfile.test.js` | `frontend/src/pages/dashboard/EmployeeProfile.jsx`<br>`backend/src/services/employeeService.js` (get profile) |

**Tổng file:** 5 test files
**Thư mục lưu:**
- Frontend: `frontend/src/pages/dashboard/__tests__/`
- Backend: `backend/tests/unit/payroll/`, `backend/tests/unit/dashboard/`

---

## 👤 Người 5: Recruitment, Notification & System Layer

**Chức năng phụ trách:** #8, #10, #22, #23, #24

| STT | UC | Chức năng | File Test | Source Files Cần Test |
|-----|-----|-----------|-----------|------------------------|
| 1 | #8 | Cài đặt hệ thống | `adminSettings.test.js` | `frontend/src/pages/dashboard/AdminSettings.jsx`<br>`backend/src/config.js`<br>`backend/src/constants/brand.js` |
| 2 | #10 | Quản lý tuyển dụng | `recruitment.test.js` | `frontend/src/pages/dashboard/HrRecruitment.jsx`<br>`backend/src/services/recruitmentService.js` |
| 3 | #22 | Thông báo real-time | `notification.test.js` | `frontend/src/components/NotificationDropdown.jsx`<br>`frontend/src/components/DashboardLayout.jsx`<br>`frontend/src/api/socket.js`<br>`backend/src/services/notificationService.js`<br>`backend/src/socketService.js` |
| 4 | #23 | Tìm kiếm & Lọc & Phân trang | `searchFilter.test.js` | `frontend/src/pages/dashboard/HrEmployees.jsx` (filter)<br>`frontend/src/pages/dashboard/EmployeeList.jsx` (filter)<br>`frontend/src/pages/dashboard/AdminAccounts.jsx` (filter) |
| 5 | #24 | Phát thông báo Broadcast | `broadcast.test.js` | `backend/src/services/notificationService.js` (broadcast)<br>`frontend/src/pages/dashboard/AdminSettings.jsx` (broadcast form) |

**Tổng file:** 5 test files
**Thư mục lưu:**
- Frontend: `frontend/src/components/__tests__/`, `frontend/src/pages/dashboard/__tests__/`
- Backend: `backend/tests/unit/recruitment/`, `backend/tests/unit/notification/`

---

## 📁 Tổng Hợp Cấu Trúc Thư Mục Test

```
frontend/src/
├── pages/
│   ├── __tests__/
│   │   ├── login.test.js                    (P1)
│   │   ├── forgotPassword.test.js           (P1)
│   │   └── ...
│   └── dashboard/
│       └── __tests__/
│           ├── adminAccounts.test.js        (P1)
│           ├── adminLoginLogs.test.js       (P1)
│           ├── employeeCrud.test.js         (P2)
│           ├── directManager.test.js        (P2)
│           ├── organization.test.js         (P2)
│           ├── decisions.test.js            (P2)
│           ├── employeeList.test.js         (P2)
│           ├── attendance.test.js           (P3)
│           ├── leaveRequest.test.js          (P3)
│           ├── leaveApprove.test.js          (P3)
│           ├── leaveConfirm.test.js          (P3)
│           ├── attendanceReport.test.js      (P3)
│           ├── dashboard.test.js            (P4)
│           ├── payrollCalculate.test.js      (P4)
│           ├── payslipView.test.js           (P4)
│           ├── kpiReport.test.js             (P4)
│           ├── employeeProfile.test.js       (P4)
│           ├── adminSettings.test.js         (P5)
│           ├── recruitment.test.js           (P5)
│           ├── searchFilter.test.js          (P5)
│           └── broadcast.test.js             (P5)
├── components/
│   └── __tests__/
│       ├── requireRole.test.js             (P1)
│       ├── notificationDropdown.test.js      (P5)
│       └── dashboardLayout.test.js          (P5)

backend/
└── tests/
    └── unit/
        ├── auth/
        │   ├── authService.test.js
        │   └── adminService.test.js
        ├── employee/
        │   └── employeeService.test.js
        ├── attendance/
        │   └── donNghiPhepService.test.js
        ├── payroll/
        │   └── payrollService.test.js
        ├── recruitment/
        │   └── recruitmentService.test.js
        └── notification/
            └── notificationService.test.js
```

## ✅ Checklist Hoàn Thành

### Người 1 (Auth & Security)
- [ ] `login.test.js` (UC #1)
- [ ] `forgotPassword.test.js` (UC #2)
- [ ] `adminAccounts.test.js` (UC #4)
- [ ] `loginLogs.test.js` (UC #5)
- [ ] `rolePermission.test.js` (UC #25)

### Người 2 (Employee & Organization)
- [ ] `employeeCrud.test.js` (UC #6)
- [ ] `directManager.test.js` (UC #7)
- [ ] `organization.test.js` (UC #9)
- [ ] `decisions.test.js` (UC #11)
- [ ] `employeeList.test.js` (UC #18)

### Người 3 (Attendance & Leave)
- [ ] `attendance.test.js` (UC #12)
- [ ] `leaveRequest.test.js` (UC #13)
- [ ] `leaveApprove.test.js` (UC #14)
- [ ] `leaveConfirm.test.js` (UC #15)
- [ ] `attendanceReport.test.js` (UC #19)

### Người 4 (Payroll & Dashboard)
- [ ] `dashboard.test.js` (UC #3)
- [ ] `payrollCalculate.test.js` (UC #16)
- [ ] `payslipView.test.js` (UC #17)
- [ ] `kpiReport.test.js` (UC #20)
- [ ] `employeeProfile.test.js` (UC #21)

### Người 5 (Recruitment, Notification & System)
- [ ] `adminSettings.test.js` (UC #8)
- [ ] `recruitment.test.js` (UC #10)
- [ ] `notification.test.js` (UC #22)
- [ ] `searchFilter.test.js` (UC #23)
- [ ] `broadcast.test.js` (UC #24)

---

**Tổng:** 25 test files / 5 người = 5 files/người

---

## 🚀 Hướng Dẫn Chạy Test

### 1. Chạy tất cả tests

```bash
cd frontend
npx jest --no-coverage
```

Hoặc với npm script:
```bash
cd frontend
npm run test
```

### 2. Chạy theo nhóm (P1, P2, P3, P4, P5)

```bash
# Chạy tests của Người 1 (Auth & Security)
npx jest P1  --no-coverage 

# Chạy tests của Người 2 (Employee & Organization)
npx jest P2  --no-coverage 

# Chạy tests của Người 3 (Attendance & Leave)
npx jest P3  --no-coverage 

# Chạy tests của Người 4 (Payroll & Dashboard)
npx jest P4  --no-coverage 

# Chạy tests của Người 5 (Recruitment, Notification & System)
npx jest P5  --no-coverage 
```
# Debug mode
$env:DEBUG_PRINT_LIMIT=0; npx jest P4 --no-coverage

### 3. Chạy từng file test cụ thể

```bash
# Ví dụ: Chạy test login (UC #1)
npx jest --testPathPatterns="P1-UC01-login" --no-coverage

# Chạy test chấm công (UC #12)
npx jest --testPathPatterns="P3-UC12-attendance" --no-coverage

# Chạy test tính lương (UC #16)
npx jest --testPathPatterns="P4-UC16-payrollCalculate" --no-coverage
```

### 4. Chạy test với coverage report

```bash
npx jest --coverage
```

### 5. Chạy test ở chế độ watch (tự động chạy lại khi file thay đổi)

```bash
npm run test:watch
```

### 6. Các option hữu ích khác

```bash
# Chạy test failed trước đó
npx jest --only-failed --no-coverage

# Chạy test với verbose output
npx jest --verbose --no-coverage

# Chạy test cụ thể theo tên
npx jest --testNamePattern="TC01" --no-coverage
```

---

**Lưu ý:**
- Chạy test từ thư mục `frontend/` để Jest load đúng config
- Sử dụng `--no-coverage` để chạy nhanh hơn khi dev
- Các tests backend services được mock, không cần chạy database
