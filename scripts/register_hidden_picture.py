#!/usr/bin/env python3
"""Hidden Picture Puzzle registration script — R72"""
import re
import os

BASE = "/home/msdn/gamezipper.com"
SLUG = "hidden-picture-puzzle"

# Step 1: Update games-data.js — append after Audio Rhythm Puzzle entry
gd_path = f"{BASE}/js/games-data.js"
with open(gd_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_entry = '''  {name:"Hidden Picture Puzzle",emoji:"🔍",cat:"puzzle",tags:["hidden object","find hidden","seek and find","spot hidden","hidden picture","puzzle","brain game","observation","mobile game","browser game","html5","free game","no download"],url:"/hidden-picture-puzzle/",desc:"Play Hidden Picture Puzzle free online! Find hidden objects across 30 procedurally-generated scenes in 5 difficulty tiers (Beginner to Master). Tap-to-find mechanic with 3-star ratings, hint system, daily streaks, and unique randomized scenes on every replay. No download, mobile-friendly!",isNew:true,status:"live"}'''

# Insert before final ]; closing
pattern = r'(\n\];)'
match = re.search(pattern, content)
if match:
    insert_pos = match.start()
    content = content[:insert_pos] + ',\n' + new_entry + '\n' + content[insert_pos:]
    with open(gd_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Step 1: Added Hidden Picture Puzzle to games-data.js")
else:
    print("❌ Could not find pattern in games-data.js")

cat_count = content.count('cat:')
print(f"  cat: count = {cat_count}")

# Step 2: Update js/itemlist-schema.js — append after Audio Rhythm Puzzle
il_path = f"{BASE}/js/itemlist-schema.js"
with open(il_path, 'r', encoding='utf-8') as f:
    il_content = f.read()

# Find the audio-rhythm-puzzle entry and append new entry after it
old_arp = '{"@type":"ListItem","position":577,"url":"https://gamezipper.com/audio-rhythm-puzzle/","name":"Audio Rhythm Puzzle"}'
new_with_hpp = old_arp + ',' + '{"@type":"ListItem","position":578,"url":"https://gamezipper.com/hidden-picture-puzzle/","name":"Hidden Picture Puzzle"}'

if old_arp in il_content:
    il_content = il_content.replace(old_arp, new_with_hpp)
    # Update numberOfItems
    il_content = il_content.replace('"numberOfItems":577', '"numberOfItems":578')
    with open(il_path, 'w', encoding='utf-8') as f:
        f.write(il_content)
    print(f"Step 2: Added Hidden Picture Puzzle to itemlist-schema.js (position 578)")
else:
    print("❌ Could not find audio-rhythm-puzzle entry in itemlist-schema.js")

# Step 3: Update index.html — find existing itemListElement and append
idx_path = f"{BASE}/index.html"
with open(idx_path, 'r', encoding='utf-8') as f:
    idx_content = f.read()

# Try to find itemListElement with audio-rhythm-puzzle
arp_html_pat = re.compile(r'(\{"@type":"ListItem","position":\d+,"url":"https://gamezipper\.com/audio-rhythm-puzzle/","name":"Audio Rhythm Puzzle"\})')
m = arp_html_pat.search(idx_content)
if m:
    new_item = ',{"@type":"ListItem","position":578,"url":"https://gamezipper.com/hidden-picture-puzzle/","name":"Hidden Picture Puzzle"}'
    idx_content = idx_content.replace(m.group(1), m.group(1) + new_item)
    # Update numberOfItems if present
    idx_content = re.sub(r'"numberOfItems":\d+', '"numberOfItems":578', idx_content, count=1)
    with open(idx_path, 'w', encoding='utf-8') as f:
        f.write(idx_content)
    print(f"Step 3: Updated index.html")
else:
    print("⚠ Could not find audio-rhythm-puzzle in index.html itemListElement (may not be present)")

# Step 4: Update sitemap.xml
sm_path = f"{BASE}/sitemap.xml"
with open(sm_path, 'r', encoding='utf-8') as f:
    sm_content = f.read()

hpp_url = '  <url><loc>https://gamezipper.com/hidden-picture-puzzle/</loc></url>'
if hpp_url not in sm_content:
    sm_content = sm_content.replace('</urlset>', hpp_url + '\n</urlset>')
    with open(sm_path, 'w', encoding='utf-8') as f:
        f.write(sm_content)
    print(f"Step 4: Updated sitemap.xml")
else:
    print(f"Step 4: sitemap.xml already has hidden-picture-puzzle")

# Step 5: Update about.html (if exists) with new game count
about_path = f"{BASE}/about.html"
if os.path.exists(about_path):
    with open(about_path, 'r', encoding='utf-8') as f:
        about_content = f.read()
    # If count exists, increment
    about_content = re.sub(r'(\d{3,})\s*(?:Free\s+)?(?:Browser\s+)?(?:Online\s+)?Games', lambda m: f'{int(m.group(1))+1} ' + m.group(0)[len(m.group(1)):], about_content)
    with open(about_path, 'w', encoding='utf-8') as f:
        f.write(about_content)
    print(f"Step 5: Updated about.html")

print("\n✅ Hidden Picture Puzzle registration complete")
print(f"   Catalog: 577 → 578")