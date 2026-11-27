
const express = require("express");
const router = express.Router();
const db = require("../db");
const {
  authMiddleware,
  authorizeRoles
} = require("../middleware/authMiddleware");

// ==========================================
// HÀM KIỂM TRA DỮ LIỆU
// ==========================================

function validServiceIds(ids) {
  return (
    Array.isArray(ids) &&
    ids.every(id =>
      Number.isInteger(Number(id)) && Number(id) > 0
    ) &&
    new Set(ids.map(Number)).size === ids.length
  );
}

function validText(value) {
  return typeof value === "string" && value.trim().length > 0;

}
// Kiểm tra định dạng Email
function validEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validCommission(value) {
  return (
    Number.isFinite(Number(value)) &&
    Number(value) >= 0 &&
    Number(value) <= 100
  );
}

// Kiểm tra dịch vụ có tồn tại trong database
async function checkServices(connection, serviceIds) {
  if (serviceIds.length === 0) return true;

  const ids = serviceIds.map(Number);
  const placeholders = ids.map(() => "?").join(",");

  const [rows] = await connection.query(
    `SELECT id FROM services WHERE id IN (${placeholders})`,
    ids
  );

  return rows.length === ids.length;
}

// ==========================================
// 1. GET: DANH SÁCH NHÂN VIÊN
// GET /api/staff
// ==========================================

router.get("/", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
    const [staffRows] = await db.query(`
      SELECT
        s.id,
        s.user_id,
        s.staff_code,
        s.full_name,
        s.job_title,
        s.phone,
        s.specialization,
        s.commission_rate,
        s.status,
        u.username,
        u.email 
      FROM staff s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.id DESC
    `);

    const [serviceRows] = await db.query(`
      SELECT
        ss.staff_id,
        sv.id AS service_id,
        sv.service_name
      FROM staff_services ss
      JOIN services sv ON ss.service_id = sv.id
    `);

    const [shiftRows] = await db.query(`
      SELECT
        staff_id,
        start_time,
        end_time,
        status
      FROM work_shifts
      WHERE shift_date = CURDATE()
      ORDER BY start_time
    `);

    const data = staffRows.map(staff => {
      const services = serviceRows.filter(
        item => item.staff_id === staff.id
      );

      const shifts = shiftRows.filter(
        item => item.staff_id === staff.id
      );

      return {
        id: staff.id,
        user_id: staff.user_id,
        code: staff.staff_code,
        name: staff.full_name,
        username: staff.username,
        email: staff.email || "",
        role: staff.job_title || "Chưa phân chức danh",
        phone: staff.phone || "",
        specialization: staff.specialization || "",
        services:
          services.map(x => x.service_name).join(", ") ||
          staff.specialization ||
          "Chưa phân công dịch vụ",
        service_ids: services.map(x => x.service_id),
        shift:
          shifts.map(x =>
            `${String(x.start_time).slice(0, 5)}–${String(x.end_time).slice(0, 5)}`
          ).join(", ") || "Chưa xếp ca",
        status:
          staff.status === "ACTIVE" ? "Đang làm" : "Đang nghỉ",
        commission_rate: Number(staff.commission_rate)
      };
    });

    res.json({
      success: true,
      total: data.length,
      data
    });

  } catch (error) {
    console.error("Lỗi lấy nhân viên:", error);

    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách nhân viên"
    });
  }
});

// ==========================================
// 2. GET: TÀI KHOẢN STAFF CHƯA LIÊN KẾT
// GET /api/staff/available-users
// ==========================================

