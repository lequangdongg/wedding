"""
Tạo ảnh chia sẻ link (Open Graph 1200x630) cho từng bên + icon iPhone.
Chạy lại khi đổi ảnh/chữ:  pip install pillow fonttools brotli  &&  python3 scripts/og.py
Kết quả: public/og.jpg, public/og-nha-trai.jpg, public/og-nha-gai.jpg, public/apple-touch-icon.png
"""
import os, io
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FS = os.path.join(ROOT, 'node_modules', '@fontsource')
OXBLOOD, CHAMP, PORC, BLUSH = (59, 10, 16), (234, 217, 185), (247, 246, 242), (227, 163, 151)


def load(fam, weight, size):
    """Font = bộ latin + bộ vietnamese (fontsource tách subset) -> trả về list để vẽ theo từng ký tự."""
    out = []
    for sub in ('latin', 'vietnamese'):
        p = os.path.join(FS, fam, 'files', f'{fam}-{sub}-{weight}.woff2')
        t = TTFont(p); t.flavor = None
        buf = io.BytesIO(); t.save(buf); buf.seek(0)
        cmap = set(t.getBestCmap().keys())
        out.append((ImageFont.truetype(buf, size), cmap))
    return out


def pick(fonts, ch):
    for f, cmap in fonts:
        if ord(ch) in cmap:
            return f
    return fonts[0][0]


def width(fonts, text):
    return sum(pick(fonts, c).getlength(c) for c in text)


def draw(d, xy, text, fonts, fill, anchor_left=True):
    x, y = xy
    if not anchor_left:
        x -= width(fonts, text)
    for c in text:
        f = pick(fonts, c)
        d.text((x, y), c, font=f, fill=fill)
        x += f.getlength(c)


def og(photo, out, names, lines, pos=0.5):
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), OXBLOOD)
    ph = Image.open(os.path.join(ROOT, 'src', 'assets', 'photos', photo)).convert('RGB')
    pw = 560
    s = max(pw / ph.width, H / ph.height)
    ph = ph.resize((int(ph.width * s), int(ph.height * s)), Image.LANCZOS)
    left = int((ph.width - pw) * pos)
    ph = ph.crop((left, 0, left + pw, H))
    img.paste(ph, (0, 0))
    d = ImageDraw.Draw(img)
    eyebrow = load('be-vietnam-pro', '500-normal', 20)
    big = load('playfair-display', '400-normal', 74)
    ital = load('playfair-display', '400-italic', 74)
    body = load('be-vietnam-pro', '500-normal', 24)
    x = pw + 64
    draw(d, (x, 92), 'TRÂN TRỌNG KÍNH MỜI', eyebrow, CHAMP)
    draw(d, (x, 150), names[0], big, PORC)
    draw(d, (x, 236), '& ', ital, BLUSH)
    draw(d, (x + width(ital, '& '), 236), names[1], big, PORC)
    d.line([(x, 360), (W - 64, 360)], fill=(234, 217, 185), width=1)
    y = 392
    for ln in lines:
        draw(d, (x, y), ln, body, CHAMP if y > 392 else PORC)
        y += 40
    img.save(os.path.join(ROOT, 'public', out), quality=86, optimize=True)
    print('->', out)


og('garden-close.jpg', 'og-nha-trai.jpg', ('Quang Đông', 'Trang Châu'),
   ['Lễ Thành Hôn · Thứ Ba 29.12.2026', 'Golden Phoenix · Đà Nẵng'], pos=0.55)
og('garden-sofa.jpg', 'og-nha-gai.jpg', ('Trang Châu', 'Quang Đông'),
   ['Tiệc cưới CN 27.12 · Vu Quy T3 29.12.2026', 'Phú Ninh · Đà Nẵng'], pos=0.5)
Image.open(os.path.join(ROOT, 'public', 'og-nha-trai.jpg')).save(os.path.join(ROOT, 'public', 'og.jpg'), quality=86)

# Icon iPhone (Thêm vào màn hình chính)
ic = Image.new('RGB', (180, 180), OXBLOOD)
d = ImageDraw.Draw(ic)
f = load('playfair-display', '400-normal', 84)
draw(d, (90 - width(f, 'ĐC') / 2, 34), 'ĐC', f, CHAMP)
ic.save(os.path.join(ROOT, 'public', 'apple-touch-icon.png'))
print('-> apple-touch-icon.png')
