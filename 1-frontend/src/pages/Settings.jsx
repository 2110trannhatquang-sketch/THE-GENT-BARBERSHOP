import { useState } from "react";
import { Save, RotateCcw, CheckCircle2 } from "lucide-react";
import {
  DEFAULT_SHOP_SETTINGS,
  getShopSettings,
  saveShopSettings
} from "../store";

export default function Settings() {
  const [form, setForm] = useState(getShopSettings);
  const [savedNotice, setSavedNotice] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    saveShopSettings(form);
    window.dispatchEvent(new Event("gent-settings-updated"));
    setSavedNotice(
      "Đã lưu thông tin cửa hàng! Thay đổi đã được cập nhật ngay lên Trang chủ."
    );
  };

  const handleReset = () => {
    const resetData = saveShopSettings(DEFAULT_SHOP_SETTINGS);
    setForm(resetData);
    window.dispatchEvent(new Event("gent-settings-updated"));
    setSavedNotice("Đã khôi phục thông tin cửa hàng về mặc định.");
  };

  return (
    <div className="panel" style={{ maxWidth: 820 }}>
      <div className="panel-heading" style={{ marginBottom: 18 }}>
        <div>
          <h3>Thông tin cửa hàng</h3>
          <p>
            Thay đổi địa chỉ shop, hotline, giờ mở cửa... Dữ liệu sẽ tự động
            cập nhật ở trang chủ khách hàng.
          </p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Tên cửa hàng *
          <input
            type="text"
            required
            value={form.shopName}
            onChange={(e) => setForm({ ...form, shopName: e.target.value })}
          />
        </label>

        <label>
          Khẩu hiệu (Tagline)
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          />
        </label>

        <label className="full-field">
          Địa chỉ cửa hàng *
          <input
            type="text"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Số nhà, tên đường, phường, quận, thành phố"
          />
        </label>

        <label>
          Khu vực hiển thị (Hero)
          <input
            type="text"
            value={form.cityLabel}
            onChange={(e) => setForm({ ...form, cityLabel: e.target.value })}
          />
        </label>

        <label>
          Số điện thoại / Hotline *
          <input
            type="text"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>

        <label>
          Email liên hệ
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>

        <label>
          Giờ mở cửa
          <input
            type="text"
            value={form.openingHours}
            onChange={(e) =>
              setForm({ ...form, openingHours: e.target.value })
            }
          />
        </label>

        <label className="full-field">
          Ngày hoạt động
          <input
            type="text"
            value={form.openingDays}
            onChange={(e) => setForm({ ...form, openingDays: e.target.value })}
          />
        </label>

        {savedNotice && (
          <div
            className="full-field"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#edf6ef",
              color: "#3f7d50",
              padding: "11px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500
            }}
          >
            <CheckCircle2 size={16} />
            {savedNotice}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="button button-outline"
            onClick={handleReset}
          >
            <RotateCcw size={15} />
            Khôi phục mặc định
          </button>

          <button type="submit" className="button button-dark">
            <Save size={15} />
            Lưu cài đặt
          </button>
        </div>
      </form>
    </div>
  );
}
