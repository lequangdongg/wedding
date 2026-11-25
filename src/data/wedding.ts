/**
 * TOÀN BỘ NỘI DUNG CỦA TRANG — sửa ở đây, không cần đụng vào component.
 * Chỗ nào còn [NGOẶC VUÔNG] là thông tin chưa có, cần điền.
 */
import type { ImageMetadata } from 'astro';
import garden from '../assets/photos/garden.jpg';
import gardenClose from '../assets/photos/garden-close.jpg';
import gardenSofa from '../assets/photos/garden-sofa.jpg';
import studioVeil from '../assets/photos/studio-veil.jpg';
import studioCouple from '../assets/photos/studio-couple.jpg';
import dance from '../assets/photos/dance.jpg';
import veil from '../assets/photos/veil.jpg';
import bride from '../assets/photos/bride.jpg';
import groom from '../assets/photos/groom.jpg';
import walk from '../assets/photos/walk.jpg';
import arm from '../assets/photos/arm.jpg';
import facing from '../assets/photos/facing.jpg';
import bridePortrait from '../assets/photos/bride-portrait.jpg';
import veilLift from '../assets/photos/veil-lift.jpg';
import groomSit from '../assets/photos/groom-sit.jpg';
import gala from '../assets/photos/gala.jpg';

export const site = {
  title: 'Quang Đông & Trang Châu — 29.12.2026',
  description: 'Trân trọng kính mời bạn đến chung vui trong ngày cưới của Quang Đông & Trang Châu · Đà Nẵng · 29.12.2026',
  dateShort: '29 · 12 · 2026',
  city: 'Đà Nẵng',
  /** Màn chờ đếm 00→100 (đẹp nhưng làm chậm điểm Lighthouse mobile ~15–20 điểm). false = tắt. */
  preloader: true,
};

/**
 * VIDEO HERO + NHẠC NỀN — chép file vào /public rồi điền đường dẫn. null = không dùng.
 * Video hero hiện tại được ghép tự động từ ảnh: python3 scripts/film.py (Ken Burns, ~20s lặp).
 * Có video quay thật thì dùng scripts/video.sh rồi đổi đường dẫn.
 */
export const media = {
  heroVideo: {
    mobile: { mp4: '/video/hero-m.mp4' as string | null, webm: '/video/hero-m.webm' as string | null },
    desktop: { mp4: '/video/hero-d.mp4' as string | null, webm: '/video/hero-d.webm' as string | null },
  },
  /** Nhạc nền (mp3, ~128kbps). Ví dụ '/audio/song.mp3'. Chỉ phát khi khách bấm nút nhạc. */
  music: null as string | null,
  musicTitle: '' as string, // tên bài hiển thị nhỏ cạnh nút (tuỳ chọn)
};

/** LOGO — đặt file vào /public (svg hoặc png nền trong) rồi điền, ví dụ '/logo.svg'. null = monogram chữ Đ | C. */
export const brand = {
  logo: null as string | null,
};

/**
 * SAU NGÀY CƯỚI — khi đã qua giờ đếm ngược, phần đếm ngược tự đổi thành lời cảm ơn + các nút dưới.
 * Livestream: hiện nút "Xem trực tiếp" từ `liveFrom` đến `liveTo`.
 */
export const after = {
  albumUrl: null as string | null, // link Google Photos / Drive album ảnh cưới
  livestreamUrl: null as string | null, // link Facebook / YouTube live
  liveFrom: '2026-12-29T09:30:00+07:00',
  liveTo: '2026-12-29T14:00:00+07:00',
};

export const photos = { garden, gardenClose, gardenSofa, studioVeil, studioCouple, dance, veil, bride, groom, walk, arm, facing, bridePortrait, veilLift, groomSit };

