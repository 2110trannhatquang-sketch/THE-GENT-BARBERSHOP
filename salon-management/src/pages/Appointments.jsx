
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  CalendarDays,
  Check,
  X,
  Clock3
} from "lucide-react";

import { formatMoney } from "../data";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";

const API_URL = "http://localhost:5000/api";
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("salon_token")}`
});

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const emptyForm = {
  customer_id: "",
  staff_id: "",
  service_id: "",
  appointment_date: getToday(),
  start_time: "09:00",
  note: ""
};

export default function Appointments() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Tải dữ liệu từ Backend
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = getAuthHeaders();

const [appointmentRes, customerRes, staffRes, serviceRes] =
  await Promise.all([
    fetch(`${API_URL}/appointments`, { headers }),
    fetch(`${API_URL}/customers`, { headers }),
    fetch(`${API_URL}/staff`, { headers }),
    fetch(`${API_URL}/services`, { headers })
  ]);

      const [
        appointmentData,
        customerData,
        staffData,
        serviceData
      ] = await Promise.all([
        appointmentRes.json(),
        customerRes.json(),
        staffRes.json(),
        serviceRes.json()
      ]);

      if (
        !appointmentRes.ok || !appointmentData.success ||
        !customerRes.ok || !customerData.success ||
        !staffRes.ok || !staffData.success ||
        !serviceRes.ok || !serviceData.success
      ) {
        throw new Error("Không thể tải dữ liệu từ máy chủ");
      }

      // Danh sách lịch hẹn
      const appointmentList = (appointmentData.data || []).map(x => ({
        id: x.appointment_code,
        db_id: x.id,
        customer_id: x.customer_id,
        customer: x.customer_name || "",
        phone: x.customer_phone || "",
        service: x.service_names || "",
        staff: x.staff_name || x.full_name || x.job_title || "",
        date: String(x.appointment_date || "").slice(0, 10),
        time: String(x.start_time || "").slice(0, 5),
        end_time: String(x.end_time || "").slice(0, 5),
        amount: Number(x.total_amount || 0),
        status: x.status,
        note: x.note || "",
        invoice_code: x.invoice_code || "",
        invoice_status: x.invoice_status || ""
      }));

      setItems(appointmentList);

      // Danh sách khách hàng
      setCustomers(customerData.data || []);

      // Danh sách nhân viên
      setStaffList(staffData.data || []);
      // Danh sách dịch vụ
      setServices(
        (serviceData.data || []).filter(
          x => x.status === "ACTIVE"
        )
      );

    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tìm kiếm và lọc
  const filtered = useMemo(() => {
    return items.filter(x => {
      const matchesFilter =
        filter === "ALL" || x.status === filter;

      const matchesQuery =
        `${x.customer} ${x.phone} ${x.id}`
          .toLowerCase()
          .includes(query.toLowerCase());

      return matchesFilter && matchesQuery;
    });
  }, [items, filter, query]);

  // Dịch vụ đang chọn
  const selectedService = services.find(
    x => String(x.id) === String(form.service_id)
  );

  // Tạo lịch hẹn và hóa đơn
  const addAppointment = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_URL}/appointments`,
        {
          method: "POST",
          headers: {
  "Content-Type": "application/json",
  ...getAuthHeaders()
},
          body: JSON.stringify({
            customer_id: Number(form.customer_id),
            staff_id: Number(form.staff_id),
            service_ids: [Number(form.service_id)],
            appointment_date: form.appointment_date,
            start_time: form.start_time,
            note: form.note
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể tạo lịch hẹn"
        );
      }

      await loadData();

      setShowModal(false);
      setForm({
        ...emptyForm,
        appointment_date: getToday()
      });

      alert(
        `Tạo lịch thành công!\n` +
        `Mã lịch: ${result.data.appointment_code}\n` +
        `Mã hóa đơn: ${result.data.invoice_code}`
      );

    } catch (error) {
      console.error("Lỗi tạo lịch:", error);
      alert(error.message);
    }
  };

  // Cập nhật trạng thái qua Backend
  const updateStatus = async (appointment, status) => {
    try {
      const response = await fetch(
        `${API_URL}/appointments/${appointment.db_id}/status`,
        {
          method: "PATCH",
        headers: {
  "Content-Type": "application/json",
  ...getAuthHeaders()
},
          body: JSON.stringify({ status })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể cập nhật trạng thái"
        );
      }

      await loadData();

    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      alert(error.message);
    }
  };

  return (
    <>
      {/* Thanh công cụ */}
      <div className="toolbar">
        <div className="search-field">
          <Search size={17} />

          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm tên khách, số điện thoại..."
          />
        </div>

        <select
          className="select-control"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="IN_PROGRESS">Đang thực hiện</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>

        <button
          className="button button-dark"
          onClick={() => setShowModal(true)}
        >
          <Plus size={17} />
          Tạo lịch hẹn
        </button>
      </div>

      {/* Thống kê */}
      <div className="summary-strip">
        <div>
          <CalendarDays />
          <span>Tổng lịch hẹn</span>
          <b>{items.length}</b>
        </div>

        <div>
          <Clock3 />
          <span>Chờ xác nhận</span>
          <b>
            {items.filter(x => x.status === "PENDING").length}
          </b>
        </div>

        <div>
          <Check />
          <span>Đã hoàn thành</span>
          <b>
            {items.filter(x => x.status === "COMPLETED").length}
          </b>
        </div>
      </div>

      {/* Bảng lịch hẹn */}
      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h3>Danh sách lịch hẹn</h3>
            <p>Quản lý và cập nhật trạng thái lịch hẹn</p>
          </div>

          <span className="muted-label">
            {filtered.length} kết quả
          </span>
        </div>

        <div className="table-scroll">
          {loading ? (
            <div className="empty-state">
              Đang tải dữ liệu lịch hẹn...
            </div>
          ) : error ? (
            <div className="empty-state">
              {error}
              <br />
              <button
                className="button button-outline small"
                onClick={loadData}
              >
                Thử tải lại
              </button>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>MÃ LỊCH</th>
                    <th>KHÁCH HÀNG</th>
                    <th>DỊCH VỤ</th>
                    <th>NHÂN VIÊN</th>
                    <th>NGÀY / GIỜ</th>
                    <th>THÀNH TIỀN</th>
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

                      <td>
                        <b>{x.customer}</b>
                        <small>{x.phone}</small>
                      </td>

                      <td>{x.service}</td>

                      <td>{x.staff}</td>

                      <td>
                        {x.date
                          ? x.date.split("-").reverse().join("/")
                          : ""}
                        <small>{x.time}</small>
                      </td>

                      <td>
                        <b>{formatMoney(x.amount)}</b>
                      </td>

                      <td>
                        <StatusBadge status={x.status} />
                      </td>

                      <td>
                        <div className="row-actions">
                          {x.status === "PENDING" && (
                            <button
                              title="Xác nhận"
                              className="action-btn success"
                              onClick={() =>
                                updateStatus(x, "CONFIRMED")
                              }
                            >
                              <Check size={16} />
                            </button>
                          )}

                          {["PENDING", "CONFIRMED"].includes(x.status) && (
                            <button
                              title="Hủy lịch"
                              className="action-btn danger"
                              onClick={() =>
                                updateStatus(x, "CANCELLED")
                              }
                            >
                              <X size={16} />
                            </button>
                          )}

                          {x.status === "CONFIRMED" && (
                            <button
                              title="Bắt đầu"
                              className="action-btn"
                              onClick={() =>
                                updateStatus(x, "IN_PROGRESS")
                              }
                            >
                              Bắt đầu
                            </button>
                          )}

                          {x.status === "IN_PROGRESS" && (
                            <button
                              title="Hoàn thành"
                              className="action-btn success"
                              onClick={() =>
                                updateStatus(x, "COMPLETED")
                              }
                            >
                              Xong
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
                  Không tìm thấy lịch hẹn phù hợp.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal tạo lịch hẹn */}
      {showModal && (
        <Modal
          title="Tạo lịch hẹn mới"
          onClose={() => setShowModal(false)}
        >
          <form
            className="form-grid"
            onSubmit={addAppointment}
          >
            <label>
              Khách hàng

              <select
                required
                value={form.customer_id}
                onChange={e =>
                  setForm({
                    ...form,
                    customer_id: e.target.value
                  })
                }
              >
                <option value="">-- Chọn khách hàng --</option>

                {customers.map(customer => (
                  <option
                    key={customer.db_id}
                    value={customer.db_id}
                  >
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Nhân viên

              <select
                required
                value={form.staff_id}
                onChange={e =>
                  setForm({
                    ...form,
                    staff_id: e.target.value
                  })
                }
              >
                <option value="">-- Chọn nhân viên --</option>

                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name || staff.full_name || staff.job_title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Dịch vụ

              <select
                required
                value={form.service_id}
                onChange={e =>
                  setForm({
                    ...form,
                    service_id: e.target.value
                  })
                }
              >
                <option value="">-- Chọn dịch vụ --</option>

                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.service_name || service.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Giá tiền (VNĐ)

              <input
                type="text"
                readOnly
                value={
                  selectedService
                    ? formatMoney(Number(selectedService.price))
                    : "Chọn dịch vụ trước"
                }
              />
            </label>

            <label>
              Ngày

              <input
                type="date"
                required
                min={getToday()}
                value={form.appointment_date}
                onChange={e =>
                  setForm({
                    ...form,
                    appointment_date: e.target.value
                  })
                }
              />
            </label>

            <label>
              Giờ

              <input
                type="time"
                min="08:00"
                max="21:00"
                required
                value={form.start_time}
                onChange={e =>
                  setForm({
                    ...form,
                    start_time: e.target.value
                  })
                }
              />
            </label>

            <label className="full-field">
              Ghi chú

              <textarea
                value={form.note}
                onChange={e =>
                  setForm({
                    ...form,
                    note: e.target.value
                  })
                }
                placeholder="Nhập ghi chú nếu có..."
              />
            </label>

            <div className="form-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setShowModal(false)}
              >
                Hủy
              </button>

              <button
                type="submit"
                className="button button-dark"
                disabled={loading}
              >
                Tạo lịch
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
