# THE GENT BARBERSHOP

Website giới thiệu, đặt lịch cắt tóc, mua sắm sản phẩm chăm sóc nam giới và hệ thống quản trị cửa hàng **THE GENT BARBERSHOP**.

---

## Cấu trúc thư mục

```text
THE-GENT-BARBERSHOP/
├── 1-frontend/     # Giao diện web (React + Vite)
├── 2-backend/      # API Server (Node.js + Express)
└── 3-database/     # Cơ sở dữ liệu MySQL (schema.sql)
```

---

## Chức năng chính

### 1. Trang chủ dành cho khách hàng (`/`)
- Giới thiệu thương hiệu, dịch vụ, bộ sưu tập hình ảnh và thông tin cửa hàng.
- **Mua sắm & Giỏ hàng**: Xem sản phẩm (Sáp vuốt tóc, Lược, Xịt tạo phồng, Dầu gội, Tinh dầu dưỡng râu...), thêm vào giỏ hàng, tăng/giảm số lượng, điền thông tin nhận hàng (Họ tên, SĐT, Địa chỉ, Phương thức thanh toán) và đặt hàng.
- **Đặt lịch cắt tóc** (`/booking`): Khách hàng chọn dịch vụ, thợ cắt, ngày giờ đặt lịch.

### 2. Trang Quản trị Admin (`/login` → `/admin`)
Gồm 5 mục quản lý chính:
1. **Tổng quan**: Thống kê nhanh doanh thu, đơn hàng chờ duyệt, lịch cắt tóc và phân công theo từng thợ.
2. **Đơn hàng & Kho sản phẩm**:
   - Duyệt đơn đặt Online và tạo đơn mua trực tiếp tại cửa tiệm.
   - Thêm / Sửa / Xóa sản phẩm (hỗ trợ chèn ảnh, mô tả chi tiết, phân loại) và cảnh báo tự động khi số lượng tồn kho ít (`≤ 5`).
3. **Lịch cắt tóc**: Phân chia rõ lịch theo từng thợ cắt, hỗ trợ thêm/xóa nhân viên cắt tóc và cập nhật trạng thái lịch hẹn.
4. **Doanh thu**: Thống kê và biểu đồ doanh thu theo **Tuần**, **Tháng**, **Năm** (hỗ trợ lịch **2026 – 2027**).
5. **Cài đặt**: Chỉnh sửa tên cửa hàng, địa chỉ, hotline, email, giờ mở cửa (tự động đồng bộ lên Trang chủ).

---

## Hướng dẫn chạy nhanh (Frontend Demo)

Yêu cầu máy đã cài **Node.js**.

```bash
cd 1-frontend
npm install
npm run dev
```

Mở trình duyệt tại: `http://localhost:5173/`

### Tài khoản đăng nhập Admin
- Truy cập nút **Quản trị** ở góc trên trang chủ (hoặc `/login`)
- **Tên đăng nhập:** `admin`
- **Mật khẩu:** `123456`

---

## Backend & Database (Tùy chọn)

Nếu muốn kết nối thêm Backend với MySQL:
1. Import file `3-database/schema.sql` vào MySQL.
2. Tạo file `.env` trong `2-backend/` theo mẫu `2-backend/.env.example`.
3. Cài đặt và chạy Backend:
   ```bash
   cd 2-backend
   npm install
   node server.js
   ```
