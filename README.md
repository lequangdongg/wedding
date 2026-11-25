# Website cưới — Quang Đông & Trang Châu

Astro (SSG) · mobile-first · GSAP (ScrollTrigger, SplitText, Draggable) · Lenis cuộn mượt trên desktop.

JS chia 2 phần: ~30 KB gzip tải ngay (preloader + intro), phần chuyển động theo cuộn (~35 KB) tải sau khi intro xong / khi khách bắt đầu cuộn.

## Chạy thử
```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # xuất site tĩnh vào dist/
npm run preview   # xem bản build
```

## Sửa nội dung
Mọi chữ, giờ, địa điểm, ảnh nằm trong **`src/data/wedding.ts`**. Chỗ còn `[NGOẶC VUÔNG]` là thông tin chưa có:
- Ảnh phần Khoảnh khắc (`moments`), tài khoản mừng cưới + mã QR (`gifts`).
- **Video hero**: chép file vào `public/video/` rồi điền `media.heroVideoMp4` (khuyên dùng 720×1280, H.264, ≤ 4 MB, 8–12 s, không tiếng).
- **Nhạc nền** (tuỳ chọn): `media.music`.
- Ảnh: thay file trong `src/assets/photos/` (giữ tên) — lúc build Astro tự sinh AVIF/WebP nhiều kích thước.
- Đổi `site` trong `astro.config.mjs` thành tên miền thật (để ảnh chia sẻ Facebook/Zalo đúng).

## Link riêng cho từng bên
- Khách nhà gái: `https://ten-mien/?ben=nha-gai` → hiện Tiệc 27/12 (Nguyệt Hà) + Lễ Vu Quy, đếm ngược đến 27/12, thứ tự gia đình như thiệp nhà gái.
- Khách nhà trai: `https://ten-mien/?ben=nha-trai` (mặc định).

## Deploy
Thư mục `dist/` là site tĩnh — kéo thả lên **Netlify Drop**, hoặc kết nối repo với **Vercel / Cloudflare Pages / Netlify** (build: `npm run build`, output: `dist`).

## Chuyển động (GSAP)
| Hiệu ứng | File |
|---|---|
| Preloader đếm 00→100, rèm kéo lên, intro chữ hero (tách chữ lúc build) | `Preloader.astro`, `Hero.astro`, `scripts/app.ts` |
| Ảnh: placeholder mờ (LQIP) + vệt sáng, ảnh thật mờ dần lên khi tải xong | `Photo.astro`, `scripts/lqip.mjs` (tự chạy khi build) |
| Hero thu nhỏ/bo góc khi cuộn, chữ tiêu đề trượt lên theo dòng (SplitText) | `scripts/scroll.ts` |
| Marquee 2 tầng, tăng tốc + đổi chiều theo vận tốc cuộn | `Marquee.astro` |
| Khoảnh khắc: polaroid lớn bay vào rồi xoè quạt khi cuộn (kiểu "Tour dates") — thay cho album | `Story.astro`, danh sách ảnh `moments` trong `wedding.ts` |
| Menu mở kiểu rèm, bấm mục -> rèm chuyển cảnh | `Nav.astro` |
| Kéo để mở (Draggable): kéo lớp phủ chữ khổng lồ xuống để lộ ảnh + lời cảm ơn | `Footer.astro` |

Tắt màn chờ: `site.preloader = false` trong `wedding.ts`. Tất cả tôn trọng `prefers-reduced-motion`.

### Sổ lời chúc

GitHub Pages build từ nhánh `main`. Đặt URL web app Apps Script (đuôi `/exec`) trong biến `PUBLIC_WISHES_ENDPOINT` ở môi trường GitHub Actions `github-pages`. Sau khi đổi biến, chạy lại workflow **Deploy wedding site**. Khi build cục bộ với biến này để trống, sổ lời chúc chạy ở chế độ xem thử.

Mã API nằm trong `apps-script/`. Chạy `setup` trong trình soạn thảo Apps Script để gắn API với tab có sáu cột của sổ lời chúc. Web app chạy với quyền chủ sở hữu và mở đúng tab đã lưu trong Script Properties. Bỏ tick **Hiện** để ẩn lời chúc khỏi trang.

Khi cập nhật API, dùng `clasp push`, rồi `clasp update-deployment --description "wishes update" <DEPLOYMENT_ID>` trong `apps-script/` để giữ nguyên URL.
