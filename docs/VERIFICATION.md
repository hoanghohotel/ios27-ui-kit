# Kết quả kiểm tra — 2026-10-27

## Chữ trên nền tối

Sửa 374 component có nhãn `Labels - Vibrant/*`: trong Dark, dùng màu Labels tương ứng với alpha tối thiểu 0.6 thay cho toán hạng màu Vibrant không có compositing native. Áp dụng cùng màu cho glyph SVG và metadata của chữ thay thế, nên React và Flutter nhận cùng dữ liệu. Đây là fallback cho khả năng đọc, không mô phỏng đầy đủ vibrancy của Figma. So sánh với commit trước xác nhận không thay đổi scene Light nào. `scripts/test-dark-labels.mjs` kiểm tra tiêu đề Menus đạt tương phản tối thiểu 4.5:1 trên nền preview #202126 và kiểm tra glyph thực sự được render sáng.

## Sửa bộ xuất từ file cục bộ

- Đưa bộ xuất vào `scripts/export-fig.mjs`; chạy với đường dẫn `.fig` làm tham số, sau đó `npm run setup`.
- Xuất đầy đủ danh sách drop shadow thay vì chỉ bóng đầu tiên; thêm inner shadow, spread và foreground/layer blur. Màu filter dùng sRGB.
- Sửa lớp fill/gradient LINEAR_DODGE trên nền solid đục: cộng màu theo opacity thay vì để gradient đen che nền. Phần này dùng SVG thông thường nên áp dụng cả Flutter.
- `scripts/test-svg-effects.mjs` kiểm tra pixel bên trong, bên ngoài hình, hai bóng độc lập và mép blur. `scripts/verify-render.mjs` render toàn bộ 3.022 scene và lưu kết quả trong `docs/render-audit.json`; đây không phải phép so sánh với ảnh Figma độc lập.
- Storybook bật snapshot cho toàn bộ catalogue, giữ kích thước thiết kế gốc và viewport đủ rộng.
- Lượt kiểm tra sau sửa: 3.022/3.022 scene render thumbnail thành công, không lỗi. React/Next.js và cấu hình Storybook đạt TypeScript; Storybook build thành công; Flutter analyze không lỗi và 2 widget tests đạt. Đã xem widget iPad trong trình duyệt: nền tím được giữ, không còn gradient đen che nền; không ghi nhận lỗi console từ localhost trong lượt xem này.

Chưa xác minh độ khớp từng pixel với Figma. Flutter vẫn bỏ SVG filters, nên sửa bóng/foreground blur chưa có hiệu lực trên Flutter. Glass refraction, backdrop blur và gradient angular vẫn còn hạn chế; không được tự chấp nhận baseline như thể đã đạt độ khớp thiết kế.

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

591 biến thể chứa hiệu ứng cần hoàn thiện theo nền tảng. Danh sách chi tiết nằm trong `shared/extraction-report.json` và từng mục catalogue. SVG filters bị bỏ trên Flutter; backdrop blur và glass refraction không được tái tạo đầy đủ. Inner shadow đã được bổ sung cho SVG/web trong lần sửa bộ xuất. Control native có khác biệt hình thức/kích thước so với SVG nguồn.

Nguồn Figma có giới hạn quyền sử dụng; xem `SOURCE-LICENSE.txt`. Bộ mã không chứa font Apple và không được tuyên bố là bản triển khai chính thức của Apple.
