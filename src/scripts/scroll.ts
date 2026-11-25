import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { S, $, $$, pad, reduced, isDesktop, body } from './shared';

// nhường luồng chính giữa các phần khởi tạo -> không có tác vụ dài làm khựng trang
const nextTask = () => new Promise<void>((r) => setTimeout(r, 0));

export async function init(): Promise<void> {
gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
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

// (chạy ở tác vụ riêng -> không dồn thành 1 tác vụ dài lúc khởi tạo)
document.fonts.ready.then(() => setTimeout(() => {
  // Tiêu đề: chữ trượt lên theo dòng
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => reduced
        ? gsap.from(self.lines, { autoAlpha: 0, duration: 0.4, scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
        : gsap.from(self.lines, { yPercent: 110, duration: 1.15, stagger: 0.09, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
    });
  });
}, 60));

// Hiện dần theo nhóm
gsap.set('[data-fade]', { autoAlpha: 0, y: reduced ? 0 : 32 });
ScrollTrigger.batch('[data-fade]', {
  start: 'top 90%', once: true,
  onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1, ease: 'expo.out', overwrite: true }),
});

await nextTask();
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

  /* Ảnh chú rể trượt ra từ từ bên trái, cô dâu từ bên phải — chạy theo nhịp cuộn */
  $$<HTMLElement>('[data-slide]').forEach((el) => {
    const left = el.dataset.slide === 'left';
    gsap.fromTo(el, { xPercent: left ? -115 : 115, rotate: left ? -4 : 4, autoAlpha: 0 },
      { xPercent: 0, rotate: 0, autoAlpha: 1, ease: 'power2.out', scrollTrigger: { trigger: el.closest('.cp__grid') ?? el, start: 'top 95%', end: desktop ? 'top 30%' : 'top 40%', scrub: 1.2 } });
  });

  /* Parallax nhẹ cho ảnh cô dâu chú rể */
  $$('.cp__arch .ph').forEach((ph) => {
    gsap.fromTo(ph, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: ph.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* Marquee + dải ảnh: chạy vô hạn, tăng tốc + đổi chiều theo vận tốc cuộn (mỗi nhóm hàng có trigger riêng) */
  const groups = new Map<HTMLElement, gsap.core.Tween[]>();
  $$('[data-marquee]').forEach((r) => {
    if (r.closest('[data-steady]') && !r.dataset.cloned) {
      // dải ảnh: HTML chỉ có 1 bản -> nhân thành 4 bản (bản sao ẩn với trình đọc màn hình)
      r.dataset.cloned = '1';
      const items = [...r.children];
      for (let k = 0; k < 3; k++) items.forEach((n) => { const c = n.cloneNode(true) as HTMLElement; c.setAttribute('aria-hidden', 'true'); r.append(c); });
    }
    const dir = Number(r.dataset.marquee) || 1;
    const dur = Number(r.dataset.speed) || (dir > 0 ? 18 : 28);
    const tw = gsap.fromTo(r, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: dur, ease: 'none', repeat: -1, paused: true });
    const g = r.parentElement as HTMLElement;
    groups.set(g, [...(groups.get(g) || []), tw]);
  });
  groups.forEach((loops, g) => {
    if (g.hasAttribute('data-steady')) {
      // chạy đều, chỉ nhanh lên nhẹ khi cuộn (không giật, không đảo chiều); tải sẵn ảnh để không bị "nháy" khi ảnh chạy vào khung
      g.querySelectorAll('img').forEach((im) => ((im as HTMLImageElement).loading = 'eager'));
      const speed = { v: 1 };
      ScrollTrigger.create({
        trigger: g, start: 'top bottom', end: 'bottom top',
        onToggle: (s) => loops.forEach((l) => (s.isActive ? l.play() : l.pause())),
        onUpdate: (s) => {
          const target = 1 + Math.min(Math.abs(s.getVelocity()) / 1200, 1.2);
          gsap.to(speed, { v: target, duration: 0.6, ease: 'power2.out', overwrite: true,
            onUpdate: () => loops.forEach((l) => l.timeScale(speed.v)),
            onComplete: () => gsap.to(speed, { v: 1, duration: 1.6, ease: 'sine.out', onUpdate: () => loops.forEach((l) => l.timeScale(speed.v)) }) });
        },
      });
      return;
    }
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

  /* Chuyện của tụi mình — kiểu gsap.com/text: vào tới đoạn nào, cả đoạn chạy một chuỗi hiệu ứng:
     1) từng chữ bật lên khỏi mép dòng (che theo dòng) nối đuôi nhau
     2) chữ nhấn (**...**) lật lên thành bản đỏ đô nghiêng (2 bản xếp chồng), số thì xáo chữ */
  const story = $$('[data-reveal]');
  if (story.length) {
    // Tách chữ (nặng) chỉ khi đoạn văn sắp vào màn hình -> không làm khựng lúc mở trang
    const build = (el: HTMLElement) => {
      {
        const split = SplitText.create(el, { type: 'lines,words', mask: 'lines', linesClass: 'ln', wordsClass: 'w' });
        const rolls: HTMLElement[][] = [];
        const nums: HTMLElement[] = [];
        // tìm các cụm chữ nhấn trong danh sách chữ đã tách (so khớp liên tiếp, bỏ dấu câu)
        const norm = (t: string) => t.toLowerCase().replace(/[.,!?;:"“”()]/g, '').trim();
        const words = split.words as HTMLElement[];
        const keys = words.map((w) => norm(w.textContent || ''));
        const hit = new Set<HTMLElement>();
        (JSON.parse(el.dataset.hl || '[]') as string[]).forEach((ph) => {
          const tk = ph.split(/\s+/).map(norm);
          for (let i = 0; i + tk.length <= keys.length; i++) {
            if (tk.every((t, j) => keys[i + j] === t)) { for (let j = 0; j < tk.length; j++) hit.add(words[i + j]); break; }
          }
        });
        words.filter((w) => hit.has(w)).forEach((w) => {
          const txt = (w.textContent || '').trim();
          const roll = document.createElement('span'); roll.className = 'roll';
          const a = document.createElement('span'); a.textContent = txt;
          const b2 = document.createElement('span'); b2.textContent = txt; b2.setAttribute('aria-hidden', 'true');
          roll.append(a, b2); w.replaceChildren(roll);
          rolls.push([a, b2, roll]);
          if (/^\d+[.,]?$/.test(txt)) nums.push(b2);
        });
        rolls.forEach(([, b2]) => gsap.set(b2, { yPercent: 110 }));
        gsap.set(split.words, { yPercent: 120, rotate: 7, opacity: 0, transformOrigin: '0% 100%' });
        const tl = gsap.timeline({ paused: true });
        tl.to(split.words, { yPercent: 0, rotate: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: { each: 0.022 } });
        rolls.forEach(([a, b2, roll], i) => {
          const at = 0.55 + i * 0.12;
          // bản nghiêng hẹp hơn -> co bề ngang theo để không hở khoảng trắng
          tl.fromTo(roll, { width: a.offsetWidth }, { width: b2.offsetWidth, duration: 0.7, ease: 'power3.inOut' }, at)
            .to(a, { yPercent: -110, duration: 0.7, ease: 'power3.inOut' }, at).to(b2, { yPercent: 0, duration: 0.7, ease: 'power3.inOut' }, at);
        });
        nums.forEach((n) => tl.to(n, { duration: 1.1, scrambleText: { text: n.textContent || '', chars: '0123456789', speed: 0.5 } }, 0.55));
        ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => tl.play() });
      }
    };
    document.fonts.ready.then(() => {
      const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        setTimeout(() => build(e.target as HTMLElement), 0);
      }), { rootMargin: '0px 0px 120% 0px' });
      story.forEach((el) => io.observe(el));
    });
  }

});

