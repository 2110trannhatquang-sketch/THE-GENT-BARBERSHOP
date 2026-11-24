
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Services from "./pages/Services";
import Staff from "./pages/Staff";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import Booking from "./pages/Booking";
import Login from "./pages/Login";

// Trang chủ khách hàng (sẽ tạo ở bước tiếp theo)
import Home from "./pages/Home";

export default function App() {
  return (
    <Routes>
      {/* Website khách hàng */}
      <Route path="/" element={<Home />} />
      <Route path="/booking" element={<Booking />} />

      {/* Đăng nhập */}
      <Route path="/login" element={<Login />} />

      {/* Khu vực quản trị */}
      <Route element={<Layout />}>
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/services" element={<Services />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
