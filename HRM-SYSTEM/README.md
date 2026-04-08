hrm-backend/
│
├── src/                        # Chứa toàn bộ mã nguồn chính
│   ├── config/                 # Cấu hình hệ thống (Database, Mail...)
│   │   └── db.js               # File kết nối MongoDB
│   │
│   ├── controllers/            # Xử lý logic nghiệp vụ (Nhận request, trả response)
│   │   ├── auth.controller.js  # Logic đăng nhập, đăng xuất
│   │   └── employee.controller.js 
│   │
│   ├── middlewares/            # Các hàm trung gian (Kiểm tra quyền, bắt lỗi)
│   │   ├── auth.middleware.js  # Chặn route, xác thực JWT Token
│   │   └── error.middleware.js # Xử lý lỗi chung
│   │
│   ├── models/                 # Định nghĩa cấu trúc dữ liệu MongoDB (Mongoose Schema)
│   │   ├── User.model.js       # Bảng Tài khoản (Role, username, password)
│   │   └── Employee.model.js   # Bảng Thông tin nhân viên
│   │
│   ├── routes/                 # Định tuyến các URL API
│   │   ├── auth.routes.js      # Chứa các route /api/auth/...
│   │   ├── employee.routes.js  # Chứa các route /api/employees/...
│   │   └── index.js            # File gom tất cả các route lại
│   │
│   ├── utils/                  # Các hàm tiện ích dùng chung
│   │   └── formatHelper.js     # Ví dụ: hàm format ngày tháng, format tiền tệ
│   │
│   └── server.js               # File gốc khởi chạy toàn bộ ứng dụng Express
│
├── .env                        # Chứa các biến môi trường nhạy cảm (KHÔNG push lên Git)
├── .gitignore                  # Khai báo các file/thư mục Git cần bỏ qua
├── package.json                # Chứa thông tin project và danh sách thư viện
└── README.md                   # Hướng dẫn chạy project cho các thành viên khác


npm install khi clone về 
