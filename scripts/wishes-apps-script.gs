/**
 * NƠI LƯU LỜI CHÚC — Google Sheet + Apps Script (miễn phí, dữ liệu nằm trong Google Drive của bạn)
 *
 * CÀI ĐẶT (~5 phút):
 *  1. Tạo Google Sheet mới (ví dụ "Lời chúc Đông & Châu").
 *  2. Menu Tiện ích mở rộng > Apps Script. Xoá code mẫu, dán TOÀN BỘ file này vào, bấm Lưu.
 *  3. Triển khai > Tuỳ chọn triển khai mới > Loại: Ứng dụng web.
 *       Thực thi với tư cách: Tôi   |   Người có quyền truy cập: Bất kỳ ai
 *     Bấm Triển khai, cấp quyền cho tài khoản của bạn, copy "URL ứng dụng web" (đuôi /exec).
 *  4. Dán URL đó vào src/data/wedding.ts -> wishes.endpoint, build + deploy lại site.
 *
 * QUẢN LÝ: mở Sheet, tab "Lời chúc". Cột "Hiện" = FALSE để ẩn một lời chúc khỏi trang (không cần sửa code).
 * Muốn duyệt trước rồi mới hiện: đổi AUTO_SHOW = false (mọi lời chúc mới sẽ ẩn cho tới khi bạn tick TRUE).
 * Sửa code này xong phải: Triển khai > Quản lý triển khai > sửa > Phiên bản mới (URL giữ nguyên).
 */
const SHEET = 'Lời chúc';
const AUTO_SHOW = true;
const MAX_NAME = 60, MAX_MSG = 300;

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const name = clean(p.name, MAX_NAME), message = clean(p.message, MAX_MSG);
    if (!name || !message) return json({ ok: false, error: 'missing' });
    sheet().appendRow([new Date(), safe(name), safe(clean(p.relation, 30)), safe(clean(p.side, 10)), safe(message), AUTO_SHOW]);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  const rows = sheet().getDataRange().getValues().slice(1);
  const wishes = rows
    .filter((r) => r[5] === true && r[1] && r[4])
    .map((r) => ({ t: r[0], name: String(r[1]), relation: String(r[2] || ''), side: String(r[3] || ''), message: String(r[4]) }))
    .reverse()
    .slice(0, 300);
  return json({ ok: true, wishes: wishes });
}

function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(['Thời gian', 'Tên', 'Quan hệ', 'Bên', 'Lời chúc', 'Hiện']);
    sh.setFrozenRows(1);
    sh.getRange('F:F').insertCheckboxes();
  }
  return sh;
}

function clean(v, max) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max); }
// chặn công thức (=, +, -, @) bị Sheet tự chạy
function safe(v) { return /^[=+\-@]/.test(v) ? "'" + v : v; }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
