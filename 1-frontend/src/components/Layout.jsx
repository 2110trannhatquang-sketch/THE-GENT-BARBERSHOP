import { useEffect, useState } from "react";
import {
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  Scissors,
  LayoutDashboard,
  ShoppingBag,
  CalendarDays,
  ChartNoAxesCombined,
  Settings,
  Menu,
  LogOut,
  ExternalLink
} from "lucide-react";

import { getShopSettings } from "../store";

const navItems = [
  { to: "/admin", label: "1. Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/orders", label: "2. Đơn hàng", icon: ShoppingBag },
  { to: "/appointments", label: "3. Lịch cắt tóc", icon: CalendarDays },
  { to: "/revenue", label: "4. Doanh thu", icon: ChartNoAxesCombined },
  { to: "/settings", label: "5. Cài đặt", icon: Settings }
];

const titles = {
  "/admin": ["Tổng quan", "Theo dõi nhanh doanh thu, đơn hàng và lịch cắt tóc"],
  "/orders": ["Quản lý đơn hàng", "Duyệt đơn đặt online và bán sản phẩm tại cửa tiệm"],
  "/appointments": ["Lịch cắt tóc", "Quản lý lịch hẹn phân theo từng thợ cắt"],
  "/revenue": ["Doanh thu", "Thống kê doanh thu cắt tóc và bán sản phẩm"],
  "/settings": ["Cài đặt cửa hàng", "Cập nhật tên, địa chỉ, hotline và giờ mở cửa"]
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopSettings, setShopSettings] = useState(getShopSettings);

  useEffect(() => {
    const sync = () => setShopSettings(getShopSettings());
    window.addEventListener("storage", sync);
    window.addEventListener("gent-settings-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("gent-settings-updated", sync);
    };
  }, []);

  const token = localStorage.getItem("salon_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  let currentUser = { full_name: "Quản trị viên", role: "OWNER" };
  try {
    const saved = JSON.parse(localStorage.getItem("salon_user") || "{}");
    if (saved && (saved.full_name || saved.username)) {
      currentUser = saved;
    }
  } catch {
    // ignore parse error
  }

  const current = titles[location.pathname] || [
    "Quản trị",
    shopSettings.shopName
  ];

  const handleLogout = () => {
    localStorage.removeItem("salon_token");
    localStorage.removeItem("salon_user");
    navigate("/", { replace: true });
  };

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          type="button"
          className="mobile-scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Đóng menu"
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Scissors size={22} />
          </div>

          <div>
            <strong>THE GENT</strong>
            <small>ADMIN PANEL</small>
          </div>
        </div>

        <div className="sidebar-label">QUẢN LÝ CỬA HÀNG</div>

        <nav className="side-nav">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="shop-card">
            <span className="online-dot" />
            {shopSettings.shopName}
            <small>{shopSettings.openingHours}</small>
            <small style={{ marginTop: 4 }}>{shopSettings.address}</small>
          </div>

          <div className="profile-mini">
            <div className="avatar avatar-gold">
              {(currentUser.full_name || currentUser.username || "A")[0].toUpperCase()}
            </div>

            <div>
              <b>{currentUser.full_name || currentUser.username || "Quản trị viên"}</b>
              <small>{currentUser.role || "OWNER"}</small>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="logout-button"
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Mở menu"
          >
            <Menu />
          </button>

          <div className="breadcrumb">
            Admin <span>/</span> <b>{current[0]}</b>
          </div>

          <div className="top-actions">
            <button
              type="button"
              className="button button-outline small"
              onClick={() => navigate("/")}
            >
              <ExternalLink size={14} />
              Xem trang chủ
            </button>

            <div className="top-user">
              <div className="avatar">
                {(currentUser.full_name || currentUser.username || "A")[0].toUpperCase()}
              </div>
              <div>
                <b>{currentUser.full_name || currentUser.username || "Quản trị viên"}</b>
                <small>{shopSettings.phone}</small>
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <h1>{current[0]}</h1>
              <p>{current[1]}</p>
            </div>
            <div className="date-chip">
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
              })}
            </div>
          </div>

          <Outlet />
        </div>
      </main>
    </div>
  );
}
