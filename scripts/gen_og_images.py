#!/usr/bin/env python3
"""
Generate OG images for games missing them.
Each OG image is 300x150 PNG with:
- Game emoji (large, centered)
- Game name (bold)
- Category badge
- GameZipper branding
"""
import os
import re
import sys
from PIL import Image, ImageDraw, ImageFont

OG_DIR = '/home/msdn/gamezipper.com/og-images'
GAMES_DATA_FILE = '/home/msdn/gamezipper.com/js/games-data.js'
FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_REGULAR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

# Color palettes per category
CATEGORY_COLORS = {
    'arcade': (255, 107, 107),     # Coral red
    'puzzle': (78, 205, 196),     # Teal
    'skill': (255, 193, 7),        # Amber
    'word': (102, 126, 234),       # Purple-blue
    'card': (56, 189, 126),        # Green
    'board': (139, 92, 246),       # Purple
    'strategy': (59, 130, 246),    # Blue
    'casual': (236, 72, 153),      # Pink
    'sports': (249, 115, 22),       # Orange
    'action': (239, 68, 68),       # Red
    'logic': (6, 182, 212),        # Cyan
    'default': (99, 102, 241),     # Indigo
}

def get_game_data():
    """Parse games from games-data.js"""
    with open(GAMES_DATA_FILE, 'r') as f:
        content = f.read()

    games = []
    # Extract game entries: {name:"...",emoji:"...",cat:"...",url:"...",desc:"...",isNew?:true,status?:"..."}
    # Find all game objects
    pattern = r'{name:"([^"]+)",emoji:"([^"]+)",cat:"([^"]+)",tags:\[([^\]]+)\],url:"([^"]+)",desc:"([^"]+)"'
    matches = re.findall(pattern, content)

    for match in matches:
        name, emoji, cat, tags, url, desc = match
        slug = url.strip('/').split('/')[-1]
        is_new = 'isNew' in content[content.find(f'name:"{name}"')-20:content.find(f'name:"{name}"')+50]
        games.append({
            'name': name,
            'emoji': emoji,
            'category': cat,
            'slug': slug,
            'desc': desc,
            'is_new': is_new,
        })
    return games

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def generate_og_image(game, output_path):
    """Generate a single OG image for a game"""
    W, H = 300, 150

    # Get category color
    cat_color = CATEGORY_COLORS.get(game['category'], CATEGORY_COLORS['default'])

    # Create gradient background
    img = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(img)

    # Gradient from cat_color (top) to darker shade (bottom)
    r, g, b = cat_color
    dark_r, dark_g, dark_b = max(0, r-60), max(0, g-60), max(0, b-60)

    for y in range(H):
        ratio = y / H
        color = (
            int(r - (r - dark_r) * ratio),
            int(g - (g - dark_g) * ratio),
            int(b - (b - dark_b) * ratio),
        )
        draw.line([(0, y), (W, y)], fill=color)

    # Add decorative circles
    draw.ellipse([W-60, -20, W+20, 60], fill=(r, g, b, 80))
    draw.ellipse([-20, H-60, 60, H+20], fill=(dark_r, dark_g, dark_b, 80))

    # Draw emoji (large, centered upper area)
    emoji_text = game['emoji']
    try:
        emoji_size = 50
        img_emoji = Image.new('RGBA', (emoji_size*4, emoji_size*4), (0,0,0,0))
        from PIL import ImageFont
        try:
            font_large = ImageFont.truetype('/usr/share/fonts/truetype/noto/NotoEmoji-Regular.ttf', emoji_size*2)
        except:
            font_large = ImageFont.truetype(FONT_BOLD, emoji_size*2)
    except:
        pass

    # Use default font for text
    try:
        font_bold = ImageFont.truetype(FONT_BOLD, 16)
        font_small = ImageFont.truetype(FONT_REGULAR, 11)
        font_emoji = ImageFont.truetype(FONT_BOLD, 50)
    except:
        font_bold = ImageFont.load_default()
        font_small = ImageFont.load_default()
        font_emoji = ImageFont.load_default()

    # Draw emoji centered
    bbox = draw.textbbox((0, 0), emoji_text, font=font_emoji)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (W - text_w) // 2
    y = 15
    draw.text((x, y), emoji_text, font=font_emoji, embedded_color=True)

    # Draw game name (centered)
    name_text = game['name']
    bbox = draw.textbbox((0, 0), name_text, font=font_bold)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (W - text_w) // 2
    y = 75
    # Text shadow
    draw.text((x+1, y+1), name_text, font=font_bold, fill=(0,0,0,180))
    draw.text((x, y), name_text, font=font_bold, fill=(255,255,255))

    # Draw category badge
    cat_text = game['category'].upper()
    bbox = draw.textbbox((0, 0), cat_text, font=font_small)
    cat_w = bbox[2] - bbox[0] + 10
    cat_h = bbox[3] - bbox[1] + 4
    cat_x = (W - cat_w) // 2
    cat_y = 100
    draw.rounded_rectangle([cat_x, cat_y, cat_x+cat_w, cat_y+cat_h], radius=4, fill=(255,255,255,200))
    bbox = draw.textbbox((0, 0), cat_text, font=font_small)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    draw.text((cat_x + (cat_w - text_w)//2, cat_y + 2), cat_text, font=font_small, fill=(50,50,50))

    # Draw GameZipper branding (bottom right)
    brand_text = 'GameZipper'
    bbox = draw.textbbox((0, 0), brand_text, font=font_small)
    text_w = bbox[2] - bbox[0]
    draw.text((W - text_w - 6, H - 14), brand_text, font=font_small, fill=(255,255,255,160))

    # Add "NEW" badge if isNew
    if game.get('is_new'):
        new_text = 'NEW'
        bbox = draw.textbbox((0, 0), new_text, font=font_small)
        nw = bbox[2] - bbox[0] + 6
        nh = bbox[3] - bbox[1] + 2
        draw.rounded_rectangle([3, 3, 3+nw, 3+nh], radius=3, fill=(255, 70, 70))
        bbox = draw.textbbox((0, 0), new_text, font=font_small)
        draw.text((5, 4), new_text, font=font_small, fill=(255,255,255))

    # Save
    img.save(output_path, 'PNG', optimize=True)
    return True

def main():
    games = get_game_data()
    missing = []
    existing = []

    for game in games:
        slug = game['slug']
        out_path = os.path.join(OG_DIR, f'{slug}.png')
        if os.path.exists(out_path):
            existing.append(slug)
        else:
            missing.append((game, out_path))

    print(f'Total games: {len(games)}')
    print(f'Existing OG images: {len(existing)}')
    print(f'Missing OG images: {len(missing)}')
    print()

    if not missing:
        print('All OG images are generated!')
        return

    generated = 0
    errors = []

    for game, out_path in missing:
        try:
            generate_og_image(game, out_path)
            generated += 1
            print(f'  ✓ {game["name"]} ({game["slug"]})')
        except Exception as e:
            errors.append((game['slug'], str(e)))
            print(f'  ✗ {game["name"]}: {e}')

    print(f'\nGenerated: {generated}/{len(missing)}')
    if errors:
        print(f'Errors: {len(errors)}')
        for slug, err in errors:
            print(f'  - {slug}: {err}')

if __name__ == '__main__':
    main()
