import gsap from 'gsap';
import { S, $, $$, pad, reduced, isDesktop, root, body } from './shared';


/* ================= Ảnh: placeholder -> ảnh thật ================= */
$$<HTMLImageElement>('.ph img').forEach((img) => {
  const ph = img.closest('.ph')!;
  const done = () => ph.classList.add('is-loaded');
  if (img.complete && img.naturalWidth) done();
  else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
});

/* ================= Video hero (nếu có): chọn bản mobile/desktop, ảnh nằm dưới làm poster ================= */
const heroVideo = $<HTMLVideoElement>('[data-hero-video]');
if (heroVideo && !reduced && !(navigator as any).connection?.saveData) {
  const k = isDesktop() ? 'd' : 'm';
  const add = (src: string | undefined, type: string) => { if (!src) return; const so = document.createElement('source'); so.src = src; so.type = type; heroVideo.appendChild(so); };
  heroVideo.addEventListener('playing', () => heroVideo.classList.add('is-playing'), { once: true });
  // Chỉ tải video sau khi intro xong + trang đã load -> không tranh băng thông với ảnh đầu trang (LCP)
  let started = false;
  const start = () => {
    if (started) return; started = true;
    add(heroVideo.dataset[k + 'Webm'], 'video/webm');
    add(heroVideo.dataset[k + 'Mp4'], 'video/mp4');
    heroVideo.preload = 'auto'; heroVideo.load();
    heroVideo.play().catch(() => {});
  };
  const later = () => setTimeout(start, 600);
  window.addEventListener('dc:intro-done', () => (document.readyState === 'complete' ? later() : window.addEventListener('load', later, { once: true })), { once: true });
  window.addEventListener('load', () => setTimeout(start, 4000), { once: true });
}

/* ================= Tên khách mời (?ten=...) ================= */
const guest = (new URLSearchParams(location.search).get('ten') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
if (guest) {
  $$('[data-guest-name]').forEach((el) => (el.textContent = guest));
  $$('[data-guest]').forEach((el) => { el.hidden = false; });
  $$('[data-no-guest]').forEach((el) => { el.hidden = true; });
}

/* ================= Bên mời + đếm ngược ================= */
type Side = 'nam' | 'nu';
const urlSide = new URLSearchParams(location.search).get('ben');
let side: Side =
  urlSide === 'nha-gai' || urlSide === 'nu' ? 'nu'
  : urlSide === 'nha-trai' || urlSide === 'nam' ? 'nam'
  : root.dataset.side === 'nu' ? 'nu' : 'nam'; // trang /nha-gai/ đặt sẵn data-side
const cd = $('[data-countdown]');
// ?now=2026-12-30T10:00 để xem thử giao diện sau ngày cưới
const nowOverride = Date.parse(new URLSearchParams(location.search).get('now') || '');
const now = () => (Number.isNaN(nowOverride) ? Date.now() : nowOverride);
function tick() {
  if (!cd) return;
  const n = now();
  const passed = Date.parse(cd.dataset[side] || '') <= n;
  $$('[data-cd-before]', cd).forEach((el) => { el.hidden = passed; });
  const afterEl = $('[data-cd-after]', cd); if (afterEl) afterEl.hidden = !passed;
  const live = $('[data-cd-live]', cd);
  if (live) live.hidden = !(n >= Date.parse(cd.dataset.liveFrom || '') && n <= Date.parse(cd.dataset.liveTo || ''));
  let t = Math.max(0, Math.floor((Date.parse(cd.dataset[side] || '') - n) / 1000));
  const d = Math.floor(t / 86400); t -= d * 86400;
  const h = Math.floor(t / 3600); t -= h * 3600;
  const m = Math.floor(t / 60);
  const v: Record<string, number> = { d, h, m, s: t - m * 60 };
  $$('[data-cd]', cd).forEach((el) => (el.textContent = pad(v[el.dataset.cd!])));
}
function setSide(s: Side, user = false) {
  side = s;
  root.dataset.side = s;
  $$('[data-side-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sideBtn === s)));
  tick();
  if (user) {
    const u = new URL(location.href);
    u.searchParams.set('ben', s === 'nu' ? 'nha-gai' : 'nha-trai');
    history.replaceState(null, '', u);
    if (!reduced) gsap.from($$(`.only-${s} [data-card]`), { y: 60, autoAlpha: 0, rotation: 2, stagger: 0.1, duration: 0.9, ease: 'expo.out' });
    S.refresh();
  }
}
$$('[data-side-btn]').forEach((b) => b.addEventListener('click', () => setSide(b.dataset.sideBtn as Side, true)));
setSide(side);
setInterval(tick, 1000);

/* ================= Preloader -> Hero intro ================= */
function unlock() {
  window.dispatchEvent(new Event('dc:intro-done'));
  body.classList.remove('is-locked');
  S.lenis?.start();
  try { sessionStorage.setItem('dc-seen', '1'); } catch {}
  S.refresh();
}

function heroIntro() {
  const title = $('[data-hero-title]')!;
  const frame = $('[data-hero-frame]')!;
  const media = $('[data-hero-media]')!;
  const chars = $$('.c', title);
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: unlock });
  if (reduced) { tl.from([title, '[data-hero-fade]', '[data-hero-script]'], { autoAlpha: 0, duration: 0.4 }); return; }
  if (isDesktop()) tl.fromTo(frame, { clipPath: 'inset(42% 42% 42% 42%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' }, 0);
  tl.fromTo(media, { scale: 1.3 }, { scale: 1, duration: 2.4 }, 0)
    .from(chars, { yPercent: 115, duration: 1.3, stagger: 0.035 }, 0.35)
    .from('[data-hero-script]', { autoAlpha: 0, x: -40, rotation: -10, duration: 1.4 }, 0.9)
    .from('[data-hero-fade]', { autoAlpha: 0, y: 16, duration: 1, stagger: 0.08 }, 1);
}

