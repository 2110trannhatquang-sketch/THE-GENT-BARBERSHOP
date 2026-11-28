import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Scissors,
  Check,
  X,
  UserPlus,
  Trash2
} from "lucide-react";

import { formatMoney, initialServices } from "../data";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import {
  getBarbers,
  addBarber,
  deleteBarber,
  getAppointments,
  saveAppointments
} from "../store";

const getToday = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function Appointments() {
  const [items, setItems] = useState(getAppointments);
  const [barbers, setBarbers] = useState(getBarbers);

  const [selectedBarber, setSelectedBarber] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showBarberModal, setShowBarberModal] = useState(false);

  const activeServices = initialServices.filter((s) => s.active !== false);

  const [form, setForm] = useState({
    customer: "",
    phone: "",
    service: activeServices[0]?.name || "Cắt tóc nam",
    staff: barbers[0]?.name || "",
    date: getToday(),
    time: "09:00"
  });

  const [barberForm, setBarberForm] = useState({
    name: "",
    role: "Thợ chính",
    specialty: "Cắt & Tạo kiểu"
  });

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchBarber =
        selectedBarber === "ALL" || item.staff === selectedBarber;
      const matchStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      const matchQuery = `${item.id} ${item.customer} ${item.phone} ${item.staff}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchBarber && matchStatus && matchQuery;
    });
  }, [items, selectedBarber, statusFilter, query]);

  const updateStatus = (id, status) => {
    const next = items.map((item) =>
      item.id === id ? { ...item, status } : item
    );
    setItems(next);
    saveAppointments(next);
  };

  const toMinutes = (hhmm) => {
    if (!hhmm || !hhmm.includes(":")) return 0;
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };

  const findBarberConflict = (staffName, date, slotTime, duration) => {
    if (!staffName || !date || !slotTime) return null;
    const newStart = toMinutes(slotTime);
    const newEnd = newStart + duration;
    return items.find((item) => {
      if (
        item.staff !== staffName ||
        item.date !== date ||
        item.status === "CANCELLED"
      ) {
        return false;
      }
      const oldStart = toMinutes(item.time);
      const oldDuration = Number(
        activeServices.find((s) => s.name === item.service)?.duration || 30
      );
      const oldEnd = oldStart + oldDuration;
      return newStart < oldEnd && oldStart < newEnd;
    });
  };

  const handleAddAppointment = (e) => {
    e.preventDefault();
    if (!form.customer.trim() || !form.phone.trim()) return;

    const svc = activeServices.find((s) => s.name === form.service);
    const duration = Number(svc?.duration || 30);
    const assignedStaff = form.staff || barbers[0]?.name || "Chưa phân công";

    const conflict = findBarberConflict(assignedStaff, form.date, form.time, duration);
    if (conflict) {
      alert(
        `Thợ ${assignedStaff} đã có lịch với "${conflict.customer}" vào lúc ${conflict.time}. Vui lòng chọn giờ khác hoặc thợ khác!`
      );
      return;
    }

    const nextNum =
      items.reduce((max, item) => {
        const n = Number(String(item.id).replace("AP", ""));
        return Number.isFinite(n) ? Math.max(max, n) : max;
      }, 0) + 1;

    const newItem = {
      id: `AP${String(nextNum).padStart(3, "0")}`,
      customer: form.customer.trim(),
      phone: form.phone.trim(),
      service: form.service,
      staff: assignedStaff,
      date: form.date,
      time: form.time,
      status: "CONFIRMED",
      amount: Number(svc?.price || 120000)
    };

    const next = [newItem, ...items];
    setItems(next);
    saveAppointments(next);
    setShowModal(false);
    setForm({
      customer: "",
      phone: "",
      service: activeServices[0]?.name || "Cắt tóc nam",
      staff: barbers[0]?.name || "",
      date: getToday(),
      time: "09:00"
    });
  };

  const handleAddBarber = (e) => {
    e.preventDefault();
    if (!barberForm.name.trim()) return;
    const next = addBarber(barberForm);
    setBarbers(next);
    setBarberForm({ name: "", role: "Thợ chính", specialty: "Cắt & Tạo kiểu" });
    setShowBarberModal(false);
  };

  const handleDeleteBarber = (e, barber) => {
    e.stopPropagation();
    if (barbers.length <= 1) {
      alert("Cần giữ lại ít nhất 1 nhân viên cắt tóc.");
      return;
    }
    if (!window.confirm(`Xóa nhân viên "${barber.name}" khỏi danh sách?`)) {
      return;
    }
    const next = deleteBarber(barber.id);
    setBarbers(next);
    if (selectedBarber === barber.name) {
      setSelectedBarber("ALL");
    }
  };

  return (
    <>
      {/* Danh sách thợ cắt (lọc + thêm/xóa nhân viên) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          gap: 12,
          marginBottom: 16
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedBarber("ALL")}
          style={{
            background: selectedBarber === "ALL" ? "#242420" : "#fff",
            color: selectedBarber === "ALL" ? "#fff" : "inherit",
            border: "1px solid var(--line)",
            borderRadius: 9,
            padding: "13px 15px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            textAlign: "left"
          }}
        >
          <Scissors size={18} style={{ color: "#b28b4e" }} />
          <span style={{ flex: 1, fontSize: 12 }}>Tất cả thợ cắt</span>
          <b>{items.length}</b>
        </button>

        {barbers.map((barber) => {
          const count = items.filter((i) => i.staff === barber.name).length;
          const active = selectedBarber === barber.name;
          return (
            <div
              key={barber.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedBarber(barber.name)}
              onKeyDown={(e) =>
                e.key === "Enter" && setSelectedBarber(barber.name)
              }
              style={{
                background: active ? "#242420" : "#fff",
                color: active ? "#fff" : "inherit",
                border: "1px solid var(--line)",
                borderRadius: 9,
                padding: "13px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer"
              }}
            >
              <Scissors size={18} style={{ color: "#b28b4e", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b
                  style={{
                    display: "block",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {barber.name}
                </b>
                <small style={{ opacity: 0.75, fontSize: 10 }}>
                  {barber.role} · {count} lịch
                </small>
              </div>

              <button
                type="button"
                title={`Xóa ${barber.name}`}
                onClick={(e) => handleDeleteBarber(e, barber)}
                style={{
                  border: 0,
                  background: "transparent",
                  color: active ? "#f0a9a2" : "#b65e53",
                  padding: 4,
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setShowBarberModal(true)}
          style={{
            background: "#faf8f4",
            color: "#8e6d3d",
            border: "1px dashed #c9b086",
            borderRadius: 9,
            padding: "13px 15px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 600
          }}
        >
          <UserPlus size={16} />
          Thêm nhân viên
        </button>
      </div>

      {/* Thanh công cụ */}
      <div className="toolbar">
        <div className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm khách hàng, SĐT, mã lịch, thợ cắt..."
          />
        </div>

        <select
          className="select-control"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="IN_PROGRESS">Đang cắt</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>

        <button
          type="button"
          className="button button-dark"
          onClick={() => {
            setForm((prev) => ({
              ...prev,
              staff:
                selectedBarber !== "ALL"
                  ? selectedBarber
                  : barbers[0]?.name || ""
            }));
            setShowModal(true);
          }}
        >
          <Plus size={17} />
          Thêm lịch cắt tóc
        </button>
      </div>

      {/* Bảng lịch cắt tóc */}
      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h3>
              {selectedBarber === "ALL"
                ? "Tất cả lịch cắt tóc"
                : `Lịch cắt của thợ: ${selectedBarber}`}
            </h3>
            <p>Phân chia rõ ràng ai là người cắt cho từng khách hàng</p>
          </div>
          <span className="muted-label">{filtered.length} lịch hẹn</span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>MÃ LỊCH</th>
                <th>NGƯỜI CẮT (THỢ)</th>
                <th>KHÁCH HÀNG</th>
                <th>DỊCH VỤ</th>
                <th>NGÀY / GIỜ</th>
                <th>GIÁ DỊCH VỤ</th>
                <th>TRẠNG THÁI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <b>{item.id}</b>
                  </td>

                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 9px",
                        borderRadius: 999,
                        background: "#f6f0e5",
                        color: "#8e6d3d",
                        fontWeight: 600,
                        fontSize: 10
                      }}
                    >
                      <Scissors size={11} />
                      {item.staff}
                    </span>
                  </td>

                  <td>
                    <b>{item.customer}</b>
                    <small>{item.phone}</small>
                  </td>

                  <td>{item.service}</td>

                  <td>
                    {item.date
                      ? item.date.split("-").reverse().join("/")
                      : ""}
                    <small>{item.time}</small>
                  </td>

                  <td>
                    <b>{formatMoney(item.amount)}</b>
                  </td>

                  <td>
                    <StatusBadge status={item.status} />
                  </td>

                  <td>
                    <div className="row-actions">
                      {item.status === "PENDING" && (
                        <button
                          type="button"
                          className="action-btn success"
                          onClick={() => updateStatus(item.id, "CONFIRMED")}
                        >
                          <Check size={14} /> Xác nhận
                        </button>
                      )}

                      {item.status === "CONFIRMED" && (
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => updateStatus(item.id, "IN_PROGRESS")}
                        >
                          Bắt đầu cắt
                        </button>
                      )}

                      {item.status === "IN_PROGRESS" && (
                        <button
                          type="button"
                          className="action-btn success"
                          onClick={() => updateStatus(item.id, "COMPLETED")}
                        >
                          Hoàn thành
                        </button>
                      )}

                      {["PENDING", "CONFIRMED"].includes(item.status) && (
                        <button
                          type="button"
                          className="action-btn danger"
                          onClick={() => updateStatus(item.id, "CANCELLED")}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="empty-state">
              Không có lịch cắt tóc nào cho bộ lọc hiện tại.
            </div>
          )}
        </div>
      </div>

      {/* Modal thêm lịch cắt */}
      {showModal && (
        <Modal
          title="Thêm lịch cắt tóc & phân công thợ"
          onClose={() => setShowModal(false)}
        >
          <form className="form-grid" onSubmit={handleAddAppointment}>
            <label>
              Tên khách hàng *
              <input
                type="text"
                required
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
                placeholder="Nhập tên khách"
              />
            </label>

            <label>
              Số điện thoại *
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="09xx xxx xxx"
              />
            </label>

            <label>
              Thợ cắt tóc *
              <select
                value={form.staff}
                onChange={(e) => setForm({ ...form, staff: e.target.value })}
              >
                {barbers.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({b.role})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Dịch vụ *
              <select
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
              >
                {activeServices.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} — {formatMoney(s.price)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Ngày cắt *
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>

            <label>
              Giờ cắt (24h) *
              <select
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              >
                {[
                  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
                  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
                  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
                  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
                  "20:00", "20:30"
                ].map((slot) => {
                  const svcDuration = Number(
                    activeServices.find((s) => s.name === form.service)?.duration || 30
                  );
                  const isBusy = Boolean(
                    findBarberConflict(form.staff, form.date, slot, svcDuration)
                  );
                  return (
                    <option key={slot} value={slot} disabled={isBusy}>
                      {slot}
                      {isBusy ? " (Trùng lịch)" : ""}
                    </option>
                  );
                })}
              </select>
            </label>

            <div className="form-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setShowModal(false)}
              >
                Hủy
              </button>
              <button type="submit" className="button button-dark">
                Lưu lịch cắt
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal thêm nhân viên mới */}
      {showBarberModal && (
        <Modal
          title="Thêm nhân viên cắt tóc"
          onClose={() => setShowBarberModal(false)}
        >
          <form className="form-grid" onSubmit={handleAddBarber}>
            <label className="full-field">
              Họ và tên nhân viên *
              <input
                type="text"
                required
                value={barberForm.name}
                onChange={(e) =>
                  setBarberForm({ ...barberForm, name: e.target.value })
                }
                placeholder="Ví dụ: Lê Minh Tuấn"
              />
            </label>

            <label>
              Chức danh / Vai trò
              <input
                type="text"
                value={barberForm.role}
                onChange={(e) =>
                  setBarberForm({ ...barberForm, role: e.target.value })
                }
                placeholder="Master Barber / Thợ chính..."
              />
            </label>

            <label>
              Chuyên môn
              <input
                type="text"
                value={barberForm.specialty}
                onChange={(e) =>
                  setBarberForm({ ...barberForm, specialty: e.target.value })
                }
                placeholder="Fade, Uốn, Nhuộm..."
              />
            </label>

            <div className="form-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setShowBarberModal(false)}
              >
                Hủy
              </button>
              <button type="submit" className="button button-dark">
                Thêm nhân viên
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
