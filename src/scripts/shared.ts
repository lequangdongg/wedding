// Trạng thái dùng chung giữa phần tải ngay (app.ts) và phần tải sau (scroll.ts)
export type LenisLike = { raf: (t: number) => void; on: (e: string, cb: () => void) => void; stop: () => void; start: () => void; scrollTo: (t: Element | number, o?: Record<string, unknown>) => void };
export const S: { lenis: LenisLike | null; menuOpen: boolean; refresh: () => void } = { lenis: null, menuOpen: false, refresh: () => {} };
export const root = document.documentElement;
export const body = document.body;
export const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) => c.querySelector<T>(s);
export const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) => Array.from(c.querySelectorAll<T>(s));
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isDesktop = () => matchMedia('(min-width: 1024px)').matches;
export const pad = (n: number) => (n < 10 ? '0' + n : String(n));

/**
 * Tên khách từ ?ten=... — chịu được link gõ tay có dấu "&" chưa mã hoá
 * (vd. ?ten=Anh Tuấn & chị Linh -> "Anh Tuấn & chị Linh"): lấy hết tới tham số đã biết kế tiếp (ben, now, utm_..., fbclid...).
 */
export const guestName = (search = location.search): string => {
  const m = /[?&]ten=(.*?)(?=&(?:ben|now|utm_[a-z]+|fbclid|gclid|zarsrc)=|$)/i.exec(search);
  if (!m) return '';
  let raw = m[1].replace(/\+/g, ' ').replace(/=+$/, '');
  try { raw = decodeURIComponent(raw); } catch { raw = raw.replace(/%26/gi, '&').replace(/%20/g, ' '); }
  return raw.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
};
