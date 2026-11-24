
const express = require("express");
const router = express.Router();
const db = require("../db");
const {
  authMiddleware,
  authorizeRoles
} = require("../middleware/authMiddleware");

// GET: Lấy danh sách lịch hẹn
router.get("/", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        a.id,
        a.appointment_code,
        a.customer_id,
        c.customer_code,
        c.full_name AS customer_name,
        c.phone AS customer_phone,
        a.staff_id,
        s.job_title,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.note,
        COALESCE(SUM(aps.price), 0) AS total_amount,
        GROUP_CONCAT(
          sv.service_name
          SEPARATOR ', '
        ) AS service_names,
        i.invoice_code,
        i.status AS invoice_status
      FROM appointments a
      JOIN customers c ON c.id = a.customer_id
      JOIN staff s ON s.id = a.staff_id
      LEFT JOIN appointment_services aps
        ON aps.appointment_id = a.id
      LEFT JOIN services sv ON sv.id = aps.service_id
      LEFT JOIN invoices i ON i.appointment_id = a.id
      GROUP BY a.id
      ORDER BY a.appointment_date DESC, a.start_time DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("Lỗi lấy lịch hẹn:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tải danh sách lịch hẹn"
    });
  }
});

// POST: Tạo lịch hẹn và hóa đơn
router.post("/", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  const {
    customer_id,
    staff_id,
    service_ids,
    appointment_date,
    start_time,
    note
  } = req.body;

  if (
    !customer_id ||
    !staff_id ||
    !Array.isArray(service_ids) ||
    service_ids.length === 0 ||
    !appointment_date ||
    !start_time
  ) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập đầy đủ thông tin lịch hẹn"
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Kiểm tra khách hàng
    const [customers] = await connection.query(
      "SELECT id FROM customers WHERE id = ?",
      [customer_id]
    );

    if (customers.length === 0) {
      throw new Error("Khách hàng không tồn tại");
    }

    // Kiểm tra nhân viên
    const [staffRows] = await connection.query(
      "SELECT id FROM staff WHERE id = ? AND status = 'ACTIVE'",
      [staff_id]
    );

    if (staffRows.length === 0) {
      throw new Error("Nhân viên không tồn tại hoặc đã ngừng hoạt động");
    }

    // Lấy thông tin dịch vụ đang hoạt động
    const uniqueServiceIds = [...new Set(service_ids.map(Number))];

    if (
      uniqueServiceIds.some(
        id => !Number.isInteger(id) || id <= 0
      )
    ) {
      throw new Error("Danh sách dịch vụ không hợp lệ");
    }

    const placeholders = uniqueServiceIds.map(() => "?").join(",");

    const [services] = await connection.query(
      `SELECT id, price, duration
       FROM services
       WHERE id IN (${placeholders})
       AND status = 'ACTIVE'`,
      uniqueServiceIds
    );

    if (services.length !== uniqueServiceIds.length) {
      throw new Error("Có dịch vụ không tồn tại hoặc đã ngừng hoạt động");
    }

    // Tính tổng tiền và thời lượng
    const totalAmount = services.reduce(
      (sum, service) => sum + Number(service.price),
      0
    );

    const totalDuration = services.reduce(
      (sum, service) => sum + Number(service.duration),
      0
    );

    // Tính giờ kết thúc
    const [hours, minutes] = start_time.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + totalDuration;

    if (
      !Number.isInteger(startMinutes) ||
      hours < 0 || hours > 23 ||
      minutes < 0 || minutes > 59 ||
      endMinutes > 24 * 60
    ) {
      throw new Error("Thời gian lịch hẹn không hợp lệ");
    }

    const endTime =
      `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:` +
      `${String(endMinutes % 60).padStart(2, "0")}:00`;

    const formattedStartTime =
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:00`;

    // Kiểm tra trùng lịch nhân viên
    const [conflicts] = await connection.query(
      `SELECT id
       FROM appointments
       WHERE staff_id = ?
       AND appointment_date = ?
       AND status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
       AND start_time < ?
       AND end_time > ?
       LIMIT 1`,
      [
        staff_id,
        appointment_date,
        endTime,
        formattedStartTime
      ]
    );

    if (conflicts.length > 0) {
      throw new Error("Nhân viên đã có lịch hẹn trong khoảng thời gian này");
    }

    // Tạo mã lịch hẹn
    const [appointmentCodes] = await connection.query(
      "SELECT COUNT(*) AS total FROM appointments"
    );

    const appointmentCode =
      `AP${String(Number(appointmentCodes[0].total) + 1).padStart(3, "0")}`;

    // Tạo lịch hẹn
    const [appointmentResult] = await connection.query(
      `INSERT INTO appointments
       (appointment_code, customer_id, staff_id,
        appointment_date, start_time, end_time, status, note)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
      [
        appointmentCode,
        customer_id,
        staff_id,
        appointment_date,
        formattedStartTime,
        endTime,
        note || null
      ]
    );

    const appointmentId = appointmentResult.insertId;

    // Lưu các dịch vụ của lịch hẹn
    for (const service of services) {
      await connection.query(
        `INSERT INTO appointment_services
         (appointment_id, service_id, price, duration)
         VALUES (?, ?, ?, ?)`,
        [
          appointmentId,
          service.id,
          service.price,
          service.duration
        ]
      );
    }

    // Tạo hóa đơn tự động
    const [invoiceCodes] = await connection.query(
      "SELECT COUNT(*) AS total FROM invoices"
    );

    const invoiceCode =
      `HD${String(Number(invoiceCodes[0].total) + 1).padStart(3, "0")}`;

    await connection.query(
      `INSERT INTO invoices
       (invoice_code, appointment_id, total_amount, status)
       VALUES (?, ?, ?, 'UNPAID')`,
      [
        invoiceCode,
        appointmentId,
        totalAmount
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Tạo lịch hẹn và hóa đơn thành công",
      data: {
        id: appointmentId,
        appointment_code: appointmentCode,
        invoice_code: invoiceCode,
        total_amount: totalAmount,
        end_time: endTime
      }
    });

  } catch (error) {
    await connection.rollback();

    console.error("Lỗi tạo lịch hẹn:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Không thể tạo lịch hẹn"
    });
  } finally {
    connection.release();
  }
});

// PATCH: Cập nhật trạng thái lịch hẹn
router.patch("/:id/status", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = [
      "PENDING",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED"
    ];

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID lịch hẹn không hợp lệ"
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái lịch hẹn không hợp lệ"
      });
    }

    const [appointments] = await db.query(
      "SELECT id FROM appointments WHERE id = ?",
      [id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch hẹn"
      });
    }

    await db.query(
      "UPDATE appointments SET status = ? WHERE id = ?",
      [status, id]
    );

    res.json({
      success: true,
      message: "Cập nhật trạng thái lịch hẹn thành công"
    });

  } catch (error) {
    console.error("Lỗi cập nhật lịch hẹn:", error);

    res.status(500).json({
      success: false,
      message: "Không thể cập nhật trạng thái lịch hẹn"
    });
  }
});

module.exports = router;
