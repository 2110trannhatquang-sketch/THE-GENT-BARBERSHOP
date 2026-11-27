// Shared local store for THE GENT BARBERSHOP (Home Shop + Admin)

export const STORAGE_KEYS = {
  SETTINGS: "salon_shop_settings",
  PRODUCTS: "salon_products",
  CART: "salon_cart",
  ORDERS: "salon_orders",
  APPOINTMENTS: "salon_appointments",
  BARBERS: "salon_barbers"
};

export const LOW_STOCK_THRESHOLD = 5;

export const PRODUCT_CATEGORIES = [
  "Sáp vuốt tóc",
  "Lược",
  "Xịt tạo phồng",
  "Dầu gội nam",
  "Chăm sóc râu",
  "Phụ kiện"
];

export const DEFAULT_BARBERS = [
  { id: "NV001", name: "Trần Quốc Huy", role: "Master Barber", specialty: "Classic & Fade" },
  { id: "NV002", name: "Phạm Đức Long", role: "Senior Barber", specialty: "Tạo kiểu & Gội" },
  { id: "NV003", name: "Nguyễn Thành Đạt", role: "Stylist", specialty: "Uốn & Nhuộm" }
];

export const DEFAULT_SHOP_SETTINGS = {
  shopName: "THE GENT BARBERSHOP",
  tagline: "CLASSIC STYLE — MODERN GENTLEMEN",
  address: "128 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  cityLabel: "HO CHI MINH CITY · VIETNAM",
  phone: "0909 888 777",
  email: "contact@thegentbarber.vn",
  openingHours: "08:00 – 21:00",
  openingDays: "Thứ 2 – Chủ nhật"
};

export const DEFAULT_PRODUCTS = [
  {
    id: "SP001",
    name: "The Gent Matte Clay Pomade",
    category: "Sáp vuốt tóc",
    price: 320000,
    unit: "Hộp 100g",
    stock: 15,
    description: "Giữ nếp mạnh, hoàn thiện mờ tự nhiên, dễ gội sạch.",
    image: "https://images.unsplash.com/photo-1626808642875-0aa545482dfb?auto=format&fit=crop&w=700&q=85"
  },
  {
    id: "SP002",
    name: "Classic Shine Pomade",
    category: "Sáp vuốt tóc",
    price: 350000,
    unit: "Hộp 100g",
    stock: 4,
    description: "Độ bóng cổ điển cho kiểu tóc Slick Back & Side Part.",
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=700&q=85"
  },
  {
    id: "SP003",
    name: "Gentleman Beard Oil",
    category: "Chăm sóc râu",
    price: 280000,
    unit: "Chai 50ml",
    stock: 12,
    description: "Tinh dầu dưỡng râu mềm mượt với hương gỗ tuyết tùng.",
    image: "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=700&q=85"
  },
  {
    id: "SP004",
    name: "Sea Salt Texture Spray",
    category: "Xịt tạo phồng",
    price: 240000,
    unit: "Chai 150ml",
    stock: 3,
    description: "Tạo độ phồng và kết cấu tự nhiên trước khi sấy.",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=85"
  },
  {
    id: "SP005",
    name: "Charcoal Detox Shampoo",
    category: "Dầu gội nam",
    price: 260000,
    unit: "Chai 300ml",
    stock: 9,
    description: "Làm sạch sâu da đầu, loại bỏ bã nhờn và sáp tạo kiểu.",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=700&q=85"
  },
  {
    id: "SP006",
    name: "Barber Carbon Comb Set",
    category: "Phụ kiện",
    price: 150000,
    unit: "Bộ 2 lược",
    stock: 20,
    description: "Lược carbon chống tĩnh điện chuyên dụng cho tạo kiểu.",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&q=85"
  }
];

