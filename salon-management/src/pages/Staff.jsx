
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Phone,
  Clock3,
  UserRound,
  Pencil,
  Power
} from "lucide-react";

import Modal from "../components/Modal";

const API_URL = "http://localhost:5000/api/staff";
const SERVICE_URL = "http://localhost:5000/api/services";

const blank = {
  user_id: "",
  job_title: "Thợ chính",
  phone: "",
  email: "",
  specialization: "",
  commission_rate: 0,
  service_ids: []
};

export default function Staff() {
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);

  const [query, setQuery] = useState("");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...blank });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Tải danh sách nhân viên
  const loadStaff = async () => {
    try {
      const response = await fetch(API_URL, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("salon_token")}`
  }
});
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải nhân viên");
      }

      setItems(result.data || []);
    } catch (err) {
      console.error("Lỗi tải nhân viên:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách dịch vụ đang hoạt động
  const loadServices = async () => {
    try {
      const response = await fetch(SERVICE_URL, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("salon_token")}`
  }
});
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải dịch vụ");
      }

      setServices(
        (result.data || []).filter(
          service => service.status === "ACTIVE"
        )
      );
    } catch (err) {
      console.error("Lỗi tải dịch vụ:", err);
    }
  };

  // Tải tài khoản STAFF chưa liên kết
  const loadAvailableUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/available-users`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("salon_token")}`
  }
});
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể tải tài khoản nhân viên"
        );
      }

      setAvailableUsers(result.data || []);
    } catch (err) {
      console.error("Lỗi tải tài khoản:", err);
    }
  };

  useEffect(() => {
    loadStaff();
    loadServices();
    loadAvailableUsers();
  }, []);

  // Mở form thêm hoặc chỉnh sửa
  const openForm = (item = null) => {
    setError("");
    setEditing(item);

    if (item) {
      setForm({
        user_id: String(item.user_id || ""),
        job_title: item.role || "Thợ chính",
        phone: item.phone || "",
        email: item.email || "",
        specialization: item.specialization || "",
        commission_rate: item.commission_rate ?? 0,
        service_ids: (item.service_ids || []).map(Number)
      });
    } else {
      setForm({ ...blank });
    }

    setShow(true);
  };

  // Cập nhật dữ liệu form
  const updateForm = (field, value) => {
    setForm(old => ({
      ...old,
      [field]: value
    }));
  };

  // Chọn hoặc bỏ chọn dịch vụ
  const toggleService = (serviceId) => {
    const id = Number(serviceId);

    setForm(old => {
      const selected = old.service_ids.includes(id);

      return {
        ...old,
        service_ids: selected
          ? old.service_ids.filter(x => x !== id)
          : [...old.service_ids, id]
      };
    });
  };

  // Lưu nhân viên
  const save = async (e) => {
    e.preventDefault();
    setError("");

    if (saving) return;

    if (!editing && !form.user_id) {
      setError("Vui lòng chọn tài khoản nhân viên.");
      return;
    }

    if (!form.job_title.trim()) {
      setError("Vui lòng chọn chức danh.");
      return;
    }

    const commission = Number(form.commission_rate);

    if (
      !Number.isFinite(commission) ||
      commission < 0 ||
      commission > 100
    ) {
      setError("Hoa hồng phải từ 0 đến 100.");
      return;
    }

    const payload = {
  ...(editing ? {} : { user_id: Number(form.user_id) }),
  job_title: form.job_title.trim(),
  phone: form.phone.trim(),
  email: form.email.trim(),
  specialization: form.specialization.trim(),
  commission_rate: commission,
  service_ids: form.service_ids.map(Number)
};

    try {
      setSaving(true);

      const response = await fetch(
        editing ? `${API_URL}/${editing.id}` : API_URL,
        {
          method: editing ? "PUT" : "POST",
          headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("salon_token")}`
},
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể lưu nhân viên");
      }

      setShow(false);
      setEditing(null);
      setForm({ ...blank });

      await Promise.all([
        loadStaff(),
        loadAvailableUsers()
      ]);
    } catch (err) {
      console.error("Lỗi lưu nhân viên:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Cho nhân viên nghỉ hoặc đi làm lại
  const toggleStatus = async (item) => {
    const nextStatus =
      item.status === "Đang làm" ? "INACTIVE" : "ACTIVE";

    const message =
      nextStatus === "INACTIVE"
        ? `Bạn muốn cho ${item.name} nghỉ làm?`
        : `Bạn muốn cho ${item.name} đi làm lại?`;

    if (!window.confirm(message)) return;

    try {
      const response = await fetch(
        `${API_URL}/${item.id}/status`,
        {
          method: "PATCH",
         headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("salon_token")}`
},
          body: JSON.stringify({ status: nextStatus })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể đổi trạng thái");
      }

      await Promise.all([
        loadStaff(),
        loadAvailableUsers()
      ]);
    } catch (err) {
      console.error("Lỗi đổi trạng thái:", err);
      alert(err.message);
    }
  };

  // Tìm kiếm nhân viên
  const filteredItems = items.filter(item =>
    [
      item.name,
      item.code,
      item.phone,
      item.role,
      item.username
    ]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <>
      <div className="toolbar">
        <div className="search-field">
          <Search size={17} />

          <input
            placeholder="Tìm nhân viên..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <button
          className="button button-dark"
          onClick={() => openForm()}
          disabled={availableUsers.length === 0}
          title={
            availableUsers.length === 0
              ? "Không còn tài khoản STAFF chưa liên kết"
              : ""
          }
        >
          <Plus size={17} />
          Thêm nhân viên
        </button>
      </div>

      {error && !show && (
        <div className="empty-state">{error}</div>
      )}

      {loading ? (
        <div className="empty-state">Đang tải nhân viên...</div>
      ) : (
        <div className="staff-grid">
          {filteredItems.map(item => (
            <div className="staff-card" key={item.id}>
              <div className="staff-avatar">
                {item.name?.split(" ").slice(-1)[0]?.charAt(0)}
              </div>

              <span
                className={`active-label ${
                  item.status === "Đang làm" ? "is-active" : ""
                }`}
              >
                {item.status}
              </span>

              <h3>{item.name}</h3>
              <p>{item.role}</p>

              <div className="staff-detail">
                <span>
                  <UserRound size={15} />
                  {item.code} · {item.username}
                </span>

                <span>
                  <Phone size={15} />
                  {item.phone || "Chưa có số điện thoại"}
                </span>

                <span>
  <UserRound size={15} />
  {item.email || "Chưa có Email"}
</span>

                <span>
                  <Clock3 size={15} />
                  {item.shift}
                </span>

                <span>
                  <UserRound size={15} />
                  {item.services}
                </span>

                <span>
                  Hoa hồng: {item.commission_rate}%
                </span>
              </div>

              <div className="service-actions">
                <button
                  className="button button-outline small"
                  onClick={() => openForm(item)}
                >
                  <Pencil size={14} />
                  Chỉnh sửa
                </button>

                <button
                  className="button button-ghost small"
                  onClick={() => toggleStatus(item)}
                >
                  <Power size={14} />
                  {item.status === "Đang làm" ? "Cho nghỉ" : "Đi làm"}
                </button>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="empty-state">
              Không tìm thấy nhân viên phù hợp.
            </div>
          )}
        </div>
      )}

      {show && (
        <Modal
          title={editing ? "Cập nhật nhân viên" : "Thêm nhân viên"}
          onClose={() => {
            if (!saving) setShow(false);
          }}
        >
          <form className="form-grid" onSubmit={save}>
            {!editing && (
              <label className="full-field">
                Tài khoản nhân viên

                <select
                  required
                  value={form.user_id}
                  onChange={e => {
                    const user = availableUsers.find(
                      x => String(x.id) === e.target.value
                    );

                    setForm(old => ({
                      ...old,
                      user_id: e.target.value,
                      phone: user?.phone || ""
                    }));
                  }}
                >
                  <option value="">
                    -- Chọn tài khoản STAFF --
                  </option>

                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} - {user.full_name}
                    </option>
                  ))}
                </select>

                {availableUsers.length === 0 && (
                  <small>
                    Không có tài khoản STAFF chưa liên kết.
                    Hãy tạo tài khoản STAFF trước.
                  </small>
                )}
              </label>
            )}

            {editing && (
              <label className="full-field">
                Nhân viên
                <input
                  value={`${editing.name} (${editing.code})`}
                  disabled
                />
              </label>
            )}

            <label>
              Chức danh

              <select
                value={form.job_title}
                onChange={e =>
                  updateForm("job_title", e.target.value)
                }
              >
                <option>Thợ chính</option>
                <option>Thợ phụ</option>
                <option>Lễ tân</option>
                <option>Quản lý</option>
              </select>
            </label>

            <label>
              Số điện thoại

              <input
                value={form.phone}
                onChange={e =>
                  updateForm("phone", e.target.value)
                }
                placeholder="09xx xxx xxx"
              />
            </label>
            <label className="full-field">
  Email

  <input
    type="email"
    value={form.email}
    onChange={e =>
      updateForm("email", e.target.value)
    }
    placeholder="example@gmail.com"
  />