export const couple = {
  groom: { short: 'Quang Đông', full: 'Lê Quang Đông', role: 'Út Nam', photo: groom },
  bride: { short: 'Trang Châu', full: 'Nguyễn Thị Trang Châu', role: 'Quý Nữ', photo: bride },
  /** Chuyện của tụi mình — mỗi phần tử là một đoạn. Bọc **chữ** để làm điểm nhấn (chữ đó lật lên thành bản màu đỏ đô). */
  story: [
    'Lần đầu chúng mình gặp nhau là giữa năm **2024**, khi ấy Trang Châu đang vẫy vùng với những biến cố gia đình sau khi từ **Sài Gòn** về **Đà Nẵng**. Còn Đông Lê vẫn vai trò là con út trong gia đình 3 anh chị em, hằng ngày được ba mẹ yêu chiều. Hai con người, **hai thái cực**, hai kiểu tư duy khác nhau và tưởng chừng tụi mình chỉ có thể làm bạn nếu một trong hai không thay đổi.',
    'Ấy vậy mà, bằng sự **chân thành** và **kiên trì**, Đông Lê đã từng bước – bước vào cuộc đời Trang Châu, đã hiện diện, **sánh vai** cùng với Trang Châu ở mọi nơi. Chàng IT khô khan năm ấy giờ đã có người vẽ vời những gam màu sắc khác hơn, chàng IT năm nào giờ đã trưởng thành **một người đàn ông**.',
    'Kể về chuyện tình của tụi mình, không thể không nhắc đến **chị Tài** và công ty **Hodfords**, nơi những con người thiện lành hiện diện, bồi đắp cho tình cảm của cả hai. Đến lúc này, khi tình yêu của cả hai đã **đâm chồi nảy lộc**, chúng mình thật sự muốn gửi lời **biết ơn** đến những người đã yêu thương và đưa lối cho chúng mình.',
  ],
};

export type SideKey = 'nam' | 'nu';

export const families: Record<SideKey, { side: string; father: string; mother: string; addr: string }> = {
  nam: { side: 'Nhà trai', father: 'Lê Quang Tứ', mother: 'Nguyễn Thị Kim Anh', addr: 'K74/H10/17 Võ Văn Kiệt, P. An Hải, TP. Đà Nẵng' },
  nu: { side: 'Nhà gái', father: 'Nguyễn Quý', mother: 'Trương Thị Thu Hồng', addr: 'Thôn Dương Đàn, X. Phú Ninh, TP. Đà Nẵng' },
};

export type WeddingEvent = {
  id: string; // dùng cho file lịch /lich/<id>.ics
  kind: string;
  host: string;
  weekday: string;
  day: string;
  time: string; // hiển thị
  lunar: string;
  venue: string;
  hall?: string;
  addr: string;
  mapQuery: string;
  start: string; // ISO có múi giờ
  end: string;
};

