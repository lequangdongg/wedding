/**
 * NƠI LƯU LỜI CHÚC — Google Sheet + Apps Script (miễn phí, dữ liệu nằm trong Google Drive của bạn)
 *
 * CÀI ĐẶT (~3 phút):
 *  1. Mở Sheet "Lời chúc cưới — Đông & Châu" (đã tạo sẵn trong Google Drive của lequangdongg@gmail.com)
 *     https://docs.google.com/spreadsheets/d/1atMzSSasIBqdXkNgM0UTOjq2_3QtRlgArIRmQtYg1xA/edit
 *  2. Menu Tiện ích mở rộng > Apps Script. Xoá code mẫu, dán TOÀN BỘ file này vào, bấm Lưu.
 *  3. Triển khai > Tuỳ chọn triển khai mới > Loại: Ứng dụng web.
 *       Thực thi với tư cách: Tôi   |   Người có quyền truy cập: Bất kỳ ai
 *     Bấm Triển khai, cấp quyền cho tài khoản của bạn, copy "URL ứng dụng web" (đuôi /exec).
 *  4. Dán URL đó vào src/data/wedding.ts -> wishes.endpoint, build + deploy lại site.
 *
 * QUẢN LÝ: mở Sheet (tab đầu tiên). Cột "Hiện" bỏ tick để ẩn một lời chúc khỏi trang (không cần sửa code).
 * Muốn duyệt trước rồi mới hiện: đổi AUTO_SHOW = false (mọi lời chúc mới sẽ ẩn cho tới khi bạn tick TRUE).
 * Sửa code này xong phải: Triển khai > Quản lý triển khai > sửa > Phiên bản mới (URL giữ nguyên).
 */
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

// Dùng tab đầu tiên của Sheet; tự thêm dòng tiêu đề + ô tick cột "Hiện" nếu chưa có
function sheet() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sh.getRange('A1').getValue() !== 'Thời gian') {
    sh.getRange('A1:F1').setValues([['Thời gian', 'Tên', 'Quan hệ', 'Bên', 'Lời chúc', 'Hiện']]);
  }
  if (sh.getFrozenRows() !== 1) {
    sh.setFrozenRows(1);
    sh.getRange('A1:F1').setFontWeight('bold');
    sh.setColumnWidth(5, 420);
    sh.getRange('F2:F2000').insertCheckboxes();
  }
  return sh;
}

// (Tuỳ chọn) bấm Chạy hàm này 1 lần trong Apps Script để định dạng Sheet + cấp quyền
function setup() { sheet(); }

function clean(v, max) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max); }
// chặn công thức (=, +, -, @) bị Sheet tự chạy
function safe(v) { return /^[=+\-@]/.test(v) ? "'" + v : v; }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
