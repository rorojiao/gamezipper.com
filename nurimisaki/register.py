#!/usr/bin/env python3
"""Register Nurimisaki game into games-data.js, update index.html counts, 
update itemlist-schema.js, update sitemap.xml."""
import re, os

os.chdir('/home/msdn/gamezipper.com')

# === 1. Add to games-data.js ===
with open('js/games-data.js', 'r', encoding='utf-8', errors='surrogateescape') as f:
    data = f.read()

# Check not already registered
if 'nurimisaki' in data.lower():
    print('WARNING: nurimisaki already in games-data.js, skipping')
else:
    new_entry = ',{name:"Nurimisaki",emoji:"🗾",cat:"puzzle",tags:["nurimisaki","nurimisaki puzzle","cape painting puzzle","nikoli puzzle","shading logic puzzle","number visibility puzzle","grid puzzle","deduction puzzle","brain teaser","constraint puzzle","unique solution","connectivity puzzle","free browser game","html5","mobile game","no download"],url:"/nurimisaki/",desc:"Play Nurimisaki free online! A Nikoli-style cape painting logic puzzle where each numbered cell shows how many consecutive white cells are visible in a direction. Paint cells black or white to satisfy all clues while keeping whites connected. 30 unique-solution levels across 5 difficulty tiers from 5x5 Beginner to 9x9 Expert. Hints, star ratings, level select, keyboard support, ambient Web Audio music. No download, mobile-friendly!",isNew:true,status:"live"}'
    
    # Insert before the closing ];
    insert_pos = data.rfind('];')
    if insert_pos == -1:
        print('ERROR: Could not find ]; in games-data.js')
    else:
        data = data[:insert_pos] + new_entry + '\n' + data[insert_pos:]
        with open('js/games-data.js', 'w', encoding='utf-8', errors='surrogateescape') as f:
            f.write(data)
        print('Added nurimisaki to games-data.js')

# === 2. Update index.html counts ===
with open('index.html', 'r', encoding='utf-8', errors='surrogateescape') as f:
    html = f.read()

# Update all 596 -> 597 (total game count)
html = html.replace('596 Games', '597 Games')
html = html.replace('596+ free', '597+ free')
html = html.replace('596+ Games', '597+ Games')
html = html.replace('596+ free', '597+ free')
html = html.replace('data-count="596"', 'data-count="597"')
html = html.replace('596</span>', '597</span>')  # cat-count for All
html = html.replace('"596"', '"597"')  # any quoted
html = re.sub(r'(\b)596(\b)', r'\g<1>597\g<2>', html)  # catch remaining standalone 596

# Update puzzle category count: 508 -> 509
html = html.replace('Puzzle <span class="cat-count">508', 'Puzzle <span class="cat-count">509')
html = re.sub(r'(Filter puzzle games.*?cat-count">)508', r'\g<1>509', html)

with open('index.html', 'w', encoding='utf-8', errors='surrogateescape') as f:
    f.write(html)
print('Updated index.html counts: 596→597, puzzle 508→509')

# === 3. Rebuild itemlist-schema.js ===
os.system('node rebuild_schema.js 2>&1 || echo "schema rebuild may need manual check"')
print('Rebuilt itemlist-schema.js')

# === 4. Update sitemap.xml ===
with open('sitemap.xml', 'r', encoding='utf-8', errors='surrogateescape') as f:
    sitemap = f.read()

if '/nurimisaki/' not in sitemap:
    sitemap_entry = '''  <url>
    <loc>https://gamezipper.com/nurimisaki/</loc>
    <lastmod>2026-07-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>'''
    sitemap = sitemap.replace('</urlset>', sitemap_entry)
    with open('sitemap.xml', 'w', encoding='utf-8', errors='surrogateescape') as f:
        f.write(sitemap)
    print('Added nurimisaki to sitemap.xml')
else:
    print('nurimisaki already in sitemap.xml')

print('\n=== Registration complete ===')
