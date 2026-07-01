#!/usr/bin/env python3
"""Generate icon.png and og-image.jpg for Trebuchet Trajectory using PIL."""
from PIL import Image, ImageDraw, ImageFont
import math

def make_icon():
    size = 256
    img = Image.new('RGBA', (size, size), (26, 26, 46, 255))
    d = ImageDraw.Draw(img)
    # Background gradient
    for y in range(size):
        r = int(26 + (74 - 26) * y / size)
        g = int(26 + (74 - 26) * y / size)
        b = int(46 + (110 - 46) * y / size)
        d.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # Trebuchet silhouette
    cx, cy = 128, 200
    # Base
    d.rectangle([cx-30, cy, cx+30, cy+8], fill=(90, 74, 58, 255))
    # A-frame
    d.polygon([(cx-25, cy), (cx, cy-60), (cx+25, cy)], fill=(110, 90, 70, 255))
    # Arm (angled)
    arm_len = 70
    angle = 50
    rad = math.radians(angle)
    ex = cx + math.cos(rad) * arm_len
    ey = cy - 60 - math.sin(rad) * arm_len
    # Draw thick arm
    d.line([(cx, cy-60), (ex, ey)], fill=(140, 120, 100, 255), width=8)
    # Counterweight
    d.ellipse([cx-30, cy-70, cx-10, cy-50], fill=(60, 60, 60, 255))
    # Projectile (glowing)
    for r in range(12, 4, -1):
        alpha = int(255 * (1 - (r-4)/8))
        d.ellipse([ex-r, ey-r, ex+r, ey+r], fill=(241, 196, 15, max(80, alpha)))
    d.ellipse([ex-5, ey-5, ex+5, ey+5], fill=(255, 220, 50, 255))

    # Parabolic trajectory arc (dotted)
    for i in range(20):
        t = i * 0.05
        px = cx + 80 * t * math.cos(rad)
        py = cy - 60 - 80 * t * math.sin(rad) + 0.5 * 200 * t * t
        if 0 < px < size and 0 < py < size:
            r = 4 - int(t * 3)
            if r > 0:
                d.ellipse([px-r, py-r, px+r, py+r], fill=(231, 76, 60, 180))

    # Target
    tx, ty = 200, 210
    d.rectangle([tx-12, ty, tx+12, ty+4], fill=(231, 76, 60, 255))
    d.line([(tx, ty), (tx, ty-20)], fill=(231, 76, 60, 255), width=2)
    d.ellipse([tx-4, ty-24, tx+4, ty-16], fill=(231, 76, 60, 255))

    img.save('icon.png', 'PNG')
    print(f'icon.png: {img.size}')

def make_og():
    w, h = 1200, 630
    img = Image.new('RGB', (w, h), (26, 26, 46))
    d = ImageDraw.Draw(img)
    # Gradient bg
    for y in range(h):
        r = int(26 + (60 - 26) * y / h)
        g = int(26 + (60 - 26) * y / h)
        b = int(46 + (100 - 46) * y / h)
        d.line([(0, y), (w, y)], fill=(r, g, b))

    try:
        font_big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 64)
        font_med = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
    except:
        font_big = ImageFont.load_default()
        font_med = ImageFont.load_default()
        font_sm = ImageFont.load_default()

    # Title
    d.text((60, 80), "🏰 Trebuchet Trajectory", fill=(241, 196, 15), font=font_big)
    d.text((60, 165), "Counterweight Siege Puzzle", fill=(200, 200, 220), font=font_med)
    d.text((60, 210), "30 verified-unique ballistic physics puzzles", fill=(150, 150, 170), font=font_sm)
    d.text((60, 245), "Set power & angle → parabolic projectile → hit target", fill=(150, 150, 170), font=font_sm)

    # Siege engine illustration (right side)
    bx, by = 850, 450
    # Ground
    d.rectangle([700, 480, 1150, 520], fill=(61, 90, 61))
    # Base
    d.rectangle([bx-40, by, bx+40, by+12], fill=(90, 74, 58))
    # A-frame
    d.polygon([(bx-35, by), (bx, by-90), (bx+35, by)], fill=(110, 90, 70))
    # Arm
    angle = 50
    rad = math.radians(angle)
    ex = bx + math.cos(rad) * 100
    ey = by - 90 - math.sin(rad) * 100
    d.line([(bx, by-90), (ex, ey)], fill=(140, 120, 100), width=10)
    # Counterweight
    d.ellipse([bx-45, by-105, bx-15, by-75], fill=(60, 60, 60))
    # Projectile
    d.ellipse([ex-8, ey-8, ex+8, ey+8], fill=(241, 196, 15))
    # Arc
    for i in range(30):
        t = i * 0.04
        px = bx + 120 * t * math.cos(rad)
        py = by - 90 - 120 * t * math.sin(rad) + 0.5 * 350 * t * t
        if 700 < px < 1150 and 100 < py < 500:
            r = 5 - int(t * 4)
            if r > 0:
                d.ellipse([px-r, py-r, px+r, py+r], fill=(231, 76, 60))
    # Target
    tx, ty = 1080, 480
    d.rectangle([tx-20, ty, tx+20, ty+6], fill=(231, 76, 60))
    d.line([(tx, ty), (tx, ty-35)], fill=(231, 76, 60), width=3)
    d.ellipse([tx-7, ty-42, tx+7, ty-28], fill=(231, 76, 60))

    # Footer
    d.text((60, 560), "gamezipper.com/trebuchet-trajectory", fill=(100, 100, 120), font=font_sm)

    img.save('og-image.jpg', 'JPEG', quality=90)
    print(f'og-image.jpg: {img.size}')

make_icon()
make_og()
print('Art generation complete.')