export const sides: Record<SideKey, {
  label: string; sub: string; ceremony: string; param: string; og: string; shareTitle: string; shareDesc: string;
  countdown: { iso: string; label: string };
  events: WeddingEvent[];
}> = {
  nam: {
    label: 'Nhà trai',
    sub: 'Đà Nẵng · 29.12',
    ceremony: 'Lễ Thành Hôn',
    param: 'nha-trai',
    og: '/og-nha-trai.jpg',
    shareTitle: 'Quang Đông & Trang Châu · Lễ Thành Hôn 29.12.2026',
    shareDesc: 'Trân trọng kính mời bạn đến dự Lễ Thành Hôn & Tiệc cưới · Thứ Ba 29.12.2026 · Golden Phoenix, Đà Nẵng',
    countdown: { iso: '2026-12-29T10:00:00+07:00', label: 'Lễ Thành Hôn · 10:00 · 29.12.2026' },
    events: [
      {
        id: 'nha-trai-le-thanh-hon', kind: 'Lễ Thành Hôn', host: 'Tư gia nhà trai', weekday: 'Thứ Ba', day: '29', time: '10 giờ 00',
        lunar: 'Nhằm ngày 21 tháng 11 năm Bính Ngọ', venue: 'Tư gia nhà trai',
        addr: 'K74/H10/17 Võ Văn Kiệt, P. An Hải, TP. Đà Nẵng', mapQuery: 'K74/H10/17 Võ Văn Kiệt, An Hải, Đà Nẵng',
        start: '2026-12-29T10:00:00+07:00', end: '2026-12-29T11:00:00+07:00',
      },
      {
        id: 'nha-trai-tiec-cuoi', kind: 'Tiệc cưới', host: 'Nhà trai', weekday: 'Thứ Ba', day: '29', time: '11 giờ 00',
        lunar: 'Nhằm ngày 21 tháng 11 năm Bính Ngọ', venue: 'Trung tâm Hội nghị & Tiệc cưới Golden Phoenix', hall: 'Sảnh C',
        addr: 'A8.2 Lô 1,2 Đường 2/9, Hòa Cường, TP. Đà Nẵng', mapQuery: 'Golden Phoenix, Đường 2/9, Hòa Cường, Đà Nẵng',
        start: '2026-12-29T11:00:00+07:00', end: '2026-12-29T14:00:00+07:00',
      },
    ],
  },
  nu: {
    label: 'Nhà gái',
    sub: 'Phú Ninh · 27 & 29.12',
    ceremony: 'Lễ Vu Quy',
    param: 'nha-gai',
    og: '/og-nha-gai.jpg',
    shareTitle: 'Trang Châu & Quang Đông · Lễ Vu Quy 27 & 29.12.2026',
    shareDesc: 'Trân trọng kính mời bạn đến dự Tiệc cưới (CN 27.12) & Lễ Vu Quy (T3 29.12.2026) · Phú Ninh, Đà Nẵng',
    countdown: { iso: '2026-12-27T10:30:00+07:00', label: 'Tiệc cưới nhà gái · 10:30 · 27.12.2026' },
    events: [
      {
        id: 'nha-gai-tiec-cuoi', kind: 'Tiệc cưới', host: 'Nhà gái', weekday: 'Chủ Nhật', day: '27', time: '10 giờ 30',
        // Thiệp in ghi "21 tháng 11" — theo lịch âm, 27/12/2026 là 19/11 Bính Ngọ. Kiểm tra lại.
        lunar: 'Nhằm ngày 19 tháng 11 năm Bính Ngọ', venue: 'Nhà hàng tiệc cưới Nguyệt Hà',
        addr: 'X. Phú Ninh, TP. Đà Nẵng', mapQuery: 'Nhà hàng tiệc cưới Nguyệt Hà, Phú Ninh, Đà Nẵng',
        start: '2026-12-27T10:30:00+07:00', end: '2026-12-27T13:30:00+07:00',
      },
      {
        id: 'nha-gai-le-vu-quy', kind: 'Lễ Vu Quy', host: 'Tư gia nhà gái', weekday: 'Thứ Ba', day: '29', time: '07 giờ 00',
        lunar: 'Nhằm ngày 21 tháng 11 năm Bính Ngọ', venue: 'Tư gia nhà gái',
        addr: 'Thôn Dương Đàn, X. Phú Ninh, TP. Đà Nẵng', mapQuery: 'Thôn Dương Đàn, Phú Ninh, Đà Nẵng',
        start: '2026-12-29T07:00:00+07:00', end: '2026-12-29T09:00:00+07:00',
      },
    ],
  },
};

/** Bên mặc định khi link không có ?ben=... */
export const defaultSide: SideKey = 'nam';

/** Khoảnh khắc — xấp polaroid bay vào xoè quạt khi cuộn (như "Tour dates"). Thứ tự = thứ tự xuất hiện. */
/** KHOẢNH KHẮC — một tấm ảnh duy nhất, khách phải "rửa ảnh" (giữ & lắc tấm polaroid) mới thấy. */
export const moment = {
  photo: gala,
  alt: 'Quang Đông và Trang Châu tại Gala Dinner của Hodfords',
  caption: 'Hodfords · Gala Dinner',
  note: 'Nơi những con người thiện lành đã bồi đắp cho tình cảm của tụi mình.',
};

