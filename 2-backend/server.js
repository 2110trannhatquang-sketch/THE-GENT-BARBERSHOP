
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");
const serviceRoutes = require("./routes/services");
const staffRoutes = require("./routes/staff");
const customerRoutes = require("./routes/customers");
const app = express();
const appointmentRoutes = require("./routes/appointments");
const invoiceRoutes = require("./routes/invoices");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const settingsRoutes = require("./routes/settings");

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use((req, res, next) => {
  if (req.method === "POST" && req.originalUrl === "/api/appointments") {
    console.log("CO REQUEST TAO LICH:", req.body);
  }
  next();
});
app.use("/api/staff", staffRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/settings", settingsRoutes);

// Kiểm tra server
app.get("/", (req, res) => {
  res.json({
    message: "THE GENT BARBERSHOP API is running!"
  });
});

// Kiểm tra kết nối MySQL
app.get("/api/test", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DATABASE() AS database_name"
    );

    res.json({
      success: true,
      message: "Backend kết nối MySQL thành công!",
      database: rows[0].database_name
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Không thể kết nối MySQL"
    });
  }
});

// Đăng ký các API dịch vụ
app.use("/api/services", serviceRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
