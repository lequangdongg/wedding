/**
 * Font web được nạp bằng JS SAU lần vẽ đầu tiên (không khai báo trong CSS) -> trang hiện ngay,
 * không phải chờ/tranh băng thông với ~120KB font. Màn chờ che phần lớn trang trong lúc font về;
 * chữ trên màn chờ chỉ hiện khi font đã sẵn sàng (class .fonts trên <html>).
 * Thêm/bớt font: sửa danh sách FACES bên dưới (file lấy từ @fontsource, subset latin + vietnamese).
 */
import bv300l from '@fontsource/be-vietnam-pro/files/be-vietnam-pro-latin-300-normal.woff2?url';
import bv300v from '@fontsource/be-vietnam-pro/files/be-vietnam-pro-vietnamese-300-normal.woff2?url';
import bv400l from '@fontsource/be-vietnam-pro/files/be-vietnam-pro-latin-400-normal.woff2?url';
import bv400v from '@fontsource/be-vietnam-pro/files/be-vietnam-pro-vietnamese-400-normal.woff2?url';
import bv500l from '@fontsource/be-vietnam-pro/files/be-vietnam-pro-latin-500-normal.woff2?url';
import bv500v from '@fontsource/be-vietnam-pro/files/be-vietnam-pro-vietnamese-500-normal.woff2?url';
import bv600l from '@fontsource/be-vietnam-pro/files/be-vietnam-pro-latin-600-normal.woff2?url';
import bv600v from '@fontsource/be-vietnam-pro/files/be-vietnam-pro-vietnamese-600-normal.woff2?url';
import cg500l from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2?url';
import cg500v from '@fontsource/cormorant-garamond/files/cormorant-garamond-vietnamese-500-normal.woff2?url';
import cg500il from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2?url';
import cg500iv from '@fontsource/cormorant-garamond/files/cormorant-garamond-vietnamese-500-italic.woff2?url';
import cg600l from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2?url';
import cg600v from '@fontsource/cormorant-garamond/files/cormorant-garamond-vietnamese-600-normal.woff2?url';
import gv from '../assets/fonts/great-vibes-sub.woff2?url';
import phl from '@fontsource/patrick-hand/files/patrick-hand-latin-400-normal.woff2?url';
import phv from '@fontsource/patrick-hand/files/patrick-hand-vietnamese-400-normal.woff2?url';

const VI = 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB';
const LA = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

type Face = [family: string, weight: string, style: string, latin: string, vi?: string];
// font dùng ngay ở màn chờ + đầu trang
const FACES: Face[] = [
  ['Cormorant Garamond', '500', 'normal', cg500l, cg500v],
  ['Be Vietnam Pro', '300', 'normal', bv300l, bv300v],
  ['Be Vietnam Pro', '400', 'normal', bv400l, bv400v],
  ['Be Vietnam Pro', '500', 'normal', bv500l, bv500v],
  ['Be Vietnam Pro', '600', 'normal', bv600l, bv600v],
  ['Cormorant Garamond', '500', 'italic', cg500il, cg500iv],
  ['Cormorant Garamond', '600', 'normal', cg600l, cg600v],
  ['Great Vibes', '400', 'normal', gv],
];
// chữ viết tay: chỉ ở phía dưới trang -> nạp sau khi trang tải xong
const LATE: Face[] = [['Patrick Hand', '400', 'normal', phl, phv]];

/** Tải TẤT CẢ font trong nhóm trước, rồi mới gắn vào trang cùng lúc -> trình duyệt chỉ dàn lại chữ 1 lần (không giật nhiều lần). */
function add(faces: Face[]): Promise<void> {
  const list: FontFace[] = [];
  faces.forEach(([family, weight, style, latin, vi]) => {
    const parts: [string, string | undefined][] = vi ? [[vi, VI], [latin, LA]] : [[latin, undefined]];
    parts.forEach(([url, range]) => {
      list.push(new FontFace(family, `url(${url}) format('woff2')`, { weight, style, display: 'swap', ...(range ? { unicodeRange: range } : {}) }));
    });
  });
  return Promise.allSettled(list.map((f) => f.load())).then(() => {
    list.forEach((f) => { if (f.status === 'loaded') document.fonts.add(f); });
  });
}

let ready: Promise<void> | undefined;
/** Bắt đầu nạp font (gọi sau lần vẽ đầu). Trả về promise xong khi các font có chữ trên trang đã tải. */
export function loadFonts(): Promise<void> {
  if (ready) return ready;
  if (!('FontFace' in window)) return (ready = Promise.resolve());
  ready = add(FACES);
  const on = () => document.documentElement.classList.add('fonts');
  ready.then(on);
  setTimeout(on, 2500); // mạng chậm: không giấu chữ quá lâu
  const late = () => setTimeout(() => add(LATE), 300);
  if (document.readyState === 'complete') late(); else window.addEventListener('load', late, { once: true });
  return ready;
}
