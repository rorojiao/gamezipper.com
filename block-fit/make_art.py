#!/usr/bin/env python3
"""Block Fit art generator.

Creates icon.png (512x512) and og-image.jpg (1200x630) using PIL.
"""
import os
from PIL import Image, ImageDraw, ImageFont

PIECE_COLORS = {
    'I': (100, 255, 218),  # cyan
    'O': (251, 146, 60),   # orange
    'T': (167, 139, 250),  # purple
    'L': (62, 224, 127),   # green
    'S': (255, 107, 157),  # pink
}

TETROMINOES = {
    'I': [(0,0),(1,0),(2,0),(3,0)],
    'O': [(0,0),(0,1),(1,0),(1,1)],
    'T': [(0,0),(0,1),(0,2),(1,1)],
    'L': [(0,0),(1,0),(2,0),(2,1)],
    'S': [(0,1),(0,2),(1,0),(1,1)],
}

# Icon pieces: 5 standard tetrominoes arranged in a compact grid
ICON_PIECES = [
    ('I', (0, 0)),    # top-left
    ('O', (0, 5)),    # top-right
    ('T', (5, 0)),    # middle-left
    ('L', (5, 5)),    # middle-right
    ('S', (10, 2)),   # bottom
]


def render_piece(draw, piece_name, top_row, left_col, cell_size, color, offset_x=0, offset_y=0):
    """Render a tetromino at the given grid position."""
    cells = TETROMINOES[piece_name]
    for (r, c) in cells:
        x = offset_x + (left_col + c) * cell_size
        y = offset_y + (top_row + r) * cell_size
        draw.rounded_rectangle(
            [x+1, y+1, x+cell_size-2, y+cell_size-2],
            radius=4, fill=color, outline=(0,0,0,200), width=1
        )
        # inner highlight
        draw.rounded_rectangle(
            [x+3, y+3, x+cell_size-5, y+cell_size-5],
            radius=2, fill=None, outline=(255,255,255,80), width=1
        )


def make_icon():
    """512x512 icon with 5 tetrominoes."""
    size = 512
    img = Image.new('RGB', (size, size), (10, 10, 24))
    draw = ImageDraw.Draw(img, 'RGBA')

    # Background gradient
    for y in range(size):
        ratio = y / size
        r = int(26 * (1 - ratio) + 6 * ratio)
        g = int(26 * (1 - ratio) + 6 * ratio)
        b = int(58 * (1 - ratio) + 15 * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b))

    # 5 tetrominoes arranged in 3x3 grid
    cell_size = 28
    grid_w = 14  # 4+1+1+1+1+1+4+1 = grid width in cells
    # Approx center placement
    cx = size // 2
    cy = size // 2
    start_x = cx - (grid_w * cell_size) // 2
    start_y = cy - (10 * cell_size) // 2  # I has 4 rows

    # Layout:
    # I (top-left), O (top-right)
    # T (mid-left), L (mid-right)
    # S (bottom)
    layout = [
        ('I', 0, 0),
        ('O', 0, 8),  # 4 cells wide each, with gap
        ('T', 5, 0),
        ('L', 5, 8),
        ('S', 10, 4),
    ]
    for (name, top, left) in layout:
        render_piece(draw, name, top, left, cell_size, PIECE_COLORS[name], start_x, start_y)

    # Title text at bottom
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
    except:
        font = ImageFont.load_default()
    title = "BLOCK FIT"
    bbox = draw.textbbox((0, 0), title, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((size - tw) // 2, size - 60), title, fill=(255, 184, 77), font=font)

    img.save('icon.png', 'PNG', optimize=True)
    print(f"Saved icon.png ({os.path.getsize('icon.png')} bytes)")


def make_og_image():
    """1200x630 OG image with tetrominoes showcase."""
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), (10, 10, 24))
    draw = ImageDraw.Draw(img, 'RGBA')

    # Background
    for y in range(H):
        ratio = y / H
        r = int(26 * (1 - ratio) + 6 * ratio)
        g = int(26 * (1 - ratio) + 6 * ratio)
        b = int(58 * (1 - ratio) + 15 * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # Big title
    try:
        font_big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 80)
        font_med = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 30)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except:
        font_big = font_med = font_small = ImageFont.load_default()

    title = "BLOCK FIT"
    bbox = draw.textbbox((0, 0), title, font=font_big)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, 50), title, fill=(255, 184, 77), font=font_big)

    subtitle = "Fit tetromino pieces into the outline"
    bbox = draw.textbbox((0, 0), subtitle, font=font_med)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, 145), subtitle, fill=(200, 200, 220), font=font_med)

    # Tetrominoes arrangement
    cell_size = 38
    layout = [
        ('I', 0, 0),
        ('O', 0, 8),
        ('T', 6, 0),
        ('L', 6, 8),
        ('S', 12, 4),
    ]
    grid_w = 14
    start_x = (W - grid_w * cell_size) // 2
    start_y = 240
    for (name, top, left) in layout:
        render_piece(draw, name, top, left, cell_size, PIECE_COLORS[name], start_x, start_y)

    # Bottom text
    info = "30 handcrafted puzzles · 5 difficulty tiers · Free online"
    bbox = draw.textbbox((0, 0), info, font=font_small)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, H - 70), info, fill=(150, 150, 180), font=font_small)

    # Save as JPEG
    rgb = Image.new('RGB', (W, H), (10, 10, 24))
    rgb.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
    rgb.save('og-image.jpg', 'JPEG', quality=85, optimize=True)
    print(f"Saved og-image.jpg ({os.path.getsize('og-image.jpg')} bytes)")


if __name__ == '__main__':
    make_icon()
    make_og_image()
