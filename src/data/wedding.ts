/**
 * TOÀN BỘ NỘI DUNG CỦA TRANG — sửa ở đây, không cần đụng vào component.
 * Chỗ nào còn [NGOẶC VUÔNG] là thông tin chưa có, cần điền.
 */
import garden from '../assets/photos/garden.jpg';
import gardenClose from '../assets/photos/garden-close.jpg';
import gardenSofa from '../assets/photos/garden-sofa.jpg';
import studioVeil from '../assets/photos/studio-veil.jpg';
import studioCouple from '../assets/photos/studio-couple.jpg';
import dance from '../assets/photos/dance.jpg';
import veil from '../assets/photos/veil.jpg';
import bride from '../assets/photos/bride.jpg';
import groom from '../assets/photos/groom.jpg';

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
 * Tạo video đúng chuẩn: xem scripts/video.sh (ffmpeg). Mobile dọc 720×1280, desktop ngang 1920×1080.
 */
export const media = {
  heroVideo: {
    mobile: { mp4: null as string | null, webm: null as string | null }, // ví dụ '/video/hero-m.mp4'
    desktop: { mp4: null as string | null, webm: null as string | null }, // ví dụ '/video/hero-d.mp4'
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

export const photos = { garden, gardenClose, gardenSofa, studioVeil, studioCouple, dance, veil, bride, groom };

export const couple = {
  groom: { short: 'Quang Đông', full: 'Lê Quang Đông', role: 'Út Nam', photo: groom },
  bride: { short: 'Trang Châu', full: 'Nguyễn Thị Trang Châu', role: 'Quý Nữ', photo: bride },
  quote: 'Every day with you is a new adventure, a new chapter in our love story.',
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
export const moments = [
  { photo: studioCouple, pos: '50% 30%', alt: 'Hai bạn trong studio ngập nắng' },
  { photo: dance, pos: '50% 38%', alt: 'Khiêu vũ trong studio' },
  { photo: gardenSofa, pos: '50% 45%', alt: 'Trên sofa trắng giữa vườn' },
  { photo: gardenClose, pos: '60% 35%', alt: 'Chú rể nhìn cô dâu giữa khu vườn' },
  { photo: studioVeil, pos: '50% 35%', alt: 'Nắm tay, khăn voan dài' },
  { photo: garden, pos: '50% 35%', alt: 'Hai bạn vẫy tay khoe nhẫn cưới' },
  { photo: bride, pos: '45% 30%', alt: 'Cô dâu Trang Châu cầm bó đồng tiền hồng' },
];


/** Menu (không có mục Chuyện tình). */
export const nav = [
  { id: 'loi-moi', label: 'Lời mời' },
  { id: 'khoanh-khac', label: 'Khoảnh khắc' },
  { id: 'su-kien', label: 'Sự kiện' },
  { id: 'mung-cuoi', label: 'Mừng cưới' },
];

export const gifts = [
  { who: 'Chú rể', name: '[TÊN CHỦ TÀI KHOẢN]', bank: '[NGÂN HÀNG]', account: '[SỐ TÀI KHOẢN]', qr: null as string | null },
  { who: 'Cô dâu', name: '[TÊN CHỦ TÀI KHOẢN]', bank: '[NGÂN HÀNG]', account: '[SỐ TÀI KHOẢN]', qr: null as string | null },
];


// ---- helpers ----
const toGcal = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
export const mapsUrl = (q: string) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
export const icsUrl = (e: WeddingEvent) => `/lich/${e.id}.ics`;
export const calendarUrl = (e: WeddingEvent) =>
  'https://calendar.google.com/calendar/render?action=TEMPLATE' +
  '&text=' + encodeURIComponent(`${e.kind} · Quang Đông & Trang Châu`) +
  '&dates=' + toGcal(e.start) + '/' + toGcal(e.end) +
  '&location=' + encodeURIComponent(`${e.venue}${e.hall ? ', ' + e.hall : ''}, ${e.addr}`);
