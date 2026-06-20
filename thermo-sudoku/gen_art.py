#!/usr/bin/env python3
"""Generate Thermo Sudoku art assets (icon.png 512x512, og-image.jpg 1200x630) via PIL.
Dark navy gradient + sudoku grid + thermometer (gray tube, orange bulb) + neon glow.
No numpy (not installed) — uses ImageChops.add for glow blending."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops, ImageEnhance
import math, os

OUT = os.path.dirname(os.path.abspath(__file__))

def vgrad(w, h, c1, c2, c3=None):
    base = Image.new('RGB', (w, h), c1)
    top = Image.new('RGB', (w, h), c2)
    mask = Image.new('L', (w, h))
    md = mask.load()
    for y in range(h):
        t = y / max(1, h-1)
        v = int(255 * t)
        for x in range(w):
            md[x, y] = v
    base.paste(top, (0, 0), mask)
    if c3:
        glow = Image.new('RGB', (w, h), c3)
        m2 = Image.new('L', (w, h), 0)
        md2 = m2.load()
        for y in range(h):
            for x in range(w):
                d = math.hypot(x - w*0.2, y - (-h*0.1)) / (math.hypot(w, h))
                md2[x, y] = max(0, int(200 * (1 - d*1.3)))
        base = Image.composite(glow, base, m2)
    return base

def font(size, bold=True):
    paths = ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
             '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf']
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def draw_grid(d, ox, oy, sz, n, line_w, line_col, box_col):
    cell = sz / n
    for i in range(n+1):
        x = ox + i*cell
        heavy = (i % (n//3) == 0) if n % 3 == 0 else False
        col = box_col if heavy else line_col
        w = line_w*2 if heavy else line_w
        d.line([(x, oy), (x, oy+sz)], fill=col, width=int(w))
        d.line([(ox, oy+i*cell), (ox+sz, oy+i*cell)], fill=col, width=int(w))

def draw_thermo(d, ox, oy, cell, path, tube_col, bulb_col):
    # path: list of (r,c); draw rounded tube through centers + bulb at first
    pts = [(ox + (c+0.5)*cell, oy + (r+0.5)*cell) for (r, c) in path]
    tube_w = cell * 0.46
    # tube
    for i in range(len(pts)-1):
        d.line([pts[i], pts[i+1]], fill=tube_col, width=int(tube_w))
    for p in pts:
        d.ellipse([p[0]-tube_w/2, p[1]-tube_w/2, p[0]+tube_w/2, p[1]+tube_w/2], fill=tube_col)
    # bulb (first point)
    bx, by = pts[0]
    br = cell * 0.34
    d.ellipse([bx-br, by-br, bx+br, by+br], fill=bulb_col)

# ---------- ICON 512x512 ----------
def make_icon():
    S = 512
    img = vgrad(S, S, (10, 11, 30), (32, 24, 74), (60, 30, 90))
    d = ImageDraw.Draw(img, 'RGBA')
    # outer rounded panel
    m = 40
    d.rounded_rectangle([m, m, S-m, S-m], radius=64, fill=(255, 255, 255, 12), outline=(255, 255, 255, 40), width=2)
    # mini 4x4 grid (symbolic sudoku)
    gx, gy, gs = 120, 130, 272
    n = 4
    cell = gs / n
    # thermo path across grid (increasing: bulb bottom-left -> up -> right)
    path = [(3,0),(2,0),(1,0),(1,1),(1,2),(1,3)]
    draw_thermo(d, gx, gy, cell, path, (199, 204, 219, 235), (255, 126, 74, 255))
    draw_grid(d, gx, gy, gs, n, 2, (255, 255, 255, 55), (255, 255, 255, 120))
    # bulb highlight
    bx, by = gx+0.5*cell, gy+3.5*cell
    d.ellipse([bx-6, by-9, bx+2, by-2], fill=(255, 220, 190, 200))
    # glow overlay via blurred bulb
    glow = Image.new('RGB', (S, S), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([bx-90, by-90, bx+90, by+90], fill=(255, 140, 80))
    glow = glow.filter(ImageFilter.GaussianBlur(50))
    img = ImageChops.add(img.convert('RGB'), glow)
    img = img.convert('RGBA')
    img.save(os.path.join(OUT, 'icon.png'))
    print('icon.png saved')

# ---------- OG IMAGE 1200x630 ----------
def make_og():
    W, H = 1200, 630
    img = vgrad(W, H, (10, 11, 30), (26, 22, 64), (62, 30, 92)).convert('RGBA')
    d = ImageDraw.Draw(img, 'RGBA')
    # subtle ambient glow (early, low impact)
    amb = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ad = ImageDraw.Draw(amb)
    ad.ellipse([W-380, -120, W+120, 380], fill=(255, 130, 70, 70))
    amb = amb.filter(ImageFilter.GaussianBlur(110))
    img = Image.alpha_composite(img, amb)
    d = ImageDraw.Draw(img, 'RGBA')
    # left: 9x9 board
    bx, by, bs = 64, 96, 438
    n = 9
    cell = bs / n
    thermos = [
        [(0,0),(1,0),(2,0),(3,0)],
        [(5,3),(6,3),(7,3),(8,3)],
        [(0,6),(1,6),(1,7),(1,8)],
        [(5,5),(5,6),(5,7),(5,8)],
        [(3,1),(3,2),(4,2)],
    ]
    for t in thermos:
        draw_thermo(d, bx, by, cell, t, (199, 204, 219, 230), (255, 126, 74, 255))
    draw_grid(d, bx, by, bs, n, 2, (255, 255, 255, 70), (255, 255, 255, 150))
    # given digits
    fnum_size = int(cell*0.52)
    fnum = font(fnum_size)
    givens = {(0,4):5,(2,2):7,(3,7):2,(4,4):9,(6,1):4,(7,8):6,(8,3):1,(1,1):3,(8,8):8}
    for (r,c),v in givens.items():
        cx = bx + (c+0.5)*cell; cy = by + (r+0.5)*cell
        tw = d.textlength(str(v), font=fnum)
        d.text((cx-tw/2, cy-fnum_size*0.36), str(v), font=fnum, fill=(245, 246, 255, 255))
    # right title block (tx with safe margin from right edge = 1170)
    tx = 560
    right_edge = 1160
    # badge
    bdg_w = 244
    d.rounded_rectangle([tx, 104, tx+bdg_w, 146], radius=21, fill=(255, 126, 74, 235))
    fb = font(20)
    label = 'PUZZLE  ·  SUDOKU'
    lw = d.textlength(label, font=fb)
    d.text((tx + (bdg_w-lw)/2, 115), label, font=fb, fill=(22, 16, 44))
    # title (sized to fit)
    ftitle = font(76)
    d.text((tx, 178), 'Thermo', font=ftitle, fill=(255, 240, 228))
    d.text((tx, 256), 'Sudoku', font=ftitle, fill=(255, 179, 71))
    # subtitle (short, fits well within margin)
    fsub = font(25)
    d.text((tx, 366), 'Digits rise along each thermometer.', font=fsub, fill=(196, 200, 228))
    d.text((tx, 402), '23 puzzles  -  Beginner to Master', font=fsub, fill=(196, 200, 228))
    # tier chips
    fchip = font(21)
    tiers = ['4x4','6x6','9x9']
    cxp = tx
    for t in tiers:
        w = 74
        d.rounded_rectangle([cxp, 462, cxp+w, 502], radius=12, fill=(255,255,255,26), outline=(255,255,255,70))
        tw = d.textlength(t, font=fchip)
        d.text((cxp+(w-tw)/2, 470), t, font=fchip, fill=(255,224,184))
        cxp += w + 12
    # brand (safe margin)
    fbrand = font(23)
    d.text((tx, 556), 'GameZipper', font=fbrand, fill=(150, 156, 195))
    # border frame
    d.rounded_rectangle([6, 6, W-6, H-6], radius=14, outline=(255,255,255,18), width=2)
    img.convert('RGB').save(os.path.join(OUT, 'og-image.jpg'), quality=90)
    print('og-image.jpg saved')

if __name__ == '__main__':
    make_icon()
    make_og()
    # report sizes
    for f in ['icon.png','og-image.jpg']:
        p = os.path.join(OUT, f)
        print(f, os.path.getsize(p), 'bytes')