export const DEFAULT_ORDERS = [
  {
    id: "DH001",
    channel: "ONLINE",
    customerName: "Trần Minh Quân",
    phone: "0908 123 456",
    address: "45 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
    paymentMethod: "COD",
    note: "Giao giờ hành chính",
    items: [
      { id: "SP001", name: "The Gent Matte Clay Pomade", price: 320000, quantity: 1 },
      { id: "SP004", name: "Sea Salt Texture Spray", price: 240000, quantity: 1 }
    ],
    total: 560000,
    status: "PENDING",
    createdAt: "2026-11-26T09:15:00"
  },
  {
    id: "DH002",
    channel: "IN_STORE",
    customerName: "Nguyễn Hoàng Phúc",
    phone: "0912 678 999",
    address: "Mua trực tiếp tại cửa tiệm",
    paymentMethod: "TIEN_MAT",
    note: "Khách cắt tóc mua thêm sáp",
    items: [
      { id: "SP002", name: "Classic Shine Pomade", price: 350000, quantity: 1 }
    ],
    total: 350000,
    status: "COMPLETED",
    createdAt: "2026-11-26T10:30:00"
  },
  {
    id: "DH003",
    channel: "ONLINE",
    customerName: "Lê Quốc Bảo",
    phone: "0933 444 555",
    address: "210 Phan Xích Long, Phú Nhuận, TP. HCM",
    paymentMethod: "CHUYEN_KHOAN",
    note: "",
    items: [
      { id: "SP003", name: "Gentleman Beard Oil", price: 280000, quantity: 1 },
      { id: "SP005", name: "Charcoal Detox Shampoo", price: 260000, quantity: 1 }
    ],
    total: 540000,
    status: "COMPLETED",
    createdAt: "2026-11-25T16:20:00"
  }
];

export const DEFAULT_APPOINTMENTS = [
  { id: "AP001", customer: "Nguyễn Minh Anh", phone: "0901 234 567", service: "Cắt tóc nam", staff: "Trần Quốc Huy", date: "2026-11-26", time: "09:00", status: "CONFIRMED", amount: 120000 },
  { id: "AP002", customer: "Lê Hoàng Nam", phone: "0912 345 678", service: "Cắt + gội", staff: "Phạm Đức Long", date: "2026-11-26", time: "10:00", status: "PENDING", amount: 180000 },
  { id: "AP003", customer: "Phạm Gia Bảo", phone: "0987 654 321", service: "Uốn tóc", staff: "Nguyễn Thành Đạt", date: "2026-11-26", time: "13:30", status: "IN_PROGRESS", amount: 450000 },
  { id: "AP004", customer: "Võ Thanh Tùng", phone: "0933 222 111", service: "Nhuộm tóc", staff: "Nguyễn Thành Đạt", date: "2026-11-26", time: "15:00", status: "COMPLETED", amount: 550000 },
  { id: "AP005", customer: "Đặng Nhật Minh", phone: "0908 111 222", service: "Cắt tóc nam", staff: "Trần Quốc Huy", date: "2026-11-26", time: "16:30", status: "COMPLETED", amount: 120000 },
  { id: "AP006", customer: "Hoàng Gia Huy", phone: "0977 321 654", service: "Cắt + gội", staff: "Phạm Đức Long", date: "2026-11-27", time: "10:30", status: "CONFIRMED", amount: 180000 }
];

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const API_BASE = "http://localhost:5000/api";

const sendToApi = (path, method, body) => {
  try {
    const token = localStorage.getItem("salon_token");
    const headers = { "Content-Type": "application/json" };
    if (token && token !== "local-admin-token") {
      headers.Authorization = `Bearer ${token}`;
    }
    fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    }).catch(() => {});
  } catch {
    // Fallback to localStorage seamlessly when backend/MySQL is offline
  }
};

export const getShopSettings = () => ({
  ...DEFAULT_SHOP_SETTINGS,
  ...readJson(STORAGE_KEYS.SETTINGS, {})
});

export const saveShopSettings = (settings) => {
  const next = { ...DEFAULT_SHOP_SETTINGS, ...settings };
  writeJson(STORAGE_KEYS.SETTINGS, next);
  sendToApi("/settings", "PUT", next);
  return next;
};

