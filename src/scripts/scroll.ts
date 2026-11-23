import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { S, $, $$, pad, reduced, isDesktop, body } from './shared';

export function init() {
gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });
S.refresh = () => ScrollTrigger.refresh();
const cd = $('[data-countdown]');

/* ================= Lenis (desktop) ================= */
if (isDesktop() && matchMedia('(pointer: fine)').matches && !reduced) {
  import('lenis').then(({ default: Lenis }) => {
    S.lenis = new Lenis({ lerp: 0.1 }) as unknown as LenisLike;
    S.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => S.lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    if (body.classList.contains('is-locked')) S.lenis.stop();
  });
}

/* ================= Chuyển động theo cuộn ================= */
const mm = gsap.matchMedia();

document.fonts.ready.then(() => {
  // Tiêu đề: chữ trượt lên theo dòng
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => reduced
        ? gsap.from(self.lines, { autoAlpha: 0, duration: 0.4, scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
        : gsap.from(self.lines, { yPercent: 110, duration: 1.15, stagger: 0.09, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
    });
  });
  ScrollTrigger.refresh();
});

// Hiện dần theo nhóm
gsap.set('[data-fade]', { autoAlpha: 0, y: reduced ? 0 : 32 });
ScrollTrigger.batch('[data-fade]', {
  start: 'top 90%', once: true,
  onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1, ease: 'expo.out', overwrite: true }),
});

