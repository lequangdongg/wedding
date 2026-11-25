// @ts-check
import { defineConfig } from 'astro/config';

// Static site (SSG). Đổi `site` thành tên miền thật khi deploy để OG/canonical đúng.
export default defineConfig({
  site: process.env.ASTRO_SITE || 'https://dong-chau.example.com',
  base: process.env.ASTRO_BASE || '/',
  output: 'static',
  compressHTML: true,
  build: {
    // Trang 1 trang: inline toàn bộ CSS vào HTML -> không còn request chặn render
    inlineStylesheets: 'always',
    assets: '_a',
  },
});
