
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const router = express.Router();

// POST: Đăng nhập
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên đăng nhập và mật khẩu"
      });
    }

    const [rows] = await db.query(
      `SELECT id, username, password, full_name, email, phone, role, status
       FROM users
       WHERE username = ?
       LIMIT 1`,
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng"
      });
    }

    const user = rows[0];
// Chỉ OWNER và STAFF được đăng nhập trang quản trị
if (!["OWNER", "STAFF"].includes(user.role)) {
  return res.status(403).json({
    success: false,
    message: "Tài khoản khách hàng không được phép đăng nhập trang quản trị"
  });
}
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị khóa hoặc ngừng hoạt động"
      });
    }

    const isBcrypt = /^\$2[aby]\$/.test(user.password);

    const passwordValid = isBcrypt
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng"
      });
    }

    // Tự nâng cấp mật khẩu cũ sang Bcrypt
    if (!isBcrypt) {
      const hashedPassword = await bcrypt.hash(password, 12);

      await db.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, user.id]
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
      }
    );

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Lỗi đăng nhập:", error);

    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi đăng nhập"
    });
  }
});
// OWNER cập nhật email tài khoản
router.put(
  "/profile/email",
  authMiddleware,
  authorizeRoles("OWNER"),
  async (req, res) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();

      // Kiểm tra định dạng email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Email không hợp lệ"
        });
      }

      // Kiểm tra email đã được tài khoản khác sử dụng chưa
      const [existing] = await db.query(
        "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
        [email, req.user.id]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email này đã được sử dụng"
        });
      }

      // Cập nhật email OWNER
      await db.query(
        "UPDATE users SET email = ? WHERE id = ? AND role = 'OWNER'",
        [email, req.user.id]
      );

      return res.json({
        success: true,
        message: "Cập nhật email thành công",
        email
      });
    } catch (error) {
      console.error("Update OWNER email error:", error);

      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ khi cập nhật email"
      });
    }
  }
);
module.exports = router;
