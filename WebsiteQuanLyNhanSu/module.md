

---

## Kịch bản workflow theo module và role

Mục tiêu phần này là mô tả nhanh: đăng nhập vào mỗi role thì thấy gì, thao tác chính ra sao, dữ liệu chạy qua các bước nào.

---

### Module 1: Infrastructure & Auth (Xác thực, phân quyền, quên mật khẩu OTP)

- **Admin**
  - Đăng nhập thành công vào dashboard admin, quản lý tài khoản và phân quyền.
  - Tạo tài khoản mới cho nhân viên, gán role, khóa/mở tài khoản khi cần.
  - Dùng chức năng reset mật khẩu khi hỗ trợ người dùng.
- **HR / Director / Employee**
  - Đăng nhập bằng username + password và được điều hướng đúng dashboard theo role.
  - Nếu quên mật khẩu: nhập username ở trang quên mật khẩu, nhận OTP qua email công việc, nhập OTP + mật khẩu mới để đặt lại.
- **Workflow chính**
  - Người dùng xác thực → hệ thống cấp JWT → frontend lưu phiên theo tab → các API kiểm tra quyền theo role trước khi xử lý.

### Module 2: Org & Employee Data (Cơ cấu tổ chức và hồ sơ nhân sự)

- **HR**
  - Vào màn hình tổ chức để quản lý chi nhánh, phòng ban, nhóm, chức vụ.
  - Quản lý hồ sơ nhân viên: thêm mới, cập nhật thông tin cá nhân/công việc, theo dõi trạng thái làm việc.
  - Ghi nhận lịch sử công tác và quyết định (điều chuyển, khen thưởng, kỷ luật).
- **Admin**
  - Phối hợp với HR khi gán tài khoản vào nhân viên đúng dữ liệu nhân sự. HR thêm nhân viên và admin sẽ gán nhân viên vào tài khoản 
- **Director**
  - Xem dữ liệu tổ chức và nhân sự ở mức tổng quan để ra quyết định.
- **Employee**
  - Xem/ cập nhật các thông tin cá nhân được phép chỉnh sửa trong hồ sơ.
- **Workflow chính**
  - HR cập nhật cấu trúc tổ chức → dữ liệu này làm nền cho phân quyền, chấm công, nghỉ phép, lương và tuyển dụng.

### Module 3: Attendance & Leave (Chấm công và nghỉ phép)

- **Employee**
  - Check-in/check-out hằng ngày.
  - Tạo đơn nghỉ phép, theo dõi trạng thái từng đơn và số phép còn lại.
- **Employee có vai trò quản lý trực tiếp**
  - Nhận các đơn nghỉ từ nhân viên thuộc phạm vi quản lý.
  - Duyệt hoặc từ chối, ghi chú lý do khi cần.
- **HR**
  - Xử lý bước xác nhận tiếp theo sau quản lý trực tiếp.
  - Theo dõi các trường hợp tồn đọng, đồng bộ dữ liệu nghỉ phép với công/lương.
- **Director**
  - Theo dõi tỷ lệ đi muộn, vắng mặt, xu hướng nghỉ phép toàn công ty.
- **Workflow chính**
  - Nhân viên nộp đơn → quản lý trực tiếp duyệt bước 1 → HR xác nhận bước 2 → hệ thống cập nhật quỹ phép và báo cáo liên quan.

### Module 4: Recruitment (Tuyển dụng)

- **HR**
  - Nhận yêu cầu tuyển dụng từ các phòng ban.
  - Quản lý danh sách ứng viên, CV, lịch phỏng vấn và kết quả đánh giá.
  - Chuyển ứng viên trúng tuyển sang hồ sơ nhân viên chính thức (onboarding).
- **Director**
  - Theo dõi nhu cầu tuyển dụng và phê duyệt ở mức chính sách/định biên.
- **Admin**
  - Tạo tài khoản hệ thống khi nhân sự mới đã onboard.
- **Workflow chính**
  - Phòng ban đề xuất nhu cầu → HR tuyển chọn/phỏng vấn → chốt trúng tuyển → tạo hồ sơ nhân viên → kích hoạt tài khoản làm việc.

### Module 5: Payroll System (Tiền lương)

- **HR**
  - Quản lý cấu trúc lương, phụ cấp, dữ liệu đầu vào tính lương.
  - Rà soát dữ liệu công, phép, đi muộn trước kỳ chốt lương.
- **Director**
  - Theo dõi biến động quỹ lương và các chỉ số tổng hợp theo kỳ.
- **Employee**
  - Xem phiếu lương cá nhân, trạng thái chi trả và lịch sử lương.
- **Workflow chính**
  - Đến kỳ lương hệ thống tổng hợp công + phép + phụ cấp/khấu trừ → sinh phiếu lương → HR kiểm tra/chốt → nhân viên tra cứu.

### Module 6: Dashboard & Notification (Tổng quan điều hành và thông báo)

- **Admin Dashboard**
  - Quản trị tài khoản tập trung: tạo, khóa/mở, đổi role, theo dõi trạng thái tài khoản.
- **HR Dashboard**
  - Theo dõi nghiệp vụ nhân sự theo thời gian thực: đơn từ chờ xử lý, biến động nhân sự, chỉ số đi muộn/nghỉ việc.
- **Director Dashboard**
  - Xem chỉ số chiến lược: tổng nhân sự, xu hướng hiệu suất, biến động quỹ lương.
- **Employee Dashboard**
  - Xem thông báo cá nhân, lịch sử thao tác chính (đơn phép, chấm công, hồ sơ, lương).
- **Workflow chính**
  - Sự kiện nghiệp vụ phát sinh (duyệt đơn, chốt lương, cập nhật hồ sơ) → hệ thống đẩy thông báo in-app → dashboard từng role cập nhật theo phạm vi quyền.

---

## Tóm tắt nhanh theo role

- **Admin**: Quản trị tài khoản và phân quyền, đảm bảo đúng người đúng vai trò.
- **HR**: Vận hành nghiệp vụ nhân sự end-to-end (tổ chức, hồ sơ, nghỉ phép, tuyển dụng, lương).
- **Director**: Theo dõi KPI nhân sự cấp công ty và ra quyết định điều hành.
- **Employee**: Tự phục vụ nghiệp vụ cá nhân (hồ sơ, chấm công, đơn phép, phiếu lương, thông báo).
