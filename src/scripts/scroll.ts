import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Draggable } from 'gsap/Draggable';
import { S, $, $$, pad, reduced, isDesktop, body } from './shared';

export function init() {
gsap.registerPlugin(ScrollTrigger, SplitText, Draggable);
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
    if (desktop) {
      gsap.to('[data-hero-frame]', { yPercent: -12, scale: 1.08, ease: 'none', scrollTrigger: st });
      gsap.to('.hero__bg', { yPercent: 12, ease: 'none', scrollTrigger: st });
    } else {
      gsap.to('[data-hero-frame]', { scale: 0.9, borderRadius: 28, ease: 'none', scrollTrigger: st });
    }
    gsap.to('[data-hero-bottom]', { yPercent: -18, autoAlpha: 0.2, ease: 'none', scrollTrigger: { ...st, start: 'top top', end: '70% top' } });
  }

  /* Parallax nhẹ cho ảnh cô dâu chú rể */
  $$('.cp__arch .ph').forEach((ph) => {
    gsap.fromTo(ph, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: ph.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* Marquee: chạy vô hạn, tăng tốc + đổi chiều theo vận tốc cuộn */
  const rows = $$('[data-marquee]');
  const loops = rows.map((r) => {
    const dir = Number(r.dataset.marquee) || 1;
    return gsap.fromTo(r, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: dir > 0 ? 18 : 28, ease: 'none', repeat: -1 });
  });
  if (rows[0]) {
    let sign = 1;
    ScrollTrigger.create({
      trigger: rows[0].parentElement, start: 'top bottom', end: 'bottom top',
      onToggle: (s) => loops.forEach((l) => (s.isActive ? l.play() : l.pause())),
      onUpdate: (s) => {
        const v = s.getVelocity();
        if (Math.abs(v) < 5) return;
        sign = v < 0 ? -1 : 1;
        const boost = gsap.utils.clamp(1, 5, 1 + Math.abs(v) / 400);
        loops.forEach((l) => gsap.to(l, { timeScale: boost * sign, duration: 0.2, overwrite: true, onComplete: () => gsap.to(l, { timeScale: sign, duration: 1.2 }) }));
      },
    });
  }

  /* Khoảnh khắc: polaroid bay vào rồi xoè quạt sang hai bên (kiểu "Tour dates") */
  const tour = $('[data-tour]');
  if (tour) {
    const pols = $$('[data-pol]', tour);
    const n = pols.length;
    const cur = $('[data-tour-cur]', tour);
    const W = () => pols[0].offsetWidth;
    // vị trí của ảnh j khi đã có k ảnh trên bàn (ảnh mới nhất ở giữa, ảnh cũ dạt dần ra hai bên)
    const slot = (j: number, k: number) => {
      const d = k - 1 - j;
      if (d <= 0) return { x: 0, y: 0, rotation: k % 2 ? -2.5 : 3, scale: 1 };
      const side = d % 2 ? -1 : 1;
      const dist = Math.ceil(d / 2);
      const spread = desktop ? W() * 0.44 : W() * 0.16;
      return {
        x: side * (dist * spread + (desktop ? 0 : 0)),
        y: desktop ? dist * 14 - 6 : -dist * 22,
        rotation: side * (4 + dist * 3.5),
        scale: 1 - dist * (desktop ? 0.05 : 0.06),
      };
    };
    const offscreen = (i: number) => ({ x: (i % 2 ? -1 : 1) * W() * 0.25, y: window.innerHeight * 1.1, rotation: i % 2 ? -26 : 24, scale: 1 });
    gsap.set(pols, { xPercent: -50, yPercent: -50 });
    gsap.set(pols[0], slot(0, 1));
    pols.slice(1).forEach((p, i) => gsap.set(p, offscreen(i + 1)));
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out', duration: 1 },
      scrollTrigger: {
        trigger: tour, pin: '[data-tour-pin]', start: 'top top', end: () => `+=${(n - 1) * window.innerHeight * 0.8}`,
        scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (s) => { if (cur) cur.textContent = pad(Math.min(n, 1 + Math.round(s.progress * (n - 1)))); },
      },
    });
    for (let k = 2; k <= n; k++) {
      const at = k - 2 + 0.1;
      tl.fromTo(pols[k - 1], offscreen(k - 1), { ...slot(k - 1, k), immediateRender: false }, at);
      for (let j = 0; j < k - 1; j++) tl.to(pols[j], slot(j, k), at);
    }
    // vào section: ảnh đầu tiên rơi xuống bàn
    gsap.from(pols[0], { y: -window.innerHeight * 0.7, rotation: -20, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: tour, start: 'top 70%', once: true } });
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

