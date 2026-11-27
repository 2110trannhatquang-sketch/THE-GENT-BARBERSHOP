# Thư mục 3-database

Chứa cấu trúc cơ sở dữ liệu **MySQL** cho **THE GENT BARBERSHOP**:

- `schema.sql`: Toàn bộ 13 bảng (`users`, `staff`, `customers`, `services`, `staff_services`, `work_shifts`, `appointments`, `appointment_services`, `invoices`, `products`, `orders`, `order_items`, `shop_settings`).

## Cách import vào MySQL
1. Tạo file `.env` trong thư mục `2-backend/` theo mẫu `.env.example`.
2. Import `schema.sql` vào MySQL Workbench / phpMyAdmin hoặc chạy lệnh:
   ```sql
   SOURCE 3-database/schema.sql;
   ```
