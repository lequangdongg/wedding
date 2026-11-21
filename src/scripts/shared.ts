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
