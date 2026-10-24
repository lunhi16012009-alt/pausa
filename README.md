# PAUSA PWA

## Chạy thử
Cài Node.js 20+; mở Terminal tại thư mục này:

```bash
npm install
npx web-push generate-vapid-keys
```

Đặt hai khóa sinh ra thành biến môi trường `VAPID_PUBLIC_KEY` và `VAPID_PRIVATE_KEY`, thêm `VAPID_SUBJECT=mailto:email-cua-ban@example.com`, sau đó chạy `npm start`. Mở http://localhost:3000.

## Triển khai
Cần host Node.js có HTTPS, tiến trình chạy liên tục, biến môi trường VAPID và nơi lưu `subscriptions.json` bền vững. GitHub Pages chỉ host giao diện, không chạy được server gửi push. Lịch gửi hiện kiểm tra mỗi phút và sử dụng múi giờ **của máy chủ**; hãy cấu hình `TZ=Asia/Ho_Chi_Minh` nếu toàn bộ người tham gia ở Việt Nam. Khi host ngủ hoặc khởi động lại, lịch có thể trễ/bỏ lỡ; production nên dùng database và scheduled worker/cron độc lập.

Dữ liệu khảo sát và nhật ký chỉ lưu trong localStorage trên thiết bị, chưa tự đồng bộ về server. Server chỉ lưu push subscriptions và giờ nhắc. Không công khai `subscriptions.json` hoặc khóa bí mật. Trước khi dùng với học sinh, cần xin phép phù hợp, thêm chính sách quyền riêng tư, xác thực, rate limiting, cơ chế xóa subscription và database an toàn.

iPhone/iPad: iOS 16.4+; mở bằng Safari, Add to Home Screen, mở app từ màn hình chính rồi bật thông báo bằng nút trong PAUSA. Push phụ thuộc kết nối mạng, quyền thông báo và chế độ tiết kiệm pin/tập trung; không bảo đảm giao đúng phút. Trang web không thể tự theo dõi TikTok/Facebook hay bật Do Not Disturb.