/** THE LOVE BOOK — trang album cưới (bìa + 5 trang đôi, mỗi trang đôi cắt làm 2 trang lẻ). */
const bookFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/book/p*.jpg', { eager: true });
export const book = Object.keys(bookFiles).sort().map((k) => bookFiles[k].default);

/** Dải phim ảnh chạy ngang (dùng hết ảnh còn lại). */
export const strip = [walk, bridePortrait, dance, groomSit, veil, facing, gardenSofa, arm, groom, veilLift, studioCouple, bride, gardenClose, studioVeil, garden];


/** Menu (không có mục Chuyện tình). */
export const nav = [
  { id: 'loi-moi', label: 'Lời mời' },
  { id: 'khoanh-khac', label: 'Khoảnh khắc' },
  { id: 'su-kien', label: 'Sự kiện' },
  { id: 'loi-chuc', label: 'Lời chúc' },
  { id: 'mung-cuoi', label: 'Mừng cưới' },
];

/**
 * SỔ LỜI CHÚC — trang tĩnh không tự lưu được, cần một nơi lưu bên ngoài.
 * Khuyên dùng: Google Sheet + Apps Script (miễn phí, dữ liệu nằm trong Drive của bạn, sửa/ẩn lời chúc ngay trên Sheet).
 * Cách cài tự động: docs/CODEX_TASK_wishes.md (clasp + Apps Script API). Tay: scripts/wishes-apps-script.gs.
 * endpoint = null: chế độ XEM THỬ — lời chúc chỉ lưu trên máy đang xem, có ghi chú rõ cho khách.
 */
export const wishes = {
  // URL web app Apps Script (…/exec). Ưu tiên biến môi trường PUBLIC_WISHES_ENDPOINT (file .env hoặc cài trên Vercel/Netlify/Cloudflare)
  endpoint: (import.meta.env.PUBLIC_WISHES_ENDPOINT || null) as string | null,
  max: 300,
  relations: ['Gia đình', 'Bạn bè', 'Đồng nghiệp', 'Hàng xóm'],
  ideas: [
    'Trăm năm hạnh phúc, đầu bạc răng long!',
    'Chúc hai bạn mãi yêu nhau như ngày đầu.',
    'Sớm có tin vui nhé!',
    'Hẹn gặp ở tiệc cưới, nâng ly chúc mừng!',
  ],
};

export const gifts = [
  { who: 'Chú rể', name: '[TÊN CHỦ TÀI KHOẢN]', bank: '[NGÂN HÀNG]', account: '[SỐ TÀI KHOẢN]', qr: null as string | null },
  { who: 'Cô dâu', name: '[TÊN CHỦ TÀI KHOẢN]', bank: '[NGÂN HÀNG]', account: '[SỐ TÀI KHOẢN]', qr: null as string | null },
];


// ---- helpers ----
/** Giữ 2 chữ cuối của tên dính nhau (không bị rớt dòng giữa tên): 'Nguyễn Thị Trang Châu' -> '…Trang\u00a0Châu' */
export const keep = (name: string) => name.replace(/\s+(\S+)\s+(\S+)$/, ' $1\u00a0$2');
const toGcal = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
export const mapsUrl = (q: string) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
export const icsUrl = (e: WeddingEvent) => `/lich/${e.id}.ics`;
export const calendarUrl = (e: WeddingEvent) =>
  'https://calendar.google.com/calendar/render?action=TEMPLATE' +
  '&text=' + encodeURIComponent(`${e.kind} · Quang Đông & Trang Châu`) +
  '&dates=' + toGcal(e.start) + '/' + toGcal(e.end) +
  '&location=' + encodeURIComponent(`${e.venue}${e.hall ? ', ' + e.hall : ''}, ${e.addr}`);
