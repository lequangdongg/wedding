/** File lịch .ics cho từng sự kiện (tạo sẵn lúc build): /lich/<id>.ics — iPhone, Mac, Outlook, Android đều mở được. */
import type { APIRoute, GetStaticPaths } from 'astro';
import { sides, type WeddingEvent } from '../../data/wedding';

export const getStaticPaths: GetStaticPaths = () =>
  Object.values(sides).flatMap((s) => s.events.map((e) => ({ params: { id: e.id }, props: { e } })));

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
// RFC 5545: dòng tối đa 75 byte -> gập dòng
const fold = (line: string) => {
  const out: string[] = []; let cur = ''; let bytes = 0;
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length;
    if (bytes + b > 73) { out.push(cur); cur = ' ' + ch; bytes = 1 + b; } else { cur += ch; bytes += b; }
  }
  out.push(cur); return out.join('\r\n');
};

export const GET: APIRoute = ({ props, site }) => {
  const e = (props as { e: WeddingEvent }).e;
  const where = `${e.venue}${e.hall ? ', ' + e.hall : ''}, ${e.addr}`;
  const url = new URL(import.meta.env.BASE_URL, site).toString();
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//dong-chau-wedding//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.id}@dong-chau-wedding`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SUMMARY:${esc(`${e.kind} · Quang Đông & Trang Châu`)}`,
    `LOCATION:${esc(where)}`,
    `DESCRIPTION:${esc(`${e.weekday} ${e.day}.12.2026 · ${e.time} (${e.lunar})\nChỉ đường: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.mapQuery)}\n${url}`)}`,
    `URL:${url}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Ngày mai là ngày cưới của Quang Đông & Trang Châu', 'TRIGGER:-P1D', 'END:VALARM',
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(`${e.kind} bắt đầu sau 2 giờ`)}`, 'TRIGGER:-PT2H', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return new Response(lines.map(fold).join('\r\n') + '\r\n', { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
