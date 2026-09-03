#!/usr/bin/env python3
"""Generate icon.png and og-image.jpg for Tilt Maze."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.dirname(os.path.abspath(__file__))

# Color scheme (matches CSS)
BG0 = (6, 6, 15)
BG1 = (16, 16, 42)
BG2 = (26, 26, 58)
ACCENT = (255, 184, 77)   # gold/orange (ball)
ACCENT2 = (100, 255, 218) # cyan (hole)
ACCENT3 = (255, 107, 157) # pink
ACCENT4 = (167, 139, 250) # purple
WALL = (96, 96, 128)

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

# 4x4 grid centered
cell = 80
ox = (512 - 4 * cell) // 2
oy = (512 - 4 * cell) // 2 + 16

# Grid frame
d.rectangle([ox - 6, oy - 6, ox + 4*cell + 6, oy + 4*cell + 6], outline=ACCENT2, width=4)

for r in range(4):
    for c in range(4):
        x = ox + c * cell
        y = oy + r * cell
        d.rectangle([x, y, x+cell, y+cell], outline=(48, 48, 80), width=1, fill=BG1)

# Ball at (0, 0) — top-left
bx, by = ox, oy
d.ellipse([bx + cell*0.15, by + cell*0.15, bx + cell*0.85, by + cell*0.85], fill=ACCENT, outline=(170, 102, 17), width=3)
# Highlight on ball
d.ellipse([bx + cell*0.32, by + cell*0.28, bx + cell*0.5, by + cell*0.46], fill=(255, 224, 160))

# Hole at (3, 3) — bottom-right
hx, hy = ox + 3*cell, oy + 3*cell
d.ellipse([hx + cell*0.15, hy + cell*0.15, hx + cell*0.85, hy + cell*0.85], fill=(0, 0, 0), outline=ACCENT2, width=3)
d.ellipse([hx + cell*0.32, hy + cell*0.32, hx + cell*0.68, hy + cell*0.68], fill=(0, 0, 0))

# Arrow indicator (subtle tilt N)
# Just a small arrow in corner showing direction
arrow_x, arrow_y = ox + 4*cell + 20, oy + 4*cell + 20
# Drawn as a small triangle at the bottom
tri_x, tri_y = ox + 2*cell, oy + 4*cell + 25
d.polygon([(tri_x - 15, tri_y), (tri_x + 15, tri_y), (tri_x, tri_y + 30)], fill=ACCENT3)

icon.save(os.path.join(OUT, 'icon.png'), 'PNG')
print(f"icon.png: {os.path.getsize(os.path.join(OUT, 'icon.png'))} bytes")

# === og-image.jpg 1200x630 ===
og = Image.new('RGB', (1200, 630), BG0)
d = ImageDraw.Draw(og)
# Gradient bg
for y in range(630):
    t = y / 630
    r = int(BG0[0] * (1-t) + BG2[0] * t)
    g = int(BG0[1] * (1-t) + BG2[1] * t)
    b = int(BG0[2] * (1-t) + BG2[2] * t)
    d.line([(0, y), (1200, y)], fill=(r, g, b))

# Title "TILT MAZE" centered at top
try:
    title_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 90)
    body_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 32)
    small_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 28)
except:
    title_font = ImageFont.load_default()
    body_font = ImageFont.load_default()
    small_font = ImageFont.load_default()

title = "TILT MAZE"
tw = d.textbbox((0,0), title, font=title_font)[2]
d.text(((1200 - tw)//2, 50), title, fill=ACCENT, font=title_font)

# Subtitle
subtitle = "Roll every ball into a hole"
sw = d.textbbox((0,0), subtitle, font=body_font)[2]
d.text(((1200 - sw)//2, 165), subtitle, fill=ACCENT2, font=body_font)

# Big 5x5 grid centered
cell = 70
gx, gy = (1200 - 5*cell)//2, 250
d.rectangle([gx - 6, gy - 6, gx + 5*cell + 6, gy + 5*cell + 6], outline=ACCENT2, width=4)

for r in range(5):
    for c in range(5):
        x = gx + c * cell
        y = gy + r * cell
        d.rectangle([x, y, x+cell, y+cell], outline=(48, 48, 80), width=1, fill=BG1)

# Two balls (matching an Easy/Medium level design)
# Ball at (0,0)
bx, by = gx, gy
d.ellipse([bx + cell*0.18, by + cell*0.18, bx + cell*0.82, by + cell*0.82], fill=ACCENT, outline=(170, 102, 17), width=3)
# Highlight
d.ellipse([bx + cell*0.34, by + cell*0.30, bx + cell*0.50, by + cell*0.46], fill=(255, 224, 160))

# Ball at (0,3)
bx, by = gx + 3*cell, gy
d.ellipse([bx + cell*0.18, by + cell*0.18, bx + cell*0.82, by + cell*0.82], fill=ACCENT3, outline=(140, 50, 90), width=3)
d.ellipse([bx + cell*0.34, by + cell*0.30, bx + cell*0.50, by + cell*0.46], fill=(255, 192, 220))

# Holes at bottom row
for c in [0, 4]:
    hx, hy = gx + c * cell, gy + 4 * cell
    d.ellipse([hx + cell*0.18, hy + cell*0.18, hx + cell*0.82, hy + cell*0.82], fill=(0, 0, 0), outline=ACCENT2, width=3)

# Wall in middle
wx, wy = gx + 2*cell, gy + 2*cell
d.rectangle([wx + 8, wy + 8, wx + cell - 8, wy + cell - 8], fill=WALL, outline=(120, 120, 160), width=2)

# Tagline at bottom
tagline = "30 unique-solution puzzles · 5 difficulty tiers"
tw = d.textbbox((0,0), tagline, font=small_font)[2]
d.text(((1200 - tw)//2, 560), tagline, fill=ACCENT4, font=small_font)

og.save(os.path.join(OUT, 'og-image.jpg'), 'JPEG', quality=88)
print(f"og-image.jpg: {os.path.getsize(os.path.join(OUT, 'og-image.jpg'))} bytes")

# === thumb (smaller version) ===
thumb = Image.new('RGB', (300, 200), BG1)
d = ImageDraw.Draw(thumb)
cell = 38
gx, gy = (300 - 4*cell)//2, (200 - 4*cell)//2
d.rectangle([gx-2, gy-2, gx+4*cell+2, gy+4*cell+2], outline=ACCENT2, width=2)
for r in range(4):
    for c in range(4):
        x, y = gx + c*cell, gy + r*cell
        d.rectangle([x, y, x+cell, y+cell], outline=(48, 48, 80), fill=BG1)
# Ball
d.ellipse([gx + cell*0.2, gy + cell*0.2, gx + cell*0.8, gy + cell*0.8], fill=ACCENT)
# Hole
hx, hy = gx + 3*cell, gy + 3*cell
d.ellipse([hx + cell*0.2, hy + cell*0.2, hx + cell*0.8, hy + cell*0.8], fill=(0,0,0), outline=ACCENT2, width=2)

thumb.save(os.path.join(OUT, 'thumb.jpg'), 'JPEG', quality=85)
print(f"thumb.jpg: {os.path.getsize(os.path.join(OUT, 'thumb.jpg'))} bytes")