/* ================= Kéo để mở (như "drag to reveal") ================= */
(function dragReveal() {
  const stage = $('[data-drag-stage]');
  const cover = $('[data-drag-cover]');
  const pill = $<HTMLButtonElement>('[data-drag-pill]');
  const label = $('[data-drag-label]');
  const msg = $('[data-drag-msg]');
  if (!stage || !cover || !pill) return;
  const closeBtn2 = $<HTMLButtonElement>('[data-drag-close]');
  const maxY = () => stage.clientHeight;
  let open = false;

  const setState = (o: boolean) => {
    open = o;
    pill.setAttribute('aria-expanded', String(o));
    if (label) label.textContent = o ? 'Đã mở' : 'Kéo để mở';
    if (closeBtn2) { closeBtn2.tabIndex = o ? 0 : -1; gsap.to(closeBtn2, { autoAlpha: o ? 1 : 0, duration: 0.5, delay: o ? 0.6 : 0 }); }
  };
  const animateTo = (o: boolean, velocity = 0) => {
    setState(o);
    gsap.to(cover, { y: o ? maxY() : 0, duration: o ? 1.1 : 0.9, ease: o ? 'expo.out' : 'elastic.out(1, .65)', onUpdate: syncMsg });
    if (o && msg) gsap.fromTo(msg.children, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.12, duration: 1.1, ease: 'expo.out', delay: 0.15 });
    void velocity;
  };
  const syncMsg = () => {
    const p = gsap.utils.clamp(0, 1, (gsap.getProperty(cover, 'y') as number) / maxY());
    gsap.set('.dr__ph', { scale: 1.15 - p * 0.15 });
    gsap.set(cover, { borderRadius: p > 0.98 ? '28px 28px 28px 28px' : undefined });
  };

  const [drag] = Draggable.create(cover, {
    type: 'y',
    bounds: { minY: 0, maxY: stage.clientHeight },
    edgeResistance: 0.85,
    dragClickables: false,
    onPress() { gsap.killTweensOf(cover); },
    onDrag: syncMsg,
    onRelease() {
      const y = this.y as number;
      const shouldOpen = y > maxY() * 0.22;
      animateTo(shouldOpen);
    },
  });
  pill.addEventListener('click', () => animateTo(!open));
  closeBtn2?.addEventListener('click', () => { animateTo(false); pill.focus({ preventScroll: true }); });
  window.addEventListener('resize', () => { drag.applyBounds({ minY: 0, maxY: maxY() }); gsap.set(cover, { y: open ? maxY() : 0 }); });

  // gợi ý: khi cuộn tới, lớp phủ "nhấc" lên một chút + nút nhịp
  if (!reduced) {
    gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top 65%', once: true } })
      .from('.dr__word', { yPercent: 30, autoAlpha: 0, duration: 1.2, ease: 'expo.out' })
      .from(pill, { scale: 0.6, autoAlpha: 0, duration: 0.8, ease: 'back.out(2)' }, '-=.8')
      .to(cover, { y: 56, duration: 0.6, ease: 'power2.out' }, '+=.2')
      .to(cover, { y: 0, duration: 1, ease: 'elastic.out(1, .5)' });
    gsap.to(pill, { y: 6, repeat: -1, yoyo: true, duration: 0.9, ease: 'sine.inOut' });
  }
})();

/* ================= Thanh điều hướng + Menu + rèm chuyển cảnh ================= */
const navEl = $('#nav');
if (navEl) {
  // nền sáng sau hero, tối khi đang ở section nền tối
  ScrollTrigger.create({ trigger: '.hero', start: 'bottom 80px', onToggle: (s) => navEl.classList.toggle('is-solid', s.isActive), end: 'max' });
  let darkCount = 0;
  $$('.mq, .tour, .ev, .cd, .ft').forEach((sec) => ScrollTrigger.create({
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
