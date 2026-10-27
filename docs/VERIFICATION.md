# Kết quả kiểm tra — 2026-10-27

## Sửa Product Bezels

Đã sửa canvas cho 36 biến thể / 72 appearance để giữ toàn bộ phần ảnh tràn ngoài frame màn hình của Figma. Ảnh iPhone 17 Pro Deep Blue tải từ Figma MCP và ảnh cục bộ có SHA-256 giống nhau. Đã đối chiếu ảnh tham chiếu Figma của mẫu này; iPad và máy gập được kiểm tra bằng dữ liệu layer và ảnh gốc trong file `.fig` do giới hạn lượt gọi MCP. Không vẽ lại hoặc thay thế ảnh bezel. Kiểm tra tự động xác nhận toàn bộ layer nằm trong canvas mới và vùng màn hình nguồn được giữ ở `screenRect`.

## Đã kiểm tra

- React library: TypeScript build thành công.
- React và Next.js: kiểm tra kiểu dữ liệu thành công.
- Flutter: `analyze --no-pub` không có lỗi/cảnh báo.
- Flutter widget tests: 2 bài kiểm tra đạt — callback nút/disabled và tải catalogue 1.511 mục, render SVG Button từ tài nguyên thật, thay chữ thành Save.
- Kiểm tra cấu trúc tài nguyên: 1.511 ID duy nhất, 3.022 scene sáng/tối có SVG và kích thước hợp lệ; ảnh được tham chiếu tồn tại; không có cảnh báo thiếu master/image. Lệnh tái chạy: `node scripts/verify-assets.mjs`.
- Trình duyệt Next.js: tải catalogue, hiển thị Button, thay Label thành Save, đổi theme, bật/tắt Notifications, tăng Quantity từ 3 lên 4, mở và đóng dialog. Không ghi nhận console error/warning trong lượt kiểm tra đó.
- Có ảnh xem thử tại `preview.png`.

## Giới hạn kiểm tra

Không đối chiếu từng pixel của tất cả 1.511 biến thể với Figma. Chỉ một Button được đối chiếu với ảnh tham chiếu từ Figma; các mẫu còn lại dựa vào dữ liệu file cục bộ. Kiểm tra cấu trúc không chứng minh mọi SVG đều có hình thức hoàn hảo. Chưa chạy ứng dụng Flutter hoàn chỉnh trên Android/iOS hoặc trình duyệt.

591 biến thể chứa hiệu ứng cần hoàn thiện theo nền tảng. Danh sách chi tiết nằm trong `shared/extraction-report.json` và từng mục catalogue. SVG filters bị bỏ trên Flutter; backdrop blur, inner shadow và glass refraction không được tái tạo đầy đủ. Control native có khác biệt hình thức/kích thước so với SVG nguồn.

Nguồn Figma có giới hạn quyền sử dụng; xem `SOURCE-LICENSE.txt`. Bộ mã không chứa font Apple và không được tuyên bố là bản triển khai chính thức của Apple.
