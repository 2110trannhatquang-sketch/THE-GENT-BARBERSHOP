import { useMemo, useState } from "react";
import { Wallet, Scissors, ShoppingBag, Calendar } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

import { formatMoney } from "../data";
import { getAppointments, getOrders } from "../store";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const toIsoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const formatViDate = (iso) =>
  iso ? iso.split("-").reverse().join("/") : "";

// Lấy chuỗi ISO week dạng "YYYY-Www" từ Date
const getIsoWeekValue = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

// Trả về 7 ngày (Thứ 2 -> Chủ nhật) của chuỗi "YYYY-Www"
const getDaysOfIsoWeek = (weekStr) => {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekStr || "");
  if (!match) return [];
  const year = Number(match[1]);
  const week = Number(match[2]);

  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setDate(jan4.getDate() - jan4Day + 1);

  const monday = new Date(mondayOfWeek1);
  monday.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      iso: toIsoDate(d),
      shortLabel: `${WEEKDAY_LABELS[i]} (${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
      ).padStart(2, "0")})`
    };
  });
};

export default function Revenue() {
  const [appointments] = useState(getAppointments);
  const [orders] = useState(getOrders);
  const [period, setPeriod] = useState("week"); // "week" | "month" | "year"

  const now = new Date();
  const [selectedWeek, setSelectedWeek] = useState(() => getIsoWeekValue(now));
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [selectedYear, setSelectedYear] = useState(
    now.getFullYear() === 2027 ? "2027" : "2026"
  );

  const weekDays = useMemo(() => getDaysOfIsoWeek(selectedWeek), [selectedWeek]);

  const completedAppointments = useMemo(
    () => appointments.filter((a) => a.status === "COMPLETED"),
    [appointments]
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "COMPLETED"),
    [orders]
  );

  // Chuẩn hóa danh sách giao dịch kèm ngày YYYY-MM-DD
  const allTransactions = useMemo(() => {
    const apptRows = completedAppointments.map((a) => ({
      id: a.id,
      kind: "SERVICE",
      type: "Cắt tóc",
      customer: a.customer,
      detail: `${a.service} (Thợ: ${a.staff})`,
      date: String(a.date || "").slice(0, 10),
      amount: Number(a.amount || 0)
    }));

    const orderRows = completedOrders.map((o) => ({
      id: o.id,
      kind: "PRODUCT",
      type: o.channel === "ONLINE" ? "Đơn Online" : "Mua tại tiệm",
      customer: o.customerName,
      detail: o.items.map((i) => `${i.name} × ${i.quantity}`).join(", "),
      date: String(o.createdAt || "").slice(0, 10),
      amount: Number(o.total || 0)
    }));

    return [...orderRows, ...apptRows].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [completedAppointments, completedOrders]);

  // Lọc giao dịch theo Tuần / Tháng / Năm (chính xác theo lịch 2026, 2027)
  const filteredTransactions = useMemo(() => {
    if (period === "week") {
      const weekSet = new Set(weekDays.map((d) => d.iso));
      return allTransactions.filter((t) => weekSet.has(t.date));
    }
    if (period === "month") {
      return allTransactions.filter((t) => t.date.startsWith(selectedMonth));
    }
    return allTransactions.filter((t) => t.date.startsWith(selectedYear));
  }, [allTransactions, period, weekDays, selectedMonth, selectedYear]);

  const serviceRevenue = filteredTransactions
    .filter((t) => t.kind === "SERVICE")
    .reduce((sum, t) => sum + t.amount, 0);

  const productRevenue = filteredTransactions
    .filter((t) => t.kind === "PRODUCT")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRevenue = serviceRevenue + productRevenue;

  const periodDescription = useMemo(() => {
    if (period === "week" && weekDays.length === 7) {
      return `Tuần ${selectedWeek.split("-W")[1]}/${selectedWeek.split("-W")[0]} (${formatViDate(
        weekDays[0].iso
      )} – ${formatViDate(weekDays[6].iso)})`;
    }
    if (period === "month") {
      const [y, m] = selectedMonth.split("-");
      return `Tháng ${m}/${y}`;
    }
    return `Năm ${selectedYear}`;
  }, [period, selectedWeek, weekDays, selectedMonth, selectedYear]);

  // Dữ liệu biểu đồ chính xác theo ngày trong tuần / tuần trong tháng / 12 tháng trong năm
  const chartData = useMemo(() => {
    if (period === "week") {
      return weekDays.map((day) => {
        const dayTx = filteredTransactions.filter((t) => t.date === day.iso);
        return {
          label: day.shortLabel,
          "Cắt tóc": dayTx
            .filter((t) => t.kind === "SERVICE")
            .reduce((s, t) => s + t.amount, 0),
          "Sản phẩm": dayTx
            .filter((t) => t.kind === "PRODUCT")
            .reduce((s, t) => s + t.amount, 0)
        };
      });
    }

    if (period === "month") {
      const [y, m] = selectedMonth.split("-").map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const buckets = [
        { label: "Tuần 1 (1–7)", min: 1, max: 7 },
        { label: "Tuần 2 (8–14)", min: 8, max: 14 },
        { label: "Tuần 3 (15–21)", min: 15, max: 21 },
        { label: `Tuần 4 (22–${lastDay})`, min: 22, max: lastDay }
      ];

      return buckets.map((b) => {
        const tx = filteredTransactions.filter((t) => {
          const day = Number(t.date.slice(8, 10));
          return day >= b.min && day <= b.max;
        });
        return {
          label: b.label,
          "Cắt tóc": tx
            .filter((t) => t.kind === "SERVICE")
            .reduce((s, t) => s + t.amount, 0),
          "Sản phẩm": tx
            .filter((t) => t.kind === "PRODUCT")
            .reduce((s, t) => s + t.amount, 0)
        };
      });
    }

    // Theo Năm (12 tháng của 2026 hoặc 2027)
    return Array.from({ length: 12 }, (_, idx) => {
      const monthKey = `${selectedYear}-${String(idx + 1).padStart(2, "0")}`;
      const tx = filteredTransactions.filter((t) => t.date.startsWith(monthKey));
      return {
        label: `T${idx + 1}/${selectedYear.slice(2)}`,
        "Cắt tóc": tx
          .filter((t) => t.kind === "SERVICE")
          .reduce((s, t) => s + t.amount, 0),
        "Sản phẩm": tx
          .filter((t) => t.kind === "PRODUCT")
          .reduce((s, t) => s + t.amount, 0)
      };
    });
  }, [filteredTransactions, period, weekDays, selectedMonth, selectedYear]);

  return (
    <>
      {/* Bộ lọc Tuần / Tháng / Năm (2026 - 2027) */}
      <div className="toolbar">
        <button
          type="button"
          className={`button ${period === "week" ? "button-dark" : "button-outline"}`}
          onClick={() => setPeriod("week")}
        >
          <Calendar size={15} />
          Theo Tuần
        </button>

        <button
          type="button"
          className={`button ${period === "month" ? "button-dark" : "button-outline"}`}
          onClick={() => setPeriod("month")}
        >
          <Calendar size={15} />
          Theo Tháng
        </button>

        <button
          type="button"
          className={`button ${period === "year" ? "button-dark" : "button-outline"}`}
          onClick={() => setPeriod("year")}
        >
          <Calendar size={15} />
          Theo Năm
        </button>

        {period === "week" && (
          <input
            type="week"
            className="select-control"
            min="2026-W01"
            max="2027-W52"
            value={selectedWeek}
            onChange={(e) => e.target.value && setSelectedWeek(e.target.value)}
            style={{ marginLeft: "auto" }}
          />
        )}

        {period === "month" && (
          <input
            type="month"
            className="select-control"
            min="2026-01"
            max="2027-12"
            value={selectedMonth}
            onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
            style={{ marginLeft: "auto" }}
          />
        )}

        {period === "year" && (
          <select
            className="select-control"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ marginLeft: "auto" }}
          >
            <option value="2026">Năm 2026</option>
            <option value="2027">Năm 2027</option>
          </select>
        )}
      </div>

      {/* KPI Cards */}
      <div className="stats-grid report-stats">
        <div className="stat-card">
          <div className="stat-icon gold">
            <Wallet size={19} />
          </div>
          <span>Tổng doanh thu · {periodDescription}</span>
          <strong>{formatMoney(totalRevenue)}</strong>
          <small>{filteredTransactions.length} giao dịch hoàn thành</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Scissors size={19} />
          </div>
          <span>Doanh thu cắt tóc</span>
          <strong>{formatMoney(serviceRevenue)}</strong>
          <small>
            {filteredTransactions.filter((t) => t.kind === "SERVICE").length} lượt cắt
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <ShoppingBag size={19} />
          </div>
          <span>Doanh thu bán sản phẩm</span>
          <strong>{formatMoney(productRevenue)}</strong>
          <small>
            {filteredTransactions.filter((t) => t.kind === "PRODUCT").length} đơn hàng
          </small>
        </div>
      </div>

      {/* Chart */}
      <div className="panel report-chart">
        <div className="panel-heading">
          <div>
            <h3>Biểu đồ doanh thu {periodDescription}</h3>
            <p>Tách riêng doanh thu dịch vụ cắt tóc và bán sản phẩm</p>
          </div>
          <span className="chart-total">{formatMoney(totalRevenue)}</span>
        </div>

        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#efede8" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Cắt tóc" fill="#242420" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Sản phẩm" fill="#b28b4e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bảng chi tiết */}
      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h3>Chi tiết khoản thu ({periodDescription})</h3>
            <p>Các giao dịch hoàn thành trong khoảng thời gian đã chọn</p>
          </div>
          <span className="muted-label">
            {filteredTransactions.length} khoản thu
          </span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>MÃ</th>
                <th>NGUỒN THU</th>
                <th>KHÁCH HÀNG</th>
                <th>CHI TIẾT</th>
                <th>NGÀY</th>
                <th>SỐ TIỀN</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr key={t.id}>
                  <td>
                    <b>{t.id}</b>
                  </td>
                  <td>
                    <span className="status status-completed">{t.type}</span>
                  </td>
                  <td>
                    <b>{t.customer}</b>
                  </td>
                  <td>{t.detail}</td>
                  <td>{formatViDate(t.date)}</td>
                  <td>
                    <b>{formatMoney(t.amount)}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTransactions.length === 0 && (
            <div className="empty-state">
              Chưa có giao dịch hoàn thành trong {periodDescription}.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
