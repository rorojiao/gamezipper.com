#!/usr/bin/env python3
"""Set Quest — PIL art generator.

Writes BOTH art assets for the game:
  icon.png      512x512 PNG  (<= 50KB)
  og-image.jpg  1200x630 JPEG (<= 200KB)

Visual design — shows the GAME, not generic art:
  - Dark navy background (#0a1430) matching the game's --bg1 CSS variable
  - Three overlapping white playing-card faces, slightly rotated
  - SET attribute glyphs on the cards: circle / square / triangle, one of
    each in red #ff5a6e / green #3ee07f / purple #b18cff, so the trio reads
    as "all different" in both shape and color
  - og-image additionally renders the title "SET QUEST", the subtitle
    "Find the three cards" and a "30 LEVELS" badge
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))

BG = (10, 20, 48)        # #0a1430
BG2 = (23, 36, 85)       # #172455
FACE = (247, 249, 255)   # #f7f9ff card face
EDGE = (210, 220, 240)
RED = (255, 90, 110)     # #ff5a6e
GREEN = (62, 224, 127)   # #3ee07f
PURPLE = (177, 140, 255)  # #b18cff
GOLD = (255, 209, 102)   # #ffd166 accent

W_ICON, H_ICON = 512, 512
W_OG, H_OG = 1200, 630


def load_font(size):
    for cand in (
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
    ):
        if os.path.exists(cand):
            return ImageFont.truetype(cand, size)
    return ImageFont.load_default()


def draw_shape(draw, shape, cx, cy, r, color, width=6):
    """shape: 0 circle, 1 square, 2 triangle — stroked in `color` like the game."""
    if shape == 0:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=width)
    elif shape == 1:
        draw.rectangle([cx - r, cy - r, cx + r, cy + r], outline=color, width=width)
    else:
        p1 = (cx, cy - r)
        p2 = (cx + r * 0.92, cy + r * 0.72)
        p3 = (cx - r * 0.92, cy + r * 0.72)
        draw.polygon([p1, p2, p3], outline=color, width=width)


def draw_card(img, cx, cy, w, h, angle, shape, color):
    """One rotated white playing card with a SET glyph centered on it.

    The card is rendered at 4x supersampling with soft anti-aliasing,
    rotated, then composited onto `img` via its alpha channel.
    """
    ss = 4
    pad = 6
    card = Image.new('RGBA', ((w + 2 * pad) * ss, (h + 2 * pad) * ss), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    cd.rounded_rectangle([pad * ss, pad * ss, (pad + w) * ss, (pad + h) * ss],
                         radius=12 * ss, fill=FACE + (255,),
                         outline=EDGE + (255,), width=2 * ss)
    gx, gy = (pad + w / 2) * ss, (pad + h / 2) * ss
    gr = min(w, h) * 0.30 * ss
    draw_shape(cd, shape, gx, gy, gr, color + (255,), width=2 * ss)
    card = card.rotate(angle, expand=True, resample=Image.BICUBIC,
                       fillcolor=(0, 0, 0, 0))
    # downsample the 4x supersampled layer back to 1x (anti-aliasing)
    card = card.resize((card.width // ss, card.height // ss), Image.LANCZOS)
    img.paste(card, (int(cx - card.width / 2), int(cy - card.height / 2)), card)


def draw_title(draw, cx, cy, scale=1.0):
    font_title = load_font(int(110 * scale))
    font_sub = load_font(int(40 * scale))
    t = 'SET QUEST'
    bbox = draw.textbbox((0, 0), t, font=font_title)
    tw = bbox[2] - bbox[0]
    x, y = cx - tw / 2, cy
    draw.text((x + 3, y + 3), t, font=font_title, fill=(0, 0, 0, 170))
    # tricolor echo: SET in red, QUEST in gold
    draw.text((x, y), 'SET', font=font_title, fill=RED)
    w_set = draw.textbbox((0, 0), 'SET', font=font_title)[2]
    draw.text((x + w_set, y), ' QUEST', font=font_title, fill=GOLD)
    sub = 'Find the three cards'
    bbox2 = draw.textbbox((0, 0), sub, font=font_sub)
    draw.text((cx - (bbox2[2] - bbox2[0]) / 2, y + int(128 * scale)), sub,
              font=font_sub, fill=(232, 237, 247))


def draw_badge(draw, cx, cy, text, scale=1.0):
    font_badge = load_font(int(34 * scale))
    bbox = draw.textbbox((0, 0), text, font=font_badge)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad_x, pad_y = 26 * scale, 14 * scale
    x0, y0 = cx - tw / 2 - pad_x, cy - th / 2 - pad_y
    x1, y1 = cx + tw / 2 + pad_x, cy + th / 2 + pad_y
    draw.rounded_rectangle([x0, y0, x1, y1], radius=18 * scale,
                           fill=(6, 214, 160), outline=(255, 255, 255), width=2)
    draw.text((x0 + pad_x, y0 + pad_y - 4 * scale), text, font=font_badge,
              fill=(6, 9, 20))


def glow(d, cx, cy, radius, steps=120, alpha=28):
    """Concentric translucent circles = cheap radial glow on RGBA draw."""
    for i in range(steps, 0, -1):
        a = int(alpha * (1 - i / steps))
        d.ellipse([cx - i * radius / steps, cy - i * radius / steps,
                   cx + i * radius / steps, cy + i * radius / steps],
                  fill=BG2 + (a,))


def make_icon():
    img = Image.new('RGBA', (W_ICON, H_ICON), BG + (255,))
    d = ImageDraw.Draw(img, 'RGBA')
    glow(d, 256, 240, 260)
    cards = [
        # (cx, cy, angle, shape, color)
        (150, 250, -14, 0, RED),     # circle, red
        (256, 225, 0, 1, GREEN),     # square, green
        (362, 250, 14, 2, PURPLE),   # triangle, purple
    ]
    for cx, cy, ang, shape, color in cards:
        draw_card(img, cx, cy, 122, 170, ang, shape, color)
    # quantize to keep the PNG under 50KB
    img.convert('P', palette=Image.ADAPTIVE, colors=64).save(
        os.path.join(HERE, 'icon.png'), optimize=True)


def make_og():
    img = Image.new('RGBA', (W_OG, H_OG), BG + (255,))
    d = ImageDraw.Draw(img, 'RGBA')
    glow(d, W_OG / 2, 140, 420, steps=200, alpha=34)
    cards = [
        (250, 420, -12, 0, RED),
        (425, 380, -4, 1, GREEN),
        (600, 420, 6, 2, PURPLE),
    ]
    for cx, cy, ang, shape, color in cards:
        draw_card(img, cx, cy, 172, 240, ang, shape, color)
    draw_title(d, 880, 140, scale=0.82)
    draw_badge(d, 880, 470, '30 LEVELS', scale=0.8)
    img.convert('RGB').save(os.path.join(HERE, 'og-image.jpg'), 'JPEG',
                            quality=82, optimize=True, progressive=True)


if __name__ == '__main__':
    make_icon()
    make_og()
    for f, cap in (('icon.png', 50 * 1024), ('og-image.jpg', 200 * 1024)):
        p = os.path.join(HERE, f)
        size = os.path.getsize(p)
        flag = 'OK' if size <= cap else 'OVER'
        print(f'{f}: {size} bytes ({flag}, cap {cap})')
