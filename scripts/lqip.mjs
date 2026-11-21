// Tạo ảnh placeholder siêu nhỏ (LQIP, ~300 byte) cho mỗi ảnh trong src/assets/photos
// -> src/data/lqip.json. Tự chạy trước mỗi lần build (npm run build).
import sharp from 'sharp';
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dir = path.resolve('src/assets/photos');
const out = {};
for (const f of (await readdir(dir)).sort()) {
  if (!/\.(jpe?g|png|webp|avif)$/i.test(f)) continue;
  const buf = await sharp(path.join(dir, f)).resize(24).webp({ quality: 45 }).toBuffer();
  out[f.replace(/\.[^.]+$/, '')] = 'data:image/webp;base64,' + buf.toString('base64');
}
await writeFile('src/data/lqip.json', JSON.stringify(out, null, 2));
console.log('LQIP:', Object.keys(out).length, 'ảnh');
