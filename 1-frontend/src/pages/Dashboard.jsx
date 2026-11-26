import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  CalendarDays,
  Wallet,
  Scissors,
  Clock,
  ArrowRight,
  Settings as SettingsIcon
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

import { formatMoney } from "../data";
import StatusBadge from "../components/StatusBadge";
import {
  getBarbers,
  getAppointments,
  getOrders,
  getShopSettings
} from "../store";

export default function Dashboard() {
  const [appointments] = useState(getAppointments);
  const [orders] = useState(getOrders);
  const [settings] = useState(getShopSettings);
  const [barbers] = useState(getBarbers);

  const stats = useMemo(() => {
    const serviceRevenue = appointments
      .filter((a) => a.status === "COMPLETED")
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);

    const productRevenue = orders
      .filter((o) => o.status === "COMPLETED")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
    const activeAppointments = appointments.filter((a) =>
      ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(a.status)
    ).length;

    return {
      totalRevenue: serviceRevenue + productRevenue,
      serviceRevenue,
      productRevenue,
      pendingOrders,
      totalOrders: orders.length,
      activeAppointments,
      totalAppointments: appointments.length
    };
  }, [appointments, orders]);

  const barberSummary = useMemo(() => {
    return barbers.map((barber) => {
      const list = appointments.filter((a) => a.staff === barber.name);
      const completed = list.filter((a) => a.status === "COMPLETED").length;
      const upcoming = list.filter((a) =>
        ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(a.status)
      ).length;
      return {
        ...barber,
        total: list.length,
        completed,
        upcoming
      };
    });
  }, [appointments, barbers]);

  const chartData = [
    { name: "Cắt tóc (Dịch vụ)", value: stats.serviceRevenue },
    {
      name: "Đơn Online",
      value: orders
        .filter((o) => o.channel === "ONLINE" && o.status === "COMPLETED")
        .reduce((s, o) => s + Number(o.total || 0), 0)
    },
    {
      name: "Mua tại tiệm",
      value: orders
        .filter((o) => o.channel === "IN_STORE" && o.status === "COMPLETED")
        .reduce((s, o) => s + Number(o.total || 0), 0)
    }
  ];

  const upcomingAppointments = appointments
    .filter((a) => ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(a.status))
    .slice(0, 5);

  return (
    <>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <span className="eyebrow">TỔNG QUAN HỆ THỐNG</span>
          <h2>{settings.shopName}</h2>
          <p>
            Địa chỉ: {settings.address} · Giờ mở cửa: {settings.openingHours}
          </p>
        </div>

        <Link to="/settings" className="button button-light">
          <SettingsIcon size={15} />
          Chỉnh sửa thông tin shop
        </Link>
      </div>

      {/* 4 KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon gold">
            <Wallet size={19} />
          </div>
          <span>Tổng doanh thu (Mục 4)</span>
          <strong>{formatMoney(stats.totalRevenue)}</strong>
          <small>
            Dịch vụ: {formatMoney(stats.serviceRevenue)} · SP:{" "}
            {formatMoney(stats.productRevenue)}
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <ShoppingBag size={19} />
          </div>
          <span>Đơn hàng chờ duyệt (Mục 2)</span>
          <strong>{stats.pendingOrders} đơn</strong>
          <small>Tổng {stats.totalOrders} đơn (Online & Tại tiệm)</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CalendarDays size={19} />
          </div>
          <span>Lịch cắt đang chờ / thực hiện (Mục 3)</span>
          <strong>{stats.activeAppointments} lịch</strong>
          <small>Tổng {stats.totalAppointments} lịch hẹn</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Scissors size={19} />
          </div>
          <span>Đội ngũ thợ cắt</span>
          <strong>{barbers.length} thợ</strong>
          <small>Phân công trực tiếp theo từng lịch</small>
        </div>
      </div>

      {/* Chart + Barber Schedule Preview */}
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Cơ cấu doanh thu</h3>
              <p>Tổng hợp từ lịch cắt tóc và đơn hàng sản phẩm</p>
            </div>
            <Link to="/revenue" className="text-link">
              Xem chi tiết <ArrowRight size={13} style={{ verticalAlign: "middle" }} />
            </Link>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#efede8" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Bar dataKey="value" fill="#b28b4e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Lịch cắt tóc sắp tới</h3>
              <p>Phân công theo thợ cắt</p>
            </div>
            <Link to="/appointments" className="text-link">
              Quản lý lịch →
            </Link>
          </div>

          <div className="mini-appointments">
            {upcomingAppointments.length === 0 ? (
              <div className="empty-state">Chưa có lịch hẹn sắp tới.</div>
            ) : (
              upcomingAppointments.map((item) => (
                <div className="mini-appointment" key={item.id}>
                  <div className="time-box">
                    <b>{item.time}</b>
                    <Clock size={12} />
                  </div>
                  <div className="mini-info">
                    <b>
                      {item.customer} — {item.service}
                    </b>
                    <small>
                      Thợ cắt: {item.staff} · {item.date}
                    </small>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Barber breakdown */}
      <div className="panel" style={{ marginBottom: 17 }}>
        <div className="panel-heading" style={{ marginBottom: 14 }}>
          <div>
            <h3>Phân công theo từng thợ cắt</h3>
            <p>Số lượng khách của từng thợ trong danh sách lịch cắt</p>
          </div>
          <Link to="/appointments" className="text-link">
            Xem lịch theo thợ →
          </Link>
        </div>

        <div className="summary-strip" style={{ marginBottom: 0 }}>
          {barberSummary.map((b) => (
            <div key={b.id}>
              <Scissors />
              <span>
                <b style={{ fontSize: 12, display: "block", color: "#242321" }}>
                  {b.name}
                </b>
                <small style={{ color: "#858179" }}>
                  Đang chờ: {b.upcoming} · Đã xong: {b.completed}
                </small>
              </span>
              <b>{b.total} lịch</b>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Panel */}
      <div className="panel quick-panel">
        <div>
          <h3>Truy cập nhanh</h3>
          <p>Đi thẳng đến các mục quản lý chính</p>
        </div>

        <div className="quick-links">
          <Link to="/orders">
            <ShoppingBag /> Duyệt đơn hàng ({stats.pendingOrders} chờ)
          </Link>
          <Link to="/appointments">
            <CalendarDays /> Lịch cắt tóc theo thợ
          </Link>
          <Link to="/revenue">
            <Wallet /> Báo cáo doanh thu
          </Link>
          <Link to="/settings">
            <SettingsIcon /> Cài đặt cửa hàng
          </Link>
        </div>
      </div>
    </>
  );
}
