const labels = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  PAID: "Đã thanh toán",
  UNPAID: "Chưa thanh toán",
  VOID: "Đã hủy hóa đơn"
};

export default function StatusBadge({ status }) {
  return <span className={`status status-${String(status).toLowerCase()}`}>{labels[status] || status}</span>;
}
