
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scissors, LockKeyhole, User } from "lucide-react";

const API = "http://localhost:5000/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!username || !password) {
      setMessage("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Đăng nhập thất bại");
      }
localStorage.setItem("salon_token", result.token);
localStorage.setItem("salon_user", JSON.stringify(result.user));

console.log("Đăng nhập thành công:", result);
navigate("/admin", { replace: true });

navigate("/admin");
    } catch (error) {
      setMessage(error.message || "Không thể kết nối Backend.");
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
          <span>SALON MANAGEMENT</span>
        </div>

        <h1>Chào mừng trở lại</h1>
        <p>Đăng nhập để quản lý cửa hàng của bạn.</p>

        <form onSubmit={submit}>
          <label>Tên đăng nhập
            <div className="input-icon">
              <User size={17} />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
              />
            </div>
          </label>

          <label>Mật khẩu
            <div className="input-icon">
              <LockKeyhole size={17} />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
              />
            </div>
          </label>

          <button
            className="button button-dark full-field"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          {message && (
            <div className="inline-notice">{message}</div>
          )}
        </form>

        <button
  className="text-link back-home"
  onClick={() => navigate("/")}
>
  Quay lại trang chủ khách hàng
</button>

        <div className="login-foot">
          <Link to="/booking">Đi đến trang đặt lịch khách hàng</Link>
        </div>
      </div>
    </div>
  );
}
