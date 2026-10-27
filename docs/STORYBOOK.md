# Storybook và Chromatic

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

Mặc định chụp 11 story: 5 control native và 3 Product Bezels × 2 theme. Các story catalogue còn lại có `chromatic.disableSnapshot: true`, vẫn duyệt bình thường trong Storybook. Mở rộng danh sách `capture` trong `scripts/generate-stories.mjs` để bật thêm mẫu; chạy lại build sau khi chỉnh.

Lượt đầu tạo baseline, cần duyệt hình ảnh trước khi xem đó là bản chuẩn. `exitZeroOnChanges` cho phép build hoàn tất khi có khác biệt hình ảnh; lỗi build/runtime vẫn phải sửa. Không bật tự động chấp nhận thay đổi.

## GitHub Actions

Workflow `.github/workflows/storybook.yml` build khi push vào main, mở PR hoặc chạy thủ công. Build Storybook được lưu thành artifact 7 ngày. Để bật bước Chromatic tự động, thêm repository secret `CHROMATIC_PROJECT_TOKEN` trong GitHub → Settings → Secrets and variables → Actions. Nếu thiếu secret, workflow vẫn build và ghi rõ đã bỏ qua Chromatic; không báo rằng visual tests đã chạy.

Flutter tiếp tục dùng widget/golden tests riêng; Storybook này không kiểm tra widget Flutter.

Tham khảo: https://storybook.js.org/docs/get-started/frameworks/react-vite/ và https://www.chromatic.com/docs/github-actions/.
