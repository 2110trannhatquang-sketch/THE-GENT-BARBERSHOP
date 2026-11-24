
const express = require("express");
const router = express.Router();
const db = require("../db");
// Kiểm tra định dạng Email
function validEmail(email) {
  if (!email) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
const {
  authMiddleware,
  authorizeRoles
} = require("../middleware/authMiddleware");

// GET: Lấy danh sách khách hàng
router.get("/", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
  const [rows] = await db.query(`
  SELECT
    c.id,
    c.customer_code,
    c.full_name,
    c.phone,
    c.email,
    c.gender,
    c.date_of_birth,
    c.address,
    c.note,

    (
      SELECT COUNT(*)
      FROM appointments a
      WHERE a.customer_id = c.id
        AND a.status = 'COMPLETED'
    ) AS visits,

    (
      SELECT COALESCE(SUM(i.total_amount), 0)
      FROM appointments a
      JOIN invoices i ON i.appointment_id = a.id
      WHERE a.customer_id = c.id
        AND i.status = 'PAID'
    ) AS spent

  FROM customers c
  ORDER BY c.id DESC
`);

    const data = rows.map(customer => ({
      id: customer.customer_code,
      db_id: customer.id,
      name: customer.full_name,
      phone: customer.phone,
      email: customer.email || "",
      gender: customer.gender || "",
      date_of_birth: customer.date_of_birth || "",
      address: customer.address || "",
      note: customer.note || "",
      visits: Number(customer.visits || 0),
      spent: Number(customer.spent || 0)
    }));

    res.json({
      success: true,
      total: data.length,
      data
    });
  } catch (error) {
    console.error("Lỗi lấy khách hàng:", error);

    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách khách hàng"
    });
  }
});
// POST: Thêm khách hàng
router.post("/", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      gender,
      date_of_birth,
      address,
      note
    } = req.body;
    const formattedDate = date_of_birth
  ? String(date_of_birth).slice(0, 10)
  : null;

    if (!name || !name.trim() || !phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Họ tên và số điện thoại không được để trống"
      });
    }
// Kiểm tra định dạng Email
if (email && !validEmail(email.trim())) {
  return res.status(400).json({
    success: false,
    message: "Email không đúng định dạng"
  });
}
    // Kiểm tra số điện thoại đã tồn tại
    const [existing] = await db.query(
      "SELECT id FROM customers WHERE phone = ?",
      [phone.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Số điện thoại đã tồn tại"
      });
    }

    // Tạo mã khách hàng
    const [codes] = await db.query(`
      SELECT COALESCE(
        MAX(CAST(SUBSTRING(customer_code, 3) AS UNSIGNED)),
        0
      ) + 1 AS next_number
      FROM customers
    `);

    const customerCode =
      `KH${String(codes[0].next_number).padStart(3, "0")}`;

    const [result] = await db.query(
      `INSERT INTO customers
      (
        customer_code,
        full_name,
        phone,
        email,
        gender,
        date_of_birth,
        address,
        note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerCode,
        name.trim(),
        phone.trim(),
        email || null,
        gender || null,
        formattedDate,
        address || null,
        note || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Thêm khách hàng thành công",
      id: result.insertId,
      customer_code: customerCode
    });

  } catch (error) {
    console.error("Lỗi thêm khách hàng:", error);

    res.status(500).json({
      success: false,
      message: "Không thể thêm khách hàng"
    });
  }
});
// PUT: Cập nhật khách hàng
router.put("/:id", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      name,
      phone,
      email,
      gender,
      date_of_birth,
      address,
      note
    } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID khách hàng không hợp lệ"
      });
    }

    if (!name || !name.trim() || !phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Họ tên và số điện thoại không được để trống"
      });
    }
// Kiểm tra định dạng Email
if (email && !validEmail(email.trim())) {
  return res.status(400).json({
    success: false,
    message: "Email không đúng định dạng"
  });
}
    // Kiểm tra khách hàng có tồn tại không
    const [customer] = await db.query(
      "SELECT id FROM customers WHERE id = ?",
      [id]
    );

    if (customer.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khách hàng"
      });
    }

    // Kiểm tra số điện thoại trùng với khách hàng khác
    const [existing] = await db.query(
      "SELECT id FROM customers WHERE phone = ? AND id <> ?",
      [phone.trim(), id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Số điện thoại đã tồn tại"
      });
    }

    await db.query(
      `UPDATE customers
       SET full_name = ?,
           phone = ?,
           email = ?,
           gender = ?,
           date_of_birth = ?,
           address = ?,
           note = ?
       WHERE id = ?`,
      [
        name.trim(),
        phone.trim(),
        email || null,
        gender || null,
        date_of_birth || null,
        address || null,
        note || null,
        id
      ]
    );

    res.json({
      success: true,
      message: "Cập nhật khách hàng thành công"
    });

  } catch (error) {
    console.error("Lỗi cập nhật khách hàng:", error);

    res.status(500).json({
      success: false,
      message: "Không thể cập nhật khách hàng"
    });
  }
});

// DELETE: Xóa khách hàng
router.delete("/:id", authMiddleware, authorizeRoles("OWNER"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID khách hàng không hợp lệ"
      });
    }

    // Kiểm tra khách hàng tồn tại
    const [customers] = await db.query(
      "SELECT id FROM customers WHERE id = ?",
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khách hàng"
      });
    }

    // Kiểm tra lịch hẹn của khách hàng
    const [appointments] = await db.query(
      "SELECT id FROM appointments WHERE customer_id = ? LIMIT 1",
      [id]
    );

    if (appointments.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Khách hàng đã có lịch hẹn, không thể xóa"
      });
    }

    await db.query(
      "DELETE FROM customers WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Xóa khách hàng thành công"
    });

  } catch (error) {
    console.error("Lỗi xóa khách hàng:", error);

    res.status(500).json({
      success: false,
      message: "Không thể xóa khách hàng"
    });
  }
});

module.exports = router;
