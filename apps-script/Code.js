const HEADERS = ['Thời gian', 'Tên', 'Quan hệ', 'Bên', 'Lời chúc', 'Hiện'];
const SIDE_VALUES = ['nha-trai', 'nha-gai'];

function setup() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Chạy setup từ dự án gắn với Google Sheet.');

  const tabs = spreadsheet.getSheets();
  const sheet = tabs.find((tab) => {
    const [headers] = tab.getRange(1, 1, 1, HEADERS.length).getDisplayValues();
    return HEADERS.every((header, column) => headers[column].trim() === header);
  }) || (tabs.length === 1 && tabs[0].getLastRow() === 0 ? tabs[0] : null);
  if (!sheet) throw new Error('Không tìm thấy trang tính có sáu cột của sổ lời chúc.');

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setBackground('#7a1420').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  const dataRows = sheet.getMaxRows() - 1;
  sheet.getRange(2, 1, dataRows, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(2, 6, dataRows, 1).setDataValidation(checkboxRule_());
  PropertiesService.getScriptProperties().setProperties({
    spreadsheetId: spreadsheet.getId(),
    sheetId: String(sheet.getSheetId()),
  });
}

function doGet() {
  try {
    const sheet = wishesSheet_();
    const lastRow = sheet.getLastRow();
    const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues() : [];
    const wishes = rows
      .filter(([t, name, , , message, visible]) => t instanceof Date && name && message && visible === true)
      .reverse()
      .sort((a, b) => b[0] - a[0])
      .map(([t, name, relation, side, message]) => ({
        t: t.toISOString(), name: String(name), relation: String(relation), side: String(side), message: String(message),
      }));
    return json_({ ok: true, wishes });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: 'Không thể tải lời chúc lúc này.' });
  }
}

function doPost(event) {
  const body = event && event.postData && event.postData.contents;
  if (!body || body.length > 16000) return json_({ ok: false, error: 'Dữ liệu gửi không hợp lệ.' });

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    return json_({ ok: false, error: 'Dữ liệu gửi không hợp lệ.' });
  }
  const name = text_(data?.name);
  const message = text_(data?.message);
  const relation = text_(data?.relation);
  const side = text_(data?.side);
  if (!name || name.length > 80 || !message || message.length > 1000 || relation.length > 80 ||
      (side && !SIDE_VALUES.includes(side))) {
    return json_({ ok: false, error: 'Kiểm tra lại tên, lời chúc và các thông tin đã điền.' });
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = wishesSheet_();
    const row = lastDataRow_(sheet) + 1;
    if (row > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 100);
    sheet.getRange(row, 6).setDataValidation(checkboxRule_());
    sheet.getRange(row, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    sheet.getRange(row, 1, 1, HEADERS.length)
      .setValues([[new Date(), literal_(name), literal_(relation), side, literal_(message), true]]);
    SpreadsheetApp.flush();
    return json_({ ok: true });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: 'Không thể lưu lời chúc lúc này.' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function wishesSheet_() {
  const { spreadsheetId, sheetId } = PropertiesService.getScriptProperties().getProperties();
  if (!spreadsheetId || !sheetId) throw new Error('Chưa chạy setup.');
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetById(Number(sheetId));
  if (!sheet) throw new Error('Không tìm thấy trang tính lời chúc.');
  return sheet;
}

function lastDataRow_(sheet) {
  // Ô tick trống có thể được Sheets tính là dữ liệu. Chỉ xét các cột nội dung.
  const rows = sheet.getRange(1, 1, sheet.getLastRow(), HEADERS.length - 1).getValues();
  for (let index = rows.length - 1; index >= 0; index--) {
    if (rows[index].some((value) => value !== '')) return index + 1;
  }
  return 1;
}

function checkboxRule_() {
  return SpreadsheetApp.newDataValidation().requireCheckbox().setAllowInvalid(false).build();
}

function text_(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function literal_(value) {
  return /^[=+@'-]/.test(value) ? "'" + value : value;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
