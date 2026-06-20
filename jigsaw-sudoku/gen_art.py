#!/usr/bin/env python3
"""Generate procedural icon.png and og-image.png for Jigsaw Sudoku."""
from PIL import Image, ImageDraw, ImageFont
import json, math

# Read level 1 for region pattern
with open('/home/msdn/gamezipper.com/jigsaw-sudoku/levels.json') as f:
    data = json.load(f)
lv = data['levels'][0]
N = lv['N']
regions = lv['regions']

# ---- Color palette ----
BG_DARK = (15, 23, 42)
BG_MID = (30, 41, 59)
SKY = (125, 211, 252)
SILVER = (203, 213, 225)
INK = (241, 245, 249)
REGION_COLORS = [
    (125, 211, 252, 50),   # sky
    (203, 213, 225, 40),   # silver
    (87, 227, 137, 40),    # green
    (255, 209, 102, 40),   # gold
    (255, 159, 67, 40),    # orange
    (84, 160, 255, 40),    # blue
]

# ---- ICON (512x512) ----
def make_icon():
    size = 512
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background rounded square
    margin = 20
    draw.rounded_rectangle([margin, margin, size-margin, size-margin], radius=60, fill=BG_DARK)
    
    # Draw mini jigsaw grid (6x6)
    grid_size = N
    avail = size - 2 * margin - 60
    cs = avail // grid_size
    gx = (size - cs * grid_size) // 2
    gy = (size - cs * grid_size) // 2
    
    # Region fills
    for r in range(grid_size):
        for c in range(grid_size):
            rid = regions[r * grid_size + c]
            x1 = gx + c * cs
            y1 = gy + r * cs
            color = REGION_COLORS[rid % len(REGION_COLORS)]
            draw.rectangle([x1+1, y1+1, x1+cs-1, y1+cs-1], fill=color)
    
    # Thin grid lines
    for i in range(grid_size + 1):
        x = gx + i * cs
        y = gy + i * cs
        draw.line([x, gy, x, gy + cs * grid_size], fill=(255,255,255,20), width=1)
        draw.line([gx, y, gx + cs * grid_size, y], fill=(255,255,255,20), width=1)
    
    # Thick region borders
    border_w = 4
    for r in range(grid_size):
        for c in range(grid_size):
            rid = regions[r * grid_size + c]
            x1 = gx + c * cs
            y1 = gy + r * cs
            # right border
            if c < grid_size - 1 and regions[r * grid_size + c + 1] != rid:
                draw.line([x1+cs, y1, x1+cs, y1+cs], fill=(255,255,255,180), width=border_w)
            # bottom border
            if r < grid_size - 1 and regions[(r+1) * grid_size + c] != rid:
                draw.line([x1, y1+cs, x1+cs, y1+cs], fill=(255,255,255,180), width=border_w)
    # outer border
    draw.rounded_rectangle([gx, gy, gx+cs*grid_size, gy+cs*grid_size], radius=4, outline=(255,255,255,200), width=border_w)
    
    # Draw a few sample digits
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", cs // 2)
    except:
        font = ImageFont.load_default()
    
    samples = {(0,0):'3', (1,1):'6', (2,3):'1', (4,2):'5', (3,4):'2', (5,5):'4'}
    for (r, c), d in samples.items():
        if r < grid_size and c < grid_size:
            x = gx + c * cs + cs // 2
            y = gy + r * cs + cs // 2
            bbox = draw.textbbox((0,0), d, font=font)
            tw, th = bbox[2]-bbox[0], bbox[3]-bbox[1]
            draw.text((x - tw//2, y - th//2 - 2), d, fill=INK, font=font)
    
    img.save('/home/msdn/gamezipper.com/jigsaw-sudoku/icon.png')
    print("icon.png saved (512x512)")

# ---- OG-IMAGE (1200x630) ----
def make_og_image():
    w, h = 1200, 630
    img = Image.new('RGBA', (w, h), BG_DARK)
    draw = ImageDraw.Draw(img)
    
    # Gradient background
    for y in range(h):
        t = y / h
        r = int(15 + (30 - 15) * t)
        g = int(23 + (41 - 23) * t)
        b = int(42 + (59 - 42) * t)
        draw.line([0, y, w, y], fill=(r, g, b))
    
    # Draw a larger jigsaw grid on the left
    grid_size = N
    cs = 60
    grid_px = cs * grid_size
    gx = 80
    gy = (h - grid_px) // 2
    
    for r in range(grid_size):
        for c in range(grid_size):
            rid = regions[r * grid_size + c]
            x1 = gx + c * cs
            y1 = gy + r * cs
            color = REGION_COLORS[rid % len(REGION_COLORS)]
            draw.rectangle([x1+1, y1+1, x1+cs-1, y1+cs-1], fill=color)
    
    for i in range(grid_size + 1):
        x = gx + i * cs
        y = gy + i * cs
        draw.line([x, gy, x, gy + grid_px], fill=(255,255,255,20), width=1)
        draw.line([gx, y, gx + grid_px, y], fill=(255,255,255,20), width=1)
    
    border_w = 5
    for r in range(grid_size):
        for c in range(grid_size):
            rid = regions[r * grid_size + c]
            x1 = gx + c * cs
            y1 = gy + r * cs
            if c < grid_size - 1 and regions[r * grid_size + c + 1] != rid:
                draw.line([x1+cs, y1, x1+cs, y1+cs], fill=(255,255,255,180), width=border_w)
            if r < grid_size - 1 and regions[(r+1) * grid_size + c] != rid:
                draw.line([x1, y1+cs, x1+cs, y1+cs], fill=(255,255,255,180), width=border_w)
    draw.rectangle([gx, gy, gx+grid_px, gy+grid_px], outline=(255,255,255,200), width=border_w)
    
    # Sample digits
    try:
        font_grid = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", cs // 2)
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 54)
        font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        font_brand = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
    except:
        font_grid = font_title = font_sub = font_brand = ImageFont.load_default()
    
    samples = {(0,0):'3', (1,1):'6', (2,3):'1', (4,2):'5', (3,4):'2', (5,5):'4'}
    for (r, c), d in samples.items():
        if r < grid_size and c < grid_size:
            x = gx + c * cs + cs // 2
            y = gy + r * cs + cs // 2
            bbox = draw.textbbox((0,0), d, font=font_grid)
            tw, th = bbox[2]-bbox[0], bbox[3]-bbox[1]
            draw.text((x - tw//2, y - th//2 - 2), d, fill=INK, font=font_grid)
    
    # Title text on the right
    tx = gx + grid_px + 60
    # Title
    title = "Jigsaw Sudoku"
    draw.text((tx, 160), title, fill=SKY, font=font_title)
    # Subtitle
    sub1 = "Irregular regions replace"
    sub2 = "standard 3x3 boxes"
    draw.text((tx, 240), sub1, fill=SILVER, font=font_sub)
    draw.text((tx, 275), sub2, fill=SILVER, font=font_sub)
    # Features
    feats = ["27 Unique Puzzles", "6 Tiers: Beginner to Master", "6x6 and 9x9 Grids", "Free & No Sign-up"]
    for i, f in enumerate(feats):
        draw.text((tx, 330 + i * 35), f"* {f}", fill=INK, font=font_sub)
    
    # Brand
    draw.text((tx, h - 50), "GameZipper.com", fill=SILVER, font=font_brand)
    
    img = img.convert('RGB')
    img.save('/home/msdn/gamezipper.com/jigsaw-sudoku/og-image.png', quality=95)
    print("og-image.png saved (1200x630)")

make_icon()
make_og_image()
print("Procedural art generation complete.")
