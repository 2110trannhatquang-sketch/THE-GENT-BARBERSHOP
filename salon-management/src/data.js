export const initialAppointments = [
  { id: "AP001", customer: "Nguyễn Minh Anh", phone: "0901 234 567", service: "Cắt tóc nam", staff: "Trần Quốc Huy", date: "2026-11-19", time: "09:00", status: "CONFIRMED", amount: 120000 },
  { id: "AP002", customer: "Lê Hoàng Nam", phone: "0912 345 678", service: "Cắt + gội", staff: "Phạm Đức Long", date: "2026-11-19", time: "10:00", status: "PENDING", amount: 180000 },
  { id: "AP003", customer: "Phạm Gia Bảo", phone: "0987 654 321", service: "Uốn tóc", staff: "Trần Quốc Huy", date: "2026-11-19", time: "13:30", status: "IN_PROGRESS", amount: 450000 },
  { id: "AP004", customer: "Võ Thanh Tùng", phone: "0933 222 111", service: "Nhuộm tóc", staff: "Nguyễn Thành Đạt", date: "2026-11-19", time: "15:00", status: "COMPLETED", amount: 550000 },
  { id: "AP005", customer: "Đặng Nhật Minh", phone: "0908 111 222", service: "Cắt tóc nam", staff: "Phạm Đức Long", date: "2026-11-20", time: "09:30", status: "PENDING", amount: 120000 }
];

export const initialServices = [
  { id: 1, name: "Cắt tóc nam", category: "Cắt tóc", price: 120000, duration: 30, active: true, description: "Tư vấn và tạo kiểu tóc nam." },
  { id: 2, name: "Cắt + gội", category: "Combo", price: 180000, duration: 45, active: true, description: "Cắt tóc kết hợp gội và massage." },
  { id: 3, name: "Uốn tóc", category: "Tạo kiểu", price: 450000, duration: 120, active: true, description: "Tạo kiểu uốn theo yêu cầu." },
  { id: 4, name: "Nhuộm tóc", category: "Nhuộm", price: 550000, duration: 120, active: true, description: "Nhuộm màu thời trang." },
  { id: 5, name: "Gội đầu thư giãn", category: "Chăm sóc", price: 80000, duration: 25, active: false, description: "Gội đầu và massage thư giãn." }
];

export const initialStaff = [
  { id: "NV001", name: "Trần Quốc Huy", role: "Thợ chính", phone: "0905 111 222", services: "Cắt tóc, Uốn tóc", shift: "08:00–17:00", status: "Đang làm" },
  { id: "NV002", name: "Phạm Đức Long", role: "Thợ chính", phone: "0905 333 444", services: "Cắt tóc, Gội đầu", shift: "09:00–18:00", status: "Đang làm" },
  { id: "NV003", name: "Nguyễn Thành Đạt", role: "Thợ phụ", phone: "0905 555 666", services: "Nhuộm, Cắt tóc", shift: "12:00–21:00", status: "Đang làm" }
];

export const initialCustomers = [
  { id: "KH001", name: "Nguyễn Minh Anh", phone: "0901 234 567", email: "minhanh@gmail.com", visits: 8, spent: 1260000 },
  { id: "KH002", name: "Lê Hoàng Nam", phone: "0912 345 678", email: "hoangnam@gmail.com", visits: 4, spent: 620000 },
  { id: "KH003", name: "Phạm Gia Bảo", phone: "0987 654 321", email: "giabao@gmail.com", visits: 12, spent: 3480000 },
  { id: "KH004", name: "Võ Thanh Tùng", phone: "0933 222 111", email: "thanhtung@gmail.com", visits: 2, spent: 550000 }
];

export const initialInvoices = [
  { id: "HD001", customer: "Nguyễn Minh Anh", date: "19/11/2026", amount: 120000, method: "Chuyển khoản", status: "PAID" },
  { id: "HD002", customer: "Lê Hoàng Nam", date: "19/11/2026", amount: 180000, method: "Chưa thanh toán", status: "UNPAID" },
  { id: "HD003", customer: "Võ Thanh Tùng", date: "19/11/2026", amount: 550000, method: "Tiền mặt", status: "PAID" }
];

export const formatMoney = (value) => new Intl.NumberFormat("vi-VN").format(value) + " ₫";
