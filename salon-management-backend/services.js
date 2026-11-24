
const express = require("express");
const router = express.Router();
const db = require("../db");

// 1. LẤY DANH SÁCH DỊCH VỤ
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM services ORDER BY id DESC"
    );

    const services = rows.map((item) => ({
      id: item.id,
      service_code: item.service_code,
      name: item.service_name,
      description: item.description || "",
      price: Number(item.price),
      duration: item.duration,
      active: item.status === "ACTIVE"
    }));

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
router.post("/", async (req, res) => {
  try {
    const {
      name,
      service_name,
      description,
      price,
      duration,
      active
    } = req.body;

    const serviceName = name || service_name;

    if (
      !serviceName ||
      price === undefined ||
      duration === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin dịch vụ"
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

    const [rows] = await db.query(
      "SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM services"
    );

    const serviceCode =
      `DV${String(rows[0].nextId).padStart(3, "0")}`;

    const status = active === false ? "INACTIVE" : "ACTIVE";

    const [result] = await db.query(
      `INSERT INTO services
       (service_code, service_name, description, price, duration, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        serviceCode,
        serviceName,
        description || null,
        Number(price),
        Number(duration),
        status
      ]
    );

    res.status(201).json({
      success: true,
      message: "Thêm dịch vụ thành công",
      id: result.insertId,
      service_code: serviceCode
    });

  } catch (error) {
    console.error("Lỗi thêm dịch vụ:", error);

    res.status(500).json({
      success: false,
      message: "Không thể thêm dịch vụ"
    });
  }
});

// 3. CẬP NHẬT DỊCH VỤ
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      service_name,
      description,
      price,
      duration
    } = req.body;

    const serviceName = name || service_name;

    if (
      !serviceName ||
      price === undefined ||
      duration === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cập nhật"
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
      `UPDATE services
       SET service_name = ?,
           description = ?,
           price = ?,
           duration = ?
       WHERE id = ?`,
      [
        serviceName,
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
    console.error("Lỗi cập nhật dịch vụ:", error);

    res.status(500).json({
      success: false,
      message: "Không thể cập nhật dịch vụ"
    });
  }
});

// 4. ẨN / HIỆN DỊCH VỤ
// 4. ẨN / HIỆN DỊCH VỤ
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { active, status } = req.body;

    let newStatus;

    if (typeof active === "boolean") {
      newStatus = active ? "ACTIVE" : "INACTIVE";
    } else if (status === "ACTIVE" || status === "INACTIVE") {
      newStatus = status;
    } else {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ"
      });
    }

    const [check] = await db.query(
      "SELECT id FROM services WHERE id = ?",
      [id]
    );

    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ"
      });
    }

    await db.query(
      "UPDATE services SET status = ? WHERE id = ?",
      [newStatus, id]
    );

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