(function preloader() {
  const el = $('#loader');
  if (!el || root.classList.contains('skip-loader') || getComputedStyle(el).display === 'none') {
    el?.remove();
    heroIntro();
    return;
  }
  const line = $<SVGPathElement>('[data-heart-line]')! as unknown as SVGPathElement;
  const fill = $('[data-heart-fill]')!;
  const pen = $('[data-heart-pen]')!;
  const total = line.getTotalLength();
  gsap.set(pen, { opacity: 1 });
  // trạng thái tải thật: ảnh hero + font
  const heroImg = $<HTMLImageElement>('[data-hero-media] img');
  let ready = 0;
  const parts = { img: !heroImg || (heroImg.complete && heroImg.naturalWidth > 0), fonts: false };
  const upd = () => (ready = (Number(parts.img) + Number(parts.fonts)) / 2);
  heroImg?.addEventListener('load', () => { parts.img = true; upd(); }, { once: true });
  heroImg?.addEventListener('error', () => { parts.img = true; upd(); }, { once: true });
  document.fonts?.ready.then(() => { parts.fonts = true; upd(); });
  upd();


  const p = { v: 0 };
  const start = performance.now();
  const MIN = reduced ? 300 : 1700, MAX = 3500;
  const loop = () => {
    const elapsed = performance.now() - start;
    const target = elapsed > MAX ? 1 : Math.min(elapsed / MIN, 0.15 + ready * 0.85);
    p.v += (target - p.v) * 0.12;
    if (target >= 1 && p.v > 0.995) p.v = 1;
    // vẽ trái tim theo tiến độ tải (không hiện %), đầu bút sáng chạy theo nét
    line.style.strokeDashoffset = String(1 - p.v);
    const pt = line.getPointAtLength(total * p.v);
    pen.setAttribute('cx', String(pt.x)); pen.setAttribute('cy', String(pt.y));
    if (p.v < 1) return;
    gsap.ticker.remove(loop);
    gsap.timeline()
      .to(pen, { opacity: 0, duration: 0.3 })
      .to(fill, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
      // nhịp tim: thình thịch 2 lần
      .to(fill, { keyframes: [{ scale: 1.14, duration: 0.14 }, { scale: 1, duration: 0.18 }, { scale: 1.2, duration: 0.14 }, { scale: 1, duration: 0.3 }], ease: 'power1.inOut' }, 0.15)
      .to('[data-loader-heart]', { scale: 1.06, duration: 0.3, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 0.15)
      .to('[data-loader-heart], [data-loader-names] > *, .loader__top, .loader__bottom', { yPercent: -40, autoAlpha: 0, duration: 0.6, stagger: 0.04, ease: 'power3.in' }, '+=.1')
      .to(el, { yPercent: -100, duration: 1.2, ease: 'expo.inOut' }, '-=.15')
      .add(heroIntro, '-=.75')
      .add(() => el.remove());
  };
  gsap.ticker.add(loop);
})();

/* ================= Sao chép số TK ================= */
const toast = $('#toast');
let toastT = 0;
const toastMsg = (m: string) => {
  if (!toast) return;
  toast.textContent = m; toast.classList.add('is-on');
  clearTimeout(toastT); toastT = window.setTimeout(() => toast.classList.remove('is-on'), 2200);
};
$$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy || ''); toastMsg('Đã sao chép số tài khoản'); }
  catch { toastMsg('Không sao chép được, vui lòng chép thủ công'); }
}));