router.get("/available-users", authMiddleware, authorizeRoles("OWNER"), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.id,
        u.username,
        u.full_name,
        u.phone
      FROM users u
      LEFT JOIN staff s ON s.user_id = u.id
      WHERE u.role = 'STAFF'
        AND u.status = 'ACTIVE'
        AND s.id IS NULL
      ORDER BY u.id
    `);

    res.json({
      success: true,
      total: rows.length,
      data: rows
    });

  } catch (error) {
    console.error("Lỗi lấy tài khoản:", error);

    res.status(500).json({
      success: false,
      message: "Không thể lấy tài khoản nhân viên"
    });
  }
});

// ==========================================
// 3. POST: THÊM NHÂN VIÊN
// POST /api/staff
// ==========================================

router.post("/", authMiddleware, authorizeRoles("OWNER"), async (req, res) => {
  let connection;
  let transactionStarted = false;

  try {
    const {
      user_id,
      job_title,
      phone,
      email,
      specialization,
      commission_rate = 0,
      service_ids = []
    } = req.body;

    const userId = Number(user_id);

    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !validText(job_title)
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn tài khoản và chức danh"
      });
    }

    if (
      phone !== undefined &&
      phone !== null &&
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ"
      });
    }
// Kiểm tra định dạng Email
if (
  email !== undefined &&
  email !== null &&
  !validEmail(email.trim())
) {
  return res.status(400).json({
    success: false,
    message: "Email không đúng định dạng"
  });
}
// Kiểm tra định dạng Email
if (email !== undefined && email !== null && !validEmail(email.trim())) {
  return res.status(400).json({
    success: false,
    message: "Email không đúng định dạng"
  });
}

    if (!validServiceIds(service_ids)) {
      return res.status(400).json({
        success: false,
        message: "Danh sách dịch vụ không hợp lệ"
      });
    }

    if (!validCommission(commission_rate)) {
      return res.status(400).json({
        success: false,
        message: "Tỷ lệ hoa hồng phải từ 0 đến 100"
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    const [users] = await connection.query(
      `SELECT id, full_name, phone, role, status
       FROM users
       WHERE id = ?
       FOR UPDATE`,
      [userId]
    );

    if (
  users.length === 0 ||
  users[0].role !== "STAFF" ||
  users[0].status !== "ACTIVE"
) {
  const [existing] = await connection.query(
  "SELECT id FROM staff WHERE user_id = ?",
  [userId]
);
// Kiểm tra email đã được tài khoản khác sử dụng chưa
if (email && email.trim()) {
  const [emailRows] = await connection.query(
    "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
    [email.trim(), userId]
  );

  if (emailRows.length > 0) {
    await connection.rollback();
    transactionStarted = false;

    return res.status(409).json({
      success: false,
      message: "Email này đã được sử dụng"
    });
  }

  await connection.query(
    "UPDATE users SET email = ? WHERE id = ?",
    [email.trim(), userId]
  );
}
  await connection.rollback();
  transactionStarted = false;

  return res.status(400).json({
    success: false,
    message: "Tài khoản không hợp lệ hoặc không hoạt động"
  });
}

    const [existing] = await connection.query(
      "SELECT id FROM staff WHERE user_id = ?",
      [userId]
    );

    if (existing.length > 0) {
  await connection.rollback();
  transactionStarted = false;

  return res.status(409).json({
    success: false,
    message: "Tài khoản này đã có hồ sơ nhân viên"
  });
}

    const servicesValid = await checkServices(
      connection,
      service_ids
    );

  if (!servicesValid) {
  await connection.rollback();
  transactionStarted = false;

  return res.status(400).json({
    success: false,
    message: "Một hoặc nhiều dịch vụ không tồn tại"
  });
}

    const fullName = users[0].full_name;
    const staffPhone = phone || users[0].phone || null;

    const [codes] = await connection.query(`
      SELECT COALESCE(
        MAX(CAST(SUBSTRING(staff_code, 3) AS UNSIGNED)),
        0
      ) + 1 AS next_number
      FROM staff
    `);

    const staffCode =
      `NV${String(codes[0].next_number).padStart(3, "0")}`;

    const [result] = await connection.query(
      `INSERT INTO staff
       (
         user_id,
         staff_code,
         full_name,
         job_title,
         phone,
         email,
         specialization,
         commission_rate,
         status
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [
        userId,
        staffCode,
        fullName,
        job_title.trim(),
        staffPhone,
        specialization || null,
        Number(commission_rate)
      ]
    );

    if (service_ids.length > 0) {
      const values = service_ids.map(serviceId => [
        result.insertId,
        Number(serviceId)
      ]);

      await connection.query(
        `INSERT INTO staff_services (staff_id, service_id)
         VALUES ?`,
        [values]
      );
    }

    await connection.commit();
    transactionStarted = false;

    res.status(201).json({
      success: true,
      message: "Thêm nhân viên thành công",
      id: result.insertId,
      staff_code: staffCode
    });

  } catch (error) {
    if (connection && transactionStarted) {
      await connection.rollback();
      transactionStarted = false;
    }

    console.error("Lỗi thêm nhân viên:", error);

    res.status(500).json({
      success: false,
      message: "Không thể thêm nhân viên"
    });

  } finally {
    if (connection) connection.release();
  }
});

// ==========================================
// 4. PUT: CẬP NHẬT NHÂN VIÊN
// PUT /api/staff/:id
// ==========================================

