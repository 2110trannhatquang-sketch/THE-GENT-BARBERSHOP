
import { Link } from "react-router-dom";
import "./Home.css";
import useScrollReveal from "../hooks/useScrollReveal";

export default function Home() {
  useScrollReveal();

  return (
    <main className="home-page">

      {/* HEADER */}
      <header className="home-header">
        <Link to="/" className="home-logo">
          THE <span>GENT</span>
          <small>BARBERSHOP</small>
        </Link>

        <nav className="home-nav">
          <a href="#home">Trang chủ</a>
          <a href="#our-story">Về chúng tôi</a>
          <a href="#services">Dịch vụ</a>
          <a href="#gallery">Hình ảnh</a>
        </nav>

        <Link to="/booking" className="home-booking-btn">
          ĐẶT LỊCH
          <span>↗</span>
        </Link>
      </header>

      {/* HERO */}
      <section className="hero-section" id="home">
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <p className="hero-subtitle">
            EST. THE GENT BARBERSHOP
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

            <a href="#our-story" className="hero-explore">
              KHÁM PHÁ THÊM ↓
            </a>
          </div>
        </div>

        <div className="hero-bottom">
          <span>CLASSIC STYLE — MODERN GENTLEMEN</span>
          <span>HO CHI MINH CITY · VIETNAM</span>
        </div>
      </section>

      {/* GIỚI THIỆU */}
      <section className="home-intro reveal" id="about">
        <span>WELCOME TO THE GENT</span>
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

          {/* SERVICE 01 */}
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

          {/* SERVICE 02 */}
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

          {/* SERVICE 03 */}
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
            THE GENT được xây dựng với mong muốn mang đến
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
            <small>CLASSIC STYLE — MODERN GENTLEMEN</small>
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
              CLASSIC STYLE — MODERN GENTLEMEN.
              <br />
              Phong cách tạo nên dấu ấn riêng.
            </p>
          </div>

          <div className="footer-column">
            <h3>EXPLORE</h3>
            <a href="#home">Trang chủ</a>
            <a href="#our-story">Về chúng tôi</a>
            <a href="#services">Dịch vụ</a>
            <a href="#gallery">Hình ảnh</a>
          </div>

          <div className="footer-column">
            <h3>OPENING HOURS</h3>
            <p>Thứ 2 – Chủ nhật</p>
            <p>08:00 – 21:00</p>
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
          <span>© 2026 THE GENT BARBERSHOP.</span>
          <span>CRAFTED FOR GENTLEMEN.</span>
          <a href="#home">BACK TO TOP ↑</a>
        </div>
      </footer>

    </main>
  );
}
