import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Check,
  X,
  ShoppingBag,
  Store,
  Globe,
  AlertTriangle,
  Package,
  Pencil,
  Trash2,
  Minus,
  ImagePlus
} from "lucide-react";

import { formatMoney } from "../data";
import Modal from "../components/Modal";
import {
  LOW_STOCK_THRESHOLD,
  PRODUCT_CATEGORIES,
  getOrders,
  getProducts,
  getLowStockProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  createOrder,
  updateOrderStatus,
  PAYMENT_METHOD_LABELS,
  ORDER_STATUS_LABELS
} from "../store";

const emptyProductForm = {
  name: "",
  category: PRODUCT_CATEGORIES[0],
  customCategory: "",
  price: "",
  unit: "Hộp 100g",
  stock: 10,
  description: "",
  image: ""
};

export default function Orders() {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState(getOrders);
  const [products, setProducts] = useState(getProducts);

  const [channelFilter, setChannelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  // Modal bán tại tiệm
  const [showInStoreModal, setShowInStoreModal] = useState(false);
  const [posForm, setPosForm] = useState({
    customerName: "Khách mua tại tiệm",
    phone: "",
    paymentMethod: "TIEN_MAT",
    note: "",
    productId: products[0]?.id || "",
    quantity: 1
  });

  // Modal thêm / sửa sản phẩm chi tiết
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState(emptyProductForm);

  const lowStockProducts = useMemo(
    () => getLowStockProducts(products),
    [products]
  );

  const allCategories = useMemo(() => {
    const set = new Set([...PRODUCT_CATEGORIES, ...products.map((p) => p.category)]);
    return Array.from(set).filter(Boolean);
  }, [products]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchChannel =
        channelFilter === "ALL" || order.channel === channelFilter;
      const matchStatus =
        statusFilter === "ALL" || order.status === statusFilter;
      const text = `${order.id} ${order.customerName} ${order.phone} ${order.address} ${order.items
        .map((i) => i.name)
        .join(" ")}`.toLowerCase();
      return matchChannel && matchStatus && text.includes(query.toLowerCase());
    });
  }, [orders, channelFilter, statusFilter, query]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        categoryFilter === "ALL" || p.category === categoryFilter;
      const matchQuery = `${p.id} ${p.name} ${p.category} ${p.description || ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, categoryFilter, query]);

  const showToast = (msg) => {
    setNotice(msg);
    window.clearTimeout(window.__adminOrderToast);
    window.__adminOrderToast = window.setTimeout(() => setNotice(""), 3200);
  };

  const handleStatusChange = (orderId, nextStatus) => {
    setOrders(updateOrderStatus(orderId, nextStatus));
    setProducts(getProducts());
  };

  const selectedPosProduct =
    products.find((p) => p.id === posForm.productId) || products[0];
  const posTotal =
    (selectedPosProduct ? Number(selectedPosProduct.price) : 0) *
    Math.max(1, Number(posForm.quantity || 1));

  const handleCreateInStoreOrder = (e) => {
    e.preventDefault();
    if (!selectedPosProduct) return;

    const qty = Math.max(1, Number(posForm.quantity || 1));
    if (selectedPosProduct.stock < qty) {
      alert(
        `Sản phẩm "${selectedPosProduct.name}" chỉ còn ${selectedPosProduct.stock} trong kho!`
      );
      return;
    }

    createOrder({
      channel: "IN_STORE",
      customerName: posForm.customerName.trim() || "Khách mua tại tiệm",
      phone: posForm.phone.trim() || "Tại quầy",
      address: "Mua trực tiếp tại cửa tiệm",
      paymentMethod: posForm.paymentMethod,
      note: posForm.note.trim(),
      items: [
        {
          id: selectedPosProduct.id,
          name: selectedPosProduct.name,
          price: selectedPosProduct.price,
          quantity: qty
        }
      ],
      total: selectedPosProduct.price * qty
    });

    setOrders(getOrders());
    setProducts(getProducts());
    setShowInStoreModal(false);
    showToast(`Đã tạo đơn bán tại tiệm cho "${selectedPosProduct.name}"`);
  };

  // Mở modal thêm mới
  const openAddProduct = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setShowProductModal(true);
  };

  // Mở modal sửa sản phẩm cũ
  const openEditProduct = (product) => {
    const isKnownCat = PRODUCT_CATEGORIES.includes(product.category);
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      category: isKnownCat ? product.category : "__OTHER__",
      customCategory: isKnownCat ? "" : product.category,
      price: product.price,
      unit: product.unit || "",
      stock: product.stock,
      description: product.description || "",
      image: product.image || ""
    });
    setShowProductModal(true);
  };

  // Upload ảnh từ máy tính -> Base64 Data URL
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Vui lòng chọn ảnh có dung lượng dưới 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProductForm((prev) => ({ ...prev, image: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!productForm.name.trim() || Number(productForm.price) <= 0) return;

    const finalCategory =
      productForm.category === "__OTHER__"
        ? productForm.customCategory.trim() || "Khác"
        : productForm.category;

    const payload = {
      name: productForm.name,
      category: finalCategory,
      price: Number(productForm.price),
      unit: productForm.unit,
      stock: Number(productForm.stock),
      description: productForm.description,
      image: productForm.image
    };

    if (editingProductId) {
      setProducts(updateProduct(editingProductId, payload));
      showToast(`Đã cập nhật sản phẩm "${payload.name}"`);
    } else {
      setProducts(addProduct(payload));
      showToast(`Đã thêm sản phẩm mới "${payload.name}"`);
    }
    setShowProductModal(false);
  };

  const handleDeleteProduct = (product) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${product.name}"?`)) return;
    setProducts(deleteProduct(product.id));
    showToast(`Đã xóa sản phẩm "${product.name}"`);
  };

  const handleQuickStock = (product, delta) => {
    const nextStock = Math.max(0, Number(product.stock) + delta);
    setProducts(updateProduct(product.id, { stock: nextStock }));
  };

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const onlineCount = orders.filter((o) => o.channel === "ONLINE").length;
  const inStoreCount = orders.filter((o) => o.channel === "IN_STORE").length;

  return (
    <>
      {/* Cảnh báo số lượng tồn kho ít */}
      {lowStockProducts.length > 0 && (
        <div
          className="panel"
          style={{
            marginBottom: 16,
            background: "#fff8eb",
            borderColor: "#f0d39a",
            display: "flex",
            alignItems: "flex-start",
            gap: 12
          }}
        >
          <AlertTriangle
            size={20}
            style={{ color: "#b7791f", flexShrink: 0, marginTop: 2 }}
          />
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13, color: "#7c4d0e", display: "block" }}>
              Thông báo: Có {lowStockProducts.length} sản phẩm số lượng ít (≤{" "}
              {LOW_STOCK_THRESHOLD})
            </b>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8c5c19" }}>
              {lowStockProducts
                .map((p) => `${p.name} (còn ${p.stock})`)
                .join(" · ")}
            </p>
          </div>
          {activeTab !== "products" && (
            <button
              type="button"
              className="button button-outline small"
              onClick={() => setActiveTab("products")}
            >
              Nhập thêm hàng
            </button>
          )}
        </div>
      )}

      {notice && (
        <div
          className="panel"
          style={{
            marginBottom: 14,
            background: "#edf6ef",
            borderColor: "#cce6d2",
            color: "#367346",
            fontSize: 12,
            fontWeight: 600,
            padding: "11px 16px"
          }}
        >
          {notice}
        </div>
      )}

      {/* Tab chuyển đổi */}
      <div className="toolbar" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className={`button ${
            activeTab === "orders" ? "button-dark" : "button-outline"
          }`}
          onClick={() => setActiveTab("orders")}
        >
          <ShoppingBag size={16} />
          Đơn hàng ({orders.length})
        </button>

        <button
          type="button"
          className={`button ${
            activeTab === "products" ? "button-dark" : "button-outline"
          }`}
          onClick={() => setActiveTab("products")}
        >
          <Package size={16} />
          Kho sản phẩm ({products.length})
          {lowStockProducts.length > 0 && (
            <span
              style={{
                background: "#c54b3f",
                color: "#fff",
                borderRadius: 999,
                padding: "1px 7px",
                fontSize: 10
              }}
            >
              {lowStockProducts.length} sắp hết
            </span>
          )}
        </button>

        <div className="search-field" style={{ marginLeft: "auto" }}>
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              activeTab === "orders"
                ? "Tìm mã đơn, khách, sản phẩm..."
                : "Tìm tên, phân loại, mô tả..."
            }
          />
        </div>

        {activeTab === "orders" ? (
          <>
            <select
              className="select-control"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
            >
              <option value="ALL">Tất cả kênh bán</option>
              <option value="ONLINE">Đơn đặt Online</option>
              <option value="IN_STORE">Mua tại cửa tiệm</option>
            </select>

            <select
              className="select-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="CONFIRMED">Đã duyệt</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>

            <button
              type="button"
              className="button button-dark"
              onClick={() => setShowInStoreModal(true)}
            >
              <Plus size={17} />
              Bán tại tiệm
            </button>
          </>
        ) : (
          <>
            <select
              className="select-control"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">Tất cả phân loại</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="button button-dark"
              onClick={openAddProduct}
            >
              <Plus size={17} />
              Thêm sản phẩm
            </button>
          </>
        )}
      </div>

      {activeTab === "orders" ? (
        <>
          <div className="summary-strip">
            <div>
              <ShoppingBag />
              <span>Chờ duyệt (Online)</span>
              <b>{pendingCount} đơn</b>
            </div>
            <div>
              <Globe />
              <span>Tổng đơn Online</span>
              <b>{onlineCount} đơn</b>
            </div>
            <div>
              <Store />
              <span>Mua tại cửa tiệm</span>
              <b>{inStoreCount} đơn</b>
            </div>
          </div>

          <div className="panel table-panel">
            <div className="panel-heading">
              <div>
                <h3>Chi tiết đơn hàng</h3>
                <p>Xem chi tiết sản phẩm, địa chỉ, ghi chú và duyệt đơn Online / Tại tiệm</p>
              </div>
              <span className="muted-label">{filteredOrders.length} đơn hàng</span>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>MÃ ĐƠN</th>
                    <th>KÊNH</th>
                    <th>KHÁCH HÀNG</th>
                    <th>CHI TIẾT SẢN PHẨM</th>
                    <th>ĐỊA CHỈ / THANH TOÁN</th>
                    <th>TỔNG TIỀN</th>
                    <th>TRẠNG THÁI</th>
                    <th>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <b>{order.id}</b>
                        <small>
                          {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </small>
                      </td>

                      <td>
                        <span
                          className={`status ${
                            order.channel === "ONLINE"
                              ? "status-in_progress"
                              : "status-confirmed"
                          }`}
                        >
                          {order.channel === "ONLINE" ? "Đặt Online" : "Tại tiệm"}
                        </span>
                      </td>

                      <td>
                        <b>{order.customerName}</b>
                        <small>{order.phone}</small>
                      </td>

                      <td>
                        <div style={{ display: "grid", gap: 4 }}>
                          {order.items.map((item) => (
                            <div key={item.id}>
                              <b>{item.name}</b> × {item.quantity}{" "}
                              <span style={{ color: "#8a867e" }}>
                                ({formatMoney(item.price * item.quantity)})
                              </span>
                            </div>
                          ))}
                          {order.note && (
                            <small style={{ color: "#9a7438" }}>
                              Ghi chú: {order.note}
                            </small>
                          )}
                        </div>
                      </td>

                      <td>
                        <span>{order.address}</span>
                        <small>
                          {PAYMENT_METHOD_LABELS[order.paymentMethod] ||
                            order.paymentMethod}
                        </small>
                      </td>

                      <td>
                        <b>{formatMoney(order.total)}</b>
                      </td>

                      <td>
                        <span
                          className={`status status-${String(
                            order.status
                          ).toLowerCase()}`}
                        >
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>

                      <td>
                        <div className="row-actions">
                          {order.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                className="action-btn success"
                                onClick={() =>
                                  handleStatusChange(order.id, "CONFIRMED")
                                }
                              >
                                <Check size={14} /> Duyệt
                              </button>
                              <button
                                type="button"
                                className="action-btn danger"
                                onClick={() =>
                                  handleStatusChange(order.id, "CANCELLED")
                                }
                              >
                                <X size={14} /> Hủy
                              </button>
                            </>
                          )}

                          {order.status === "CONFIRMED" && (
                            <>
                              <button
                                type="button"
                                className="action-btn success"
                                onClick={() =>
                                  handleStatusChange(order.id, "COMPLETED")
                                }
                              >
                                Hoàn thành
                              </button>
                              <button
                                type="button"
                                className="action-btn danger"
                                onClick={() =>
                                  handleStatusChange(order.id, "CANCELLED")
                                }
                              >
                                Hủy
                              </button>
                            </>
                          )}

                          {order.status === "COMPLETED" && (
                            <span className="muted-label">Đã hoàn tất</span>
                          )}
                          {order.status === "CANCELLED" && (
                            <span className="muted-label">Đã hủy</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <div className="empty-state">Không có đơn hàng nào phù hợp.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="panel table-panel">
          <div className="panel-heading">
            <div>
              <h3>Kho sản phẩm chi tiết</h3>
              <p>
                Thêm/sửa sản phẩm với ảnh, mô tả, phân loại (Lược, Sáp vuốt tóc,
                ...) và tồn kho (cảnh báo khi ≤ {LOW_STOCK_THRESHOLD})
              </p>
            </div>
            <span className="muted-label">{filteredProducts.length} sản phẩm</span>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ẢNH & MÃ</th>
                  <th>SẢN PHẨM & THÔNG TIN</th>
                  <th>PHÂN LOẠI</th>
                  <th>ĐƠN GIÁ</th>
                  <th>TỒN KHO</th>
                  <th>TÌNH TRẠNG</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isOut = product.stock <= 0;
                  const isLow =
                    product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
                  return (
                    <tr key={product.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <img
                            src={product.image}
                            alt={product.name}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 7,
                              objectFit: "cover",
                              border: "1px solid #e9e5dc"
                            }}
                          />
                          <b>{product.id}</b>
                        </div>
                      </td>
                      <td style={{ maxWidth: 280, whiteSpace: "normal" }}>
                        <b>{product.name}</b>
                        <small>
                          {product.unit}
                          {product.description ? ` · ${product.description}` : ""}
                        </small>
                      </td>
                      <td>
                        <span className="status status-in_progress">
                          {product.category}
                        </span>
                      </td>
                      <td>
                        <b>{formatMoney(product.price)}</b>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => handleQuickStock(product, -1)}
                            title="Giảm 1"
                          >
                            <Minus size={12} />
                          </button>
                          <b style={{ minWidth: 26, textAlign: "center" }}>
                            {product.stock}
                          </b>
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => handleQuickStock(product, 1)}
                            title="Tăng 1"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td>
                        {isOut ? (
                          <span className="status status-cancelled">Hết hàng</span>
                        ) : isLow ? (
                          <span className="status status-pending">
                            Sắp hết ({product.stock})
                          </span>
                        ) : (
                          <span className="status status-completed">Còn hàng</span>
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => openEditProduct(product)}
                          >
                            <Pencil size={13} /> Sửa
                          </button>
                          <button
                            type="button"
                            className="action-btn danger"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <Trash2 size={13} /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="empty-state">Không tìm thấy sản phẩm nào.</div>
            )}
          </div>
        </div>
      )}

      {/* Modal bán hàng tại tiệm */}
      {showInStoreModal && (
        <Modal
          title="Tạo đơn mua sản phẩm tại cửa tiệm"
          onClose={() => setShowInStoreModal(false)}
        >
          <form className="form-grid" onSubmit={handleCreateInStoreOrder}>
            <label>
              Tên khách hàng
              <input
                type="text"
                value={posForm.customerName}
                onChange={(e) =>
                  setPosForm({ ...posForm, customerName: e.target.value })
                }
              />
            </label>

            <label>
              Số điện thoại
              <input
                type="text"
                value={posForm.phone}
                onChange={(e) =>
                  setPosForm({ ...posForm, phone: e.target.value })
                }
                placeholder="Không bắt buộc"
              />
            </label>

            <label className="full-field">
              Chọn sản phẩm
              <select
                value={selectedPosProduct?.id || ""}
                onChange={(e) =>
                  setPosForm({ ...posForm, productId: e.target.value })
                }
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.category}] {p.name} — {formatMoney(p.price)} (Còn:{" "}
                    {p.stock})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Số lượng
              <input
                type="number"
                min={1}
                value={posForm.quantity}
                onChange={(e) =>
                  setPosForm({ ...posForm, quantity: e.target.value })
                }
              />
            </label>

            <label>
              Phương thức thanh toán
              <select
                value={posForm.paymentMethod}
                onChange={(e) =>
                  setPosForm({ ...posForm, paymentMethod: e.target.value })
                }
              >
                <option value="TIEN_MAT">{PAYMENT_METHOD_LABELS.TIEN_MAT}</option>
                <option value="CHUYEN_KHOAN">
                  {PAYMENT_METHOD_LABELS.CHUYEN_KHOAN}
                </option>
                <option value="MOMO">{PAYMENT_METHOD_LABELS.MOMO}</option>
              </select>
            </label>

            <label className="full-field">
              Ghi chú
              <input
                type="text"
                value={posForm.note}
                onChange={(e) =>
                  setPosForm({ ...posForm, note: e.target.value })
                }
                placeholder="Ví dụ: Khách quen giảm nhẹ, mua kèm..."
              />
            </label>

            <label className="full-field">
              Tổng thanh toán
              <input type="text" readOnly value={formatMoney(posTotal)} />
            </label>

            <div className="form-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setShowInStoreModal(false)}
              >
                Hủy
              </button>
              <button type="submit" className="button button-dark">
                Xác nhận bán tại tiệm
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Thêm / Sửa sản phẩm chi tiết */}
      {showProductModal && (
        <Modal
          title={
            editingProductId
              ? "Chỉnh sửa sản phẩm"
              : "Thêm sản phẩm mới"
          }
          onClose={() => setShowProductModal(false)}
        >
          <form className="form-grid" onSubmit={handleSaveProduct}>
            <label className="full-field">
              Tên sản phẩm *
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
                placeholder="Ví dụ: Sáp vuốt tóc Clay Pomade / Lược Carbon..."
              />
            </label>

            <label>
              Phân loại *
              <select
                value={productForm.category}
                onChange={(e) =>
                  setProductForm({ ...productForm, category: e.target.value })
                }
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__OTHER__">+ Phân loại khác...</option>
              </select>
            </label>

            {productForm.category === "__OTHER__" ? (
              <label>
                Nhập tên phân loại *
                <input
                  type="text"
                  required
                  value={productForm.customCategory}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      customCategory: e.target.value
                    })
                  }
                  placeholder="Ví dụ: Máy sấy, Dao cạo..."
                />
              </label>
            ) : (
              <label>
                Đơn vị / Quy cách
                <input
                  type="text"
                  value={productForm.unit}
                  onChange={(e) =>
                    setProductForm({ ...productForm, unit: e.target.value })
                  }
                  placeholder="Hộp 100g / Chai 150ml / Cây..."
                />
              </label>
            )}

            <label>
              Giá bán (VNĐ) *
              <input
                type="number"
                min={1000}
                required
                value={productForm.price}
                onChange={(e) =>
                  setProductForm({ ...productForm, price: e.target.value })
                }
              />
            </label>

            <label>
              Số lượng tồn kho *
              <input
                type="number"
                min={0}
                required
                value={productForm.stock}
                onChange={(e) =>
                  setProductForm({ ...productForm, stock: e.target.value })
                }
              />
            </label>

            <label className="full-field">
              Chèn ảnh từ máy tính hoặc dán link URL
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="text"
                  value={productForm.image}
                  onChange={(e) =>
                    setProductForm({ ...productForm, image: e.target.value })
                  }
                  placeholder="Dán URL ảnh hoặc chọn file bên cạnh..."
                  style={{ flex: 1 }}
                />
                <label
                  className="button button-outline small"
                  style={{
                    flexDirection: "row",
                    cursor: "pointer",
                    margin: 0,
                    height: 39,
                    whiteSpace: "nowrap"
                  }}
                >
                  <ImagePlus size={15} />
                  Chọn ảnh
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
              {productForm.image && (
                <img
                  src={productForm.image}
                  alt="Xem trước"
                  style={{
                    marginTop: 8,
                    width: 84,
                    height: 84,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid #e7e3db"
                  }}
                />
              )}
            </label>

            <label className="full-field">
              Thông tin chi tiết sản phẩm
              <textarea
                rows={3}
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    description: e.target.value
                  })
                }
                placeholder="Mô tả công dụng, chất liệu, hướng dẫn sử dụng..."
                style={{
                  border: "1px solid #e7e3db",
                  borderRadius: 6,
                  padding: "8px 10px",
                  font: "inherit",
                  fontSize: 11,
                  outline: "none"
                }}
              />
            </label>

            <div className="form-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setShowProductModal(false)}
              >
                Hủy
              </button>
              <button type="submit" className="button button-dark">
                {editingProductId ? "Lưu thay đổi" : "Thêm sản phẩm"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
