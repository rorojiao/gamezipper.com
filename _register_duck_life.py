#!/usr/bin/env python3
"""Register Duck Life game in games-data.js, index.html, and sitemap.xml"""

import os

os.chdir('/home/msdn/gamezipper.com')

# 1. Update games-data.js - insert INSIDE the GAMES array
game_entry = '{name:"Duck Life",emoji:"🦆",cat:"puzzle",tags:["Training","Racing","Simulation","RPG","Pet","Casual"],url:"/duck-life/",desc:"Train your duck to run, swim, and fly! Level up stats through 3 mini-games, collect coins, buy accessories, and race against AI opponents across 4 worlds. Can you win the championship?",isNew:true,status:"live"},'

with open('js/games-data.js', 'r') as f:
    content = f.read()

# Check if already registered
if 'duck-life' in content:
    print("⚠️ Already in games-data.js, skipping")
else:
    # Find GAMES array and insert inside it
    games_start = content.find('const GAMES = [')
    if games_start == -1:
        print("❌ Could not find GAMES array")
        exit(1)
    
    # Find matching ]; by counting bracket depth
    depth = 0
    for i, ch in enumerate(content[games_start:]):
        if ch == '[':
            depth += 1
        elif ch == ']':
            depth -= 1
            if depth == 0:
                end_pos = games_start + i
                break
    
    # Find last entry before ];
    last_entry = content.rfind('},', games_start, end_pos)
    if last_entry == -1:
        last_entry = content.rfind('}', games_start, end_pos)
    
    # Insert after last entry
    insert_pos = last_entry + 1  # After the }
    content = content[:insert_pos] + ',\n  ' + game_entry + content[insert_pos:]
    
    with open('js/games-data.js', 'w') as f:
        f.write(content)
    print("✅ Added to games-data.js")

# Verify
import subprocess
result = subprocess.run(['node', '-c', 'js/games-data.js'], capture_output=True, text=True)
if result.returncode == 0:
    print("✅ games-data.js syntax OK")
else:
    print(f"❌ Syntax error: {result.stderr}")

# Check count
with open('js/games-data.js', 'r') as f:
    content = f.read()
count = content.count('cat:')
print(f"Total games in games-data.js: {count}")

# Verify duck-life appears exactly once
duck_count = content.count('duck-life')
print(f"duck-life entries: {duck_count}")

# 2. Update index.html - global replace of game count
with open('index.html', 'r') as f:
    html = f.read()

# Count current games in games-data.js
old_count = count - 1  # Before we added duck-life
new_count = count

# Replace all occurrences of old count number with new
# Use str.replace for the specific count strings
old_str = str(old_count)
new_str = str(new_count)

# We need to be careful - replace specific patterns
replacements = [
    (f'Play {old_count} free online games', f'Play {new_count} free online games'),
    (f'{old_count} free browser games', f'{new_count} free browser games'),
    (f'{old_count} Free Online Games', f'{new_count} Free Online Games'),
    (f'"{old_count} games"', f'"{new_count} games"'),
]

for old_pat, new_pat in replacements:
    if old_pat in html:
        html = html.replace(old_pat, new_pat)
        print(f"✅ Replaced: {old_pat[:40]}...")

# Also try global number replacement for remaining instances
# Only replace standalone numbers that are game counts
import re
# Replace in meta content and visible text
html = html.replace(f'>{old_count}<', f'>{new_count}<')  # Between tags
html = html.replace(f'{old_count} games', f'{new_count} games')

with open('index.html', 'w') as f:
    f.write(html)
print("✅ Updated index.html")

# Verify
with open('index.html', 'r') as f:
    html = f.read()
if 'duck-life' in html:
    print("⚠️ duck-life already in index.html")
else:
    print("✅ duck-life not in index.html (dynamic rendering)")

# 3. Update sitemap.xml
with open('sitemap.xml', 'r') as f:
    sitemap = f.read()

if 'duck-life' in sitemap:
    print("⚠️ duck-life already in sitemap.xml")
else:
    new_url = '  <url><loc>https://gamezipper.com/duck-life/</loc></url>\n'
    sitemap = sitemap.replace('</urlset>', new_url + '</urlset>')
    with open('sitemap.xml', 'w') as f:
        f.write(sitemap)
    print("✅ Updated sitemap.xml")

print("\n=== Registration Complete ===")
print(f"Game: Duck Life (duck-life)")
print(f"Total games: {new_count}")
