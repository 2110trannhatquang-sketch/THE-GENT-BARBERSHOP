
import { useState, useEffect } from "react";
import {
  CalendarDays, Users, Wallet, Scissors,
  ArrowUpRight, Clock3, Plus
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { formatMoney } from "../data";

const API = "http://localhost:5000/api";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("salon_token")}`
});

const getDateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const todayKey = () => getDateKey(new Date());

const formatTime = (value) => {
  if (!value) return "";
  return String(value).slice(0, 5);
};

export default function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = getAuthHeaders();

const [appointmentRes, invoiceRes, customerRes, serviceRes] =
  await Promise.all([
    fetch(`${API}/appointments`, { headers }),
    fetch(`${API}/invoices`, { headers }),
    fetch(`${API}/customers`, { headers }),
    fetch(`${API}/services`, { headers })
  ]);

      const results = await Promise.all([
        appointmentRes.json(),
        invoiceRes.json(),
        customerRes.json(),
        serviceRes.json()
      ]);

      if (
        !appointmentRes.ok || !invoiceRes.ok ||
        !customerRes.ok || !serviceRes.ok ||
        results.some(result => !result.success)
      ) {
        throw new Error("Không thể tải dữ liệu Dashboard");
      }

      setAppointments(results[0].data || []);
      setInvoices(results[1].data || []);
      setCustomers(results[2].data || []);
      setServices(results[3].data || []);

    } catch (err) {
      console.error("Lỗi Dashboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const today = todayKey();

  // Lịch hẹn trong ngày
  const todayAppointments = appointments
    .filter(item => getDateKey(item.appointment_date) === today)
    .sort((a, b) =>
      String(a.start_time).localeCompare(String(b.start_time))
    );

  // Doanh thu chỉ tính hóa đơn đã thanh toán
  const paidInvoices = invoices.filter(
    invoice => invoice.status === "PAID"
  );

  const todayRevenue = paidInvoices
    .filter(invoice => getDateKey(invoice.paid_at) === today)
    .reduce(
      (sum, invoice) => sum + Number(invoice.total_amount || 0),
      0
    );

  // Biểu đồ doanh thu 7 ngày gần nhất
  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const dateKey = getDateKey(date);

    const revenue = paidInvoices
      .filter(invoice => getDateKey(invoice.paid_at) === dateKey)
      .reduce(
        (sum, invoice) => sum + Number(invoice.total_amount || 0),
        0
      );

    return {
      day: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][date.getDay()],
      revenue
    };
  });

  const weeklyRevenue = chartData.reduce(
    (sum, item) => sum + item.revenue,
    0
  );

  const activeServices = services.filter(
    service => service.status === "ACTIVE"
  ).length;

  const stats = [
    {
      label: "Doanh thu hôm nay",
      value: formatMoney(todayRevenue),
      change: "Hóa đơn đã thanh toán",
      icon: Wallet,
      tone: "gold"
    },
    {
      label: "Lịch hẹn hôm nay",
      value: todayAppointments.length,
      change: "Lượt đặt lịch",
      icon: CalendarDays,
      tone: "blue"
    },
    {
      label: "Khách hàng",
      value: customers.length,
      change: "Tổng khách hàng",
      icon: Users,
      tone: "green"
    },
    {
      label: "Dịch vụ đang hoạt động",
      value: activeServices,
      change: "Dịch vụ ACTIVE",
      icon: Scissors,
      tone: "purple"
    }
  ];

  const dateLabel = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <>
      <div className="welcome-banner">
        <div>
          <span className="eyebrow">{dateLabel.toUpperCase()}</span>
          <h2>Chào buổi chiều, Quang!</h2>
          <p>Đây là tình hình hoạt động của cửa hàng hôm nay.</p>
        </div>
        <Link to="/appointments" className="button button-light">
          <Plus size={17} /> Tạo lịch hẹn
        </Link>
      </div>

      {error && (
        <div className="empty-state">
          {error}
          <button
            className="button button-outline small"
            onClick={loadDashboard}
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="stats-grid">
        {stats.map(({ label, value, change, icon: Icon, tone }) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${tone}`}>
              <Icon size={21} />
            </div>
            <span>{label}</span>
            <strong>{loading ? "..." : value}</strong>
            <small>
              <ArrowUpRight size={14} /> {change}
            </small>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Doanh thu trong tuần</h3>
              <p>Thống kê doanh thu 7 ngày gần nhất</p>
            </div>
            <span className="chart-total">
              {loading ? "..." : formatMoney(weeklyRevenue)}
            </span>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 12, right: 10, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="revenueFill"
                    x1="0" y1="0" x2="0" y2="1"
                  >
                    <stop offset="0%" stopColor="#c7a56a" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#c7a56a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#eeeae3"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#92908b", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#92908b", fontSize: 11 }}
                  tickFormatter={v => `${v / 1000000}tr`}
                />
                <Tooltip formatter={v => formatMoney(v)} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#b28b4e"
                  strokeWidth={2.5}
                  fill="url(#revenueFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Lịch hẹn hôm nay</h3>
              <p>Các lượt khách gần nhất</p>
            </div>
            <Link className="text-link" to="/appointments">
              Xem tất cả
            </Link>
          </div>

          <div className="mini-appointments">
            {loading ? (
              <div className="empty-state">Đang tải lịch hẹn...</div>
            ) : todayAppointments.length > 0 ? (
              todayAppointments.slice(0, 4).map(item => (
                <div className="mini-appointment" key={item.id}>
                  <div className="time-box">
                    <b>{formatTime(item.start_time)}</b>
                    <Clock3 size={13} />
                  </div>
                  <div className="mini-info">
                    <b>{item.customer_name}</b>
                    <small>
                      {item.service_names} · {item.job_title}
                    </small>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))
            ) : (
              <div className="empty-state">
                Hôm nay chưa có lịch hẹn.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel quick-panel">
        <div>
          <h3>Truy cập nhanh</h3>
          <p>Các chức năng bạn thường sử dụng</p>
        </div>
        <div className="quick-links">
          <Link to="/appointments"><CalendarDays />Quản lý lịch hẹn</Link>
          <Link to="/customers"><Users />Khách hàng</Link>
          <Link to="/invoices"><Wallet />Hóa đơn</Link>
          <Link to="/services"><Scissors />Dịch vụ</Link>
        </div>
      </div>
    </>
  );
}