</label>

            <label className="full-field">
              Chuyên môn

              <input
                value={form.specialization}
                onChange={e =>
                  updateForm("specialization", e.target.value)
                }
                placeholder="Ví dụ: Cắt tóc nam, Uốn và nhuộm tóc"
              />
            </label>

            {/* Danh sách dịch vụ - đã sửa lỗi label lồng nhau */}
            <div className="full-field">
              <div className="service-select-title">
                Dịch vụ có thể thực hiện
              </div>

              <div
                className="service-select-list"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginTop: "10px",
                  padding: "14px",
                  border: "1px solid #e8e3dc",
                  borderRadius: "10px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  background: "#fff"
                }}
              >
                {services.map(service => {
                  const checked = form.service_ids.includes(
                    Number(service.id)
                  );

                  return (
                    <label
                      key={service.id}
                      className="service-option"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        width: "100%",
                        cursor: "pointer",
                        padding: "7px 4px",
                        borderBottom: "1px solid #f1eee9"
                      }}
                    >
                      <span style={{ flex: 1 }}>
                        {service.service_name}
                      </span>

                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(service.id)}
                        style={{
                          width: "18px",
                          height: "18px",
                          flexShrink: 0,
                          cursor: "pointer",
                          accentColor: "#b88746"
                        }}
                      />
                    </label>
                  );
                })}

                {services.length === 0 && (
                  <small>
                    Chưa có dịch vụ đang hoạt động.
                  </small>
                )}
              </div>

              <small style={{ display: "block", marginTop: "8px" }}>
                Đã chọn {form.service_ids.length} dịch vụ.
              </small>
            </div>

            <label className="full-field">
              Tỷ lệ hoa hồng (%)

              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.commission_rate}
                onChange={e =>
                  updateForm("commission_rate", e.target.value)
                }
              />
            </label>

            {error && (
              <div className="empty-state full-field">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="button button-outline"
                disabled={saving}
                onClick={() => setShow(false)}
              >
                Hủy
              </button>

              <button
                type="submit"
                className="button button-dark"
                disabled={
                  saving ||
                  (!editing && availableUsers.length === 0)
                }
              >
                {saving
                  ? "Đang lưu..."
                  : editing
                    ? "Cập nhật"
                    : "Lưu nhân viên"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
