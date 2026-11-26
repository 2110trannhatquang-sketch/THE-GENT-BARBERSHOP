
const express = require("express");
const router = express.Router();
const db = require("../db");
const crypto = require("crypto");

const {
  authMiddleware,
  authorizeRoles
} = require("../middleware/authMiddleware");

// Tạo mã lịch và hóa đơn
const generateCode = (prefix) => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}${timePart}${randomPart}`;
};

// GET: Lấy danh sách lịch hẹn
router.get(
  "/",
  authMiddleware,
  authorizeRoles("OWNER", "STAFF"),
  async (req, res) => {
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
          s.full_name AS staff_name,
          s.job_title,
          a.appointment_date,
          a.start_time,
          a.end_time,
          a.status,
          a.note,
          COALESCE(SUM(aps.price), 0) AS total_amount,
          GROUP_CONCAT(
            sv.service_name SEPARATOR ', '
          ) AS service_names,
          i.invoice_code,
          i.status AS invoice_status
        FROM appointments a
        JOIN customers c ON c.id = a.customer_id
        LEFT JOIN staff s ON s.id = a.staff_id
        LEFT JOIN appointment_services aps
          ON aps.appointment_id = a.id
        LEFT JOIN services sv
          ON sv.id = aps.service_id
        LEFT JOIN invoices i
          ON i.appointment_id = a.id
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
  }
);

// POST: Tạo lịch hẹn và tự động phân công nhân viên
router.post(
  "/",
  authMiddleware,
  authorizeRoles("OWNER", "STAFF"),
  async (req, res) => {

    console.log("BODY POST APPOINTMENTS:", req.body);

    const {
      customer_id,
      staff_id,
      service_ids,
      appointment_date,
      start_time,
      note
    } = req.body;

    // 1. Kiểm tra dữ liệu đầu vào
    if (
      customer_id === undefined ||
      customer_id === null ||
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

    const customerId = Number(customer_id);

    const uniqueServiceIds = [
      ...new Set(service_ids.map(Number))
    ];

    const requestedStaffId =
      staff_id === undefined ||
      staff_id === null ||
      staff_id === ""
        ? null
        : Number(staff_id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Khách hàng không hợp lệ"
      });
    }

    if (
      requestedStaffId !== null &&
      (!Number.isInteger(requestedStaffId) || requestedStaffId <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Nhân viên không hợp lệ"
      });
    }

    if (
      uniqueServiceIds.some(
        id => !Number.isInteger(id) || id <= 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Danh sách dịch vụ không hợp lệ"
      });
    }

    // 2. Kiểm tra ngày
    const dateMatch =
      /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(appointment_date));

    if (!dateMatch) {
      return res.status(400).json({
        success: false,
        message: "Ngày đặt lịch không hợp lệ"
      });
    }

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);

    const checkDate = new Date(
      Date.UTC(year, month - 1, day)
    );

    if (
      checkDate.getUTCFullYear() !== year ||
      checkDate.getUTCMonth() !== month - 1 ||
      checkDate.getUTCDate() !== day
    ) {
      return res.status(400).json({
        success: false,
        message: "Ngày đặt lịch không tồn tại"
      });
    }

    // 3. Kiểm tra giờ
    const timeMatch =
      /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(
        String(start_time)
      );

    if (!timeMatch) {
      return res.status(400).json({
        success: false,
        message: "Giờ bắt đầu không hợp lệ"
      });
    }

    const timeParts = String(start_time).split(":").map(Number);
    const hours = timeParts[0];
    const minutes = timeParts[1];
    const startMinutes = hours * 60 + minutes;

    let connection;
    let transactionStarted = false;

    try {
      connection = await db.getConnection();

      await connection.beginTransaction();
      transactionStarted = true;

      // 4. Kiểm tra khách hàng
      const [customers] = await connection.query(
        "SELECT id FROM customers WHERE id = ?",
        [customerId]
      );

      if (customers.length === 0) {
        throw new Error("Khách hàng không tồn tại");
      }

      // 5. Lấy dịch vụ đang hoạt động
      const placeholders = uniqueServiceIds
        .map(() => "?")
        .join(",");

      const [services] = await connection.query(
        `SELECT id, price, duration
         FROM services
         WHERE id IN (${placeholders})
         AND status = 'ACTIVE'`,
        uniqueServiceIds
      );

      if (services.length !== uniqueServiceIds.length) {
        throw new Error(
          "Có dịch vụ không tồn tại hoặc đã ngừng hoạt động"
        );
      }

      // 6. Tính tiền và thời lượng
      const totalAmount = services.reduce(
        (sum, service) => sum + Number(service.price),
        0
      );

      const totalDuration = services.reduce(
        (sum, service) => sum + Number(service.duration),
        0
      );

      if (
        !Number.isFinite(totalDuration) ||
        totalDuration <= 0
      ) {
        throw new Error("Thời lượng dịch vụ không hợp lệ");
      }

      const endMinutes = startMinutes + totalDuration;

      // 7. Kiểm tra giờ hoạt động
      if (
        startMinutes < 8 * 60 ||
        endMinutes > 21 * 60
      ) {
        throw new Error(
          "Lịch hẹn phải nằm trong giờ hoạt động từ 08:00 đến 21:00"
        );
      }

      const formattedStartTime =
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:00`;

      const endTime =
        `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:` +
        `${String(endMinutes % 60).padStart(2, "0")}:00`;

      // 8. Tìm nhân viên có đủ kỹ năng
      const servicePlaceholders = uniqueServiceIds
        .map(() => "?")
        .join(",");

      let staffQuery = `
        SELECT st.id
        FROM staff st
        WHERE st.status = 'ACTIVE'
        AND (
          SELECT COUNT(DISTINCT ss.service_id)
          FROM staff_services ss
          WHERE ss.staff_id = st.id
          AND ss.service_id IN (${servicePlaceholders})
        ) = ?
      `;

      const staffParams = [
        ...uniqueServiceIds,
        uniqueServiceIds.length
      ];

      // Nếu khách chọn nhân viên thì chỉ xét người đó
      if (requestedStaffId !== null) {
        staffQuery += " AND st.id = ?";
        staffParams.push(requestedStaffId);
      }

      staffQuery += " ORDER BY st.id ASC";

      const [eligibleStaff] = await connection.query(
        staffQuery,
        staffParams
      );

      if (eligibleStaff.length === 0) {
        throw new Error(
          requestedStaffId !== null
            ? "Nhân viên đã chọn không có đủ kỹ năng thực hiện dịch vụ"
            : "Không có nhân viên phù hợp với dịch vụ đã chọn"
        );
      }

      // 9. Tìm nhân viên có ca làm và không trùng lịch
      let assignedStaffId = null;

      for (const staff of eligibleStaff) {
        // Khóa nhân viên trong transaction
        const [lockedStaff] = await connection.query(
          `SELECT id
           FROM staff
           WHERE id = ?
           AND status = 'ACTIVE'
           FOR UPDATE`,
          [staff.id]
        );

        if (lockedStaff.length === 0) {
          continue;
        }

        // Kiểm tra ca làm bao phủ toàn bộ lịch hẹn
        const [shifts] = await connection.query(
          `SELECT id
           FROM work_shifts
           WHERE staff_id = ?
           AND shift_date = ?
           AND status = 'AVAILABLE'
           AND start_time <= ?
           AND end_time >= ?
           LIMIT 1
           FOR UPDATE`,
          [
            staff.id,
            appointment_date,
            formattedStartTime,
            endTime
          ]
        );

        if (shifts.length === 0) {
          continue;
        }

        // Kiểm tra lịch bị trùng
        const [conflicts] = await connection.query(
          `SELECT id
           FROM appointments
           WHERE staff_id = ?
           AND appointment_date = ?
           AND status IN (
             'PENDING',
             'CONFIRMED',
             'IN_PROGRESS'
           )
           AND start_time < ?
           AND end_time > ?
           LIMIT 1
           FOR UPDATE`,
          [
            staff.id,
            appointment_date,
            endTime,
            formattedStartTime
          ]
        );

        // Nếu nhân viên bận, thử người tiếp theo
        if (conflicts.length > 0) {
          continue;
        }

        assignedStaffId = staff.id;
        break;
      }

      if (assignedStaffId === null) {
        throw new Error(
          requestedStaffId !== null
            ? "Nhân viên đã chọn không có ca làm phù hợp hoặc bị trùng lịch"
            : "Không có nhân viên trống trong khung giờ này. Vui lòng kiểm tra ca làm hoặc chọn giờ khác"
        );
      }

      // 10. Tạo mã lịch hẹn
      const appointmentCode = generateCode("AP");

      // 11. Tạo lịch hẹn
      const [appointmentResult] = await connection.query(
        `INSERT INTO appointments
         (
           appointment_code,
           customer_id,
           staff_id,
           appointment_date,
           start_time,
           end_time,
           status,
           note
         )
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
        [
          appointmentCode,
          customerId,
          assignedStaffId,
          appointment_date,
          formattedStartTime,
          endTime,
          note || null
        ]
      );

      const appointmentId = appointmentResult.insertId;

      // 12. Lưu dịch vụ của lịch hẹn
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

      // 13. Tạo hóa đơn tự động
      const invoiceCode = generateCode("HD");

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

      // 14. Hoàn tất transaction
      await connection.commit();
      transactionStarted = false;

      res.status(201).json({
        success: true,
        message: "Tạo lịch hẹn và hóa đơn thành công",
        data: {
          id: appointmentId,
          appointment_code: appointmentCode,
          invoice_code: invoiceCode,
          staff_id: assignedStaffId,
          total_amount: totalAmount,
          end_time: endTime
        }
      });

    } catch (error) {
      if (connection && transactionStarted) {
        await connection.rollback();
        transactionStarted = false;
      }

      console.error("Lỗi tạo lịch hẹn:", error);

      res.status(
        error.code === "ER_DUP_ENTRY" ? 409 : 400
      ).json({
        success: false,
        message:
          error.code === "ER_DUP_ENTRY"
            ? "Mã lịch hoặc mã hóa đơn bị trùng. Vui lòng thử lại"
            : error.message || "Không thể tạo lịch hẹn"
      });

    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
);

// PATCH: Cập nhật trạng thái lịch hẹn
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("OWNER", "STAFF"),
  async (req, res) => {
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
  }
);

module.exports = router;
