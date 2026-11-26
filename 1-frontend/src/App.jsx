import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Appointments from "./pages/Appointments";
import Revenue from "./pages/Revenue";
import Settings from "./pages/Settings";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Home from "./pages/Home";

export default function App() {
  return (
    <Routes>
      {/* Trang chủ & Đặt lịch khách hàng */}
      <Route path="/" element={<Home />} />
      <Route path="/booking" element={<Booking />} />

      {/* Đăng nhập Admin */}
      <Route path="/login" element={<Login />} />

      {/* Khu vực Quản trị đơn giản 5 mục */}
      <Route element={<Layout />}>
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/revenue" element={<Revenue />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
