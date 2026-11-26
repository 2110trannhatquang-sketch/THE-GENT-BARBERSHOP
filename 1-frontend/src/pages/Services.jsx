
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Clock3,
  Pencil,
  Power
} from "lucide-react";

import { formatMoney } from "../data";
import Modal from "../components/Modal";

const API_URL = "http://localhost:5000/api/services";
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("salon_token")}`
});
const blank = {
  name: "",
  price: 100000,
  duration: 30,
  description: ""
};

// Đọc phản hồi từ Backend
const readResponse = async (response) => {
  const text = await response.text();

  let result;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      `Backend không trả về JSON. Kiểm tra routes/services.js và server.js.`
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Có lỗi xảy ra");
  }

  return result;
};

export default function Services() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...blank });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lấy dịch vụ từ MySQL
  const loadServices = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL, {
  headers: getAuthHeaders()
});
      const result = await readResponse(response);

      const services = result.data.map((item) => ({
        id: item.id,
        code: item.service_code,
        name: item.service_name,
        description: item.description || "",
        price: Number(item.price),
        duration: Number(item.duration),
        active: item.status === "ACTIVE"
      }));

      setItems(services);
    } catch (error) {
      console.error("Lỗi tải dịch vụ:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Mở form thêm hoặc sửa
  const open = (item = null) => {
    setEditing(item);

    setForm(
      item
        ? {
            name: item.name,
            price: item.price,
            duration: item.duration,
            description: item.description
          }
        : { ...blank }
    );

    setModal(true);
  };

  // Thêm hoặc cập nhật dịch vụ
  const save = async (e) => {
    e.preventDefault();

    if (saving) return;

    if (
      !form.name.trim() ||
      Number(form.price) < 0 ||
      !Number.isFinite(Number(form.price)) ||
      !Number.isInteger(Number(form.duration)) ||
      Number(form.duration) < 1
    ) {
      alert("Vui lòng kiểm tra tên, giá và thời lượng dịch vụ.");
      return;
    }

    try {
      setSaving(true);

      const serviceData = {
        service_name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        duration: Number(form.duration)
      };

      let response;

      if (editing) {
        // Cập nhật dịch vụ
        response = await fetch(`${API_URL}/${editing.id}`, {
          method: "PUT",
          headers: {
  "Content-Type": "application/json",
  ...getAuthHeaders()
},
          body: JSON.stringify(serviceData)
        });
      } else {
        // Tạo mã dịch vụ mới
        const nextNumber =
          Math.max(0, ...items.map((x) => Number(x.id) || 0)) + 1;

        response = await fetch(API_URL, {
          method: "POST",
          headers: {
  "Content-Type": "application/json",
  ...getAuthHeaders()
},
          body: JSON.stringify({
            ...serviceData,
            service_code: `DV${String(nextNumber).padStart(3, "0")}`
          })
        });
      }

      const result = await readResponse(response);

      alert(result.message || "Lưu dịch vụ thành công!");

      setModal(false);
      setEditing(null);
      setForm({ ...blank });

      await loadServices();
    } catch (error) {
      console.error("Lỗi lưu dịch vụ:", error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Ẩn hoặc hiện dịch vụ
  const toggle = async (item) => {
    try {
      const newStatus = item.active ? "INACTIVE" : "ACTIVE";

      const response = await fetch(
        `${API_URL}/${item.id}/status`,
        {
          method: "PATCH",
         headers: {
  "Content-Type": "application/json",
  ...getAuthHeaders()
},
          body: JSON.stringify({
            status: newStatus
          })
        }
      );

      const result = await readResponse(response);

      alert(result.message || "Cập nhật trạng thái thành công!");

      await loadServices();
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      alert(error.message);
    }
  };

  // Tìm kiếm
  const filteredItems = items.filter((x) =>
    `${x.name} ${x.code}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <>
      <div className="toolbar">
        <div className="search-field">
          <Search size={17} />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm dịch vụ..."
          />
        </div>

        <button
          className="button button-dark"
          onClick={() => open()}
        >
          <Plus size={17} />
          Thêm dịch vụ
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          Đang tải dịch vụ...
        </div>
      ) : (
        <div className="service-grid">
          {filteredItems.map((x) => (
            <div
              className={`service-card ${
                !x.active ? "inactive-card" : ""
              }`}
              key={x.id}
            >
              <div className="service-card-top">
                <div className="service-symbol">✂</div>

                <span
                  className={`active-label ${
                    x.active ? "is-active" : ""
                  }`}
                >
                  {x.active ? "Đang hoạt động" : "Đã ẩn"}
                </span>
              </div>

              <span className="eyebrow">{x.code}</span>

              <h3>{x.name}</h3>

              <p>{x.description}</p>

              <div className="service-meta">
                <b>{formatMoney(x.price)}</b>

                <span>
                  <Clock3 size={14} />
                  {x.duration} phút
                </span>
              </div>

              <div className="service-actions">
                <button
                  className="button button-outline small"
                  onClick={() => open(x)}
                >
                  <Pencil size={14} />
                  Chỉnh sửa
                </button>

                <button
                  className="button button-ghost small"
                  onClick={() => toggle(x)}
                >
                  <Power size={14} />
                  {x.active ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="empty-state">
              Không tìm thấy dịch vụ phù hợp.
            </div>
          )}
        </div>
      )}

      {modal && (
        <Modal
          title={editing ? "Cập nhật dịch vụ" : "Thêm dịch vụ"}
          onClose={() => {
            if (!saving) setModal(false);
          }}
        >
          <form className="form-grid" onSubmit={save}>
            <label className="full-field">
              Tên dịch vụ

              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value
                  })
                }
                placeholder="Nhập tên dịch vụ"
              />
            </label>

            <label>
              Giá (VNĐ)

              <input
                type="number"
                min="0"
                required
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value
                  })
                }
              />
            </label>

            <label>
              Thời lượng (phút)

              <input
                type="number"
                min="1"
                step="1"
                required
                value={form.duration}
                onChange={(e) =>
                  setForm({
                    ...form,
                    duration: e.target.value
                  })
                }
              />
            </label>

            <label className="full-field">
              Mô tả

              <input
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value
                  })
                }
                placeholder="Mô tả dịch vụ"
              />
            </label>

            <div className="form-actions">
              <button
                type="button"
                className="button button-outline"
                disabled={saving}
                onClick={() => setModal(false)}
              >
                Hủy
              </button>

              <button
                type="submit"
                className="button button-dark"
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu dịch vụ"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