// Ảnh lộ từ dưới lên + ảnh trong thu từ 1.3 -> 1
$$('[data-clip]').forEach((el) => {
  if (reduced) return;
  const inner = $('.ph', el) ?? el.firstElementChild;
  gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
    .fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' })
    .fromTo(inner, { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.1);
});

mm.add({ desktop: '(min-width: 1024px)', mobile: '(max-width: 1023px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
  const { desktop, motion } = ctx.conditions as Record<string, boolean>;
  if (!motion) return;

  /* Hero: thu nhỏ / bo góc khi cuộn qua */
  const hero = $('.hero');
  if (hero) {
    const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('[data-hero-frame]', { scale: desktop ? 0.92 : 0.9, borderRadius: desktop ? 32 : 28, ease: 'none', scrollTrigger: st });
    gsap.to('[data-hero-bottom]', { yPercent: -18, autoAlpha: 0.2, ease: 'none', scrollTrigger: { ...st, start: 'top top', end: '70% top' } });
  }

  /* Parallax nhẹ cho ảnh cô dâu chú rể */
  $$('.cp__arch .ph').forEach((ph) => {
    gsap.fromTo(ph, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: ph.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* Marquee + dải ảnh: chạy vô hạn, tăng tốc + đổi chiều theo vận tốc cuộn (mỗi nhóm hàng có trigger riêng) */
  const groups = new Map<HTMLElement, gsap.core.Tween[]>();
  $$('[data-marquee]').forEach((r) => {
    const dir = Number(r.dataset.marquee) || 1;
    const dur = Number(r.dataset.speed) || (dir > 0 ? 18 : 28);
    const tw = gsap.fromTo(r, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: dur, ease: 'none', repeat: -1, paused: true });
    const g = r.parentElement as HTMLElement;
    groups.set(g, [...(groups.get(g) || []), tw]);
  });
  groups.forEach((loops, g) => {
    let sign = 1;
    ScrollTrigger.create({
      trigger: g, start: 'top bottom', end: 'bottom top',
      onToggle: (s) => loops.forEach((l) => (s.isActive ? l.play() : l.pause())),
      onUpdate: (s) => {
        const v = s.getVelocity();
        if (Math.abs(v) < 5) return;
        sign = v < 0 ? -1 : 1;
        const boost = gsap.utils.clamp(1, 5, 1 + Math.abs(v) / 400);
        loops.forEach((l) => gsap.to(l, { timeScale: boost * sign, duration: 0.2, overwrite: true, onComplete: () => gsap.to(l, { timeScale: sign, duration: 1.2 }) }));
      },
    });
  });

  /* Chuyện của tụi mình: từng chữ sáng dần theo cuộn */
  $$('[data-reveal]').forEach((el) => {
    const split = SplitText.create(el, { type: 'words', wordsClass: 'w' });
    gsap.fromTo(split.words, { opacity: 0.14 }, {
      opacity: 1, ease: 'none', stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: true },
    });
  });

  /* Khoảnh khắc: mỗi ảnh một màn hình, ảnh sau kéo màn từ dưới lên, ảnh trước lùi nhẹ ra sau */
  const mo = $('[data-moments]');
  if (mo) {
    const slides = $$('[data-mo-slide]', mo);
    const imgs = slides.map((sl) => $('img', sl));
    const n = slides.length;
    const cur = $('[data-mo-cur]', mo);
    const bar = $('[data-mo-bar]', mo);
    mo.classList.add('is-pinned');
    imgs.forEach((im) => { if (im) (im as HTMLImageElement).loading = 'eager'; }); // xếp chồng 1 chỗ -> tải sẵn để lật tới là có ảnh
    gsap.set(slides.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
    const tl = gsap.timeline({
      defaults: { ease: 'none', duration: 1 },
      scrollTrigger: {
        trigger: mo, pin: '[data-mo-pin]', start: 'top top', end: () => `+=${(n - 1) * window.innerHeight * 0.85}`,
        scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        snap: { snapTo: 1 / (n - 1), inertia: false, duration: { min: 0.2, max: 0.5 }, ease: 'power2.inOut', delay: 0.08 },
        onUpdate: (st) => {
          if (cur) cur.textContent = pad(Math.min(n, 1 + Math.round(st.progress * (n - 1))));
          if (bar) bar.style.transform = `scaleX(${(1 + st.progress * (n - 1)) / n})`;
        },
      },
    });
    for (let k = 1; k < n; k++) {
      const at = k - 1;
      tl.to(slides[k], { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut' }, at)
        .fromTo(imgs[k], { scale: 1.12, yPercent: 6 }, { scale: 1, yPercent: 0, ease: 'power2.out' }, at)
        .to(imgs[k - 1], { scale: 0.9, yPercent: -4, autoAlpha: 0.35, ease: 'power2.in' }, at);
    }
    if (bar) bar.style.transform = `scaleX(${1 / n})`;
  }

  /* THE LOVE BOOK: ghim section, cuộn dọc -> sách trượt ngang; trang mở ra khi vào khung */
  const bk = $('[data-book]');
  if (bk) {
    bk.classList.add('is-pinned');
    const track = $('[data-book-track]', bk)!;
    const cur = $('[data-book-cur]', bk);
    const total = $('[data-book-total]', bk);
    const units = desktop ? $$('[data-spread]', bk) : $$('[data-page]', bk);
    if (total) total.textContent = pad(units.length);
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const slide = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: bk, pin: '[data-book-pin]', start: 'top top', end: () => `+=${dist()}`, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (st) => { if (cur) cur.textContent = pad(Math.min(units.length, 1 + Math.round(st.progress * (units.length - 0.6)))); },
      },
    });
    $$('[data-page]', bk).forEach((pg) => {
      const right = desktop && pg.classList.contains('bk__page--r');
      gsap.fromTo(pg,
        right ? { rotateY: -120, autoAlpha: 0 } : { rotateY: desktop ? 0 : -28, scale: desktop ? 0.94 : 0.9, autoAlpha: desktop ? 0.6 : 0.55 },
        {
          rotateY: 0, scale: 1, autoAlpha: 1, ease: right ? 'power2.out' : 'none',
          scrollTrigger: { trigger: pg, containerAnimation: slide, start: right ? 'left 92%' : 'left 100%', end: right ? 'left 45%' : 'left 55%', scrub: true },
        });
    });
  }


});

/* Thẻ sự kiện + đếm ngược */
if (!reduced) {
  ScrollTrigger.batch('.only-nam [data-card], .only-nu [data-card]', {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.from(els, { y: 70, autoAlpha: 0, rotation: 2, stagger: 0.12, duration: 1.1, ease: 'expo.out' }),
  });
  if (cd) gsap.from($$('[data-cd]', cd), { yPercent: 60, autoAlpha: 0, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: cd, start: 'top 75%', once: true } });
}

/* ================= Giữ & lau để hé lộ (như thẻ cào — "drag to reveal" của trang mẫu) ================= */
(function scratchReveal() {
  const stage = $('[data-scratch-stage]');
  const canvas = $<HTMLCanvasElement>('[data-scratch-canvas]');
  const pill = $<HTMLButtonElement>('[data-scratch-pill]');
  const msg = $('[data-scratch-msg]');
  if (!stage || !canvas || !pill) return;
  const ctx = canvas.getContext('2d')!;
  const GX = 36, GY = 28; // lưới để tính % đã cào
  let grid = new Uint8Array(GX * GY);
  let cleared = 0, done = false, started = false;
  let w = 0, h = 0, dpr = 1, brush = 60;
  let last: { x: number; y: number } | null = null;

  const paint = () => {
    const r = stage.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);
    brush = Math.max(34, Math.min(w, h) * (isDesktop() ? 0.11 : 0.15));
    grid = new Uint8Array(GX * GY); cleared = 0;
  };

  const mark = (x: number, y: number) => {
    const rx = brush / w * GX, ry = brush / h * GY;
    const cx = x / w * GX, cy = y / h * GY;
    for (let gy = Math.max(0, Math.floor(cy - ry)); gy <= Math.min(GY - 1, Math.ceil(cy + ry)); gy++)
      for (let gx = Math.max(0, Math.floor(cx - rx)); gx <= Math.min(GX - 1, Math.ceil(cx + rx)); gx++) {
        const dx = (gx + 0.5 - cx) / rx, dy = (gy + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1 && !grid[gy * GX + gx]) { grid[gy * GX + gx] = 1; cleared++; }
      }
  };

  // nét cào: vẽ blob tròn + nối các điểm để không bị đứt
  const scratch = (x: number, y: number, auto = false) => {
    if (done) return;
    if (!started && !auto) { started = true; gsap.to(pill, { autoAlpha: 0, y: -10, duration: 0.4 }); }
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = brush * 2;
    ctx.beginPath();
    if (last) { ctx.moveTo(last.x, last.y); ctx.lineTo(x, y); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y, brush * (0.9 + Math.random() * 0.25), 0, Math.PI * 2); ctx.fill();
    // vài giọt loang quanh nét
    for (let i = 0; i < 2; i++) {
      const a = Math.random() * Math.PI * 2, d = brush * (0.7 + Math.random() * 0.5);
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, brush * (0.35 + Math.random() * 0.3), 0, Math.PI * 2); ctx.fill();
    }
    if (last) { const steps = Math.ceil(Math.hypot(x - last.x, y - last.y) / (brush * 0.5)); for (let s = 1; s <= steps; s++) mark(last.x + (x - last.x) * s / steps, last.y + (y - last.y) * s / steps); }
    mark(x, y);
    last = { x, y };
    if (cleared / grid.length > 0.5) revealAll();
  };

  const revealAll = () => {
    if (done) return;
    done = true;
    gsap.to(pill, { autoAlpha: 0, duration: 0.3 });
    gsap.to(canvas, { autoAlpha: 0, duration: 1.1, ease: 'power2.inOut' });
    gsap.to('.dr__word', { yPercent: -18, scale: 0.86, autoAlpha: 0.9, duration: 1.4, ease: 'expo.inOut' });
    gsap.fromTo('.dr__ph', { scale: 1.12 }, { scale: 1, duration: 1.8, ease: 'expo.out' });
    if (msg) gsap.fromTo(msg, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.1, delay: 0.5, ease: 'expo.out' });
  };

  const pos = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const fine = matchMedia('(pointer: fine)').matches;
  let down = false;
  canvas.addEventListener('pointerdown', (e) => { down = true; last = null; canvas.setPointerCapture(e.pointerId); const p = pos(e); scratch(p.x, p.y); });
  canvas.addEventListener('pointermove', (e) => {
    if (!down) return; // phải giữ chuột (hoặc chạm) mới lau
    const p = pos(e); scratch(p.x, p.y);
  });
  const up = () => { down = false; last = null; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', () => { if (!down) last = null; });
  pill.textContent = fine ? 'Giữ chuột & lau để hé lộ' : 'Chạm & lau để hé lộ';
  pill.addEventListener('click', revealAll); // bàn phím / người không muốn lau

  paint();
  let rw = window.innerWidth;
  window.addEventListener('resize', () => { if (!done && Math.abs(window.innerWidth - rw) > 40) { rw = window.innerWidth; paint(); } });

  // gợi ý: khi cuộn tới, tự "cào" một vệt nhỏ + nút nhịp nhẹ
  if (!reduced) {
    ScrollTrigger.create({
      trigger: stage, start: 'top 60%', once: true,
      onEnter: () => {
        gsap.from('.dr__word', { yPercent: 30, autoAlpha: 0, duration: 1.2, ease: 'expo.out' });
        const o = { t: 0 };
        gsap.to(o, {
          t: 1, duration: 0.9, delay: 0.6, ease: 'power1.inOut',
          onUpdate: () => {
            if (started || done) return;
            const x = w * (0.72 + 0.12 * o.t), y = h * (0.7 - 0.18 * Math.sin(o.t * Math.PI));
            scratch(x, y, true);
          },
          onComplete: () => { last = null; },
        });
      },
    });
    gsap.to(pill, { y: 6, repeat: -1, yoyo: true, duration: 0.9, ease: 'sine.inOut' });
  }
})();

/* ================= Thanh điều hướng + Menu + rèm chuyển cảnh ================= */
const navEl = $('#nav');
if (navEl) {
  // nền sáng sau hero, tối khi đang ở section nền tối
  ScrollTrigger.create({ trigger: '.hero', start: 'bottom 80px', onToggle: (s) => navEl.classList.toggle('is-solid', s.isActive), end: 'max' });
  let darkCount = 0;
  $$('.mq, .mo, .fs, .ev, .cd, .ft').forEach((sec) => ScrollTrigger.create({
    trigger: sec, start: 'top 64px', end: 'bottom 64px',
    onToggle: (s) => { darkCount += s.isActive ? 1 : -1; navEl.classList.toggle('is-dark', darkCount > 0); },
  }));
  // ẩn khi cuộn xuống, hiện khi cuộn lên
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (s) => navEl.classList.toggle('is-hidden', s.direction === 1 && s.scroll() > window.innerHeight * 0.8 && !S.menuOpen),
  });
}


ScrollTrigger.refresh();
window.addEventListener('load', () => ScrollTrigger.refresh());
}