router.put("/:id", authMiddleware, authorizeRoles("OWNER"), async (req, res) => {
  let connection;
  let transactionStarted = false;

  try {
    const id = Number(req.params.id);

    const {
      job_title,
      phone,
      email,
      specialization,
      commission_rate = 0,
      service_ids
    } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ"
      });
    }

    if (
      !validText(job_title) ||
      !validCommission(commission_rate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Thông tin cập nhật không hợp lệ"
      });
    }

    if (
      phone !== undefined &&
      phone !== null &&
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ"
      });
    }

    if (
      service_ids !== undefined &&
      !validServiceIds(service_ids)
    ) {
      return res.status(400).json({
        success: false,
        message: "Danh sách dịch vụ không hợp lệ"
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    const [rows] = await connection.query(
      `SELECT id, user_id
       FROM staff
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );

  if (rows.length === 0) {
  await connection.rollback();
  transactionStarted = false;

  return res.status(404).json({
    success: false,
    message: "Không tìm thấy nhân viên"
  });
}
// Kiểm tra Email đã được tài khoản khác sử dụng chưa
if (email && email.trim()) {
  const [emailRows] = await connection.query(
    `SELECT id FROM users
     WHERE email = ? AND id != ?
     LIMIT 1`,
    [email.trim(), rows[0].user_id]
  );

  if (emailRows.length > 0) {
    await connection.rollback();
    transactionStarted = false;

    return res.status(409).json({
      success: false,
      message: "Email này đã được sử dụng"
    });
  }
}

    if (service_ids !== undefined) {
      const servicesValid = await checkServices(
        connection,
        service_ids
      );

    if (!servicesValid) {
  await connection.rollback();
  transactionStarted = false;

  return res.status(400).json({
    success: false,
    message: "Một hoặc nhiều dịch vụ không tồn tại"
  });
} 
    }

    const staffPhone = phone || null;

    await connection.query(
      `UPDATE staff
       SET job_title = ?,
           phone = ?,
           specialization = ?,
           commission_rate = ?
       WHERE id = ?`,
      [
        job_title.trim(),
        staffPhone,
        specialization || null,
        Number(commission_rate),
        id
      ]
    );

    await connection.query(
      `UPDATE users
       SET phone = ?
       WHERE id = ?`,
      [staffPhone, rows[0].user_id]
    );
    // Cập nhật Email tài khoản nhân viên
if (email !== undefined) {
  await connection.query(
    "UPDATE users SET email = ? WHERE id = ?",
    [email.trim() || null, rows[0].user_id]
  );
}

    if (service_ids !== undefined) {
      await connection.query(
        "DELETE FROM staff_services WHERE staff_id = ?",
        [id]
      );

      if (service_ids.length > 0) {
        const values = service_ids.map(serviceId => [
          id,
          Number(serviceId)
        ]);

        await connection.query(
          `INSERT INTO staff_services (staff_id, service_id)
           VALUES ?`,
          [values]
        );
      }
    }

    await connection.commit();
    transactionStarted = false;

    res.json({
      success: true,
      message: "Cập nhật nhân viên thành công"
    });

  } catch (error) {
    if (connection && transactionStarted) {
      await connection.rollback();
      transactionStarted = false;
    }

    console.error("Lỗi cập nhật nhân viên:", error);

    res.status(500).json({
      success: false,
      message: "Không thể cập nhật nhân viên"
    });

  } finally {
    if (connection) connection.release();
  }
});

// ==========================================
// 5. PATCH: CHO NGHỈ / ĐI LÀM
// PATCH /api/staff/:id/status
// ==========================================

router.patch("/:id/status", authMiddleware, authorizeRoles("OWNER"), async (req, res) => {
  let connection;
  let transactionStarted = false;

  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !["ACTIVE", "INACTIVE"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "ID hoặc trạng thái không hợp lệ"
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    const [rows] = await connection.query(
      `SELECT user_id
       FROM staff
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );

    if (rows.length === 0) {
  await connection.rollback();
  transactionStarted = false;

  return res.status(404).json({
    success: false,
    message: "Không tìm thấy nhân viên"
  });
}

    await connection.query(
      "UPDATE staff SET status = ? WHERE id = ?",
      [status, id]
    );

    // Đồng bộ trạng thái tài khoản đăng nhập
    await connection.query(
      "UPDATE users SET status = ? WHERE id = ?",
      [status, rows[0].user_id]
    );

    await connection.commit();
    transactionStarted = false;

    res.json({
      success: true,
      message:
        status === "ACTIVE"
          ? "Nhân viên đã đi làm"
          : "Đã cập nhật nhân viên nghỉ"
    });

  } catch (error) {
    if (connection && transactionStarted) {
      await connection.rollback();
      transactionStarted = false;
    }

    console.error("Lỗi đổi trạng thái:", error);

    res.status(500).json({
      success: false,
      message: "Không thể cập nhật trạng thái"
    });

  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