await nextTask();
mm.add({ desktop: '(min-width: 1024px)', mobile: '(max-width: 1023px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
  const { desktop, motion } = ctx.conditions as Record<string, boolean>;
  if (!motion) return;
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

await nextTask();
/* Thẻ sự kiện + đếm ngược */
if (!reduced) {
  ScrollTrigger.batch('.only-nam [data-card], .only-nu [data-card]', {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.from(els, { y: 70, autoAlpha: 0, rotation: 2, stagger: 0.12, duration: 1.1, ease: 'expo.out' }),
  });
  if (cd) gsap.from($$('[data-cd]', cd), { yPercent: 60, autoAlpha: 0, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: cd, start: 'top 75%', once: true } });
}

/* ================= Giữ & lau để hé lộ (như thẻ cào — "drag to reveal" của trang mẫu) ================= */
/* ================= Khoảnh khắc: rửa ảnh polaroid (giữ & lắc) ================= */
(function develop() {
  const sec = $('[data-develop]');
  if (!sec) return;
  if (reduced) { sec.classList.add('is-done'); return; }
  const card = $('[data-dev-card]', sec)!;
  const img = $('.pd__ph img', sec) as HTMLImageElement | null;
  const film = $('[data-dev-film]', sec)!;
  const flash = $('[data-dev-flash]', sec)!;
  const ink = $('[data-dev-ink]', sec)!;
  const bar = $('[data-dev-bar]', sec)!;
  const pct = $('[data-dev-pct]', sec)!;
  const label = $('[data-dev-label]', sec)!;
  const note = $('[data-dev-note]', sec)!;
  const conf = $('[data-dev-confetti]', sec)!;
  const fine = matchMedia('(pointer: fine)').matches;
  label.textContent = fine ? 'Giữ chuột & lắc tấm ảnh để rửa' : 'Chạm giữ & lắc tấm ảnh để rửa';

  let p = 0, done = false, holding = false, lastX = 0, lastY = 0, sx = 0, sy = 0, raf = 0, last = 0;
  const NEED = fine ? 4200 : 3000; // quãng đường lắc (px) để rửa xong
  const paint = () => {
    const e = p;
    if (img) img.style.filter = `blur(${(1 - e) * 9}px) brightness(${0.14 + 0.86 * e}) sepia(${(1 - e) * 0.9}) saturate(${0.3 + 0.7 * e}) contrast(${0.7 + 0.3 * e})`;
    film.style.opacity = String(0.95 * (1 - e));
    bar.style.transform = `scaleX(${e})`;
    pct.textContent = String(Math.round(e * 100));
  };
  const add = (d: number) => { if (done) return; p = Math.min(1, p + d); paint(); if (p >= 1) finish(); };

  // giữ yên cũng rửa từ từ (người không muốn lắc)
  const tick = (t: number) => {
    if (!holding || done) { raf = 0; return; }
    const dt = last ? (t - last) / 1000 : 0; last = t;
    add(dt * 0.12);
    raf = requestAnimationFrame(tick);
  };

  const down = (e: PointerEvent) => {
    if (done) return;
    holding = true; card.setPointerCapture(e.pointerId);
    lastX = sx = e.clientX; lastY = sy = e.clientY; last = 0;
    gsap.to(card, { scale: 1.03, duration: 0.25 });
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const move = (e: PointerEvent) => {
    if (!holding || done) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    add(Math.hypot(dx, dy) / NEED);
    if (done) return; // vừa rửa xong -> để hiệu ứng kết thúc đưa ảnh về giữa
    // tấm ảnh lắc theo tay
    const ox = gsap.utils.clamp(-70, 70, (e.clientX - sx) * 0.5), oy = gsap.utils.clamp(-50, 50, (e.clientY - sy) * 0.4);
    gsap.to(card, { x: ox, y: oy, rotation: gsap.utils.clamp(-14, 14, dx * 0.6) - 2.5, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  };
  const up = () => {
    if (!holding) return;
    holding = false;
    if (!done) gsap.to(card, { x: 0, y: 0, rotation: -2.5, scale: 1, duration: 1, ease: 'elastic.out(1, .45)' });
  };
  card.addEventListener('pointerdown', down);
  card.addEventListener('pointermove', move);
  card.addEventListener('pointerup', up);
  card.addEventListener('pointercancel', up);
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(0.2); gsap.fromTo(card, { rotation: -8 }, { rotation: -2.5, duration: 0.6, ease: 'elastic.out(1, .4)' }); } });
  $('[data-dev-skip]', sec)?.addEventListener('click', () => gsap.to({ v: p }, { v: 1, duration: 1.4, ease: 'power2.inOut', onUpdate() { p = this.targets()[0].v; paint(); }, onComplete: finish }));

  // gợi ý: tấm ảnh tự rung nhẹ khi vào khung
  ScrollTrigger.create({ trigger: card, start: 'top 75%', once: true, onEnter: () => { if (!done) gsap.fromTo(card, { rotation: -2.5 }, { keyframes: [{ rotation: 4 }, { rotation: -7 }, { rotation: 3 }, { rotation: -2.5 }], duration: 0.9, ease: 'power1.inOut' }); } });

  function finish() {
    if (done) return; done = true; holding = false; p = 1; paint();
    sec.classList.add('is-done');
    if (img) img.style.filter = '';
    const tl = gsap.timeline();
    gsap.killTweensOf(card);
    tl.to(card, { x: 0, y: 0, rotation: -2.5, duration: 1, ease: 'elastic.out(1, .5)' })
      .fromTo(flash, { opacity: 0.95 }, { opacity: 0, duration: 1.1, ease: 'power2.out' }, 0)
      .fromTo(card, { scale: 1.08 }, { scale: 1, duration: 0.9, ease: 'back.out(2)' }, 0)
      .fromTo(ink, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.6, ease: 'power1.inOut' }, 0.4)
      .fromTo(note, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9 }, 0.9);
    // pháo giấy
    const colors = ['#E8784A', '#EAD9B9', '#E3A397', '#F7F6F2', '#B9A4E0'];
    for (let i = 0; i < 46; i++) {
      const c = document.createElement('i');
      c.style.background = colors[i % colors.length];
      conf.appendChild(c);
      const a = Math.random() * Math.PI * 2, d = 180 + Math.random() * 260;
      gsap.fromTo(c, { x: 0, y: 0, rotation: 0, opacity: 1 }, {
        x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8 + 140, rotation: Math.random() * 720 - 360, opacity: 0,
        duration: 1.6 + Math.random() * 0.8, ease: 'power3.out', onComplete: () => c.remove(),
      });
    }
  }
})();

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

