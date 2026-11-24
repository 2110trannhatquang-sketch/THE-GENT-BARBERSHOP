
const express = require("express");
const router = express.Router();
const db = require("../db");
const {
  authMiddleware,
  authorizeRoles
} = require("../middleware/authMiddleware");

// 1. LẤY DANH SÁCH DỊCH VỤ
router.get("/", authMiddleware, authorizeRoles("OWNER", "STAFF"), async (req, res) => {
  try {
    const [services] = await db.query(
      "SELECT * FROM services ORDER BY id DESC"
    );

    res.json({
      success: true,
      total: services.length,
      data: services
    });
  } catch (error) {
    console.error("Lỗi lấy dịch vụ:", error);

    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách dịch vụ"
    });
  }
});

// 2. THÊM DỊCH VỤ
router.post("/", authMiddleware, authorizeRoles("OWNER"), async (req, res) => {
  try {
    const {
      service_code,
      service_name,
      description,
      price,
      duration
    } = req.body;

    if (
      !service_code ||
      !service_name ||
      price === undefined ||
      duration === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin"
      });
    }

    if (
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      !Number.isInteger(Number(duration)) ||
      Number(duration) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Giá hoặc thời lượng không hợp lệ"
      });
    }

    const [result] = await db.query(
      `INSERT INTO services
      (service_code, service_name, description, price, duration, status)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
      [
        service_code,
        service_name,
        description || null,
        Number(price),
        Number(duration)
      ]
    );

    res.status(201).json({
      success: true,
      message: "Thêm dịch vụ thành công",
      id: result.insertId
    });

  } catch (error) {
    console.error("Lỗi thêm dịch vụ:", error);

    res.status(500).json({
      success: false,
      message: "Không thể thêm dịch vụ",
      error: error.message
    });
  }
});

// 3. CẬP NHẬT DỊCH VỤ
router.put("/:id", authMiddleware, authorizeRoles("OWNER"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      service_name,
      description,
      price,
      duration
    } = req.body;

    if (
      !service_name ||
      price === undefined ||
      duration === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cập nhật"
      });
    }

    const [result] = await db.query(
      `UPDATE services
       SET service_name = ?,
           description = ?,
           price = ?,
           duration = ?
       WHERE id = ?`,
      [
        service_name,
        description || null,
        Number(price),
        Number(duration),
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ"
      });
    }

    res.json({
      success: true,
      message: "Cập nhật dịch vụ thành công"
    });

  } catch (error) {
    console.error("Lỗi cập nhật:", error);

    res.status(500).json({
      success: false,
      message: "Không thể cập nhật dịch vụ"
    });
  }
});

// 4. ẨN / HIỆN DỊCH VỤ
router.patch("/:id/status", authMiddleware, authorizeRoles("OWNER"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ"
      });
    }

    const [result] = await db.query(
      "UPDATE services SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ"
      });
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công"
    });

  } catch (error) {
    console.error("Lỗi cập nhật trạng thái:", error);

    res.status(500).json({
      success: false,
      message: "Không thể cập nhật trạng thái"
    });
  }
});

module.exports = router;
