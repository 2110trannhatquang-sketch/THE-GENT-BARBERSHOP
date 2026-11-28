
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Scissors,
  CalendarDays,
  Clock,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";

import {
  initialInvoices,
  initialServices
} from "../data";
import { getAppointments, getBarbers, getShopSettings } from "../store";

const APPOINTMENT_KEY = "salon_appointments";
const INVOICE_KEY = "salon_invoices";
const SERVICE_KEY = "salon_services";

const getStaffNames = () => {
  const list = getBarbers().map((b) => b.name);
  return list.length > 0
    ? list
    : ["Trần Quốc Huy", "Phạm Đức Long", "Nguyễn Thành Đạt"];
};

const TIME_SLOTS_24H = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30"
];

const getStoredData = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const getNextId = (items, prefix) => {
  const maxNumber = items.reduce((max, item) => {
    const number = Number(
      String(item.id).replace(prefix, "")
    );

    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);

  return `${prefix}${String(maxNumber + 1).padStart(3, "0")}`;
};

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const toMinutes = (hhmm) => {
  if (!hhmm || !hhmm.includes(":")) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const isBarberBusyAtSlot = (appointments, services, barberName, date, slotTime, duration) => {
  if (!date || !slotTime) return false;
  const newStart = toMinutes(slotTime);
  const newEnd = newStart + duration;

  return appointments.some((item) => {
    if (
      item.staff !== barberName ||
      item.date !== date ||
      item.status === "CANCELLED"
    ) {
      return false;
    }
    const oldStart = toMinutes(item.time);
    const oldDuration = Number(
      services.find((s) => s.name === item.service)?.duration || 30
    );
    const oldEnd = oldStart + oldDuration;
    return newStart < oldEnd && oldStart < newEnd;
  });
};

export default function Booking() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [createdIds, setCreatedIds] = useState({
    appointment: "",
    invoice: ""
  });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    service: "Cắt tóc nam",
    staff: "Không chọn thợ",
    date: "",
    time: ""
  });

  const services = getStoredData(SERVICE_KEY, initialServices)
    .filter(service => service.active !== false);

  const selectedService = services.find(
    service => service.name === form.service
  );

  const submit = e => {
    e.preventDefault();
    setError("");

    const today = getToday();

    // Kiểm tra ngày đặt
    if (form.date < today) {
      setError("Không thể đặt lịch vào ngày đã qua.");
      return;
    }

    // Kiểm tra giờ hoạt động
    if (form.time < "08:00" || form.time >= "21:00") {
      setError("Vui lòng chọn giờ từ 08:00 đến trước 21:00.");
      return;
    }

    if (!selectedService) {
      setError("Dịch vụ này hiện không khả dụng.");
      return;
    }

    const amount = Number(selectedService.price || 0);
    const duration = Number(selectedService.duration || 30);

    const appointments = getAppointments();
    const staffNames = getStaffNames();

    const invoices = getStoredData(
      INVOICE_KEY,
      initialInvoices
    );

    let assignedStaff = form.staff;

    // Kiểm tra trùng lịch theo thợ
    if (form.staff !== "Không chọn thợ") {
      if (isBarberBusyAtSlot(appointments, services, form.staff, form.date, form.time, duration)) {
        setError(`Thợ ${form.staff} đã có lịch trong khung giờ này. Vui lòng chọn giờ khác hoặc thợ khác.`);
        return;
      }
    } else {
      const freeBarber = staffNames.find(
        (name) => !isBarberBusyAtSlot(appointments, services, name, form.date, form.time, duration)
      );
      if (!freeBarber) {
        setError("Tất cả thợ đều bận trong khung giờ này. Vui lòng chọn giờ khác.");
        return;
      }
      assignedStaff = freeBarber;
    }

    // Tạo mã lịch hẹn và mã hóa đơn
    const appointmentId = getNextId(appointments, "AP");
    const invoiceId = getNextId(invoices, "HD");

    // Tạo lịch hẹn
    const newAppointment = {
      id: appointmentId,
      customer: form.name.trim(),
      phone: form.phone.trim(),
      service: form.service,
      staff: assignedStaff,
      date: form.date,
      time: form.time,
      status: "PENDING",
      amount
    };

    // Tạo hóa đơn chưa thanh toán
    const newInvoice = {
      id: invoiceId,
      appointmentId,
      customer: form.name.trim(),
      date: form.date,
      amount,
      method: "Chưa thanh toán",
      status: "UNPAID"
    };

    try {
      localStorage.setItem(
        APPOINTMENT_KEY,
        JSON.stringify([newAppointment, ...appointments])
      );

      localStorage.setItem(
        INVOICE_KEY,
        JSON.stringify([newInvoice, ...invoices])
      );

      setCreatedIds({
        appointment: appointmentId,
        invoice: invoiceId
      });

      setSent(true);
    } catch {
      setError("Không thể lưu dữ liệu. Vui lòng kiểm tra bộ nhớ trình duyệt.");
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      service: "Cắt tóc nam",
      staff: "Không chọn thợ",
      date: "",
      time: ""
    });

    setSent(false);
    setError("");
  };

  return (
    <div className="booking-page">
      <header className="public-nav">
        <Link className="public-brand" to="/">
          <span className="brand-mark">
            <Scissors size={21} />
          </span>
          <b>THE GENT</b>
        </Link>

        <Link to="/" className="button button-outline">
          <ArrowLeft size={15} />
          Quay lại trang chủ
        </Link>
      </header>

      <div className="booking-hero">
        <span className="eyebrow">THE GENT BARBERSHOP</span>
        <h1>
          Phong cách của bạn.
          <br />
          <em>Chất riêng của bạn.</em>
        </h1>
        <p>
          Đặt lịch ngay hôm nay để được phục vụ chu đáo
          bởi đội ngũ thợ chuyên nghiệp.
        </p>
      </div>

      <div className="booking-card">
        <div className="booking-card-title">
          <div>
            <h2>Đặt lịch hẹn</h2>
            <p>Vui lòng điền thông tin bên dưới</p>
          </div>
          <CalendarDays size={25} />
        </div>

        {sent ? (
          <div className="success-message">
            <CheckCircle2 size={42} />

            <h3>Đặt lịch thành công!</h3>

            <p>
              Yêu cầu đặt lịch của bạn đã được lưu.
              Lịch hẹn đang chờ nhân viên xác nhận.
            </p>

            <p>
              Mã lịch hẹn: <b>{createdIds.appointment}</b>
            </p>

            <p>
              Mã hóa đơn: <b>{createdIds.invoice}</b>
            </p>

            <p>
              Hóa đơn đã được tạo với trạng thái
              <b> Chưa thanh toán</b>.
            </p>

            <button
              className="button button-dark"
              onClick={resetForm}
            >
              Đặt lịch khác
            </button>
          </div>
        ) : (
          <form className="form-grid" onSubmit={submit}>
            <label>
              Họ và tên *
              <input
                required
                value={form.name}
                onChange={e =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="Nhập họ tên"
              />
            </label>

            <label>
              Số điện thoại *
              <input
                required
                pattern="[0-9 +.-]{9,15}"
                value={form.phone}
                onChange={e =>
                  setForm({ ...form, phone: e.target.value })
                }
                placeholder="09xx xxx xxx"
              />
            </label>

            <div className="full-field booking-field-group">
              <span className="booking-field-label">Chọn dịch vụ *</span>
              <div className="booking-service-grid">
                {services.map(service => {
                  const isActive = form.service === service.name;
                  return (
                    <button
                      type="button"
                      key={service.id}
                      className={`booking-service-option ${isActive ? "active" : ""}`}
                      onClick={() =>
                        setForm({ ...form, service: service.name })
                      }
                    >
                      <div className="booking-service-top">
                        <b>{service.name}</b>
                        <span>{service.duration} phút</span>
                      </div>
                      <strong>
                        {new Intl.NumberFormat("vi-VN").format(service.price)} ₫
                      </strong>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="full-field">
              Chọn thợ cắt tóc
              <select
                value={form.staff}
                onChange={e =>
                  setForm({ ...form, staff: e.target.value, time: "" })
                }
              >
                <option>Không chọn thợ</option>

                {getStaffNames().map(staff => (
                  <option key={staff} value={staff}>
                    {staff}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Ngày đặt *
              <input
                type="date"
                min={getToday()}
                required
                value={form.date}
                onChange={e =>
                  setForm({ ...form, date: e.target.value, time: "" })
                }
              />
            </label>

            <label>
              Giờ đặt (24h: 08:00–20:30) *
              <select
                required
                value={form.time}
                onChange={e =>
                  setForm({ ...form, time: e.target.value })
                }
              >
                <option value="">-- Chọn giờ cắt (24h) --</option>
                {TIME_SLOTS_24H.map(slot => {
                  const currentAppointments = getAppointments();
                  const duration = Number(selectedService?.duration || 30);
                  const staffNames = getStaffNames();
                  const isBusy = form.date
                    ? form.staff !== "Không chọn thợ"
                      ? isBarberBusyAtSlot(
                          currentAppointments,
                          services,
                          form.staff,
                          form.date,
                          slot,
                          duration
                        )
                      : staffNames.every((name) =>
                          isBarberBusyAtSlot(
                            currentAppointments,
                            services,
                            name,
                            form.date,
                            slot,
                            duration
                          )
                        )
                    : false;

                  return (
                    <option key={slot} value={slot} disabled={isBusy}>
                      {slot}
                      {isBusy ? " (Thợ đang bận)" : ""}
                    </option>
                  );
                })}
              </select>
            </label>

            {selectedService && (
              <div className="booking-price-card full-field">
                <div>
                  <span className="booking-price-eyebrow">CHI TIẾT DỊCH VỤ</span>
                  <b>{selectedService.name}</b>
                  <small>
                    <Clock size={13} /> Thời gian dự kiến: {selectedService.duration} phút
                    {form.staff !== "Không chọn thợ" ? ` · Thợ: ${form.staff}` : " · Tự động sắp xếp thợ"}
                  </small>
                </div>

                <div className="booking-price-right">
                  <span>GIÁ DỊCH VỤ</span>
                  <strong>
                    {new Intl.NumberFormat("vi-VN").format(
                      selectedService.price
                    )}{" "}
                    ₫
                  </strong>
                </div>
              </div>
            )}

            {error && (
              <p className="full-field" style={{ color: "#dc2626", margin: 0, fontSize: 12 }}>
                {error}
              </p>
            )}

            <p className="booking-note full-field">
              <Clock size={15} />
              Lịch hẹn sẽ ở trạng thái chờ xác nhận cho đến khi
              nhân viên tiếp nhận.
            </p>

            <button className="button button-dark full-field" style={{ height: 44, fontSize: 13 }}>
              Gửi yêu cầu đặt lịch
            </button>
          </form>
        )}
      </div>

      <footer className="public-footer">
        {getShopSettings().shopName} · {getShopSettings().openingHours} · © 2026
      </footer>
    </div>
  );
}