await nextTask();
/* ================= Thanh điều hướng + Menu + rèm chuyển cảnh ================= */
const navEl = $('#nav');
if (navEl) {
  // nền sáng sau hero, tối khi đang ở section nền tối
  ScrollTrigger.create({ trigger: '.hero', start: 'bottom 80px', onToggle: (s) => navEl.classList.toggle('is-solid', s.isActive), end: 'max' });
  let darkCount = 0;
  $$('.mq, .pd, .fs, .ev, .cd, .ft').forEach((sec) => ScrollTrigger.create({
    trigger: sec, start: 'top 64px', end: 'bottom 64px',
    onToggle: (s) => { darkCount += s.isActive ? 1 : -1; navEl.classList.toggle('is-dark', darkCount > 0); },
  }));
  // ẩn khi cuộn xuống, hiện khi cuộn lên
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (s) => navEl.classList.toggle('is-hidden', s.direction === 1 && s.scroll() > window.innerHeight * 0.8 && !S.menuOpen),
  });
}


window.addEventListener('load', () => ScrollTrigger.refresh());

// Các mục dùng content-visibility: auto đổi chiều cao khi được dựng thật -> làm mới vị trí các trigger
if ('ResizeObserver' in window) {
  let t = 0, first = true;
  const ro = new ResizeObserver(() => {
    if (first) { first = false; return; } // lần gọi đầu khi bắt đầu quan sát
    clearTimeout(t); t = window.setTimeout(() => ScrollTrigger.refresh(), 150);
  });
  document.querySelectorAll('#khoanh-khac, #su-kien, .fs, .cd, #loi-chuc, #mung-cuoi, body > footer').forEach((el) => ro.observe(el));
}
// sắp xếp + tính vị trí ở tác vụ sau (tách khỏi phần tạo trigger)
await nextTask();
ScrollTrigger.sort(); // trigger tạo không theo thứ tự trang (pin ở giữa) -> sắp lại để tính đúng vị trí
ScrollTrigger.refresh();
}