export const getProducts = () => {
  const stored = readJson(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  return stored.map((p) => ({
    stock: 10,
    ...p,
    stock: Number.isFinite(Number(p.stock)) ? Number(p.stock) : 10
  }));
};

export const saveProducts = (products) => {
  writeJson(STORAGE_KEYS.PRODUCTS, products);
  return products;
};

export const addProduct = (productInput) => {
  const products = getProducts();
  const nextNum =
    products.reduce((max, p) => {
      const n = Number(String(p.id).replace("SP", ""));
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0) + 1;

  const newProduct = {
    id: `SP${String(nextNum).padStart(3, "0")}`,
    name: productInput.name.trim(),
    category: productInput.category.trim() || "Sản phẩm",
    price: Number(productInput.price || 0),
    unit: productInput.unit.trim() || "Cái",
    stock: Math.max(0, Number(productInput.stock || 0)),
    description: productInput.description.trim(),
    image:
      productInput.image.trim() ||
      "https://images.unsplash.com/photo-1626808642875-0aa545482dfb?auto=format&fit=crop&w=700&q=85"
  };

  const next = [newProduct, ...products];
  saveProducts(next);
  sendToApi("/products", "POST", { ...newProduct, product_code: newProduct.id });
  return next;
};

export const updateProduct = (productId, patch) => {
  const next = getProducts().map((p) =>
    p.id === productId
      ? {
          ...p,
          ...patch,
          price: patch.price !== undefined ? Number(patch.price) : p.price,
          stock: patch.stock !== undefined ? Math.max(0, Number(patch.stock)) : p.stock
        }
      : p
  );
  saveProducts(next);
  sendToApi(`/products/${productId}`, "PUT", patch);
  return next;
};

export const deleteProduct = (productId) => {
  const next = getProducts().filter((p) => p.id !== productId);
  saveProducts(next);
  sendToApi(`/products/${productId}`, "DELETE");
  return next;
};

export const getLowStockProducts = (products = getProducts()) =>
  products.filter((p) => Number(p.stock) <= LOW_STOCK_THRESHOLD);

export const adjustProductStock = (items, direction = -1) => {
  const products = getProducts();
  const updated = products.map((p) => {
    const line = items.find((i) => i.id === p.id);
    if (!line) return p;
    const nextStock = Math.max(0, Number(p.stock) + direction * Number(line.quantity || 0));
    return { ...p, stock: nextStock };
  });
  saveProducts(updated);
  return updated;
};

export const getCart = () => readJson(STORAGE_KEYS.CART, []);

export const saveCart = (cart) => {
  writeJson(STORAGE_KEYS.CART, cart);
  return cart;
};

export const getOrders = () => readJson(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);

export const saveOrders = (orders) => {
  writeJson(STORAGE_KEYS.ORDERS, orders);
  return orders;
};

export const createOrder = (orderInput) => {
  const orders = getOrders();
  const nextNum = orders.reduce((max, o) => {
    const n = Number(String(o.id).replace("DH", ""));
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0) + 1;

  const newOrder = {
    id: `DH${String(nextNum).padStart(3, "0")}`,
    status: orderInput.channel === "IN_STORE" ? "COMPLETED" : "PENDING",
    createdAt: new Date().toISOString(),
    ...orderInput
  };

  if (Array.isArray(orderInput.items)) {
    adjustProductStock(orderInput.items, -1);
  }

  const next = [newOrder, ...orders];
  saveOrders(next);
  sendToApi("/orders", "POST", newOrder);
  return newOrder;
};

export const updateOrderStatus = (orderId, status) => {
  const existing = getOrders().find((o) => o.id === orderId);
  if (existing && existing.status !== "CANCELLED" && status === "CANCELLED") {
    adjustProductStock(existing.items || [], +1);
  }

  const orders = getOrders().map((o) =>
    o.id === orderId ? { ...o, status } : o
  );
  saveOrders(orders);
  sendToApi(`/orders/${orderId}/status`, "PATCH", { status });
  return orders;
};

export const getAppointments = () =>
  readJson(STORAGE_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);

export const saveAppointments = (appointments) => {
  writeJson(STORAGE_KEYS.APPOINTMENTS, appointments);
  return appointments;
};

export const getBarbers = () =>
  readJson(STORAGE_KEYS.BARBERS, DEFAULT_BARBERS);

export const saveBarbers = (barbers) => {
  writeJson(STORAGE_KEYS.BARBERS, barbers);
  return barbers;
};

export const addBarber = (barberInput) => {
  const barbers = getBarbers();
  const nextNum =
    barbers.reduce((max, b) => {
      const n = Number(String(b.id).replace("NV", ""));
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0) + 1;

  const newBarber = {
    id: `NV${String(nextNum).padStart(3, "0")}`,
    name: barberInput.name.trim(),
    role: barberInput.role.trim() || "Thợ cắt tóc",
    specialty: barberInput.specialty.trim() || "Cắt & Tạo kiểu"
  };

  const next = [...barbers, newBarber];
  saveBarbers(next);
  return next;
};

export const deleteBarber = (barberId) => {
  const next = getBarbers().filter((b) => b.id !== barberId);
  saveBarbers(next);
  return next;
};

export const PAYMENT_METHOD_LABELS = {
  COD: "Thanh toán khi nhận hàng (COD)",
  CHUYEN_KHOAN: "Chuyển khoản ngân hàng",
  MOMO: "Ví MoMo / ZaloPay",
  TIEN_MAT: "Tiền mặt tại tiệm"
};

export const ORDER_STATUS_LABELS = {
  PENDING: "Chờ duyệt",
  CONFIRMED: "Đã duyệt",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy"
};
