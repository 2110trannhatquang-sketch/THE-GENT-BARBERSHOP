
import { useEffect, useState } from "react";
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  Pencil,
  Trash2
} from "lucide-react";

import { formatMoney } from "../data";

import Modal from "../components/Modal";

const blank = {
  name: "",
  phone: "",
  email: "",
  gender: "",
  date_of_birth: "",
  address: "",
  note: "",
};

export default function Customers() {

 // Danh sách khách hàng lấy từ MySQL
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const API_URL = "http://localhost:5000/api/customers";
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("salon_token")}`
});
// Tải danh sách khách hàng từ MySQL
const loadCustomers = async () => {
  try {
    setLoading(true);
    setError("");

    const response = await fetch(API_URL, {
  headers: getAuthHeaders()
});
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không thể tải khách hàng");
    }

    setItems(result.data || []);
  } catch (error) {
    console.error("Lỗi tải khách hàng:", error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

// Tự động tải khi mở trang
useEffect(() => {
  loadCustomers();
}, []);

  const [query, setQuery] = useState("");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...blank });

  // Mở form
  const openForm = (item = null) => {
    setEditing(item);
    setForm(item ? { ...item } : { ...blank });
    setShow(true);
  };

  // Thêm hoặc cập nhật khách hàng
  const save = async (e) => {
  e.preventDefault();

  const customerData = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    gender: form.gender || "",
    date_of_birth: form.date_of_birth || "",
    address: form.address || "",
    note: form.note || ""
  };

  try {
    const url = editing
      ? `${API_URL}/${editing.db_id}`
      : API_URL;

    const response = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: {
  "Content-Type": "application/json",
  ...getAuthHeaders()
},
      body: JSON.stringify(customerData)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không thể lưu khách hàng");
    }

    await loadCustomers();

    setShow(false);
    setEditing(null);
    setForm({ ...blank });

    alert(result.message);
  } catch (error) {
    console.error("Lỗi lưu khách hàng:", error);
    alert(error.message);
  }
};

// Xóa khách hàng
const deleteCustomer = async (customer) => {
  const confirmed = window.confirm(
    `Bạn có chắc muốn xóa khách hàng ${customer.name} (${customer.id}) không?`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_URL}/${customer.db_id}`,
      {
  method: "DELETE",
  headers: getAuthHeaders()
}
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không thể xóa khách hàng");
    }

    await loadCustomers();

    alert(result.message);
  } catch (error) {
    console.error("Lỗi xóa khách hàng:", error);
    alert(error.message);
  }
};

  // Tìm kiếm
  const filteredItems = items.filter(x =>
    `${x.name} ${x.phone} ${x.email} ${x.id}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <>
      {/* Thanh công cụ */}
      <div className="toolbar">

        <div className="search-field">
          <Search size={17} />

          <input
            placeholder="Tìm tên hoặc số điện thoại..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="muted-label">
          <UserPlus size={16} />
          {items.length} khách hàng
        </div>

        <button
          className="button button-dark"
          onClick={() => openForm()}
        >
          <UserPlus size={17} />
          Thêm khách hàng
        </button>

      </div>

      {/* Danh sách khách hàng */}
      <div className="panel table-panel">

        <div className="panel-heading">
          <div>
            <h3>Danh sách khách hàng</h3>
            <p>Thông tin và lịch sử sử dụng dịch vụ</p>
          </div>

          <span className="muted-label">
            {filteredItems.length} kết quả
          </span>
        </div>

        <div className="table-scroll">
{loading && (
  <div className="empty-state">
    Đang tải danh sách khách hàng...
  </div>
)}

{error && (
  <div className="empty-state">
    Lỗi: {error}
    <button
      className="button button-outline small"
      onClick={loadCustomers}
    >
      Thử lại
    </button>
  </div>
)}
          <table>
            <thead>
              <tr>
                <th>MÃ KHÁCH</th>
                <th>HỌ VÀ TÊN</th>
                <th>LIÊN HỆ</th>
                <th>SỐ LƯỢT ĐẾN</th>
                <th>TỔNG CHI TIÊU</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.map(x => (
                <tr key={x.id}>

                  <td>
                    <b>{x.id}</b>
                  </td>

                  <td>
                    <b>{x.name}</b>
                  </td>

                  <td>
                    <span className="contact-line">
                      <Phone size={14} />
                      {x.phone}
                    </span>

                    <small className="contact-line">
                      <Mail size={14} />
                      {x.email || "Chưa có email"}
                    </small>
                  </td>

                  <td>{x.visits} lượt</td>

                  <td>
                    <b>{formatMoney(x.spent)}</b>
                  </td>

                  <td>
  <div style={{ display: "flex", gap: "8px" }}>
    <button
      className="button button-outline small"
      onClick={() => openForm(x)}
    >
      <Pencil size={14} />
      Chỉnh sửa
    </button>

    <button
      className="button button-outline small"
      style={{ color: "#dc2626" }}
      onClick={() => deleteCustomer(x)}
    >
      <Trash2 size={14} />
      Xóa
    </button>
  </div>
</td>

                </tr>
              ))}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="empty-state">
              Không tìm thấy khách hàng.
            </div>
          )}

        </div>
      </div>

      {/* Form khách hàng */}
      {show && (
        <Modal
          title={editing ? "Cập nhật khách hàng" : "Thêm khách hàng"}
          onClose={() => setShow(false)}
        >

          <form className="form-grid" onSubmit={save}>

            <label className="full-field">
              Họ và tên

              <input
                required
                value={form.name}
                onChange={e =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="Nhập họ tên khách hàng"
              />
            </label>

            <label>
              Số điện thoại

              <input
                required
                value={form.phone}
                onChange={e =>
                  setForm({ ...form, phone: e.target.value })
                }
                placeholder="09xx xxx xxx"
              />
            </label>

          <label>
  Email

  <input
    type="email"
    value={form.email}
    onChange={e =>
      setForm({ ...form, email: e.target.value })
    }
    placeholder="example@gmail.com"
  />
</label>

<label>
  Giới tính

  <select
    value={form.gender}
    onChange={e =>
      setForm({ ...form, gender: e.target.value })
    }
  >
    <option value="">Chọn giới tính</option>
    <option value="MALE">Nam</option>
    <option value="FEMALE">Nữ</option>
    <option value="OTHER">Khác</option>
  </select>
</label>

<label>
  Ngày sinh

  <input
    type="date"
    value={form.date_of_birth}
    onChange={e =>
      setForm({ ...form, date_of_birth: e.target.value })
    }
  />
</label>

<label className="full-field">
  Địa chỉ

  <input
    value={form.address}
    onChange={e =>
      setForm({ ...form, address: e.target.value })
    }
    placeholder="Nhập địa chỉ"
  />
</label>

<label className="full-field">
  Ghi chú

  <textarea
    value={form.note}
    onChange={e =>
      setForm({ ...form, note: e.target.value })
    }
    placeholder="Nhập ghi chú"
  />
</label>

          
            <div className="form-actions">

              <button
                type="button"
                className="button button-outline"
                onClick={() => setShow(false)}
              >
                Hủy
              </button>

              <button
                type="submit"
                className="button button-dark"
              >
                {editing ? "Cập nhật" : "Lưu khách hàng"}
              </button>

            </div>

          </form>

        </Modal>
      )}

    </>
  );
}