const menu = $('#menu');
const openBtn = $('#menu-open');
const closeBtn = $('#menu-close');
function openMenu() {
  if (!menu) return;
  S.menuOpen = true;
  menu.hidden = false;
  openBtn?.setAttribute('aria-expanded', 'true');
  body.classList.add('is-locked'); S.lenis?.stop();
  gsap.timeline()
    .fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' })
    .fromTo($$('[data-menu-link]', menu), { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.07, ease: 'expo.out' }, '-=.35')
    .fromTo('[data-menu-foot]', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' }, '-=.7');
  setTimeout(() => closeBtn?.focus(), 400);
}
function closeMenu(instant = false) {
  if (!menu || !S.menuOpen) return;
  S.menuOpen = false;
  openBtn?.setAttribute('aria-expanded', 'false');
  body.classList.remove('is-locked'); S.lenis?.start();
  if (instant) { menu.hidden = true; return; }
  gsap.to(menu, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'expo.inOut', onComplete: () => { menu.hidden = true; } });
  openBtn?.focus({ preventScroll: true });
}
openBtn?.addEventListener('click', openMenu);
closeBtn?.addEventListener('click', () => closeMenu());
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

const curtain = $('#curtain');
const curtainLabel = $('#curtain-label');
function scrollToEl(target: Element | number) {
  if (S.lenis) S.lenis.scrollTo(target, { immediate: true, force: true });
  else if (typeof target === 'number') window.scrollTo(0, target);
  else window.scrollTo(0, (target as HTMLElement).getBoundingClientRect().top + window.scrollY);
}
$$<HTMLAnchorElement>('a[data-goto]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href')!.slice(1);
  const target = id === 'top' ? 0 : document.getElementById(id);
  if (target === null) return;
  e.preventDefault();
  if (reduced || !curtain) { closeMenu(true); scrollToEl(target); return; }
  if (curtainLabel) curtainLabel.textContent = id === 'top' ? 'Quang Đông & Trang Châu' : (a.textContent || '').replace(/^\s*\d+\s*/, '').trim();
  gsap.timeline()
    .set(curtain, { visibility: 'visible', yPercent: 100 })
    .set(curtainLabel, { autoAlpha: 0, y: 30 })
    .to(curtain, { yPercent: 0, duration: 0.75, ease: 'expo.inOut' })
    .to(curtainLabel, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, '-=.2')
    .add(() => { closeMenu(true); scrollToEl(target); })
    .to(curtainLabel, { autoAlpha: 0, y: -30, duration: 0.4, ease: 'power2.in' }, '+=.25')
    .to(curtain, { yPercent: -100, duration: 0.8, ease: 'expo.inOut' }, '-=.15')
    .set(curtain, { visibility: 'hidden' });
}));

