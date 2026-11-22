"""
Ghép ảnh thành video (Ken Burns: zoom/lia chậm + chuyển mờ) — không cần quay phim.
  pip install pillow fonttools brotli   (cần ffmpeg)
  python3 scripts/film.py            -> public/video/hero-m.mp4/.webm (dọc 9:16, điện thoại)
                                        public/video/hero-d.mp4/.webm (khung 3:4 ở giữa trang máy tính)
  python3 scripts/film.py reel       -> reel.mp4 1080x1920 ~35s có chữ, để đăng story/Zalo/TikTok
Đổi thứ tự/ảnh ở HERO và REEL bên dưới. Mỗi dòng: (file trong src/assets/, tâm x, tâm y, zoom từ, zoom tới).
"""
import os, sys, subprocess, math
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'src', 'assets')
OUT = os.path.join(ROOT, 'public', 'video')

HERO = [
    ('photos/garden-close.jpg', .62, .30, 1.00, 1.12),
    ('photos/walk.jpg', .50, .45, 1.14, 1.02),
    ('photos/bride-portrait.jpg', .45, .30, 1.00, 1.10),
    ('photos/dance.jpg', .52, .40, 1.12, 1.00),
    ('photos/veil-lift.jpg', .45, .40, 1.00, 1.10),
    ('photos/facing.jpg', .40, .45, 1.10, 1.00),
    ('photos/garden-sofa.jpg', .50, .50, 1.00, 1.12),
    ('photos/arm.jpg', .40, .40, 1.12, 1.00),
    ('photos/veil.jpg', .52, .40, 1.00, 1.10),
    ('photos/groom-sit.jpg', .45, .35, 1.10, 1.00),
]

REEL = [
    ('photos/garden-close.jpg', .62, .30, 1.00, 1.10),
    ('photos/garden.jpg', .72, .45, 1.06, 1.00),
    ('photos/walk.jpg', .50, .45, 1.00, 1.10),
    ('photos/bride-portrait.jpg', .45, .30, 1.10, 1.00),
    ('photos/groom.jpg', .50, .40, 1.00, 1.08),
    ('photos/dance.jpg', .52, .40, 1.10, 1.00),
    ('photos/veil-lift.jpg', .45, .40, 1.00, 1.10),
    ('photos/facing.jpg', .40, .45, 1.10, 1.00),
    ('photos/bride.jpg', .50, .40, 1.00, 1.10),
    ('photos/arm.jpg', .40, .40, 1.10, 1.00),
    ('photos/garden-sofa.jpg', .50, .50, 1.00, 1.10),
    ('photos/groom-sit.jpg', .45, .35, 1.10, 1.00),
    ('photos/studio-veil.jpg', .50, .40, 1.00, 1.10),
    ('photos/veil.jpg', .52, .40, 1.10, 1.00),
    ('book/p00.jpg', .50, .40, 1.00, 1.08),
    ('photos/studio-couple.jpg', .50, .40, 1.08, 1.00),
]


def ease(x):
    return 0.5 - 0.5 * math.cos(math.pi * max(0, min(1, x)))


class Shot:
    def __init__(self, path, fx, fy, z0, z1, W, H):
        im = Image.open(os.path.join(A, path)).convert('RGB')
        # khung lớn nhất cùng tỉ lệ W:H nằm trong ảnh, rồi thu nhỏ ảnh về ~1.35x khung ra (nét + nhanh)
        r = W / H
        cw, ch = (im.height * r, im.height) if im.width / im.height > r else (im.width, im.width / r)
        s = min(1, (W * 1.35 * max(z0, z1)) / cw)
        self.im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        self.cw, self.ch = cw * s, ch * s
        self.fx, self.fy, self.z0, self.z1, self.W, self.H = fx, fy, z0, z1, W, H

    def frame(self, u):
        z = self.z0 + (self.z1 - self.z0) * u
        w, h = self.cw / z, self.ch / z
        iw, ih = self.im.size
        cx = min(max(self.fx * iw, w / 2), iw - w / 2)
        cy = min(max(self.fy * ih, h / 2), ih - h / 2)
        box = (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)
        return self.im.transform((self.W, self.H), Image.EXTENT, box, Image.BICUBIC)


