#!/usr/bin/env python3
"""
Generate two art assets for the Purple puzzle game:
  1. purple/icon.png  (512x512 RGBA) — purple gradient orb with glow halo
  2. og-images/purple.jpg (1200x630 JPEG) — social share image

Style matches the orange/ series:
  - icon: radial-gradient orb centered, soft glow halo, near-white corners
  - og-image: dark background (#160a1f), centered title, decorative elements
"""
import math
import os
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

REPO = "/home/msdn/gamezipper.com"
random.seed(42)

# ── Color palette (purple series) ──────────────────────────────────────────
# Orb: #9C27B0 (center, lighter) → #6A1B9A (edge, darker)
ORB_CENTER = (0x9C, 0x27, 0xB0)   # #9C27B0
ORB_EDGE   = (0x6A, 0x1B, 0x9A)   # #6A1B9A
GLOW_RGB   = (0xBA, 0x68, 0xC8)   # lighter purple for halo
BG_DARK    = (0x16, 0x0A, 0x1F)   # #160a1f — social bg
# Text gradient: #E1BEE7 → #9C27B0
TEXT_TOP   = (0xE1, 0xBE, 0xE7)   # light purple
TEXT_BOT   = (0x9C, 0x27, 0xB0)   # brand purple


# ── Font paths ─────────────────────────────────────────────────────────────
def _font(size, bold=True):
    if bold:
        p = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    else:
        p = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    try:
        return ImageFont.truetype(p, size)
    except Exception:
        return ImageFont.load_default()


# ═══════════════════════════════════════════════════════════════════════════
# 1. ICON  (purple/icon.png, 512×512 RGBA)
# ═══════════════════════════════════════════════════════════════════════════
def make_icon():
    S = 512
    cx = cy = S / 2.0

    # Orb geometry: orb fills ~80% of canvas with a glow halo extending beyond
    orb_radius = int(S * 0.34)   # 174 — solid orb radius
    halo_extra = int(S * 0.14)   # 72  — glow extends this far past orb edge

    # ── Build orb as a radial gradient on a larger canvas ──────────────────
    # We render at 2× then downscale for smoother gradient.
    SS = S * 2
    grad = Image.new("RGBA", (SS, SS), (0, 0, 0, 0))
    gp = grad.load()
    ccx = ccy = SS / 2.0
    max_r = math.hypot(SS / 2, SS / 2)

    cr, cg, cb = ORB_CENTER
    er, eg, eb = ORB_EDGE
    orb_r2 = orb_radius * 2

    for y in range(SS):
        for x in range(SS):
            dx = x - ccx
            dy = y - ccy
            dist = math.hypot(dx, dy)
            t = dist / orb_r2           # 0 center → 1 edge
            if t <= 1.0:
                tt = t ** 1.4            # ease so center stays bright longer
                r = int(cr + (er - cr) * tt)
                g = int(cg + (eg - cg) * tt)
                b = int(cb + (eb - cb) * tt)
                a = 255
            else:
                continue
            gp[x, y] = (r, g, b, a)

    grad = grad.resize((S, S), Image.LANCZOS)

    # ── Build glow halo (separate layer, blurred) ─────────────────────────
    halo_size = orb_radius + halo_extra
    halo_diam = halo_size * 2
    halo = Image.new("RGBA", (halo_diam, halo_diam), (0, 0, 0, 0))
    hd = halo.load()
    hc = halo_diam / 2.0
    for y in range(halo_diam):
        for x in range(halo_diam):
            dx = x - hc
            dy = y - hc
            dist = math.hypot(dx, dy)
            if dist <= halo_size:
                t = dist / halo_size
                alpha = int(160 * (1 - t) ** 2.2)
                hd[x, y] = (*GLOW_RGB, alpha)

    # Soft-blur the halo for a diffuse glow
    halo = halo.filter(ImageFilter.GaussianBlur(radius=int(S * 0.06)))

    # ── Composite ──────────────────────────────────────────────────────────
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))  # transparent base
    # Paste halo centered
    hx = (S - halo.width) // 2
    hy = (S - halo.height) // 2
    img.alpha_composite(halo, (hx, hy))
    # Paste orb centered
    img.alpha_composite(grad, (0, 0))

    # ── Add a subtle specular highlight (top-left) for depth ───────────────
    hl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    hld = ImageDraw.Draw(hl)
    hlr = int(S * 0.12)
    hlx = int(cx - S * 0.10)
    hly = int(cy - S * 0.10)
    hld.ellipse(
        [hlx - hlr, hly - hlr, hlx + hlr, hly + hlr],
        fill=(255, 255, 255, 70),
    )
    hl = hl.filter(ImageFilter.GaussianBlur(radius=int(S * 0.04)))
    img.alpha_composite(hl)

    out = os.path.join(REPO, "purple", "icon.png")
    img.save(out, "PNG")
    print(f"[icon]  saved {out}  ({os.path.getsize(out)} bytes, {img.size})")
    return out


