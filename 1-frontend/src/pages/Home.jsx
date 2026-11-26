import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  ArrowLeft
} from "lucide-react";
import "./Home.css";
import useScrollReveal from "../hooks/useScrollReveal";
import { formatMoney } from "../data";
import {
  getShopSettings,
  getProducts,
  getCart,
  saveCart,
  createOrder,
  PAYMENT_METHOD_LABELS
} from "../store";

export default function Home() {
  useScrollReveal();

  const [settings, setSettings] = useState(getShopSettings);
  const [products, setProducts] = useState(getProducts);
  const [cart, setCart] = useState(getCart);

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("cart"); // "cart" | "checkout" | "success"
  const [toast, setToast] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [formError, setFormError] = useState("");

  const [checkoutForm, setCheckoutForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    paymentMethod: "COD",
    note: ""
  });

  useEffect(() => {
    const syncData = () => {
      setSettings(getShopSettings());
      setProducts(getProducts());
    };
    window.addEventListener("storage", syncData);
    window.addEventListener("focus", syncData);
    return () => {
      window.removeEventListener("storage", syncData);
      window.removeEventListener("focus", syncData);
    };
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(window.__gentToastTimer);
    window.__gentToastTimer = window.setTimeout(() => {
      setToast("");
    }, 2600);
  };

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    const nextCart = existing
      ? cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [
          ...cart,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            unit: product.unit,
            quantity: 1
          }
        ];

    setCart(nextCart);
    saveCart(nextCart);
    showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
  };

  const updateQuantity = (productId, delta) => {
    const nextCart = cart
      .map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity + delta }
          : item
      )
      .filter((item) => item.quantity > 0);

    setCart(nextCart);
    saveCart(nextCart);
  };

  const removeFromCart = (productId) => {
    const nextCart = cart.filter((item) => item.id !== productId);
    setCart(nextCart);
    saveCart(nextCart);
  };

  const openCartDrawer = () => {
    setFormError("");
    setCheckoutStep("cart");
    setCartOpen(true);
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    const name = checkoutForm.customerName.trim();
    const phone = checkoutForm.phone.trim();
    const address = checkoutForm.address.trim();

    if (!name || !phone || !address) {
      setFormError("Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.");
      return;
    }

    if (phone.replace(/\D/g, "").length < 9) {
      setFormError("Số điện thoại không hợp lệ.");
      return;
    }

    if (cart.length === 0) {
      setFormError("Giỏ hàng đang trống.");
      return;
    }

    const order = createOrder({
      channel: "ONLINE",
      customerName: name,
      phone,
      address,
      paymentMethod: checkoutForm.paymentMethod,
      note: checkoutForm.note.trim(),
      items: cart.map(({ id, name: itemName, price, quantity }) => ({
        id,
        name: itemName,
        price,
        quantity
      })),
      total: cartTotal
    });

    setCreatedOrder(order);
    setCart([]);
    saveCart([]);
    setCheckoutForm({
      customerName: "",
      phone: "",
      address: "",
      paymentMethod: "COD",
      note: ""
    });
    setCheckoutStep("success");
  };

  return (
    <main className="home-page">
      {toast && <div className="shop-toast">{toast}</div>}

      {/* HEADER */}
      <header className="home-header">
        <Link to="/" className="home-logo">
          THE <span>GENT</span>
          <small>BARBERSHOP</small>
        </Link>

        <nav className="home-nav">
          <a href="#home">Trang chủ</a>
          <a href="#services">Dịch vụ</a>
          <a href="#shop">Sản phẩm</a>
          <a href="#our-story">Về chúng tôi</a>
          <a href="#gallery">Hình ảnh</a>
        </nav>

        <div className="home-header-actions">
          <button
            type="button"
            className="home-cart-btn"
            onClick={openCartDrawer}
            aria-label="Mở giỏ hàng"
          >
            <ShoppingBag size={17} />
            <span>Giỏ hàng</span>
            {totalItems > 0 && <b className="cart-badge">{totalItems}</b>}
          </button>

          <Link to="/booking" className="home-booking-btn">
            ĐẶT LỊCH
            <span>↗</span>
          </Link>

          <Link to="/login" className="home-admin-link">
            Quản trị
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="hero-section" id="home">
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <p className="hero-subtitle">
            EST. {settings.shopName}
          </p>

          <h1>
            YOUR STYLE.
            <br />
            <span>YOUR IDENTITY.</span>
          </h1>

          <p className="hero-description">
            Không chỉ là một kiểu tóc.
            Đó là phong cách và dấu ấn riêng của bạn.
          </p>

          <div className="hero-actions">
            <Link to="/booking" className="hero-btn">
              ĐẶT LỊCH NGAY <span>↗</span>
            </Link>

            <a href="#shop" className="hero-explore">
              MUA SẮM SẢN PHẨM ↓
            </a>
          </div>
        </div>

        <div className="hero-bottom">
          <span>{settings.tagline}</span>
          <span>{settings.cityLabel}</span>
        </div>
      </section>

      {/* GIỚI THIỆU */}
      <section className="home-intro reveal" id="about">
        <span>WELCOME TO {settings.shopName}</span>
        <h2>
          THE ART OF
          <br />
          <em>GENTLEMAN.</em>
        </h2>
        <p>
          Nơi phong cách cổ điển gặp gỡ tinh thần hiện đại.
          Chúng tôi tạo nên dấu ấn riêng cho mỗi quý ông.
        </p>
      </section>

      {/* SERVICES SECTION */}
      <section className="services-section reveal" id="services">
        <div className="services-heading">
          <div>
            <span className="section-label">WHAT WE DO</span>
            <h2>OUR <em>SERVICES.</em></h2>
          </div>

          <p>
            Chăm chút từng đường kéo, tạo nên phong cách
            riêng biệt dành cho mỗi quý ông.
          </p>
        </div>

        <div className="services-grid">
          <article className="service-item reveal">
            <div className="service-image">
              <img
                src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=85"
                alt="Classic haircut"
              />
              <span>01</span>
            </div>

            <div className="service-info">
              <div>
                <h3>CLASSIC HAIRCUT</h3>
                <p>Cắt tóc và tạo kiểu theo phong cách riêng.</p>
              </div>
              <span className="service-arrow">↗</span>
            </div>
          </article>

          <article className="service-item reveal">
            <div className="service-image">
              <img
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=85"
                alt="Modern haircut"
              />
              <span>02</span>
            </div>

            <div className="service-info">
              <div>
                <h3>HAIR STYLING</h3>
                <p>Tạo kiểu và hoàn thiện diện mạo.</p>
              </div>
              <span className="service-arrow">↗</span>
            </div>
          </article>

          <article className="service-item reveal">
            <div className="service-image">
              <img
                src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=900&q=85"
                alt="Beard grooming"
              />
              <span>03</span>
            </div>

            <div className="service-info">
              <div>
                <h3>BEARD GROOMING</h3>
                <p>Chăm sóc và tạo hình râu gọn gàng.</p>
              </div>
              <span className="service-arrow">↗</span>
            </div>
          </article>
        </div>

        <div className="services-footer">
          <span>THE GENT — GROOMING EXPERIENCE</span>
          <Link to="/booking">ĐẶT LỊCH NGAY ↗</Link>
        </div>
      </section>

      {/* SHOP SECTION - MUA SẮM DÀNH CHO KHÁCH */}
      <section className="shop-section reveal" id="shop">
        <div className="services-heading">
          <div>
            <span className="section-label">GROOMING STORE</span>
            <h2>GENT <em>PRODUCTS.</em></h2>
          </div>

          <p>
            Sản phẩm chăm sóc tóc và râu tuyển chọn, đặt online giao tận nơi
            hoặc nhận trực tiếp tại tiệm.
          </p>
        </div>

        <div className="shop-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image-wrap">
                <img src={product.image} alt={product.name} />
                <span className="product-category">{product.category}</span>
              </div>

              <div className="product-body">
                <div className="product-meta-row">
                  <small>{product.unit}</small>
                  <strong>{formatMoney(product.price)}</strong>
                </div>

                <h3>{product.name}</h3>
                <p>{product.description}</p>

                <button
                  type="button"
                  className="add-cart-btn"
                  disabled={product.stock <= 0}
                  onClick={() => addToCart(product)}
                >
                  <Plus size={16} />
                  {product.stock > 0 ? "Thêm vào giỏ" : "Tạm hết hàng"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section className="about-section reveal" id="our-story">
        <div className="about-image">
          <img
            src="https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=1200&q=85"
            alt="The Gent Barbershop"
          />

          <div className="about-image-label">
            <span>THE GENT</span>
            <small>EST. BARBERSHOP</small>
          </div>
        </div>

        <div className="about-content">
          <span className="section-label">OUR STORY</span>

          <h2>
            MORE THAN
            <br />
            A <em>HAIRCUT.</em>
          </h2>

          <div className="about-line"></div>

          <p className="about-lead">
            Phong cách không chỉ nằm ở vẻ ngoài.
            Đó còn là cách bạn thể hiện bản thân.
          </p>

          <p className="about-description">
            {settings.shopName} được xây dựng với mong muốn mang đến
            trải nghiệm chăm sóc tóc chỉn chu, chuyên nghiệp
            và đầy cảm hứng. Từ những đường kéo tỉ mỉ đến
            từng chi tiết nhỏ, chúng tôi luôn đặt phong cách
            và sự hài lòng của khách hàng lên hàng đầu.
          </p>

          <Link to="/booking" className="about-button">
            TRẢI NGHIỆM NGAY <span>↗</span>
          </Link>

          <div className="about-signature">
            <span>THE GENT</span>
            <small>{settings.tagline}</small>
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section className="gallery-section reveal" id="gallery">
        <div className="gallery-heading">
          <div>
            <span className="section-label">OUR PORTFOLIO</span>
            <h2>THE GENT <em>GALLERY.</em></h2>
          </div>

          <p>
            Mỗi kiểu tóc là một dấu ấn.
            Khám phá phong cách mang đậm cá tính riêng.
          </p>
        </div>

        <div className="gallery-grid">
          <div className="gallery-item gallery-large">
            <img
              src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=85"
              alt="Barber haircut"
            />
            <span>01 / THE ART OF CUTTING</span>
          </div>

          <div className="gallery-item">
            <img
              src="https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?auto=format&fit=crop&w=900&q=85"
              alt="Modern gentleman hairstyle"
            />
            <span>02 / MODERN GENTLEMAN</span>
          </div>

          <div className="gallery-item">
            <img
              src="https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=900&q=85"
              alt="Barbershop experience"
            />
            <span>03 / THE EXPERIENCE</span>
          </div>
        </div>

        <div className="gallery-footer">
          <span>STYLE IS A WAY TO SAY WHO YOU ARE.</span>
          <Link to="/booking">BOOK YOUR EXPERIENCE ↗</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="home-logo">
              THE <span>GENT</span>
              <small>BARBERSHOP</small>
            </Link>

            <p>
              {settings.tagline}.
              <br />
              <span className="footer-address-line">
                <MapPin size={14} /> {settings.address}
              </span>
              <br />
              <span className="footer-address-line">
                <Phone size={14} /> {settings.phone}
              </span>
              <br />
              <span className="footer-address-line">
                <Mail size={14} /> {settings.email}
              </span>
            </p>
          </div>

          <div className="footer-column">
            <h3>EXPLORE</h3>
            <a href="#home">Trang chủ</a>
            <a href="#services">Dịch vụ</a>
            <a href="#shop">Sản phẩm</a>
            <a href="#our-story">Về chúng tôi</a>
            <a href="#gallery">Hình ảnh</a>
          </div>

          <div className="footer-column">
            <h3>OPENING HOURS</h3>
            <p>{settings.openingDays}</p>
            <p>{settings.openingHours}</p>
            <span>WELCOME TO THE GENT</span>
          </div>

          <div className="footer-column">
            <h3>BOOKING</h3>
            <p>Sẵn sàng làm mới phong cách?</p>
            <Link to="/booking" className="footer-booking">
              ĐẶT LỊCH NGAY ↗
            </Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 {settings.shopName}.</span>
          <span>CRAFTED FOR GENTLEMEN.</span>
          <a href="#home">BACK TO TOP ↑</a>
        </div>
      </footer>

      {/* CART & CHECKOUT DRAWER */}
      {cartOpen && (
        <div className="cart-backdrop" onClick={() => setCartOpen(false)}>
          <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-head">
              <div>
                <h3>
                  {checkoutStep === "cart" && "Giỏ hàng của bạn"}
                  {checkoutStep === "checkout" && "Thông tin thanh toán"}
                  {checkoutStep === "success" && "Đặt hàng thành công"}
                </h3>
                <small>
                  {checkoutStep === "cart" && `${totalItems} sản phẩm`}
                  {checkoutStep === "checkout" && `Tổng thanh toán: ${formatMoney(cartTotal)}`}
                  {checkoutStep === "success" && "Cảm ơn bạn đã mua sắm tại THE GENT"}
                </small>
              </div>
              <button
                type="button"
                className="cart-close-btn"
                onClick={() => setCartOpen(false)}
                aria-label="Đóng giỏ hàng"
              >
                <X size={20} />
              </button>
            </div>

            {checkoutStep === "cart" && (
              <>
                <div className="cart-drawer-body">
                  {cart.length === 0 ? (
                    <div className="cart-empty">
                      <ShoppingBag size={40} />
                      <p>Giỏ hàng của bạn đang trống.</p>
                      <button
                        type="button"
                        className="cart-secondary-btn"
                        onClick={() => setCartOpen(false)}
                      >
                        Tiếp tục xem sản phẩm
                      </button>
                    </div>
                  ) : (
                    <div className="cart-items-list">
                      {cart.map((item) => (
                        <div className="cart-item" key={item.id}>
                          <img src={item.image} alt={item.name} />
                          <div className="cart-item-info">
                            <b>{item.name}</b>
                            <small>{formatMoney(item.price)}</small>
                            <div className="cart-qty-row">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                aria-label="Giảm số lượng"
                              >
                                <Minus size={13} />
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                aria-label="Tăng số lượng"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </div>
                          <div className="cart-item-right">
                            <b>{formatMoney(item.price * item.quantity)}</b>
                            <button
                              type="button"
                              className="cart-remove-btn"
                              onClick={() => removeFromCart(item.id)}
                              aria-label="Xóa sản phẩm"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="cart-drawer-foot">
                    <div className="cart-total-row">
                      <span>Tạm tính</span>
                      <strong>{formatMoney(cartTotal)}</strong>
                    </div>
                    <button
                      type="button"
                      className="cart-primary-btn"
                      onClick={() => {
                        setFormError("");
                        setCheckoutStep("checkout");
                      }}
                    >
                      Thanh toán ({formatMoney(cartTotal)})
                    </button>
                  </div>
                )}
              </>
            )}

            {checkoutStep === "checkout" && (
              <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
                <div className="cart-drawer-body">
                  <button
                    type="button"
                    className="checkout-back-btn"
                    onClick={() => setCheckoutStep("cart")}
                  >
                    <ArrowLeft size={15} /> Quay lại giỏ hàng
                  </button>

                  <div className="checkout-summary-box">
                    {cart.map((item) => (
                      <div key={item.id} className="checkout-summary-line">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <b>{formatMoney(item.price * item.quantity)}</b>
                      </div>
                    ))}
                    <div className="checkout-summary-total">
                      <span>Tổng cộng</span>
                      <strong>{formatMoney(cartTotal)}</strong>
                    </div>
                  </div>

                  <div className="checkout-fields">
                    <label>
                      Họ và tên *
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Nguyễn Văn A"
                        value={checkoutForm.customerName}
                        onChange={(e) =>
                          setCheckoutForm({
                            ...checkoutForm,
                            customerName: e.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Số điện thoại *
                      <input
                        type="tel"
                        required
                        placeholder="09xx xxx xxx"
                        value={checkoutForm.phone}
                        onChange={(e) =>
                          setCheckoutForm({
                            ...checkoutForm,
                            phone: e.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Địa chỉ nhận hàng *
                      <input
                        type="text"
                        required
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                        value={checkoutForm.address}
                        onChange={(e) =>
                          setCheckoutForm({
                            ...checkoutForm,
                            address: e.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Phương thức thanh toán *
                      <select
                        value={checkoutForm.paymentMethod}
                        onChange={(e) =>
                          setCheckoutForm({
                            ...checkoutForm,
                            paymentMethod: e.target.value
                          })
                        }
                      >
                        <option value="COD">{PAYMENT_METHOD_LABELS.COD}</option>
                        <option value="CHUYEN_KHOAN">
                          {PAYMENT_METHOD_LABELS.CHUYEN_KHOAN}
                        </option>
                        <option value="MOMO">{PAYMENT_METHOD_LABELS.MOMO}</option>
                      </select>
                    </label>

                    <label>
                      Ghi chú giao hàng
                      <textarea
                        rows={2}
                        placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                        value={checkoutForm.note}
                        onChange={(e) =>
                          setCheckoutForm({
                            ...checkoutForm,
                            note: e.target.value
                          })
                        }
                      />
                    </label>
                  </div>

                  {formError && <div className="checkout-error">{formError}</div>}
                </div>

                <div className="cart-drawer-foot">
                  <button type="submit" className="cart-primary-btn">
                    Xác nhận đặt hàng
                  </button>
                </div>
              </form>
            )}

            {checkoutStep === "success" && createdOrder && (
              <div className="cart-drawer-body cart-success">
                <CheckCircle2 size={54} />
                <h4>Đơn hàng #{createdOrder.id} đã được ghi nhận!</h4>
                <p>
                  Đơn hàng của <b>{createdOrder.customerName}</b> đang ở trạng thái{" "}
                  <b>Chờ duyệt</b>. Cửa hàng sẽ liên hệ số{" "}
                  <b>{createdOrder.phone}</b> để xác nhận sớm nhất.
                </p>

                <div className="checkout-summary-box">
                  <div className="checkout-summary-line">
                    <span>Địa chỉ:</span>
                    <b>{createdOrder.address}</b>
                  </div>
                  <div className="checkout-summary-line">
                    <span>Thanh toán:</span>
                    <b>{PAYMENT_METHOD_LABELS[createdOrder.paymentMethod]}</b>
                  </div>
                  <div className="checkout-summary-total">
                    <span>Tổng tiền:</span>
                    <strong>{formatMoney(createdOrder.total)}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="cart-primary-btn"
                  onClick={() => setCartOpen(false)}
                >
                  Đóng
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
