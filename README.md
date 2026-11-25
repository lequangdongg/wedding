# Website cưới — Quang Đông & Trang Châu

Astro (SSG) · mobile-first · GSAP (ScrollTrigger, SplitText) · Lenis cuộn mượt trên desktop.

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
- Ảnh: thay file trong `src/assets/photos/` (giữ tên) — lúc build Astro tự sinh AVIF/WebP nhiều kích thước.
- Đổi `site` trong `astro.config.mjs` thành tên miền thật (để ảnh chia sẻ Facebook/Zalo và file lịch đúng).

### Đã chuẩn bị sẵn — chỉ cần điền
| Tính năng | Điền ở đâu | Ghi chú |
|---|---|---|
| **Video hero** | `media.heroVideo` | Đang dùng video **ghép từ ảnh** (`python3 scripts/film.py`: điện thoại dọc 9:16 ~20s; máy tính tràn màn hình 16:9, 3 cột ảnh đổi lệch nhịp ~15s). Chỉ tải sau khi intro xong nên không làm chậm trang. Có video quay thật: `bash scripts/video.sh video-goc.mp4 12 10`. |
| **Nhạc nền** | `media.music` = `'/music/ten-bai.mp3'`, `media.musicTitle` | Chép mp3 (~128 kbps) vào `public/music/`. Nút nhạc góc phải, bật/tắt có fade âm lượng. |
| **Logo** | `brand.logo` = `'/logo.svg'` | Chưa có thì dùng monogram Đ ⚘ C. `public/favicon.svg` có thể thay bằng logo. |
| **Sổ lời chúc** | `wishes.endpoint` | Trang tĩnh không tự lưu được → dùng **Google Sheet + Apps Script** (miễn phí, dữ liệu trong Drive của bạn). Sheet đã tạo sẵn; dựng API bằng clasp theo `docs/CODEX_TASK_wishes.md` (giao cho Codex làm), URL `/exec` đặt vào biến môi trường `PUBLIC_WISHES_ENDPOINT`. Chưa điền: chế độ xem thử, lời chúc chỉ lưu trên máy đang xem. Ẩn lời chúc: bỏ tick cột "Hiện" trong Sheet. |
| **Album sau cưới** | `after.albumUrl` (Google Photos/Drive) | Sau 29/12 phần đếm ngược tự đổi thành "Cảm ơn bạn đã đến chung vui" + nút album. |
| **Livestream** | `after.livestreamUrl`, `after.liveFrom/liveTo` | Trong khung giờ đó hiện nút "Xem trực tiếp"; sau đó thành "Xem lại". |
| **Ảnh chia sẻ** | `python3 scripts/og.py` | Sinh `public/og-nha-trai.jpg`, `og-nha-gai.jpg` (1200×630) mỗi bên một ảnh + `apple-touch-icon.png`. |

Xem trước giao diện sau đám cưới: thêm `?now=2026-12-30T10:00` vào link.

## Link riêng cho từng bên & từng khách
- Khách nhà trai: `https://ten-mien/nha-trai/` (trang chủ `/` cũng là nhà trai).
- Khách nhà gái: `https://ten-mien/nha-gai/` → Tiệc 27/12 (Nguyệt Hà) + Lễ Vu Quy, đếm ngược đến 27/12, thứ tự gia đình như thiệp nhà gái, ảnh chia sẻ riêng. (`?ben=nha-gai` vẫn dùng được.)
- **Tên khách**: thêm `?ten=Anh Tuấn & chị Linh` → hiện "Kính gửi …" ở màn chờ, lời mời và lời cảm ơn cuối trang.
- **Trang tạo link + mã QR**: `https://ten-mien/tao-link/` (không index Google). Nhập tên, chọn bên → sao chép link, tải QR (PNG 1024px để in lên thiệp). Dán cả danh sách khách → xuất CSV.
- **Thêm vào lịch**: mỗi sự kiện có file `/lich/<id>.ics` (iPhone, Outlook, Android) có nhắc trước 1 ngày và 2 giờ, kèm link Google Calendar.

## Deploy
Thư mục `dist/` là site tĩnh — kéo thả lên **Netlify Drop**, hoặc kết nối repo với **Vercel / Cloudflare Pages / Netlify** (build: `npm run build`, output: `dist`).

## Chuyển động (GSAP)
| Hiệu ứng | File |
|---|---|
| Preloader đếm 00→100, rèm kéo lên, intro chữ hero (tách chữ lúc build) | `Preloader.astro`, `Hero.astro`, `scripts/app.ts` |
| Ảnh: placeholder mờ (LQIP) + vệt sáng, ảnh thật mờ dần lên khi tải xong | `Photo.astro`, `scripts/lqip.mjs` (tự chạy khi build) |
| Hero thu nhỏ/bo góc khi cuộn, chữ tiêu đề trượt lên theo dòng (SplitText) | `scripts/scroll.ts` |
| Marquee 2 tầng, tăng tốc + đổi chiều theo vận tốc cuộn | `Marquee.astro` |
| Khoảnh khắc: polaroid lớn bay vào rồi xoè quạt khi cuộn (kiểu "Tour dates") | `Story.astro`, danh sách ảnh `moments` trong `wedding.ts` |
| The Love Book: album in (bìa + trang đôi) trượt ngang khi cuộn, trang phải mở ra như lật sách | `Book.astro`, ảnh trong `src/assets/book/` (p00 = bìa, p01–p10 = nửa trái/phải của từng trang đôi) |
| Dải phim 2 hàng ảnh chạy ngược chiều, tăng tốc theo tốc độ cuộn | `Filmstrip.astro`, danh sách `strip` trong `wedding.ts` |
| Menu mở kiểu rèm, bấm mục -> rèm chuyển cảnh | `Nav.astro` |
| Cào thẻ: giữ chuột / chạm rồi lau lớp chữ khổng lồ để lộ ảnh + lời cảm ơn (quá 50% tự mở hết) | `Footer.astro`, `scripts/scroll.ts` |

Tắt màn chờ: `site.preloader = false` trong `wedding.ts`. Tất cả tôn trọng `prefers-reduced-motion`.