# ═══════════════════════════════════════════════════════════════════════════
# 2. OG IMAGE  (og-images/purple.jpg, 1200×630 JPEG)
# ═══════════════════════════════════════════════════════════════════════════
def make_og():
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BG_DARK)
    draw = ImageDraw.Draw(img)

    # ── Subtle vertical gradient on background (dark purple → slightly purple) ──
    top = (0x10, 0x07, 0x16)
    bot = (0x1F, 0x0D, 0x2E)
    grad_bg = Image.new("RGB", (1, H))
    for y in range(H):
        t = y / (H - 1)
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        grad_bg.putpixel((0, y), (r, g, b))
    img = grad_bg.resize((W, H))
    draw = ImageDraw.Draw(img)

    # ── Decorative dots scattered (purple puzzle motif) ────────────────────
    for _ in range(45):
        x = random.randint(0, W)
        y = random.randint(0, H)
        r = random.randint(2, 7)
        # Vary between light-purple and mid-purple
        shade = random.choice(
            [(0x9C, 0x27, 0xB0), (0xBA, 0x68, 0xC8), (0xCE, 0x93, 0xD8), (0x7B, 0x1F, 0xA2)]
        )
        a = random.randint(30, 110)
        dot = Image.new("RGBA", (r * 2 + 2, r * 2 + 2), (0, 0, 0, 0))
        ImageDraw.Draw(dot).ellipse([0, 0, r * 2, r * 2], fill=(*shade, a))
        img.paste(dot, (x, y), dot)
    draw = ImageDraw.Draw(img)

    # ── Small puzzle-piece motif (bottom corners) ─────────────────────────
    def puzzle_piece(draw_obj, cx, cy, size, color):
        """Draw a simple stylized puzzle piece (rounded square with a tab)."""
        x0, y0 = cx - size, cy - size
        x1, y1 = cx + size, cy + size
        # body
        draw_obj.rounded_rectangle([x0, y0, x1, y1], radius=size // 3, fill=color)
        # tab on right
        tab_r = size // 3
        draw_obj.ellipse([x1 - tab_r, cy - tab_r, x1 + tab_r, cy + tab_r], fill=color)

    puzzle_piece(draw, 90, H - 90, 28, (0x4A, 0x14, 0x8C))
    puzzle_piece(draw, W - 90, 90, 28, (0x6A, 0x1B, 0x9A))

    # ── Centered orb icon (mini version of the icon orb, left of text) ─────
    orb_img = Image.open(os.path.join(REPO, "purple", "icon.png")).convert("RGBA")
    orb_disp_size = 200
    orb_img = orb_img.resize((orb_disp_size, orb_disp_size), Image.LANCZOS)
    # Add glow under it
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gld = ImageDraw.Draw(glow_layer)
    gld.ellipse(
        [80 - 30, H // 2 - orb_disp_size // 2 - 30,
         80 + orb_disp_size + 30, H // 2 + orb_disp_size // 2 + 30],
        fill=(0x9C, 0x27, 0xB0, 40),
    )
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=40))
    img = Image.alpha_composite(img.convert("RGBA"), glow_layer)
    img.alpha_composite(orb_img, (80, H // 2 - orb_disp_size // 2))
    img = img.convert("RGB")
    draw = ImageDraw.Draw(img)

    # ── Title: "Purple" with vertical gradient fill ────────────────────────
    title = "Purple"
    font_title = _font(110, bold=True)
    font_sub = _font(40, bold=False)
    font_wm = _font(24, bold=False)

    # Measure title
    tb = draw.textbbox((0, 0), title, font=font_title)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    tx = 80 + orb_disp_size + 50  # left of text = right of orb + gap
    ty = H // 2 - th // 2 - 10

    # Render title to a temp RGBA image to apply vertical gradient
    tmp = Image.new("RGBA", (tw + 20, th + 40), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    td.text((10 - tb[0], 10 - tb[1]), title, font=font_title, fill=(255, 255, 255, 255))
    # Build gradient mask
    grad_mask = Image.new("RGBA", (tw + 20, th + 40), (0, 0, 0, 0))
    gmd = grad_mask.load()
    for yy in range(th + 40):
        t = yy / (th + 39)
        r = int(TEXT_TOP[0] + (TEXT_BOT[0] - TEXT_TOP[0]) * t)
        g = int(TEXT_TOP[1] + (TEXT_BOT[1] - TEXT_TOP[1]) * t)
        b = int(TEXT_TOP[2] + (TEXT_BOT[2] - TEXT_TOP[2]) * t)
        for xx in range(tw + 20):
            _, _, _, a = tmp.getpixel((xx, yy))
            if a > 0:
                gmd[xx, yy] = (r, g, b, a)
    img.paste(grad_mask, (tx - 10, ty - 10), grad_mask)
    draw = ImageDraw.Draw(img)

    # ── Subtitle under title ───────────────────────────────────────────────
    sub = "Logic Puzzle Game"
    sb = draw.textbbox((0, 0), sub, font=font_sub)
    sw = sb[2] - sb[0]
    sx = tx + (tw - sw) // 2
    sy = ty + th + 18
    draw.text((sx, sy), sub, font=font_sub, fill=(0xCE, 0x93, 0xD8))

    # ── Watermark ──────────────────────────────────────────────────────────
    wm = "GameZipper.com"
    wb = draw.textbbox((0, 0), wm, font=font_wm)
    ww = wb[2] - wb[0]
    draw.text(((W - ww) // 2, H - 50), wm, font=font_wm, fill=(0x66, 0x55, 0x77))

    out = os.path.join(REPO, "og-images", "purple.jpg")
    img.save(out, "JPEG", quality=92)
    print(f"[og]    saved {out}  ({os.path.getsize(out)} bytes, {img.size})")
    return out


if __name__ == "__main__":
    os.makedirs(os.path.join(REPO, "purple"), exist_ok=True)
    os.makedirs(os.path.join(REPO, "og-images"), exist_ok=True)
    make_icon()
    make_og()
    print("Done.")
