const express = require("express");
const router = express.Router();
const db = require("../db");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

// GET /api/products - Công khai cho Trang chủ & Admin
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT product_code AS id, name, category, price, unit, stock, description, image FROM products ORDER BY id DESC"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Lỗi lấy sản phẩm:", error);
    res.status(500).json({ success: false, message: "Không thể tải sản phẩm" });
  }
});

// POST /api/products - Thêm sản phẩm (Admin)
router.post("/", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
    const { product_code, name, category, price, unit, stock, description, image } = req.body;
    if (!name || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: "Tên và giá sản phẩm không hợp lệ" });
    }

    const code = product_code || `SP${Date.now().toString().slice(-5)}`;
    await db.query(
      `INSERT INTO products (product_code, name, category, price, unit, stock, description, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        name.trim(),
        category || "Sản phẩm",
        Number(price),
        unit || "Cái",
        Math.max(0, Number(stock || 0)),
        description || "",
        image || ""
      ]
    );

    res.status(201).json({ success: true, message: "Thêm sản phẩm thành công", id: code });
  } catch (error) {
    console.error("Lỗi thêm sản phẩm:", error);
    res.status(500).json({ success: false, message: "Không thể thêm sản phẩm" });
  }
});

// PUT /api/products/:code - Sửa sản phẩm & tồn kho (Admin)
router.put("/:code", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
    const { code } = req.params;
    const { name, category, price, unit, stock, description, image } = req.body;

    await db.query(
      `UPDATE products
       SET name = COALESCE(?, name),
           category = COALESCE(?, category),
           price = COALESCE(?, price),
           unit = COALESCE(?, unit),
           stock = COALESCE(?, stock),
           description = COALESCE(?, description),
           image = COALESCE(?, image)
       WHERE product_code = ?`,
      [
        name ?? null,
        category ?? null,
        price !== undefined ? Number(price) : null,
        unit ?? null,
        stock !== undefined ? Math.max(0, Number(stock)) : null,
        description ?? null,
        image ?? null,
        code
      ]
    );

    res.json({ success: true, message: "Cập nhật sản phẩm thành công" });
  } catch (error) {
    console.error("Lỗi cập nhật sản phẩm:", error);
    res.status(500).json({ success: false, message: "Không thể cập nhật sản phẩm" });
  }
});

// DELETE /api/products/:code - Xóa sản phẩm (Admin)
router.delete("/:code", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
    await db.query("DELETE FROM products WHERE product_code = ?", [req.params.code]);
    res.json({ success: true, message: "Đã xóa sản phẩm" });
  } catch (error) {
    console.error("Lỗi xóa sản phẩm:", error);
    res.status(500).json({ success: false, message: "Không thể xóa sản phẩm" });
  }
});

module.exports = router;
