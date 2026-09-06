#!/usr/bin/env python3
"""Generate River Crossing icon and OG image."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).parent


def make_icon():
    """512x512 icon: river scene with two banks and a boat."""
    img = Image.new("RGBA", (512, 512), (8, 16, 36, 255))  # dark blue night
    d = ImageDraw.Draw(img)
    # Sky gradient (top half)
    for y in range(0, 280):
        t = y / 280
        r = int(20 + (60 - 20) * t)
        g = int(30 + (90 - 30) * t)
        b = int(60 + (140 - 60) * t)
        d.line([(0, y), (512, y)], fill=(r, g, b, 255))
    # Stars
    import random
    random.seed(7)
    for _ in range(40):
        x = random.randint(0, 512)
        y = random.randint(0, 240)
        sz = random.randint(1, 3)
        d.ellipse([(x, y), (x + sz, y + sz)], fill=(255, 255, 230, 200))
    # Moon
    d.ellipse([(380, 60), (470, 150)], fill=(245, 230, 200, 255))
    d.ellipse([(395, 70), (455, 130)], fill=(20, 30, 60, 255))

    # River (bottom half, with subtle wave)
    river_top = 280
    for y in range(river_top, 512):
        t = (y - river_top) / (512 - river_top)
        r = int(15 + (40 - 15) * t)
        g = int(40 + (90 - 40) * t)
        b = int(90 + (160 - 90) * t)
        d.line([(0, y), (512, y)], fill=(r, g, b, 255))
    # Wave highlights
    for y in range(river_top, 512, 8):
        for x in range(0, 512, 24):
            offset = (x // 24) % 3
            wx = x + (offset * 6)
            d.line([(wx, y), (wx + 12, y)], fill=(110, 200, 240, 90))

    # Left bank (with grass)
    d.polygon([(0, 280), (160, 320), (160, 512), (0, 512)], fill=(60, 130, 70, 255))
    d.polygon([(0, 280), (160, 320), (160, 360), (0, 320)], fill=(80, 160, 90, 255))
    # Right bank
    d.polygon([(512, 280), (352, 320), (352, 512), (512, 512)], fill=(60, 130, 70, 255))
    d.polygon([(512, 280), (352, 320), (352, 360), (512, 320)], fill=(80, 160, 90, 255))

    # Boat (centered)
    bx, by = 220, 360
    d.polygon([(bx, by), (bx + 80, by), (bx + 70, by + 30), (bx + 10, by + 30)], fill=(120, 80, 50, 255))
    d.polygon([(bx, by), (bx + 80, by), (bx + 75, by + 6), (bx + 5, by + 6)], fill=(160, 110, 70, 255))
    # Boatman figure
    d.ellipse([(bx + 35, by - 16), (bx + 47, by - 4)], fill=(255, 200, 130, 255))
    d.line([(bx + 41, by - 4), (bx + 41, by + 18)], fill=(70, 50, 40, 255), width=3)
    # Oar
    d.line([(bx + 45, by + 4), (bx + 75, by - 8)], fill=(140, 100, 60, 255), width=3)

    # Animals on left bank (small icons)
    for i, (color, label) in enumerate([
        ((220, 220, 220, 255), "W"),  # wolf
        ((240, 220, 100, 255), "G"),  # goat
        ((140, 200, 120, 255), "C"),  # cabbage
    ]):
        x = 40 + i * 36
        y = 290
        d.ellipse([(x, y), (x + 24, y + 24)], fill=color)
    # Right bank has nothing (or a "?" hint)
    d.text((420, 460), "→", fill=(255, 230, 130, 255))

    img.save(OUT / "icon.png", optimize=True)
    print(f"icon.png saved ({img.size})")


def make_og():
    """1200x630 OG image."""
    img = Image.new("RGBA", (1200, 630), (8, 16, 36, 255))
    d = ImageDraw.Draw(img)
    # Background gradient
    for y in range(0, 630):
        t = y / 630
        r = int(8 + (20 - 8) * t)
        g = int(16 + (35 - 16) * t)
        b = int(36 + (70 - 36) * t)
        d.line([(0, y), (1200, y)], fill=(r, g, b, 255))
    # Stars
    import random
    random.seed(11)
    for _ in range(80):
        x = random.randint(0, 1200)
        y = random.randint(0, 280)
        sz = random.randint(1, 3)
        d.ellipse([(x, y), (x + sz, y + sz)], fill=(255, 255, 230, 200))
    # Moon
    d.ellipse([(1000, 80), (1130, 210)], fill=(245, 230, 200, 255))
    d.ellipse([(1020, 95), (1110, 185)], fill=(20, 30, 60, 255))

    # River
    river_top = 320
    for y in range(river_top, 630):
        t = (y - river_top) / (630 - river_top)
        r = int(15 + (40 - 15) * t)
        g = int(40 + (90 - 40) * t)
        b = int(90 + (160 - 90) * t)
        d.line([(0, y), (1200, y)], fill=(r, g, b, 255))
    for y in range(river_top, 630, 10):
        for x in range(0, 1200, 30):
            offset = (x // 30) % 3
            wx = x + (offset * 8)
            d.line([(wx, y), (wx + 18, y)], fill=(110, 200, 240, 90))

    # Left bank
    d.polygon([(0, 320), (300, 380), (300, 630), (0, 630)], fill=(60, 130, 70, 255))
    d.polygon([(0, 320), (300, 380), (300, 440), (0, 380)], fill=(80, 160, 90, 255))
    # Right bank
    d.polygon([(1200, 320), (900, 380), (900, 630), (1200, 630)], fill=(60, 130, 70, 255))
    d.polygon([(1200, 320), (900, 380), (900, 440), (1200, 380)], fill=(80, 160, 90, 255))

    # Boat
    bx, by = 540, 440
    d.polygon([(bx, by), (bx + 140, by), (bx + 125, by + 50), (bx + 15, by + 50)], fill=(120, 80, 50, 255))
    d.polygon([(bx, by), (bx + 140, by), (bx + 130, by + 10), (bx + 10, by + 10)], fill=(160, 110, 70, 255))
    # Boatman
    d.ellipse([(bx + 60, by - 28), (bx + 80, by - 8)], fill=(255, 200, 130, 255))
    d.line([(bx + 70, by - 8), (bx + 70, by + 30)], fill=(70, 50, 40, 255), width=5)
    d.line([(bx + 75, by + 6), (bx + 130, by - 16)], fill=(140, 100, 60, 255), width=5)

    # Animals on left bank
    for i, (color,) in enumerate([
        ((220, 220, 220, 255),),
        ((240, 220, 100, 255),),
        ((140, 200, 120, 255),),
        ((200, 100, 100, 255),),
    ]):
        x = 80 + i * 50
        y = 350
        d.ellipse([(x, y), (x + 36, y + 36)], fill=color[0])
    # Animals on right bank (target)
    for i, (color,) in enumerate([
        ((220, 220, 220, 255),),
        ((240, 220, 100, 255),),
    ]):
        x = 980 + i * 50
        y = 350
        d.ellipse([(x, y), (x + 36, y + 36)], fill=color[0])

    # Title
    try:
        font_big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 64)
        font_med = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
    except OSError:
        font_big = ImageFont.load_default()
        font_med = font_big
    d.text((40, 40), "RIVER CROSSING", fill=(255, 220, 130, 255), font=font_big)
    d.text((40, 120), "Classic logic puzzle — 30 levels", fill=(220, 240, 255, 255), font=font_med)
    d.text((40, 165), "Wolf, goat, cabbage — boat holds 1 or 2", fill=(180, 220, 250, 220), font=font_med)
    d.text((900, 580), "GameZipper", fill=(180, 200, 240, 200), font=font_med)

    img.convert("RGB").save(OUT / "og-image.jpg", quality=88, optimize=True)
    print(f"og-image.jpg saved ({img.size})")


if __name__ == "__main__":
    make_icon()
    make_og()
