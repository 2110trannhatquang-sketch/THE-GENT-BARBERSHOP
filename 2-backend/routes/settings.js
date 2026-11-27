const express = require("express");
const router = express.Router();
const db = require("../db");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

// GET /api/settings - Lấy thông tin cửa hàng (public cho Trang chủ)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT shop_name AS shopName, tagline, address, city_label AS cityLabel,
              phone, email, opening_hours AS openingHours, opening_days AS openingDays
       FROM shop_settings WHERE id = 1 LIMIT 1`
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (error) {
    console.error("Lỗi lấy cài đặt:", error);
    res.status(500).json({ success: false, message: "Không thể tải cài đặt cửa hàng" });
  }
});

// PUT /api/settings - Cập nhật thông tin cửa hàng (Admin)
router.put("/", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
    const { shopName, tagline, address, cityLabel, phone, email, openingHours, openingDays } = req.body;
    await db.query(
      `INSERT INTO shop_settings (id, shop_name, tagline, address, city_label, phone, email, opening_hours, opening_days)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         shop_name = VALUES(shop_name),
         tagline = VALUES(tagline),
         address = VALUES(address),
         city_label = VALUES(city_label),
         phone = VALUES(phone),
         email = VALUES(email),
         opening_hours = VALUES(opening_hours),
         opening_days = VALUES(opening_days)`,
      [shopName, tagline, address, cityLabel, phone, email, openingHours, openingDays]
    );
    res.json({ success: true, message: "Đã lưu cài đặt cửa hàng" });
  } catch (error) {
    console.error("Lỗi lưu cài đặt:", error);
    res.status(500).json({ success: false, message: "Không thể lưu cài đặt" });
  }
});

module.exports = router;
