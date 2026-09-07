#!/usr/bin/env python3
"""Generate icon.png (512x512) and og-image.jpg (1200x630) for Number Maze."""
from PIL import Image, ImageDraw, ImageFont
import os
import math
import random

random.seed(42)
OUT_DIR = os.path.dirname(os.path.abspath(__file__))


def get_font(size):
    candidates = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, size)
            except Exception:
                pass
    return ImageFont.load_default()


def make_icon():
    size = 512
    img = Image.new('RGB', (size, size), (10, 20, 40))  # bg
    d = ImageDraw.Draw(img)

    # Mini maze 4x4 with checkpoints
    n = 4
    cell = 80
    pad = (size - n * cell) // 2
    # Maze walls (simplified - just outer + a few internal)
    walls = [
        [13, 3, 13, 3],  # row 0: N walls + internal
        [11, 12, 5, 2],
        [10, 9, 5, 6],
        [12, 4, 5, 7],
    ]
    checkpoints = [(0, 1), (0, 2), (0, 3), (1, 3)]
    solution_path = [(0, 1), (0, 2), (0, 3), (1, 3)]
    path_set = set(solution_path)

    # Draw cells
    for r in range(n):
        for c in range(n):
            x = pad + c * cell
            y = pad + r * cell
            color = (29, 49, 88) if (r, c) in path_set else (22, 38, 72)
            d.rectangle([x + 2, y + 2, x + cell - 2, y + cell - 2], fill=color)

    # Draw walls
    for r in range(n):
        for c in range(n):
            x = pad + c * cell
            y = pad + r * cell
            w = walls[r][c]
            wall_color = (13, 23, 48)
            wall_w = 6
            if w & 1: d.rectangle([x, y - 1, x + cell, y + wall_w], fill=wall_color)
            if w & 2: d.rectangle([x + cell - wall_w, y, x + cell, y + cell], fill=wall_color)
            if w & 4: d.rectangle([x, y + cell - wall_w, x + cell, y + cell], fill=wall_color)
            if w & 8: d.rectangle([x - 1, y, x + wall_w, y + cell], fill=wall_color)

    # Draw path as thick orange line
    for i in range(len(solution_path) - 1):
        r1, c1 = solution_path[i]
        r2, c2 = solution_path[i + 1]
        x1 = pad + c1 * cell + cell // 2
        y1 = pad + r1 * cell + cell // 2
        x2 = pad + c2 * cell + cell // 2
        y2 = pad + r2 * cell + cell // 2
        d.line([(x1, y1), (x2, y2)], fill=(255, 138, 101), width=12)

    # Draw checkpoints
    for i, (r, c) in enumerate(checkpoints):
        x = pad + c * cell + cell // 2
        y = pad + r * cell + cell // 2
        num = i + 1
        if i == len(checkpoints) - 1:
            # flag
            d.ellipse([x - 28, y - 28, x + 28, y + 28], fill=(255, 138, 101))
            d.ellipse([x - 22, y - 22, x + 22, y + 22], fill=(10, 20, 40))
            f = get_font(28)
            d.text((x, y), '🏁', fill=(255, 213, 79), anchor='mm', font=f)
        else:
            color = (100, 255, 218) if i < 3 else (255, 213, 79)
            d.ellipse([x - 28, y - 28, x + 28, y + 28], fill=color)
            d.ellipse([x - 22, y - 22, x + 22, y + 22], fill=(10, 20, 40))
            f = get_font(28)
            d.text((x, y), str(num), fill=(10, 20, 40), anchor='mm', font=f)

    img.save(os.path.join(OUT_DIR, 'icon.png'), 'PNG', optimize=True)
    print(f'  icon.png saved ({os.path.getsize(os.path.join(OUT_DIR, "icon.png"))} bytes)')


