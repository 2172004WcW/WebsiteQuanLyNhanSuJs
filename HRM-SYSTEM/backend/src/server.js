require('dotenv').config(); // Load biến môi trường từ file .env
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Khởi tạo app Express
const app = express();

// Kết nối MongoDB
connectDB();

// Middleware
app.use(cors()); // Cho phép Frontend (React) gọi API
app.use(express.json()); // Cho phép Node.js đọc được dữ liệu JSON gửi lên

// Route cơ bản để test server
app.get('/', (req, res) => {
    res.send('HRM System API is running...');
});

// Lắng nghe cổng
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy ở chế độ phát triển trên cổng ${PORT}`);
});