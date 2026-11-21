#!/usr/bin/env bash
# Nén video pre-wedding cho hero (cần ffmpeg: brew install ffmpeg)
# Dùng:  bash scripts/video.sh duong-dan/video-goc.mp4 [giây-bắt-đầu] [số-giây]
# Ra:    public/video/hero-m.mp4 + .webm (dọc 720x1280, cho điện thoại)
#        public/video/hero-d.mp4 + .webm (ngang 1920x1080, cho máy tính)
# Sau đó điền vào src/data/wedding.ts:
#   heroVideo: { mobile: { mp4: '/video/hero-m.mp4', webm: '/video/hero-m.webm' },
#                desktop: { mp4: '/video/hero-d.mp4', webm: '/video/hero-d.webm' } }
set -euo pipefail
IN="${1:?Thiếu đường dẫn video gốc}"; SS="${2:-0}"; T="${3:-10}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/video"; mkdir -p "$OUT"
COMMON=(-ss "$SS" -t "$T" -an -movflags +faststart)
# Mobile: cắt giữa thành khung dọc 9:16
ffmpeg -y -i "$IN" "${COMMON[@]}" -vf "crop='min(iw,ih*9/16)':ih,scale=720:1280,fps=30" -c:v libx264 -profile:v high -preset slow -crf 26 -pix_fmt yuv420p "$OUT/hero-m.mp4"
ffmpeg -y -i "$IN" "${COMMON[@]}" -vf "crop='min(iw,ih*9/16)':ih,scale=720:1280,fps=30" -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 "$OUT/hero-m.webm"
# Desktop: khung ngang 16:9
ffmpeg -y -i "$IN" "${COMMON[@]}" -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30" -c:v libx264 -profile:v high -preset slow -crf 25 -pix_fmt yuv420p "$OUT/hero-d.mp4"
ffmpeg -y -i "$IN" "${COMMON[@]}" -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30" -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 "$OUT/hero-d.webm"
ls -lh "$OUT"
echo "Mục tiêu: mỗi file mobile < 3 MB, desktop < 6 MB. Lớn hơn thì tăng -crf thêm 2–3 hoặc giảm số giây."
