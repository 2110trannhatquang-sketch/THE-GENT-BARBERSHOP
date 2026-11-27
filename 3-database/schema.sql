-- THE GENT BARBERSHOP - MySQL Database Schema
CREATE DATABASE IF NOT EXISTS the_gent_barbershop
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE the_gent_barbershop;

-- 1. Tài khoản đăng nhập (OWNER / STAFF)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NULL,
  role ENUM('OWNER', 'STAFF') NOT NULL DEFAULT 'STAFF',
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Nhân viên / Thợ cắt tóc
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  staff_code VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NULL,
  job_title VARCHAR(80) DEFAULT 'Barber',
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Khách hàng
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_code VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(120) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Dịch vụ cắt tóc
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_name VARCHAR(120) NOT NULL,
  category VARCHAR(80) DEFAULT 'Cắt tóc',
  price DECIMAL(12, 0) NOT NULL DEFAULT 0,
  duration INT NOT NULL DEFAULT 30,
  description TEXT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE'
);

-- 5. Kỹ năng dịch vụ của từng nhân viên
CREATE TABLE IF NOT EXISTS staff_services (
  staff_id INT NOT NULL,
  service_id INT NOT NULL,
  PRIMARY KEY (staff_id, service_id),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- 6. Ca làm việc của nhân viên
CREATE TABLE IF NOT EXISTS work_shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('AVAILABLE', 'OFF') NOT NULL DEFAULT 'AVAILABLE',
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- 7. Lịch cắt tóc
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_code VARCHAR(40) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  staff_id INT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

-- 8. Chi tiết dịch vụ trong lịch hẹn
CREATE TABLE IF NOT EXISTS appointment_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  service_id INT NOT NULL,
  price DECIMAL(12, 0) NOT NULL,
  duration INT NOT NULL,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- 9. Hóa đơn dịch vụ
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_code VARCHAR(40) NOT NULL UNIQUE,
  appointment_id INT NOT NULL,
  total_amount DECIMAL(12, 0) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) NULL,
  status ENUM('UNPAID', 'PAID', 'VOID') NOT NULL DEFAULT 'UNPAID',
  paid_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- 10. Sản phẩm bán hàng (Shop)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Sáp vuốt tóc',
  price DECIMAL(12, 0) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NULL,
  stock INT NOT NULL DEFAULT 0,
  description TEXT NULL,
  image LONGTEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Đơn hàng (Online & Mua tại tiệm)
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(40) NOT NULL UNIQUE,
  channel ENUM('ONLINE', 'IN_STORE') NOT NULL DEFAULT 'ONLINE',
  customer_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'COD',
  note TEXT NULL,
  total_amount DECIMAL(12, 0) NOT NULL DEFAULT 0,
  status ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Chi tiết đơn hàng
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NULL,
  product_name VARCHAR(150) NOT NULL,
  price DECIMAL(12, 0) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 13. Cài đặt thông tin cửa hàng
CREATE TABLE IF NOT EXISTS shop_settings (
  id INT PRIMARY KEY DEFAULT 1,
  shop_name VARCHAR(150) NOT NULL,
  tagline VARCHAR(200) NULL,
  address VARCHAR(255) NOT NULL,
  city_label VARCHAR(120) NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(120) NULL,
  opening_hours VARCHAR(60) NULL,
  opening_days VARCHAR(80) NULL
);

INSERT IGNORE INTO shop_settings (id, shop_name, tagline, address, city_label, phone, email, opening_hours, opening_days)
VALUES (
  1,
  'THE GENT BARBERSHOP',
  'CLASSIC STYLE — MODERN GENTLEMEN',
  '128 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  'HO CHI MINH CITY · VIETNAM',
  '0909 888 777',
  'contact@thegentbarber.vn',
  '08:00 – 21:00',
  'Thứ 2 – Chủ nhật'
);
