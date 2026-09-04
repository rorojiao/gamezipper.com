#!/usr/bin/env python3
"""Generate icon.png and og-image.jpg for Knight's Tour."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.dirname(os.path.abspath(__file__))

# Color scheme (matches CSS)
BG0 = (6, 6, 15)
BG1 = (16, 16, 42)
BG2 = (26, 26, 58)
ACCENT = (255, 213, 79)   # gold (knight)
KNIGHT_STROKE = (192, 160, 96)
ACCENT2 = (100, 255, 218) # cyan (visited)
ACCENT3 = (255, 138, 101) # orange (current)
GOLD_DARK = (170, 130, 30)

# === icon.png 512x512 ===
icon = Image.new('RGB', (512, 512), BG0)
d = ImageDraw.Draw(icon)
# Background gradient
for y in range(512):
    t = y / 512
    r = int(BG0[0] * (1-t) + BG2[0] * t)
    g = int(BG0[1] * (1-t) + BG2[1] * t)
    b = int(BG0[2] * (1-t) + BG2[2] * t)
    d.line([(0, y), (512, y)], fill=(r, g, b))

# 5x5 board centered
size = 5
cell = 80
total = size * cell
ox = (512 - total) // 2
oy = (512 - total) // 2 + 16

# Grid frame
d.rectangle([ox - 6, oy - 6, ox + total + 6, oy + total + 6], outline=KNIGHT_STROKE, width=4)

# Draw cells (chess-like)
for r in range(size):
    for c in range(size):
        x = ox + c * cell
        y = oy + r * cell
        is_light = (r + c) % 2 == 0
        cell_bg = BG2 if is_light else BG1
        d.rectangle([x, y, x+cell, y+cell], outline=(48, 48, 80), width=1, fill=cell_bg)

# Knight silhouette — simplified chess knight shape (head facing right)
# Use a stylized horse-head silhouette
def draw_knight(cx, cy, scale, fill, stroke, stroke_w):
    """Draw a stylized knight chess piece silhouette at (cx, cy)."""
    # Polygon points for a horse-head knight silhouette
    pts = [
        (cx - 0.4*scale, cy + 0.55*scale),  # bottom-left
        (cx - 0.45*scale, cy + 0.05*scale),  # mid-left
        (cx - 0.3*scale, cy - 0.15*scale),  # neck-left
        (cx - 0.05*scale, cy - 0.35*scale),  # upper neck
        (cx + 0.15*scale, cy - 0.55*scale),  # forehead
        (cx + 0.4*scale, cy - 0.5*scale),    # ear top
        (cx + 0.3*scale, cy - 0.3*scale),    # ear bottom
        (cx + 0.5*scale, cy - 0.15*scale),   # muzzle top
        (cx + 0.5*scale, cy + 0.05*scale),   # muzzle
        (cx + 0.35*scale, cy + 0.05*scale),  # chin
        (cx + 0.3*scale, cy + 0.25*scale),   # jaw
        (cx + 0.45*scale, cy + 0.5*scale),   # bottom-right
    ]
    d.polygon(pts, fill=fill, outline=stroke)

# Knight in center cell (2, 2)
cx = ox + 2*cell + cell//2
cy = oy + 2*cell + cell//2
draw_knight(cx, cy, cell*0.85, ACCENT, KNIGHT_STROKE, 3)

# Small "1" number in corner of cell
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    font_big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
except OSError:
    font = ImageFont.load_default()
    font_big = font

# Add small "1" label (start number) in corner
d.text((ox + 4, oy + 4), "1", fill=ACCENT3, font=font_big)

# === og-image.jpg 1200x630 ===
og = Image.new('RGB', (1200, 630), BG0)
d2 = ImageDraw.Draw(og)
# Gradient bg
for y in range(630):
    t = y / 630
    r = int(BG0[0] * (1-t) + BG2[0] * t)
    g = int(BG0[1] * (1-t) + BG2[1] * t)
    b = int(BG0[2] * (1-t) + BG2[2] * t)
    d2.line([(0, y), (1200, y)], fill=(r, g, b))

# 6x6 board on left half
size = 6
cell = 70
total = size * cell
ox = 80
oy = (630 - total) // 2

# Grid frame
d2.rectangle([ox - 6, oy - 6, ox + total + 6, oy + total + 6], outline=KNIGHT_STROKE, width=4)
# Cells
for r in range(size):
    for c in range(size):
        x = ox + c * cell
        y = oy + r * cell
        is_light = (r + c) % 2 == 0
        cell_bg = BG2 if is_light else BG1
        d2.rectangle([x, y, x+cell, y+cell], outline=(48, 48, 80), width=1, fill=cell_bg)

# Add a sample tour: highlight some visited squares with their numbers
sample_path = [
    (0,0),(1,2),(2,4),(4,3),(5,5),(4,5),(3,3),(1,4),(0,2),(1,0),
    (3,1),(4,3),(5,5),(4,5),(3,3),(1,4),(0,2),(1,0),(3,1),(5,2),
]
seen = set()
for i, (r, c) in enumerate(sample_path[:18]):
    k = (r, c)
    if k in seen: continue
    seen.add(k)
    x = ox + c * cell
    y = oy + r * cell
    d2.rectangle([x, y, x+cell, y+cell], outline=ACCENT2, width=2)
    try:
        num_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
    except OSError:
        num_font = ImageFont.load_default()
    d2.text((x + cell//2 - 8, y + cell//2 - 14), str(i + 1), fill=ACCENT2, font=num_font)

# Knight at the last position
cx = ox + sample_path[17][1]*cell + cell//2
cy = oy + sample_path[17][0]*cell + cell//2
draw_knight(cx, cy, cell*0.85, ACCENT, KNIGHT_STROKE, 3)

# Text on right
try:
    title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 70)
    sub_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36)
    tag_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
except OSError:
    title_font = ImageFont.load_default()
    sub_font = title_font
    tag_font = title_font

d2.text((640, 180), "Knight's Tour", fill=ACCENT, font=title_font)
d2.text((640, 280), "Chess Knight Logic Puzzle", fill=ACCENT2, font=sub_font)
d2.text((640, 340), "Visit every square exactly once", fill=(200, 200, 220), font=sub_font)
d2.text((640, 460), "30 puzzles · 5 difficulty tiers · 5×5 to 10×10", fill=(180, 180, 200), font=tag_font)
d2.text((640, 510), "gamezipper.com/knights-tour", fill=(140, 140, 170), font=tag_font)

# Save
icon.save(os.path.join(OUT, 'icon.png'), optimize=True)
print(f'icon.png: {os.path.getsize(os.path.join(OUT, "icon.png"))} bytes')

og.save(os.path.join(OUT, 'og-image.jpg'), quality=88, optimize=True)
print(f'og-image.jpg: {os.path.getsize(os.path.join(OUT, "og-image.jpg"))} bytes')

# Also thumb.jpg for compat (smaller version)
thumb = icon.copy()
thumb.thumbnail((240, 240))
thumb.save(os.path.join(OUT, 'thumb.jpg'), quality=85, optimize=True)
print(f'thumb.jpg: {os.path.getsize(os.path.join(OUT, "thumb.jpg"))} bytes')
