/**
 * Sổ lời chúc: gửi + hiển thị lời chúc.
 * Nơi lưu = Google Apps Script web app (wishes.endpoint). Không có endpoint -> chế độ xem thử, lưu localStorage của máy đang xem.
 * Mọi nội dung khách nhập đều gắn bằng textContent (không dùng innerHTML).
 */
import gsap from 'gsap';

interface Wish { name: string; message: string; relation?: string; side?: string; t?: string | number; demo?: boolean }

const COLORS = ['#FFF7E0', '#F6E3E0', '#E4EEEA', '#F3EEE4', '#EFE4F0'];
const DEMO_KEY = 'dc-wishes-demo';
const LAST_KEY = 'dc-wish-last';

const store = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* chế độ riêng tư */ } },
};

const ago = (t?: string | number) => {
  if (!t) return '';
  const s = Math.max(0, (Date.now() - new Date(t).getTime()) / 1000);
  if (s < 60) return 'vừa xong';
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} ngày trước`;
  return new Date(t).toLocaleDateString('vi-VN');
};

export function init(root: HTMLElement) {
  const endpoint = root.dataset.endpoint || '';
  const demo = !endpoint;
  const form = root.querySelector<HTMLFormElement>('[data-wish-form]')!;
  const done = root.querySelector<HTMLElement>('[data-wish-done]')!;
  const list = root.querySelector<HTMLElement>('[data-wish-list]')!;
  const empty = root.querySelector<HTMLElement>('[data-wish-empty]')!;
  const total = root.querySelector<HTMLElement>('[data-wish-total]')!;
  const note = root.querySelector<HTMLElement>('[data-wish-note]')!;
  const send = root.querySelector<HTMLButtonElement>('[data-wish-send]')!;
  const sendLabel = root.querySelector<HTMLElement>('[data-send-label]')!;
  const msg = form.elements.namedItem('message') as HTMLTextAreaElement;
  const nameEl = form.elements.namedItem('name') as HTMLInputElement;
  const count = root.querySelector<HTMLElement>('[data-wish-count]')!;
  const max = msg.maxLength || 300;
  let n = 0;

  // điền sẵn tên khách từ link ?ten=
  const guest = (new URLSearchParams(location.search).get('ten') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (guest && !nameEl.value) nameEl.value = guest;

  const card = (w: Wish, i: number) => {
    const el = document.createElement('article');
    el.className = 'note' + (w.demo ? ' note--demo' : '');
    el.style.setProperty('--bg', COLORS[i % COLORS.length]);
    el.style.setProperty('--r', `${((i * 37) % 7) - 3}deg`);
    const m = document.createElement('p'); m.className = 'note__msg'; m.textContent = w.message;
    const by = document.createElement('p'); by.className = 'note__by'; by.textContent = '— ' + w.name;
    const meta = [w.relation, ago(w.t)].filter(Boolean).join(' · ');
    if (meta) { const sp = document.createElement('span'); sp.textContent = meta; by.appendChild(sp); }
    el.append(m, by);
    return el;
  };
  const setTotal = () => { total.textContent = String(n); empty.hidden = n > 0; };
  const render = (items: Wish[]) => {
    list.replaceChildren(...items.map(card)); n = items.length; setTotal();
  };
  const add = (w: Wish) => {
    const el = card(w, n); list.prepend(el); n += 1; setTotal();
    list.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    gsap.from(el, { y: -40, scale: 0.85, rotation: -8, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.6)' });
  };

  // tải lời chúc
  if (demo) render(store.get<Wish[]>(DEMO_KEY, []));
  else {
    fetch(endpoint, { method: 'GET' }).then((r) => r.json()).then((d) => render(Array.isArray(d?.wishes) ? d.wishes : []))
      .catch(() => { empty.textContent = 'Chưa tải được lời chúc, thử tải lại trang nhé.'; empty.hidden = false; });
  }

  // đếm ký tự + gợi ý
  const upd = () => { count.textContent = String(msg.value.length); };
  msg.addEventListener('input', () => { upd(); msg.closest('.ws__field')?.classList.remove('is-invalid'); });
  nameEl.addEventListener('input', () => nameEl.closest('.ws__field')?.classList.remove('is-invalid'));
  root.querySelectorAll<HTMLButtonElement>('[data-idea]').forEach((b) => b.addEventListener('click', () => {
    const t = b.dataset.idea || '';
    msg.value = (msg.value.trim() ? msg.value.trim() + ' ' : '') + t;
    msg.value = msg.value.slice(0, max); upd(); msg.focus();
    gsap.fromTo(b, { scale: 0.92 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
  }));

  const field = (el: Element) => el.closest('.ws__field') as HTMLElement;
  const setNote = (t: string, bad = false) => { note.textContent = t; note.style.color = bad ? 'var(--c-rose)' : ''; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const w: Wish = {
      name: String(fd.get('name') || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      message: String(fd.get('message') || '').trim().slice(0, max),
      relation: String(fd.get('relation') || ''),
      side: document.documentElement.dataset.side === 'nu' ? 'nha-gai' : 'nha-trai',
    };
    let ok = true;
    if (!w.name) { field(nameEl).classList.add('is-invalid'); ok = false; }
    if (!w.message) { field(msg).classList.add('is-invalid'); ok = false; }
    if (!ok) { gsap.fromTo(form, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, .3)' }); return; }
    if (fd.get('website')) return finish(w); // bot điền ô ẩn -> giả vờ thành công
    const last = store.get<number>(LAST_KEY, 0);
    if (Date.now() - last < 15000) { setNote('Bạn vừa gửi xong, đợi vài giây rồi gửi tiếp nhé.', true); return; }

    send.disabled = true; sendLabel.textContent = 'Đang gửi…';
    try {
      if (demo) {
        await new Promise((r) => setTimeout(r, 500));
        store.set(DEMO_KEY, [{ ...w, t: Date.now(), demo: true }, ...store.get<Wish[]>(DEMO_KEY, [])].slice(0, 50));
      } else {
        // text/plain -> không bị chặn CORS preflight với Apps Script
        const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(w) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || d.ok === false) throw new Error(d.error || 'send');
      }
      store.set(LAST_KEY, Date.now());
      finish({ ...w, t: Date.now(), demo });
    } catch {
      setNote('Chưa gửi được (mạng yếu?). Lời chúc vẫn còn đây, bấm gửi lại nhé.', true);
    } finally {
      send.disabled = false; sendLabel.textContent = 'Gửi lời chúc';
    }
  });

  function finish(w: Wish) {
    add(w);
    root.querySelector('[data-done-name]')!.textContent = w.name;
    const h = form.offsetHeight;
    gsap.to(form, { autoAlpha: 0, y: -20, duration: 0.35, onComplete: () => {
      form.hidden = true; done.hidden = false;
      gsap.fromTo(done, { minHeight: Math.min(h, 460), autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' });
      gsap.from(done.querySelector('.ws__env'), { y: 30, rotation: -10, scale: 0.6, duration: 0.9, ease: 'back.out(1.8)' });
    } });
  }

  root.querySelector('[data-wish-again]')!.addEventListener('click', () => {
    msg.value = ''; upd(); (form.querySelector('input[name=relation]:checked') as HTMLInputElement | null)?.removeAttribute('checked');
    setNote(demo ? 'Bản xem thử: lời chúc mới chỉ lưu trên máy này.' : 'Lời chúc sẽ hiện ngay trên bảng.');
    done.hidden = true; form.hidden = false; gsap.fromTo(form, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5 }); msg.focus();
  });
}
