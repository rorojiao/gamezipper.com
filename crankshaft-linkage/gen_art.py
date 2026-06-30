#!/usr/bin/env python3
"""Generate icon.png and og-image.jpg for Crankshaft Linkage via PIL."""
from PIL import Image, ImageDraw, ImageFont
import math

def draw_crank(draw, cx, cy, r, angle, color_arm='#ffa726', color_pin='#ff7043'):
    pin_x = cx + r * math.cos(angle)
    pin_y = cy + r * math.sin(angle)
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline='#37474f', width=3)
    draw.line([cx, cy, pin_x, pin_y], fill=color_arm, width=5)
    draw.ellipse([cx-4, cy-4, cx+4, cy+4], fill='#546e7a')
    draw.ellipse([pin_x-5, pin_y-5, pin_x+5, pin_y+5], fill=color_pin)
    return pin_x, pin_y

# === Icon 512x512 ===
icon = Image.new('RGB', (512, 512), '#0d1320')
d = ImageDraw.Draw(icon)
# 3 cranks centered
for i, ang in enumerate([0.3, 2.0, 4.2]):
    draw_crank(d, 256, 256, 120, ang)
# Slider track
d.line([96, 400, 416, 400], fill='#1a2a3a', width=10)
for sx in [180, 280, 360]:
    d.rectangle([sx-16, 388, sx+16, 412], fill='#42a5f5', outline='#90caf9', width=2)
# Rods
for i, (ang, sx) in enumerate(zip([0.3, 2.0, 4.2], [180, 280, 360])):
    cx = [136, 256, 376][i]
    pin_x = cx + 120*math.cos(ang)
    pin_y = 256 + 120*math.sin(ang)
    d.line([pin_x, pin_y, sx, 400], fill='#78909c', width=4)
icon.save('icon.png', optimize=True)
print('icon.png saved')

# === OG Image 1200x630 ===
og = Image.new('RGB', (1200, 630), '#0a0e17')
d = ImageDraw.Draw(og)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 48)
    font_sm = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 24)
except:
    font = ImageFont.load_default()
    font_sm = ImageFont.load_default()
d.text((60, 40), '🔧 Crankshaft Linkage', fill='#ffa726', font=font)
d.text((60, 100), 'Slider-Crank Mechanism Puzzle', fill='#e0e0e0', font=font_sm)
d.text((60, 560), '30 Levels • Unique Solutions • Free HTML5', fill='#888', font=font_sm)
# 4 cranks
track_y = 450
for i, ang in enumerate([0.5, 1.8, 3.5, 5.0]):
    cx = 200 + i * 250
    cy = track_y - 120 - 30
    draw_crank(d, cx, cy, 100, ang)
    pin_x = cx + 100*math.cos(ang)
    pin_y = cy + 100*math.sin(ang)
    sx = cx + round(100*math.cos(ang))
    d.line([pin_x, pin_y, sx, track_y], fill='#78909c', width=5)
    d.rectangle([sx-14, track_y-10, sx+14, track_y+10], fill='#42a5f5')
d.line([100, track_y, 1100, track_y], fill='#1a2a3a', width=8)
og.save('og-image.jpg', quality=85)
print('og-image.jpg saved')

import os
print(f'icon.png: {os.path.getsize("icon.png")} bytes')
print(f'og-image.jpg: {os.path.getsize("og-image.jpg")} bytes')