def render(seq, W, H, fps, P, X, loop, writer, overlay=None):
    shots = [Shot(*s, W, H) for s in seq]
    N = len(shots)
    total = N * P if loop else (N - 1) * P + P + X
    for f in range(int(total * fps)):
        t = f / fps
        i = min(int(t // P), N - 1)
        tau = t - i * P
        img = shots[i].frame((tau + X) / (P + X))
        j = i + 1
        if tau >= P - X and (loop or j < N):
            j %= N
            nxt = shots[j].frame((tau - P + X) / (P + X))
            img = Image.blend(img, nxt, ease((tau - (P - X)) / X))
        if overlay:
            img = overlay(img, t, total)
        writer.stdin.write(img.tobytes())


def ffmpeg(W, H, fps, out, args):
    return subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-', *args, out], stdin=subprocess.PIPE)


def encode(seq, W, H, name, fps=25, P=2.0, X=0.7):
    os.makedirs(OUT, exist_ok=True)
    mp4 = os.path.join(OUT, name + '.mp4')
    w = ffmpeg(W, H, fps, mp4, ['-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart'])
    render(seq, W, H, fps, P, X, True, w)
    w.stdin.close(); w.wait()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp4, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', os.path.join(OUT, name + '.webm')], check=True)
    # ảnh poster = khung đầu
    Shot(*seq[0], W, H).frame(0).save(os.path.join(OUT, name + '.jpg'), quality=78)
    for ext in ('mp4', 'webm', 'jpg'):
        p = os.path.join(OUT, f'{name}.{ext}')
        print(f'{p}: {os.path.getsize(p) / 1e6:.2f} MB')


def reel():
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from og import load, draw, width
    W, H, fps = 1080, 1920, 30
    names = load('playfair-display', '400-normal', 112)
    amp = load('playfair-display', '400-italic', 96)
    small = load('be-vietnam-pro', '500-normal', 30)
    grad = Image.linear_gradient('L').resize((W, H))

    def card(img, a, lines):
        if a <= 0: return img
        shade = Image.new('RGB', (W, H), (23, 12, 14))
        img = Image.composite(shade, img, grad.point(lambda v: int(v * 0.85 * a)))
        d = ImageDraw.Draw(img, 'RGBA')
        y = H - 600
        for text, fonts, fill in lines:
            x = (W - width(fonts, text)) / 2
            draw(d, (x, y), text, fonts, fill + (int(255 * a),))
            y += {id(names): 150, id(amp): 118}.get(id(fonts), 58)
        return img

    def overlay(img, t, total):
        a = min(1, t / .8) * (1 - ease((t - 3.2) / .8))
        img = card(img, a, [('Quang Đông', names, (247, 246, 242)), ('&', amp, (227, 163, 151)), ('Trang Châu', names, (247, 246, 242)), ('THE LOVE BOOK · 29.12.2026', small, (234, 217, 185))])
        b = ease((t - (total - 4)) / .8)
        return card(img, b, [('Hẹn gặp bạn', names, (247, 246, 242)), ('29 · 12 · 2026', small, (234, 217, 185)), ('ĐÀ NẴNG', small, (234, 217, 185))])

    out = os.path.join(ROOT, 'reel.mp4')
    w = ffmpeg(W, H, fps, out, ['-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'])
    render(REEL, W, H, fps, 2.2, 0.7, False, w, overlay)
    w.stdin.close(); w.wait()
    print(out, f'{os.path.getsize(out) / 1e6:.1f} MB')


if __name__ == '__main__':
    if 'reel' in sys.argv:
        reel()
    else:
        encode(HERO, 720, 1280, 'hero-m')
        encode(HERO, 768, 1056, 'hero-d')
