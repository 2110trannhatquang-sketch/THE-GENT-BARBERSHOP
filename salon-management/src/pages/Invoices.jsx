
import { useState, useEffect } from "react";
import { Search, Wallet, CreditCard } from "lucide-react";
import { formatMoney } from "../data";
import StatusBadge from "../components/StatusBadge";

const API_URL = "http://localhost:5000/api/invoices";
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("salon_token")}`
});
export default function Invoices() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Định dạng ngày
  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("vi-VN");
  };

  // Lấy danh sách hóa đơn từ MySQL
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
          result.message || "Không thể tải danh sách hóa đơn"
        );
      }

     setItems(
  (result.data || []).map(invoice => ({
    db_id: invoice.id,
    id: invoice.invoice_code,
    customer: invoice.customer_name,
    amount: Number(invoice.total_amount || 0),
    status: invoice.status,
    method: invoice.payment_method,
    date: invoice.created_at,
    paidAt: invoice.paid_at
  }))
);

    } catch (error) {
      console.error("Lỗi tải hóa đơn:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Ghi nhận thanh toán
  const pay = async (invoice, method) => {
    const confirmed = window.confirm(
      `Xác nhận hóa đơn ${invoice.id} đã thanh toán bằng ${method}?`
    );

    if (!confirmed) return;

    try {
      const paymentMethod =
        method === "Tiền mặt" ? "CASH" : "BANK_TRANSFER";

      const response = await fetch(
        `${API_URL}/${invoice.db_id}/pay`,
        {
          method: "PATCH",
          headers: {
  "Content-Type": "application/json",
  ...getAuthHeaders()
},
          body: JSON.stringify({
            method: paymentMethod
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể thanh toán hóa đơn"
        );
      }

      await loadInvoices();

      alert("Thanh toán hóa đơn thành công!");

    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      alert(error.message);
    }
  };

  // Tìm kiếm hóa đơn
  const filtered = items.filter(x =>
    `${x.id} ${x.customer}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  // Thống kê
  const paidCount = items.filter(
    x => x.status === "PAID"
  ).length;

  const unpaidCount = items.filter(
    x => x.status === "UNPAID"
  ).length;

  const totalPaid = items
    .filter(x => x.status === "PAID")
    .reduce(
      (sum, x) => sum + Number(x.amount || 0),
      0
    );

  return (
    <>
      <div className="toolbar">
        <div className="search-field">
          <Search size={17} />

          <input
            placeholder="Tìm mã hóa đơn hoặc khách hàng..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="muted-label">
          Ghi nhận thanh toán thủ công
        </div>
      </div>

      <div className="summary-strip">
        <div>
          <Wallet />
          <span>Tổng hóa đơn</span>
          <b>{items.length}</b>
        </div>

        <div>
          <CreditCard />
          <span>Đã thanh toán</span>
          <b>{paidCount}</b>
        </div>

        <div>
          <Wallet />
          <span>Chưa thanh toán</span>
          <b>{unpaidCount}</b>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h3>Danh sách hóa đơn</h3>
            <p>Hóa đơn được tạo khi khách đặt lịch</p>
          </div>

          <button
            className="button button-outline small"
            onClick={loadInvoices}
          >
            Tải lại
          </button>
        </div>

        <div className="table-scroll">
          {loading ? (
            <div className="empty-state">
              Đang tải danh sách hóa đơn...
            </div>
          ) : error ? (
            <div className="empty-state">
              {error}
              <br />
              <button
                className="button button-outline small"
                onClick={loadInvoices}
              >
                Thử lại
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>MÃ HÓA ĐƠN</th>
                  <th>KHÁCH HÀNG</th>
                  <th>NGÀY TẠO</th>
                  <th>TỔNG TIỀN</th>
                  <th>PHƯƠNG THỨC</th>
                  <th>TRẠNG THÁI</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(x => (
                  <tr key={x.db_id}>
                    <td>
                      <b>{x.id}</b>
                    </td>

                    <td>{x.customer}</td>

                    <td>{formatDate(x.date)}</td>

                    <td>
                      <b>{formatMoney(x.amount)}</b>
                    </td>

                    <td>
                      {x.method === "CASH"
                        ? "Tiền mặt"
                        : x.method === "BANK_TRANSFER"
                          ? "Chuyển khoản"
                          : "Chưa thanh toán"}
                    </td>

                    <td>
                      <StatusBadge status={x.status} />
                    </td>

                    <td>
                      {x.status === "UNPAID" ? (
                        <div className="row-actions">
                          <button
                            className="action-btn success"
                            onClick={() => pay(x, "Tiền mặt")}
                          >
                            Tiền mặt
                          </button>

                          <button
                            className="action-btn"
                            onClick={() => pay(x, "Chuyển khoản")}
                          >
                            Chuyển khoản
                          </button>
                        </div>
                      ) : (
                        <span className="muted-label">
                          Đã ghi nhận
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        textAlign: "center",
                        padding: 24
                      }}
                    >
                      Không tìm thấy hóa đơn
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div
        className="panel"
        style={{ marginTop: 20, padding: 20 }}
      >
        <span className="muted-label">
          Tổng tiền đã thu
        </span>

        <h2>{formatMoney(totalPaid)}</h2>
      </div>
    </>
  );
}
