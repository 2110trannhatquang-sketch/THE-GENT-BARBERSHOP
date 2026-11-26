import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scissors, LockKeyhole, User } from "lucide-react";

const API = "http://localhost:5000/api";

const LOCAL_ADMIN_ACCOUNTS = [
  { username: "admin", password: "123456", full_name: "Quản trị viên", role: "OWNER", email: "admin@thegentbarber.vn" },
  { username: "owner", password: "123456", full_name: "Chủ tiệm The Gent", role: "OWNER", email: "owner@thegentbarber.vn" }
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setMessage("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      // Thử đăng nhập qua backend nếu có MySQL
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUser, password })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        localStorage.setItem("salon_token", result.token);
        localStorage.setItem("salon_user", JSON.stringify(result.user));
        navigate("/admin", { replace: true });
        return;
      }

      // Nếu backend trả lỗi xác thực (401/400) nhưng khớp tài khoản local demo khi chưa có DB
      const localMatch = LOCAL_ADMIN_ACCOUNTS.find(
        (acc) => acc.username === trimmedUser && acc.password === password
      );
      if (response.status >= 500 && localMatch) {
        localStorage.setItem("salon_token", "local-admin-token");
        localStorage.setItem("salon_user", JSON.stringify(localMatch));
        navigate("/admin", { replace: true });
        return;
      }

      throw new Error(result.message || "Sai tài khoản hoặc mật khẩu.");
    } catch (error) {
      const localMatch = LOCAL_ADMIN_ACCOUNTS.find(
        (acc) => acc.username === trimmedUser && acc.password === password
      );
      if (localMatch) {
        localStorage.setItem("salon_token", "local-admin-token");
        localStorage.setItem("salon_user", JSON.stringify(localMatch));
        navigate("/admin", { replace: true });
        return;
      }
      setMessage(
        error.message === "Failed to fetch"
          ? "Sai tài khoản hoặc mật khẩu."
          : error.message || "Sai tài khoản hoặc mật khẩu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <div className="brand-mark"><Scissors /></div>
          <b>THE GENT</b>
          <span>ADMIN PORTAL</span>
        </div>

        <h1>Đăng nhập Quản trị</h1>
        <p>Nhập đúng tài khoản và mật khẩu để vào trang Admin.</p>

        <form onSubmit={submit}>
          <label>
            Tên đăng nhập
            <div className="input-icon">
              <User size={17} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
              />
            </div>
          </label>

          <label>
            Mật khẩu
            <div className="input-icon">
              <LockKeyhole size={17} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
              />
            </div>
          </label>

          <button
            className="button button-dark full-field"
            disabled={loading}
          >
            {loading ? "Đang kiểm tra..." : "Đăng nhập Admin"}
          </button>

          {message && <div className="inline-notice">{message}</div>}
        </form>

        <button
          className="text-link back-home"
          onClick={() => navigate("/")}
        >
          ← Quay lại trang chủ
        </button>

        <div className="login-foot">
          <Link to="/booking">Đi đến trang đặt lịch khách hàng</Link>
        </div>
      </div>
    </div>
  );
}