def make_og_image():
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), (10, 20, 40))
    d = ImageDraw.Draw(img)

    # Background gradient
    for y in range(H):
        c = int(10 + 20 * (y / H))
        d.line([(0, y), (W, y)], fill=(c, c * 2, c * 4))

    # Left: large mini maze (5x5)
    n = 5
    cell = 80
    maze_pad_x = 80
    maze_pad_y = (H - n * cell) // 2
    walls = [
        [13, 3, 13, 11, 12],
        [11, 12, 5, 10, 2],
        [10, 9, 5, 9, 6],
        [10, 9, 5, 9, 6],
        [12, 4, 5, 9, 7],
    ]
    # Just a sample
    checkpoints = [(2, 1), (2, 2), (2, 3), (2, 4)]
    solution_path = checkpoints

    for r in range(n):
        for c in range(n):
            x = maze_pad_x + c * cell
            y = maze_pad_y + r * cell
            d.rectangle([x + 2, y + 2, x + cell - 2, y + cell - 2], fill=(22, 38, 72))

    # Walls
    for r in range(n):
        for c in range(n):
            x = maze_pad_x + c * cell
            y = maze_pad_y + r * cell
            w = walls[r][c]
            wall_color = (13, 23, 48)
            ww = 5
            if w & 1: d.rectangle([x, y, x + cell, y + ww], fill=wall_color)
            if w & 2: d.rectangle([x + cell - ww, y, x + cell, y + cell], fill=wall_color)
            if w & 4: d.rectangle([x, y + cell - ww, x + cell, y + cell], fill=wall_color)
            if w & 8: d.rectangle([x, y, x + ww, y + cell], fill=wall_color)

    # Path
    for i in range(len(solution_path) - 1):
        r1, c1 = solution_path[i]
        r2, c2 = solution_path[i + 1]
        x1 = maze_pad_x + c1 * cell + cell // 2
        y1 = maze_pad_y + r1 * cell + cell // 2
        x2 = maze_pad_x + c2 * cell + cell // 2
        y2 = maze_pad_y + r2 * cell + cell // 2
        d.line([(x1, y1), (x2, y2)], fill=(255, 138, 101), width=14)

    # Checkpoints
    for i, (r, c) in enumerate(checkpoints):
        x = maze_pad_x + c * cell + cell // 2
        y = maze_pad_y + r * cell + cell // 2
        num = i + 1
        if i == len(checkpoints) - 1:
            d.ellipse([x - 30, y - 30, x + 30, y + 30], fill=(255, 138, 101))
            d.ellipse([x - 24, y - 24, x + 24, y + 24], fill=(10, 20, 40))
            f = get_font(36)
            d.text((x, y), '🏁', fill=(255, 213, 79), anchor='mm', font=f)
        else:
            color = (100, 255, 218) if i < 3 else (255, 213, 79)
            d.ellipse([x - 30, y - 30, x + 30, y + 30], fill=color)
            d.ellipse([x - 24, y - 24, x + 24, y + 24], fill=(10, 20, 40))
            f = get_font(32)
            d.text((x, y), str(num), fill=(10, 20, 40), anchor='mm', font=f)

    # Right: title + subtitle
    title_x = 580
    f_title = get_font(78)
    d.text((title_x, 200), 'NUMBER', fill=(255, 213, 79), anchor='lm', font=f_title)
    d.text((title_x, 290), 'MAZE', fill=(100, 255, 218), anchor='lm', font=f_title)

    f_sub = get_font(28)
    d.text((title_x, 360), 'Draw a path through the maze', fill=(228, 238, 248), anchor='lm', font=f_sub)
    d.text((title_x, 400), 'visiting checkpoints 1, 2, 3...', fill=(228, 238, 248), anchor='lm', font=f_sub)

    f_meta = get_font(22)
    d.text((title_x, 470), '30 hand-crafted puzzles', fill=(148, 163, 196), anchor='lm', font=f_meta)
    d.text((title_x, 500), '5 difficulty tiers', fill=(148, 163, 196), anchor='lm', font=f_meta)
    d.text((title_x, 530), 'Free online · No download', fill=(148, 163, 196), anchor='lm', font=f_meta)

    # Brand at bottom
    f_brand = get_font(20)
    d.text((W // 2, H - 30), 'GameZipper.com', fill=(100, 255, 218), anchor='mm', font=f_brand)

    img.save(os.path.join(OUT_DIR, 'og-image.jpg'), 'JPEG', quality=85, optimize=True)
    print(f'  og-image.jpg saved ({os.path.getsize(os.path.join(OUT_DIR, "og-image.jpg"))} bytes)')


if __name__ == '__main__':
    make_icon()
    make_og_image()
