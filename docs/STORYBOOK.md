# Storybook và Chromatic

## Duyệt thư viện

Mở **Library → Overview → Browse collections** để xem 36 collection dạng bảng. Mỗi collection có trang Overview riêng với nhóm family, tìm kiếm, preview Light/Dark cạnh nhau và kích thước gốc. Mặc định hiển thị 24 biến thể; nút Show more tải thêm 24. Preview tự thu nhỏ để vừa ô; Product Bezels giữ tỷ lệ và có ô cao hơn. Trên điện thoại, hai appearance xếp dọc.

Các story **Design** vẫn giữ nguyên ID và phục vụ snapshot từng biến thể. 37 trang tổng quan mới không bật snapshot để tránh kiểm tra trùng toàn bộ catalogue; các snapshot thiết kế hiện có vẫn được bật. Storybook hiện có 3.064 story tổng cộng.

## Build thử ngày 2026-10-27

- Build Storybook cục bộ và kiểm tra TypeScript: thành công.
- GitHub Actions: build và lưu artifact thành công; bước Chromatic được bỏ qua do chưa có repository secret.
- Chromatic build 1: thành công, nhận 3.027 story thuộc 37 mục, chụp 11 snapshot. Đây là baseline đầu tiên được dịch vụ tự chấp nhận, không chứng minh toàn bộ thiết kế khớp Figma.
- [Xem Storybook đã xuất bản](https://6ae01d8be55240a0d88b85ab-qqkxxskgua.chromatic.com/).
- [GitHub Actions đã chạy thành công](https://github.com/hoanghohotel/ios27-ui-kit/actions/runs/40445934382).

Token đã được dùng qua biến môi trường cho lượt chạy thử, không lưu trong repository. Cần thêm GitHub Actions secret để các lượt push sau tự chạy Chromatic.

## Chạy trên máy

```sh
npm ci
npm run storybook
```

Mở http://127.0.0.1:6006. Build tĩnh bằng `npm run build-storybook`; kết quả ở `storybook-static/` (không commit).

Storybook dùng React + Vite để kiểm tra thư viện React độc lập với ứng dụng Next.js. Có 3.022 story được sinh từ 1.511 biến thể sáng/tối và 5 story control native. Mẫu tương tác kiểm tra Toggle, Stepper và TextField. Các story thiết kế chờ tải JSON và ảnh trước khi chụp.

## Chạy Chromatic

Đặt biến môi trường `CHROMATIC_PROJECT_TOKEN` trong terminal rồi chạy `npm run chromatic`. Không đưa token vào mã nguồn hoặc commit. Nếu đã có build tĩnh:

```sh
npx chromatic --storybook-build-dir=storybook-static --config-file=chromatic.ci.json
```

Mặc định chụp toàn bộ 3.027 story: 5 control native và 1.511 component × 2 theme. Các story catalogue đặt `chromatic.disableSnapshot: false` và dùng kích thước gốc, không thu nhỏ về 420px. Mỗi lượt chạy đầy đủ sử dụng hạn mức snapshot tương ứng của tài khoản. Baseline cũ chỉ có 11 story nên lần đầu sau thay đổi này sẽ có nhiều story mới, không có nghĩa chúng đã được xác minh với Figma.

Lượt đầu tạo baseline, cần duyệt hình ảnh trước khi xem đó là bản chuẩn. `exitZeroOnChanges` cho phép build hoàn tất khi có khác biệt hình ảnh; lỗi build/runtime vẫn phải sửa. Không bật tự động chấp nhận thay đổi.

## GitHub Actions

Workflow `.github/workflows/storybook.yml` build khi push vào main, mở PR hoặc chạy thủ công. Build Storybook được lưu thành artifact 7 ngày. Để bật bước Chromatic tự động, thêm repository secret `CHROMATIC_PROJECT_TOKEN` trong GitHub → Settings → Secrets and variables → Actions. Nếu thiếu secret, workflow vẫn build và ghi rõ đã bỏ qua Chromatic; không báo rằng visual tests đã chạy.

Flutter tiếp tục dùng widget/golden tests riêng; Storybook này không kiểm tra widget Flutter.

Tham khảo: https://storybook.js.org/docs/get-started/frameworks/react-vite/ và https://www.chromatic.com/docs/github-actions/.
