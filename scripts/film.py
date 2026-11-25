"""
Ghép ảnh thành video (Ken Burns: zoom/lia chậm + chuyển mờ) — không cần quay phim.
  pip install pillow fonttools brotli   (cần ffmpeg)
  python3 scripts/film.py            -> public/video/hero-m.mp4/.webm (dọc ~9:19.5, điện thoại, giữ nguyên cả ảnh)
                                        public/video/hero-d.mp4/.webm (16:9 tràn màn hình máy tính, 3 cột ảnh)
  (thêm 'mobile' hoặc 'desktop' để chỉ làm 1 bản)
Đổi thứ tự/ảnh ở HERO (điện thoại) và TRI (máy tính, 3 cột) bên dưới. Mỗi dòng: (file trong src/assets/, tâm x, tâm y, zoom từ, zoom tới).
"""
import os, sys, subprocess, math
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'src', 'assets')
OUT = os.path.join(ROOT, 'public', 'video')

HERO = [  # điện thoại: ảnh giữ nguyên cả khung (fit), zoom rất nhẹ
    ('photos/garden-close.jpg', .5, .5, 1.00, 1.04),
    ('photos/walk.jpg', .5, .5, 1.04, 1.00),
    ('photos/bride-portrait.jpg', .5, .5, 1.00, 1.04),
    ('photos/dance.jpg', .5, .5, 1.04, 1.00),
    ('photos/veil-lift.jpg', .5, .5, 1.00, 1.04),
    ('photos/facing.jpg', .5, .5, 1.04, 1.00),
    ('photos/garden-sofa.jpg', .5, .5, 1.00, 1.04),
    ('photos/arm.jpg', .5, .5, 1.04, 1.00),
    ('photos/veil.jpg', .5, .5, 1.00, 1.04),
    ('photos/groom-sit.jpg', .5, .5, 1.04, 1.00),
]



def ease(x):
    return 0.5 - 0.5 * math.cos(math.pi * max(0, min(1, x)))


