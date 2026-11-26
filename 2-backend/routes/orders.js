const express = require("express");
const router = express.Router();
const db = require("../db");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

// GET /api/orders - Lấy danh sách đơn hàng kèm chi tiết món (Admin)
router.get("/", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT id AS db_id, order_code AS id, channel, customer_name AS customerName,
              phone, address, payment_method AS paymentMethod, note,
              total_amount AS total, status, created_at AS createdAt
       FROM orders
       ORDER BY id DESC`
    );

    const [items] = await db.query(
      `SELECT order_id, product_name AS name, price, quantity FROM order_items`
    );

    const data = orders.map((o) => ({
      ...o,
      items: items.filter((i) => i.order_id === o.db_id)
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error("Lỗi lấy đơn hàng:", error);
    res.status(500).json({ success: false, message: "Không thể tải đơn hàng" });
  }
});

// POST /api/orders - Khách đặt Online (public) hoặc Admin tạo đơn tại tiệm
router.post("/", async (req, res) => {
  const { channel, customerName, phone, address, paymentMethod, note, items, total } = req.body;
  if (!customerName || !phone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Thiếu thông tin đơn hàng" });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const orderCode = `DH${Date.now().toString().slice(-6)}`;
    const status = channel === "IN_STORE" ? "COMPLETED" : "PENDING";

    const [result] = await connection.query(
      `INSERT INTO orders (order_code, channel, customer_name, phone, address, payment_method, note, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderCode,
        channel === "IN_STORE" ? "IN_STORE" : "ONLINE",
        customerName,
        phone,
        address || "Mua trực tiếp tại cửa tiệm",
        paymentMethod || "COD",
        note || "",
        Number(total || 0),
        status
      ]
    );

    const orderId = result.insertId;
    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_name, price, quantity)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.name, Number(item.price), Number(item.quantity)]
      );

      if (item.id) {
        await connection.query(
          `UPDATE products SET stock = GREATEST(0, stock - ?) WHERE product_code = ?`,
          [Number(item.quantity), item.id]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ success: true, id: orderCode });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Lỗi tạo đơn hàng:", error);
    res.status(500).json({ success: false, message: "Không thể tạo đơn hàng" });
  } finally {
    if (connection) connection.release();
  }
});

// PATCH /api/orders/:code/status - Duyệt / Hoàn thành / Hủy đơn (Admin)
router.patch("/:code/status", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    await db.query("UPDATE orders SET status = ? WHERE order_code = ?", [
      status,
      req.params.code
    ]);
    res.json({ success: true, message: "Cập nhật đơn hàng thành công" });
  } catch (error) {
    console.error("Lỗi cập nhật đơn hàng:", error);
    res.status(500).json({ success: false, message: "Không thể cập nhật đơn hàng" });
  }
});

module.exports = router;
