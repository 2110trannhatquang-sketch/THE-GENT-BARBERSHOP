
import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { formatMoney } from "../data";

const API_URL = "http://localhost:5000/api/invoices";
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("salon_token")}`
});
const WEEK_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// Chuyển ngày từ API thành ngày địa phương
function parseInvoiceDate(value) {
  if (!value) return null;

  const text = String(value).trim();

  // YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss
  const isoDate = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (isoDate) {
    const [, year, month, day] = isoDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // DD/MM/YYYY
  const vnDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);

  if (vnDate) {
    const [, day, month, year] = vnDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Ưu tiên ngày thanh toán, nếu chưa có thì dùng ngày tạo
function getInvoiceDate(invoice) {
  return (
    parseInvoiceDate(invoice.paid_at) ||
    parseInvoiceDate(invoice.created_at)
  );
}

function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function Reports() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Lấy hóa đơn trực tiếp từ MySQL thông qua Backend
  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
  headers: getAuthHeaders()
});
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể tải dữ liệu báo cáo"
        );
      }

      setInvoices(result.data || []);
    } catch (err) {
      console.error("Lỗi tải báo cáo:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Chỉ tính hóa đơn đã thanh toán
  const paidInvoices = useMemo(
    () => invoices.filter(invoice => invoice.status === "PAID"),
    [invoices]
  );

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Hóa đơn đã thanh toán trong tháng hiện tại
  const monthlyInvoices = paidInvoices.filter(invoice => {
    const date = getInvoiceDate(invoice);

    return (
      date &&
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  // Tổng doanh thu tháng
  const monthlyRevenue = monthlyInvoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.total_amount || 0),
    0
  );

  // Tổng lượt phục vụ
  const totalVisits = monthlyInvoices.length;

  // Giá trị trung bình
  const averageValue =
    totalVisits > 0 ? monthlyRevenue / totalVisits : 0;

  // Biểu đồ doanh thu tuần hiện tại
  const chartData = useMemo(() => {
    const today = new Date();
    const day = today.getDay();

    const monday = new Date(today);

    monday.setDate(
      today.getDate() - (day === 0 ? 6 : day - 1)
    );

    monday.setHours(0, 0, 0, 0);

    return WEEK_DAYS.map((name, index) => {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + index);

      const targetKey = getDateKey(targetDate);

      const value = paidInvoices
        .filter(invoice => {
          const date = getInvoiceDate(invoice);
          return date && getDateKey(date) === targetKey;
        })
        .reduce(
          (sum, invoice) =>
            sum + Number(invoice.total_amount || 0),
          0
        );

      return { name, value };
    });
  }, [paidInvoices]);

  return (
    <>
      {error && (
        <div className="empty-state">
          {error}
          <button
            className="button button-outline small"
            onClick={loadInvoices}
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="stats-grid report-stats">
        <div className="stat-card">
          <span>Doanh thu tháng này</span>
          <strong>
            {loading ? "..." : formatMoney(monthlyRevenue)}
          </strong>
          <small>Chỉ tính hóa đơn đã thanh toán</small>
        </div>

        <div className="stat-card">
          <span>Tổng lượt phục vụ</span>
          <strong>{loading ? "..." : totalVisits}</strong>
          <small>Số hóa đơn đã thanh toán trong tháng</small>
        </div>

        <div className="stat-card">
          <span>Giá trị trung bình</span>
          <strong>
           {loading ? "..." : formatMoney(Math.round(averageValue))}
          </strong>
          <small>Trên mỗi hóa đơn đã thanh toán</small>
        </div>
      </div>

      <div className="panel chart-panel report-chart">
        <div className="panel-heading">
          <div>
            <h3>Doanh thu theo ngày</h3>
            <p>Doanh thu thực tế trong tuần hiện tại</p>
          </div>

          <button
            className="button button-outline small"
            onClick={loadInvoices}
            disabled={loading}
          >
            Tải lại
          </button>
        </div>

        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 15,
                right: 15,
                left: 0,
                bottom: 0
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#eeeae3"
              />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={value =>
                  `${value / 1000000}tr`
                }
              />

              <Tooltip
                formatter={value => formatMoney(value)}
              />

              <Bar
                dataKey="value"
                fill="#b28b4e"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel quick-panel">
        <h3>Ghi chú báo cáo</h3>
        <p>
          Báo cáo lấy dữ liệu trực tiếp từ MySQL thông qua Backend.
          Chỉ tổng hợp hóa đơn đã thanh toán (PAID).
          Doanh thu được tính theo ngày thanh toán nếu có,
          nếu chưa có thì sử dụng ngày tạo hóa đơn.
          Dữ liệu sử dụng múi giờ địa phương Việt Nam.
        </p>
      </div>
    </>
  );
}
