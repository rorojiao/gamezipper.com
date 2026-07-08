#!/usr/bin/env python3
"""Generate icon.png and og-image.jpg for Nurimisaki using PIL."""
from PIL import Image, ImageDraw, ImageFont
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# === ICON (512x512) ===
def make_icon():
    size = 512
    img = Image.new('RGBA', (size, size), (13, 17, 23, 255))
    draw = ImageDraw.Draw(img)
    
    # Background rounded rect
    draw.rounded_rectangle([20, 20, size-20, size-20], radius=40, fill=(26, 26, 46, 255))
    
    # 4x4 grid of cells showing puzzle state
    grid_size = 4
    cell = 80
    offset_x = (size - cell * grid_size) // 2
    offset_y = (size - cell * grid_size) // 2
    
    # Pattern: mix of white (cyan), black, empty, and numbered
    pattern = [
        [(0,217,255,255), (0,217,255,255), (10,14,22,255), (42,52,80,255)],
        [(0,217,255,255), (10,14,22,255), (0,217,255,255), (0,217,255,255)],
        [(10,14,22,255), (0,217,255,255), (0,217,255,255), (42,52,80,255)],
        [(0,217,255,255), (0,217,255,255), (42,52,80,255), (0,217,255,255)],
    ]
    
    for r in range(grid_size):
        for c in range(grid_size):
            x = offset_x + c * cell
            y = offset_y + r * cell
            color = pattern[r][c]
            draw.rounded_rectangle([x+4, y+4, x+cell-4, y+cell-4], radius=8, fill=color)
            # Grid border
            draw.rectangle([x+4, y+4, x+cell-4, y+cell-4], outline=(48, 54, 61, 200), width=2)
    
    # Add clue numbers on some cells
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
    except:
        font = ImageFont.load_default()
    
    clues = {(0,0): '3', (0,1): '2', (1,3): '3', (3,3): '2'}
    for (r, c), num in clues.items():
        x = offset_x + c * cell
        y = offset_y + r * cell
        # Dark text on cyan cells
        draw.text((x + cell//2, y + cell//2), num, fill=(26, 26, 46, 255), font=font, anchor='mm')
    
    img.save('icon.png')
    print('Saved icon.png (512x512)')

# === OG IMAGE (1200x630) ===
def make_og():
    w, h = 1200, 630
    img = Image.new('RGB', (w, h), (13, 17, 23))
    draw = ImageDraw.Draw(img)
    
    # Gradient background
    for y in range(h):
        ratio = y / h
        r = int(13 + (0 - 13) * ratio * 0.3)
        g = int(17 + (153 - 17) * ratio * 0.2)
        b = int(23 + (204 - 23) * ratio * 0.3)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    
    # Title
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
        sub_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except:
        title_font = ImageFont.load_default()
        sub_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Title
    draw.text((w//2, 100), 'Nurimisaki', fill=(0, 217, 255), font=title_font, anchor='mm')
    draw.text((w//2, 170), 'Cape Painting Logic Puzzle', fill=(230, 237, 243), font=sub_font, anchor='mm')
    
    # Mini puzzle grid on left side
    grid_size = 5
    cell = 70
    gx = 80
    gy = 260
    
    pattern = [
        [(0,217,255), (0,217,255), (10,14,22), (42,52,80), (0,217,255)],
        [(0,217,255), (10,14,22), (0,217,255), (0,217,255), (0,217,255)],
        [(10,14,22), (0,217,255), (0,217,255), (42,52,80), (10,14,22)],
        [(0,217,255), (0,217,255), (42,52,80), (0,217,255), (0,217,255)],
        [(42,52,80), (0,217,255), (0,217,255), (0,217,255), (10,14,22)],
    ]
    
    for r in range(grid_size):
        for c in range(grid_size):
            x = gx + c * cell
            y = gy + r * cell
            draw.rounded_rectangle([x+3, y+3, x+cell-3, y+cell-3], radius=6, fill=pattern[r][c])
    
    # Clue numbers
    try:
        num_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
    except:
        num_font = ImageFont.load_default()
    
    clues = {(0,0): '3', (1,2): '2', (2,1): '4', (3,3): '3', (4,2): '2'}
    for (r, c), num in clues.items():
        x = gx + c * cell
        y = gy + r * cell
        draw.text((x + cell//2, y + cell//2), num, fill=(26, 26, 46), font=num_font, anchor='mm')
    
    # Feature list on right
    features = ['🎯 30 Levels', '📱 Mobile Friendly', '🎵 Procedural Music', '💡 Smart Hints', '⭐ Star Ratings']
    fy = 260
    for feat in features:
        draw.text((560, fy), feat, fill=(230, 237, 243), font=sub_font, anchor='lm')
        fy += 55
    
    # Bottom tagline
    draw.text((w//2, h - 50), 'Play FREE at GameZipper.com', fill=(255, 215, 0), font=small_font, anchor='mm')
    
    img.save('og-image.jpg', quality=90)
    print('Saved og-image.jpg (1200x630)')

make_icon()
make_og()
print('Art generation complete!')
