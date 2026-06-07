#!/usr/bin/env python3
"""Generate Hidato icon.png (512x512) and og-image.png (1200x630)
Ocean/night theme with chain of numbered squares
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hidato")
os.makedirs(OUT_DIR, exist_ok=True)

# Color palette - ocean twilight
BG_DARK = (10, 25, 50)
BG_MID = (15, 60, 95)
BG_LIGHT = (30, 110, 160)
CYAN = (0, 220, 255)
AMBER = (255, 180, 80)
GOLD = (255, 210, 60)
WHITE = (240, 250, 255)

def make_gradient(size, stops):
    img = Image.new("RGB", size, stops[0][1])
    px = img.load()
    w, h = size
    for y in range(h):
        t = y / max(1, h - 1)
        c1, c2 = stops[0], stops[-1]
        # linear interpolation in RGB
        # Find which segment
        r = int(c1[1][0] + (c2[1][0] - c1[1][0]) * t)
        g = int(c1[1][1] + (c2[1][1] - c1[1][1]) * t)
        b = int(c1[1][2] + (c2[1][2] - c1[1][2]) * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    return img

def get_font(size, bold=True):
    paths_bold = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    paths_reg = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    paths = paths_bold if bold else paths_reg
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def draw_chain_squares(draw, grid_size, cell_size, offset_x, offset_y, chain, dot_radius, fill_color, text_color, show_text=True, font_size=20):
    """Draw a chain of numbered squares connected diagonally."""
    n = len(chain)
    for i, (r, c) in enumerate(chain):
        x = offset_x + c * cell_size
        y = offset_y + r * cell_size
        # Glow
        glow_box = [x - 2, y - 2, x + cell_size + 2, y + cell_size + 2]
        draw.rounded_rectangle(glow_box, radius=8, outline=CYAN, width=2)
        # Filled cell
        inner = [x + 1, y + 1, x + cell_size - 1, y + cell_size - 1]
        alpha_val = int(80 + (i / n) * 100)
        # use a fill color with progress gradient
        col = (
            int(fill_color[0] * (0.4 + 0.6 * i / n)),
            int(fill_color[1] * (0.4 + 0.6 * i / n)),
            int(fill_color[2] * (0.4 + 0.6 * i / n))
        )
        draw.rounded_rectangle(inner, radius=6, fill=col)
        if show_text and (i < 12 or i == n - 1):
            num = str(i + 1)
            font = get_font(font_size, bold=True)
            bbox = draw.textbbox((0, 0), num, font=font)
            tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
            tx = x + (cell_size - tw) / 2 - bbox[0]
            ty = y + (cell_size - th) / 2 - bbox[1]
            draw.text((tx, ty), num, fill=text_color, font=font)
        # Connection line to next cell
        if i < n - 1:
            nr, nc = chain[i + 1]
            x1 = x + cell_size / 2
            y1 = y + cell_size / 2
            x2 = offset_x + nc * cell_size + cell_size / 2
            y2 = offset_y + nr * cell_size + cell_size / 2
            draw.line([(x1, y1), (x2, y2)], fill=CYAN, width=3)

def make_icon():
    size = 512
    img = make_gradient((size, size), [
        (0, BG_DARK),
        (0.5, BG_MID),
        (1, BG_LIGHT)
    ])
    # Add radial glow
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for r in range(140, 0, -2):
        a = int(20 * (1 - r / 140))
        od.ellipse([size/2 - r, size/2 - r, size/2 + r, size/2 + r], fill=(0, 200, 255, a))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    # draw rounded corners mask
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, size - 1, size - 1], radius=80, fill=255)
    img.putalpha(mask)
    # Draw chain grid (5x5, smaller)
    chain = [
        (0, 0), (0, 1), (1, 1), (1, 2), (0, 2),
        (0, 3), (1, 3), (2, 3), (2, 2), (3, 2),
        (3, 1), (4, 1), (4, 0), (3, 0), (2, 0),
        (2, 1), (1, 0), (4, 2), (4, 3), (4, 4),
        (3, 4), (2, 4), (1, 4), (0, 4), (3, 3),
    ]
    n_grid = 5
    cell_size = (size - 80) // n_grid
    offset_x = (size - cell_size * n_grid) / 2
    offset_y = (size - cell_size * n_grid) / 2
    # Draw on alpha
    draw_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    dd = ImageDraw.Draw(draw_layer)
    # Title text
    title_font = get_font(56, bold=True)
    title = "HIDATO"
    bbox = dd.textbbox((0, 0), title, font=title_font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    # Position title above grid? Better: place title in upper area, chain below
    # Actually grid spans full size, so put "H" big letter mark in top
    # Skip title — use just the grid centered
    # Draw chain
    draw_chain_squares(dd, n_grid, cell_size, offset_x, offset_y, chain, 0, CYAN, WHITE, show_text=True, font_size=int(cell_size * 0.36))
    # Top-left badge with "H"
    badge_size = 96
    bd = ImageDraw.Draw(draw_layer)
    bd.ellipse([20, 20, 20 + badge_size, 20 + badge_size], fill=AMBER)
    bf = get_font(72, bold=True)
    bbox = bd.textbbox((0, 0), "H", font=bf)
    tw2 = bbox[2] - bbox[0]
    th2 = bbox[3] - bbox[1]
    bd.text((20 + (badge_size - tw2) / 2 - bbox[0], 20 + (badge_size - th2) / 2 - bbox[1]), "H", fill=BG_DARK, font=bf)
    img = Image.alpha_composite(img.convert("RGBA"), draw_layer).convert("RGB")
    # Save
    img.save(os.path.join(OUT_DIR, "icon.png"), "PNG", optimize=True)
    print(f"Saved {OUT_DIR}/icon.png ({size}x{size})")

def make_og():
    W, H = 1200, 630
    img = make_gradient((W, H), [
        (0, BG_DARK),
        (0.5, BG_MID),
        (1, BG_LIGHT)
    ])
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for r in range(280, 0, -2):
        a = int(15 * (1 - r / 280))
        od.ellipse([W/2 - r, H/2 - r, W/2 + r, H/2 + r], fill=(0, 200, 255, a))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(draw_layer)
    # Title "HIDATO"
    title_font = get_font(120, bold=True)
    title = "HIDATO"
    bbox = dd.textbbox((0, 0), title, font=title_font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (W - tw) / 2 - bbox[0]
    ty = 80 - bbox[1]
    # Drop shadow
    dd.text((tx + 4, ty + 4), title, fill=(0, 0, 0, 180), font=title_font)
    # Main title
    for offset in [(0, 0)]:
        # gradient text effect
        for c in [CYAN, (100, 230, 255), AMBER, GOLD]:
            pass
    # Just draw CYAN
    dd.text((tx, ty), title, fill=CYAN, font=title_font)
    # Subtitle
    sub_font = get_font(36, bold=False)
    sub = "Number Snake · Logic Puzzle"
    bbox = dd.textbbox((0, 0), sub, font=sub_font)
    tw2 = bbox[2] - bbox[0]
    dd.text(((W - tw2) / 2 - bbox[0], 230 - bbox[1]), sub, fill=WHITE, font=sub_font)
    # Chain grid below
    chain = [
        (0, 0), (0, 1), (1, 1), (1, 2), (0, 2),
        (0, 3), (1, 3), (2, 3), (2, 2), (3, 2),
        (3, 1), (4, 1), (4, 0), (3, 0), (2, 0),
        (2, 1), (1, 0), (4, 2), (4, 3), (4, 4),
        (3, 4), (2, 4), (1, 4), (0, 4), (3, 3),
    ]
    n_grid = 5
    cell_size = 60
    grid_w = cell_size * n_grid
    grid_h = cell_size * n_grid
    offset_x = (W - grid_w) / 2
    offset_y = 320
    draw_chain_squares(dd, n_grid, cell_size, offset_x, offset_y, chain, 0, CYAN, WHITE, show_text=True, font_size=int(cell_size * 0.36))
    # Brand mark
    bd_font = get_font(28, bold=True)
    brand = "GameZipper"
    bbox = dd.textbbox((0, 0), brand, font=bd_font)
    tw3 = bbox[2] - bbox[0]
    dd.text(((W - tw3) / 2 - bbox[0], H - 50 - bbox[1]), brand, fill=AMBER, font=bd_font)
    img = Image.alpha_composite(img.convert("RGBA"), draw_layer).convert("RGB")
    img.save(os.path.join(OUT_DIR, "og-image.png"), "PNG", optimize=True)
    print(f"Saved {OUT_DIR}/og-image.png ({W}x{H})")

if __name__ == "__main__":
    make_icon()
    make_og()
