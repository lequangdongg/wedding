import { $, S } from './shared';

type Wish = { t: string; name: string; relation: string; side: string; message: string };
type WishesResponse = { ok: true; wishes?: Wish[] } | { ok: false; error?: string };

const section = $<HTMLElement>('[data-wishes-endpoint]');

if (section) {
  const endpoint = section.dataset.wishesEndpoint ?? '';
  const form = $<HTMLFormElement>('form', section)!;
  const button = $<HTMLButtonElement>('button[type="submit"]', form)!;
  const status = $('[data-wish-status]', form)!;
  const boardStatus = $('[data-wish-board-status]', section)!;
  const list = $('[data-wish-list]', section)!;
  const template = $<HTMLTemplateElement>('[data-wish-entry]', section)!;
  const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
  const sideLabel: Record<string, string> = { 'nha-trai': 'Nhà trai', 'nha-gai': 'Nhà gái' };
  const preview: Wish[] = [];
  let boardRequest = 0;
  // Chỉ để tạo kiểu giao diện (CSS đọc section[data-state]); không ảnh hưởng luồng gửi/tải.
  const setState = (state: string) => { section.dataset.state = state; };

  function render(entries: Wish[]) {
    list.replaceChildren(...entries.map((entry) => {
      const item = template.content.cloneNode(true) as DocumentFragment;
      $('[data-entry-name]', item)!.textContent = entry.name;
      $('[data-entry-details]', item)!.textContent = [entry.relation, sideLabel[entry.side]].filter(Boolean).join(' · ');
      $('[data-entry-message]', item)!.textContent = entry.message;
      const time = $<HTMLTimeElement>('[data-entry-time]', item)!;
      time.dateTime = entry.t;
      time.textContent = dateFormat.format(new Date(entry.t));
      return item;
    }));
    boardStatus.hidden = entries.length > 0;
    boardStatus.textContent = entries.length ? '' : 'Chưa có lời chúc.';
    setState(entries.length ? 'ready' : endpoint ? 'empty' : 'preview');
    S.refresh();
  }

  async function request(options?: RequestInit) {
    const response = await fetch(endpoint, { ...options, cache: 'no-store', credentials: 'omit' });
    if (!response.ok) throw new Error('Máy chủ đang bận. Vui lòng thử lại.');
    return await response.json() as WishesResponse;
  }

  async function load() {
    const requestId = ++boardRequest;
    try {
      const result = await request();
      if (requestId !== boardRequest) return;
      if (!result.ok || !Array.isArray(result.wishes)) throw new Error();
      render(result.wishes);
    } catch {
      if (requestId !== boardRequest) return;
      boardStatus.hidden = false;
      setState('error');
      boardStatus.textContent = 'Không tải được bảng lời chúc. Hãy tải lại trang để thử lại.';
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled) return;
    const fields = new FormData(form);
    const value = (name: string) => String(fields.get(name) ?? '').trim();
    const entry = { name: value('name'), message: value('message'), relation: value('relation'), side: value('side') };
    if (!entry.name || !entry.message) {
      status.textContent = 'Bạn điền tên và lời chúc nhé.';
      setState('invalid');
      $<HTMLElement>(entry.name ? '[name="message"]' : '[name="name"]', form)?.focus();
      return;
    }

    button.disabled = true;
    setState('sending');
    status.textContent = 'Đang gửi lời chúc…';
    try {
      if (endpoint) {
        const result = await request({
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(entry),
        });
        if (!result.ok) {
          status.textContent = result.error || 'Chưa gửi được lời chúc. Vui lòng thử lại.';
          setState('send-error');
          return;
        }
      }
      form.reset();
      status.textContent = endpoint ? 'Đã gửi lời chúc. Cảm ơn bạn!' : 'Đã thêm lời chúc xem thử.';
      if (endpoint) {
        await load();
      } else {
        preview.unshift({ ...entry, t: new Date().toISOString() });
        render(preview);
      }
      setState('sent');
    } catch {
      setState('send-error');
      status.textContent = 'Chưa xác nhận được lời chúc. Hãy tải lại trang để kiểm tra trước khi gửi lại.';
    } finally {
      button.disabled = false;
    }
  });

  button.disabled = false;
  if (endpoint) void load();
}
