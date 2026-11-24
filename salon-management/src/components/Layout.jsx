
import { useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  Scissors,
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  Users,
  Contact,
  ReceiptText,
  ChartNoAxesCombined,
  Bell,
  Search,
  Menu,
  LogOut
} from "lucide-react";

const navItems = [
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/appointments", label: "Lịch hẹn", icon: CalendarDays },
  { to: "/services", label: "Dịch vụ", icon: Sparkles },
  { to: "/staff", label: "Nhân viên", icon: Users },
  { to: "/customers", label: "Khách hàng", icon: Contact },
  { to: "/invoices", label: "Hóa đơn", icon: ReceiptText },
  { to: "/reports", label: "Báo cáo", icon: ChartNoAxesCombined }
];

const titles = {
  "/admin": ["Tổng quan", "Theo dõi tình hình hoạt động cửa hàng"],
  "/appointments": ["Quản lý lịch hẹn", "Theo dõi và xử lý lịch đặt của khách hàng"],
  "/services": ["Quản lý dịch vụ", "Danh sách dịch vụ và bảng giá"],
  "/staff": ["Quản lý nhân viên", "Thông tin nhân viên và ca làm việc"],
  "/customers": ["Khách hàng", "Quản lý hồ sơ và lịch sử khách hàng"],
  "/invoices": ["Quản lý hóa đơn", "Theo dõi hóa đơn và trạng thái thanh toán"],
  "/reports": ["Báo cáo", "Phân tích hoạt động kinh doanh"]
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [email, setEmail] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("salon_user") || "{}"
      ).email || "";
    } catch {
      return "";
    }
  });

  const [emailMessage, setEmailMessage] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const current = titles[location.pathname] || [
    "Quản trị",
    "Salon Management"
  ];

  // ĐĂNG XUẤT
  const handleLogout = () => {
  localStorage.removeItem("salon_token");
  localStorage.removeItem("salon_user");

  setProfileOpen(false);
  navigate("/", { replace: true });
};

  // CẬP NHẬT EMAIL
  const handleUpdateEmail = async (e) => {
    e.preventDefault();

    setSavingEmail(true);
    setEmailMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/profile/email",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("salon_token")}`
          },
          body: JSON.stringify({ email })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Không thể cập nhật Email"
        );
      }

      const user = JSON.parse(
        localStorage.getItem("salon_user") || "{}"
      );

      user.email = result.email;

      localStorage.setItem(
        "salon_user",
        JSON.stringify(user)
      );

      setEmailMessage("Cập nhật Email thành công!");
    } catch (error) {
      setEmailMessage(
        error.message || "Có lỗi xảy ra khi cập nhật Email"
      );
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Scissors size={22} />
          </div>

          <div>
            <strong>THE GENT</strong>
            <small>SALON MANAGEMENT</small>
          </div>
        </div>

        <div className="sidebar-label">MENU CHÍNH</div>

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
            Cửa hàng đang hoạt động
            <small>08:00 – 21:00</small>
          </div>

          <div className="profile-mini">
            <div className="avatar avatar-gold">Q</div>

            <div>
              <b>Quản trị viên</b>
              <small>Owner</small>
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
            Salon <span>/</span> <b>{current[0]}</b>
          </div>

          <div className="top-actions">
            <label className="top-search">
              <Search size={17} />
              <input placeholder="Tìm kiếm..." />
            </label>

            <button
              className="icon-button notification"
              aria-label="Thông báo"
            >
              <Bell size={19} />
              <i />
            </button>

            <div
              className="top-user profile-trigger"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="avatar">Q</div>

              <div>
                <b>Quang</b>
                <small>Chủ cửa hàng</small>
              </div>
            </div>

            {profileOpen && (
              <div className="profile-dropdown">
                <h3>Thông tin tài khoản</h3>

                <form onSubmit={handleUpdateEmail}>
                  <label>Email OWNER</label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    required
                  />

                  <button type="submit" disabled={savingEmail}>
                    {savingEmail
                      ? "Đang lưu..."
                      : "Cập nhật Email"}
                  </button>

                  {emailMessage && (
                    <p>{emailMessage}</p>
                  )}
                </form>
              </div>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <section className="page-content">
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
        </section>
      </main>

      {mobileOpen && (
        <button
          className="mobile-scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Đóng menu"
        />
      )}
    </div>
  );
}
