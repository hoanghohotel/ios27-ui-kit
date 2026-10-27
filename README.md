# iOS & iPadOS 27 — React/Next.js + Flutter

Bản chuyển đổi từ file Figma do bạn cung cấp, dùng để xem, chọn và tái sử dụng các thành phần thiết kế.

## Phạm vi

- 1.511 biến thể, 308 nhóm component, 36 trang có component công khai.
- 302 biến thiết kế đang hoạt động, dữ liệu typography và 414 ảnh nguồn.
- Catalogue sáng/tối, tìm kiếm, sửa nội dung chữ và ví dụ sử dụng React/Flutter.
- Hai lớp: `Design…` / `KitComponent` giữ hình dáng bằng SVG; các control như Button, Toggle, TextField, Slider có tương tác native riêng.

**Đây chưa phải 1.511 widget native với đầy đủ hành vi hệ thống.** Catalogue giữ kích thước nguồn và hỗ trợ scale, thay chữ, gắn callback; không tự chuyển auto-layout thành responsive. Các màn hình hệ thống, Face ID và bàn phím là mẫu giao diện, không thực hiện chức năng hệ điều hành. Các trang bìa, hướng dẫn và helper nội bộ không được xuất thành component công khai.

## Chạy trang Next.js

Yêu cầu Node.js 22 trở lên và npm.

```sh
npm ci
npm run setup
npm run dev
```

Mở http://127.0.0.1:3127. Bản đang mở trong phiên làm việc dùng cổng 3128.

```sh
npm run build
npm run typecheck
```

## Dùng trong React / Next.js

Cài package `packages/react` vào ứng dụng của bạn bằng local dependency hoặc giữ cấu trúc workspace. Chạy build thư viện trước. Với Next.js, component sử dụng sự kiện cần nằm trong file có `'use client'`.

```tsx
'use client';
import {KitProvider, KitComponent, Button} from '@local/ios27-react';
import '@local/ios27-react/styles.css';

export default function Example() {
  return <KitProvider theme="light" assetBase="/ios27">
    <KitComponent id="5:108579" texts={{Label: 'Save'}}
      label="Save" onPress={() => console.log('save')} />
    <Button onClick={() => console.log('save')}>Save</Button>
  </KitProvider>;
}
```

Chạy `npm run prepare:assets` để tạo tài nguyên cho showcase. Với dự án khác, sao chép `apps/showcase/public/ios27` vào `public/ios27` của ứng dụng. Package React không tự mang toàn bộ ảnh nguồn; đường dẫn `assetBase` phải trỏ tới thư mục đó. Tránh nhập toàn bộ ảnh vào JavaScript bundle.

`shared/component-exports.json` liệt kê 308 tên export `Design…`, cùng các biến thể và ID. Có thể chọn bằng `id`, hoặc `page`, `group`, `variant`. Hãy chỉ định đầy đủ thuộc tính cần thiết; nếu thiếu, thư viện chọn biến thể khớp đầu tiên.

Product Bezels dùng kích thước toàn bộ máy (gồm viền và nút bên hông), không chỉ kích thước màn hình. Ví dụ iPhone 17 Pro là 450×920; `screenRect` trong dữ liệu JSON giữ vùng màn hình gốc `{x:24,y:23,width:402,height:874}`. `width`/`scale` áp dụng cho cả khung máy. Chạy `node scripts/test-product-bezels.mjs` để kiểm tra không cắt viền ở 36 biến thể.

`texts` nhận ID, tên layer (ví dụ `Label`) hoặc khóa `t0`. ID layer giúp phân biệt khi nhiều layer cùng tên. `actions` nhận ID/tên hitbox; `onPress` áp dụng cả component. Dữ liệu layer nằm trong `shared/assets/components/*.json`. Chữ thay thế nằm trong khung gốc nên nội dung dài có thể bị cắt.

## Dùng trong Flutter

Thêm vào `pubspec.yaml` của ứng dụng (đổi đường dẫn theo dự án):

Nếu lấy mã từ GitHub, trước tiên chạy `npm ci` và `npm run setup` tại thư mục gốc để tạo lại tài nguyên Flutter và web từ `shared`. Repository chỉ lưu một bản tài nguyên nguồn để tránh trùng lặp.

```yaml
dependencies:
  ios27_kit:
    path: ../ios27-ui-kit/packages/flutter
```

```dart
import 'package:ios27_kit/ios27_kit.dart';

KitComponent(
  id: '5:108579',
  texts: const {'Label': 'Save'},
  onPressed: () {},
)

KitButton(label: 'Save', onPressed: () {})
```

Dùng `KitTheme.light()` / `KitTheme.dark()` trong `MaterialApp`. Tài nguyên được đóng gói trong package. `KitCatalogue.load()` đọc danh sách, `KitCatalogue.tokens()` đọc biến thiết kế. Các wrapper `Design…` có cùng tên nhóm như React.

Demo tại `packages/flutter/example/lib/main.dart`. Để tạo cấu hình nền tảng trên máy của bạn:

```sh
cd packages/flutter/example
flutter pub get
flutter create --platforms=web --project-name ios27_showcase .
flutter run -d chrome
```

Mã demo đã có sẵn; giữ lại `lib/main.dart` và dependency local `ios27_kit` nếu công cụ tạo dự án hỏi ghi đè. Bản này đã kiểm tra với Flutter 3.47.7 / Dart 3.13.5; chưa xác minh các SDK cũ hơn.

## Storybook và kiểm tra hình ảnh

Chạy `npm run storybook` để duyệt component tại cổng 6006; `npm run build-storybook` để build tĩnh; `npm run chromatic` để chạy kiểm tra cloud khi đã đặt `CHROMATIC_PROJECT_TOKEN`. Xem [hướng dẫn Storybook/Chromatic](docs/STORYBOOK.md) về phạm vi chụp ảnh và thiết lập GitHub Actions.

## Cấu trúc thư mục

- `packages/react`: thư viện TypeScript và CSS.
- `packages/flutter`: thư viện Dart, tài nguyên và ví dụ.
- `apps/showcase`: catalogue Next.js có mã sử dụng để sao chép.
- `shared`: dữ liệu gốc chuẩn hóa, tokens, typography, ánh xạ component, ảnh và SVG.
- `scripts`: tái tạo wrapper và đồng bộ tài nguyên từ dữ liệu `shared`.
- `docs`: ảnh xem thử và kết quả kiểm tra.

## Giới hạn hình ảnh và quyền sử dụng

591 biến thể có cảnh báo hiệu ứng trong `shared/extraction-report.json`: khúc xạ kính, blur nền, inner shadow hoặc khác biệt SVG filter/gradient. Flutter loại bỏ SVG filter không được hỗ trợ. Không cam kết khớp từng pixel cho toàn bộ kit; cần kiểm tra các component được chọn trước khi tích hợp sản phẩm. Control native là bản triển khai tương tác theo phong cách nguồn, không phải mô phỏng hoàn toàn iOS.

Chữ nguồn thường giữ dưới dạng vector. Chữ thay thế dùng font có trên thiết bị; bộ mã không phân phối font Apple. Typography và tokens được giữ dưới dạng dữ liệu để bạn tích hợp với theme riêng.

Giấy phép có trong file nguồn được giữ nguyên tại `SOURCE-LICENSE.txt`. Không coi bản chuyển đổi là cấp phép sử dụng/phân phối không giới hạn các tài nguyên Apple.