class Shot:
    def __init__(self, path, fx, fy, z0, z1, W, H, fit=False):
        im = Image.open(os.path.join(A, path)).convert('RGB')
        if fit:
            # GIỮ NGUYÊN CẢ ẢNH (không cắt người): ảnh vừa khít bề ngang khung, phần thừa trên/dưới là chính ảnh đó phóng to + làm mờ
            K = 1.35
            CW, CH = round(W * K), round(H * K)
            sc = min(CW / im.width, CH / im.height)
            fg = im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS)
            sb = max(CW / im.width, CH / im.height) * 1.08
            bg = im.resize((round(im.width * sb / 6), round(im.height * sb / 6)), Image.BILINEAR).filter(ImageFilter.GaussianBlur(5))
            bg = bg.resize((round(im.width * sb), round(im.height * sb)), Image.BILINEAR)
            bg = bg.crop(((bg.width - CW) // 2, (bg.height - CH) // 2, (bg.width - CW) // 2 + CW, (bg.height - CH) // 2 + CH))
            bg = Image.blend(bg, Image.new('RGB', bg.size, (23, 24, 26)), 0.35)
            bg.paste(fg, ((CW - fg.width) // 2, (CH - fg.height) // 2))
            im, fx, fy = bg, .5, .5
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


def render(seq, W, H, fps, P, X, loop, writer, overlay=None, fit=False):
    shots = [Shot(*s, W, H, fit) for s in seq]
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


def encode(seq, W, H, name, fps=25, P=2.0, X=0.7, fit=False):
    os.makedirs(OUT, exist_ok=True)
    mp4 = os.path.join(OUT, name + '.mp4')
    w = ffmpeg(W, H, fps, mp4, ['-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart'])
    render(seq, W, H, fps, P, X, True, w, fit=fit)
    w.stdin.close(); w.wait()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp4, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', os.path.join(OUT, name + '.webm')], check=True)
    # ảnh poster = khung đầu
    Shot(*seq[0], W, H, fit).frame(0).save(os.path.join(OUT, name + '.jpg'), quality=78)
    for ext in ('mp4', 'webm', 'jpg'):
        p = os.path.join(OUT, f'{name}.{ext}')
        print(f'{p}: {os.path.getsize(p) / 1e6:.2f} MB')


# ---------- Máy tính: tràn màn hình 16:9, 3 cột ảnh dọc, mỗi cột đổi ảnh lệch nhịp (ảnh mới đẩy từ dưới lên) ----------
TRI = [  # máy tính: mỗi cột giữ TRỌN ảnh (phần thừa là ảnh làm mờ); zoom tối đa 4%
    [('photos/garden-close.jpg', .45, 0, 1.00, 1.04), ('photos/dance.jpg', .5, 0, 1.04, 1.00), ('photos/veil-lift.jpg', .5, 0, 1.00, 1.04),
     ('photos/arm.jpg', .45, 0, 1.04, 1.00), ('photos/groom.jpg', .5, 0, 1.00, 1.04)],
    [('photos/walk.jpg', .5, 0, 1.04, 1.00), ('photos/bride-portrait.jpg', .45, 0, 1.00, 1.04), ('photos/studio-couple.jpg', .5, 0, 1.04, 1.00),
     ('photos/garden-sofa.jpg', .5, 0, 1.00, 1.04), ('photos/veil.jpg', .5, 0, 1.04, 1.00)],
    [('photos/bride.jpg', .5, 0, 1.00, 1.04), ('photos/facing.jpg', .45, 0, 1.04, 1.00), ('photos/groom-sit.jpg', .45, 0, 1.00, 1.04),
     ('photos/studio-veil.jpg', .5, 0, 1.04, 1.00), ('photos/gala.jpg', .5, 0, 1.00, 1.04)],
]


def encode_tri(name='hero-d', W=1920, H=1080, gap=6, fps=25, P=3.0, X=0.9, stagger=0.45):
    n = len(TRI)
    pw = (W - gap * (n - 1)) // n
    cols = [[Shot(*s, pw, H, True) for s in col] for col in TRI]  # fit: giữ trọn ảnh, không cắt người
    N = len(TRI[0])
    T = N * P  # cả 3 cột cùng chu kỳ -> vòng lặp liền mạch

    def col_frame(shots, t):
        t %= T
        i = int(t // P)
        tau = t - i * P
        cur = shots[i].frame((tau + X) / (P + X))
        if tau < P - X:
            return cur
        nxt = shots[(i + 1) % N].frame((tau - P + X) / (P + X))
        e = ease((tau - (P - X)) / X)
        out = Image.new('RGB', (pw, H))
        out.paste(cur, (0, round(-H * 0.35 * e)))
        out.paste(nxt, (0, round(H * (1 - e))))
        return out

    os.makedirs(OUT, exist_ok=True)
    mp4 = os.path.join(OUT, name + '.mp4')
    w = ffmpeg(W, H, fps, mp4, ['-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart'])
    first = None
    for f in range(int(T * fps)):
        t = f / fps
        frame = Image.new('RGB', (W, H), (23, 24, 26))
        for k, shots in enumerate(cols):
            # cột giữa đổi trước, hai cột bên đổi sau -> nhịp sóng từ giữa ra
            off = 2 * stagger if k == n // 2 else stagger
            frame.paste(col_frame(shots, t + off), (k * (pw + gap), 0))
        if first is None: first = frame
        w.stdin.write(frame.tobytes())
    w.stdin.close(); w.wait()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp4, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '42', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', os.path.join(OUT, name + '.webm')], check=True)
    first.save(os.path.join(OUT, name + '.jpg'), quality=78)
    for ext in ('mp4', 'webm', 'jpg'):
        p = os.path.join(OUT, f'{name}.{ext}')
        print(f'{p}: {os.path.getsize(p) / 1e6:.2f} MB')


if __name__ == '__main__':
    if 'desktop' not in sys.argv:
        # tỉ lệ ~9:19.5 = màn hình điện thoại hiện nay; ảnh giữ nguyên, không cắt người
        encode(HERO, 720, 1560, 'hero-m', fit=True)
    if 'mobile' not in sys.argv:
        encode_tri('hero-d')
