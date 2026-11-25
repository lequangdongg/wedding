# Nhiệm vụ cho Codex: dựng nơi lưu "Sổ lời chúc" bằng Google Sheet + Apps Script API

> Dán cho Codex: **"Đọc và làm theo docs/CODEX_TASK_wishes.md trong repo này. Dừng lại hỏi tôi ở các bước có ghi [CẦN NGƯỜI]."**

## Bối cảnh

- Site: Astro tĩnh (`npm run build` → `dist/`). Form lời chúc đã làm xong: `src/components/Wishes.astro` + `src/scripts/wishes.ts`.
- Frontend gọi **một URL web app Apps Script** (đuôi `/exec`):
  - `GET  <URL>` → `{ ok: true, wishes: [{ t, name, relation, side, message }] }` (chỉ dòng có cột "Hiện" = TRUE, mới nhất trước)
  - `POST <URL>` body JSON (gửi kèm header `Content-Type: text/plain;charset=utf-8` để tránh CORS preflight)
    `{ name, message, relation?, side? }` → `{ ok: true }`
- URL được đọc từ biến môi trường **`PUBLIC_WISHES_ENDPOINT`** (xem `src/data/wedding.ts` → `wishes.endpoint`). Chưa có URL → form chạy chế độ xem thử.
- Google Sheet đã tạo sẵn (chủ: lequangdongg@gmail.com):
  - ID: `1atMzSSasIBqdXkNgM0UTOjq2_3QtRlgArIRmQtYg1xA`
  - https://docs.google.com/spreadsheets/d/1atMzSSasIBqdXkNgM0UTOjq2_3QtRlgArIRmQtYg1xA/edit
  - Cột: Thời gian | Tên | Quan hệ | Bên | Lời chúc | Hiện (ô tick)
- Code Apps Script nằm trong `apps-script/` (`Code.js`, `appsscript.json` đã cấu hình web app: chạy với quyền chủ sở hữu, ai cũng truy cập được, scope `spreadsheets.currentonly`).

## Các bước

1. **Cài clasp** (CLI chính thức của Apps Script): `npm i -g @google/clasp` rồi `clasp --version`.
   - clasp v2 dùng lệnh `create / push / open / deploy`; clasp v3 đổi thành `create-script / push / open-script / create-deployment`. Dùng đúng theo phiên bản đã cài.
2. **[CẦN NGƯỜI]** Bật "Google Apps Script API" cho tài khoản: mở https://script.google.com/home/usersettings → bật. Sau đó chạy `clasp login` và đăng nhập **lequangdongg@gmail.com** trên trình duyệt.
3. **Tạo script gắn vào Sheet** (chạy trong thư mục `apps-script/`):
   ```bash
   cd apps-script
   clasp create --title "Lời chúc cưới API" --parentId 1atMzSSasIBqdXkNgM0UTOjq2_3QtRlgArIRmQtYg1xA --rootDir .
   # (v3: clasp create-script --title ... --parentId ... --rootDir .)
   git checkout -- appsscript.json   # clasp create có thể ghi đè manifest -> lấy lại bản của repo
   clasp push -f
   ```
   Commit file `apps-script/.clasp.json` (chỉ chứa scriptId, không phải bí mật). KHÔNG commit `~/.clasprc.json`.
4. **[CẦN NGƯỜI]** Cấp quyền 1 lần: `clasp open` (v3: `clasp open-script`) → trong trình soạn thảo chọn hàm `setup` → **Chạy** → đồng ý quyền truy cập Sheet. (Bước này cũng định dạng dòng tiêu đề + ô tick.)
5. **Triển khai web app**:
   ```bash
   clasp deploy --description "wishes v1"      # v3: clasp create-deployment --description "wishes v1"
   clasp deployments                            # lấy Deployment ID (AKfy...)
   ```
   URL = `https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec`
   Nếu mở URL báo cần đăng nhập/không có quyền: vào Apps Script → Triển khai → Quản lý triển khai → kiểm tra "Thực thi với tư cách: Tôi", "Ai có quyền truy cập: Bất kỳ ai".
6. **Kiểm tra API**:
   ```bash
   URL="https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec"
   curl -sL "$URL"                                                   # -> {"ok":true,"wishes":[...]}
   curl -sL -H 'Content-Type: text/plain;charset=utf-8' \
        -d '{"name":"Codex test","message":"Kiểm tra API","relation":"Bạn bè","side":"nha-trai"}' "$URL"   # -> {"ok":true}
   curl -sL "$URL"                                                   # thấy lời chúc "Codex test"
   ```
   Xác nhận dòng mới xuất hiện trong Sheet, sau đó **xoá dòng test** trong Sheet.
7. **Gắn vào site**:
   ```bash
   cd ..
   echo "PUBLIC_WISHES_ENDPOINT=$URL" > .env      # .env đã nằm trong .gitignore
   npm run build && grep -rl "script.google.com/macros" dist | head -3   # URL phải có trong bản build
   ```
   Trên nơi host (Vercel / Netlify / Cloudflare Pages): thêm biến môi trường `PUBLIC_WISHES_ENDPOINT` = URL rồi build lại.
   Muốn cố định trong code thay vì env: sửa `wishes.endpoint` trong `src/data/wedding.ts` thành chuỗi URL.
8. **Kiểm tra giao diện**: `npm run preview` → mở `/#loi-chuc` → gửi 1 lời chúc → hiện trên bảng + có dòng trong Sheet → xoá dòng test. Dòng "Bản xem thử…" dưới nút gửi phải đổi thành "Lời chúc sẽ hiện ngay trên bảng."
9. **Commit** với tác giả `lequangdongg <lequangdongg@gmail.com>`:
   `git -c user.name=lequangdongg -c user.email=lequangdongg@gmail.com commit -am "Kết nối sổ lời chúc với Google Sheet (Apps Script)"` rồi `git push`.

## Cập nhật code Apps Script sau này

```bash
cd apps-script && clasp push -f && clasp deploy -i <DEPLOYMENT_ID> --description "wishes v2"   # giữ nguyên URL
```

## Tiêu chí hoàn thành

- `curl -sL "$URL"` trả `{"ok":true,...}`; POST thêm được dòng vào Sheet.
- Site build có `PUBLIC_WISHES_ENDPOINT`, gửi lời chúc từ trang lưu vào Sheet và hiện trên bảng.
- Bỏ tick cột "Hiện" trong Sheet → lời chúc biến mất khỏi trang sau khi tải lại.
- Không có bí mật nào (token, `.clasprc.json`, `.env`) bị commit.
