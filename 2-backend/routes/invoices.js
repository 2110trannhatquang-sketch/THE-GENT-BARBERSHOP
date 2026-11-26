const express = require("express");
const router = express.Router();
const db = require("../db");
const {
  authMiddleware,
  authorizeRoles
} = require("../middleware/authMiddleware");

// GET: Lấy danh sách hóa đơn
router.get("/", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        i.id,
        i.invoice_code,
        i.appointment_id,
        i.total_amount,
        i.status,
        i.payment_method,
        i.paid_at,
        i.created_at,
        c.full_name AS customer_name,
        a.appointment_code
      FROM invoices i
      JOIN appointments a ON a.id = i.appointment_id
      JOIN customers c ON c.id = a.customer_id
      ORDER BY i.created_at DESC
    `);

    res.json({
      success: true,
      total: rows.length,
      data: rows
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách hóa đơn:", error);

    res.status(500).json({
      success: false,
      message: "Không thể tải danh sách hóa đơn"
    });
  }
});

// PATCH: Ghi nhận thanh toán hóa đơn
router.patch("/:id/pay", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { method } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID hóa đơn không hợp lệ"
      });
    }

    if (!["CASH", "BANK_TRANSFER"].includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Phương thức thanh toán không hợp lệ"
      });
    }

    const [invoices] = await db.query(
      "SELECT id, status FROM invoices WHERE id = ?",
      [id]
    );

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hóa đơn"
      });
    }

    if (invoices[0].status === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Hóa đơn đã được thanh toán"
      });
    }

    await db.query(
      `UPDATE invoices
       SET status = 'PAID',
           payment_method = ?,
           paid_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [method, id]
    );

    res.json({
      success: true,
      message: "Thanh toán hóa đơn thành công"
    });

  } catch (error) {
    console.error("Lỗi thanh toán hóa đơn:", error);

    res.status(500).json({
      success: false,
      message: "Không thể thanh toán hóa đơn"
    });
  }
});

module.exports = router;