/* ================= Nhạc nền: đĩa than quay theo bài hát ================= */
(function music() {
  const box = $('[data-music]');
  const btn = $('[data-music-btn]');
  const disc = $('[data-music-disc]');
  const audio = $<HTMLAudioElement>('[data-music-audio]');
  const title = $('[data-music-title]');
  if (!box || !btn || !disc || !audio) return;
  const KEY = 'dc-music';
  const spin = gsap.to(disc, { rotation: '+=360', duration: 3.6, ease: 'none', repeat: -1, paused: true });
  let titleT = 0;
  const showTitle = () => {
    if (!title) return;
    title.classList.add('is-shown');
    clearTimeout(titleT); titleT = window.setTimeout(() => title.classList.remove('is-shown'), 4200);
  };
  const play = () => {
    if (!audio.paused) return;
    audio.volume = 0;
    audio.play().then(() => {
      box.classList.add('is-playing', 'was-played');
      btn.setAttribute('aria-pressed', 'true');
      spin.timeScale(0).play();
      gsap.to(spin, { timeScale: 1, duration: 1.2, ease: 'power2.out' }); // đĩa tăng tốc dần
      gsap.to(audio, { volume: 0.55, duration: 2, ease: 'power1.out' });
      showTitle();
      try { sessionStorage.setItem(KEY, 'on'); } catch {}
    }).catch(() => {});
  };
  const stop = () => {
    box.classList.remove('is-playing');
    btn.setAttribute('aria-pressed', 'false');
    gsap.to(spin, { timeScale: 0, duration: 1.4, ease: 'power2.out', onComplete: () => spin.pause() }); // chậm dần rồi dừng
    gsap.to(audio, { volume: 0, duration: 0.7, ease: 'power1.in', onComplete: () => audio.pause() });
    try { sessionStorage.setItem(KEY, 'off'); } catch {}
  };
  btn.addEventListener('click', () => (audio.paused ? play() : stop()));
  btn.addEventListener('mouseenter', () => { if (!audio.paused) showTitle(); });
  // tự bật ở lần tương tác đầu tiên (trình duyệt không cho tự phát khi chưa chạm)
  let off = false;
  try { off = sessionStorage.getItem(KEY) === 'off'; } catch {}
  if (!off) {
    const first = (e: Event) => {
      if (btn.contains(e.target as Node)) return; // bấm chính nút -> để click xử lý
      ['pointerdown', 'keydown', 'touchend'].forEach((ev) => window.removeEventListener(ev, first, true));
      play();
    };
    ['pointerdown', 'keydown', 'touchend'].forEach((ev) => window.addEventListener(ev, first, { capture: true, passive: true }));
    play(); // thử tự phát ngay; bị chặn thì chờ lần tương tác đầu tiên ở trên
  }
  // tab ẩn thì tạm dừng, quay lại thì phát tiếp (nếu đang bật)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !audio.paused) { audio.pause(); spin.pause(); box.dataset.resume = '1'; }
    else if (!document.hidden && box.dataset.resume) { delete box.dataset.resume; audio.play().then(() => spin.play()).catch(() => {}); }
  });
})();


/* Phần chuyển động theo cuộn được tải sau (không chặn lần hiển thị đầu tiên) */
let scrollReady: Promise<void> | undefined;
const loadScroll = () => scrollReady ??= import('./scroll').then((m) => m.init());
const initialHash = location.hash;
const initialAnchor = document.getElementById(initialHash.slice(1));
const idle = (fn: () => void) => ('requestIdleCallback' in window ? (window as any).requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 200));
// chỉ tải khi intro xong hoặc người dùng bắt đầu tương tác
window.addEventListener('dc:intro-done', () => {
  if (!initialAnchor) {
    idle(loadScroll);
    return;
  }
  // Các section ghim làm thay đổi vị trí đích của liên kết sau khi trang tải.
  void Promise.all([loadScroll(), document.fonts.ready]).then(() => {
    if (location.hash === initialHash) initialAnchor.scrollIntoView();
  });
}, { once: true });
['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => idle(loadScroll), { once: true, passive: true }));
setTimeout(() => idle(loadScroll), 6000);
// trình duyệt khôi phục vị trí cuộn giữa trang -> tải ngay để bố cục (pin) đúng từ đầu
if (initialAnchor || window.scrollY > 50) void loadScroll();
