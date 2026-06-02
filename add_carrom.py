#!/usr/bin/env python3
"""Update all registration files for Carrom Board"""
import re

# === Step 1: Update games-data.js ===
gd_path = '/home/msdn/gamezipper.com/js/games-data.js'
with open(gd_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_entry = '''  {name:"Carrom Board",emoji:"🎯",cat:"puzzle",tags:["Board Game","Carrom","Disc","Classic","Strategy","Physics","Multiplayer","AI","Casual","Brain"],url:"/carrom/",desc:"Play Carrom Board free online! Classic tabletop disc-flicking game with realistic physics, AI opponent and local 2-player mode. 3 difficulty levels, 4 board themes, score tracking and statistics.",isNew:true,status:"live"},'''

pattern = r'(\n\];)'
match = re.search(pattern, content)
if match:
    insert_pos = match.start()
    content = content[:insert_pos] + ',\n' + new_entry + '\n' + content[insert_pos:]
    with open(gd_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Step 1: Added Carrom Board to {gd_path}")
else:
    print("ERROR: Could not find closing bracket of GAMES array")
    exit(1)

cat_count = content.count('cat:')
print(f"  Verification: cat: count = {cat_count} (expected 218)")

# === Step 2: Update index.html ===
idx_path = '/home/msdn/gamezipper.com/index.html'
with open(idx_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update ItemList
old_il = '"itemListElement":[{"@type":"ListItem","position":1,"name":"GameZipper Free Games Collection","url":"https://gamezipper.com/"},{"@type":"ListItem","position":2,"url":"https://gamezipper.com/number-nexus/","name":"Number Nexus"},{"@type":"ListItem","position":3,"url":"https://gamezipper.com/poly-art-3d/","name":"Poly Art 3D"},{"@type":"ListItem","position":5,"url":"https://gamezipper.com/ball-sort/","name":"Ball Sort Puzzle"},{"@type":"ListItem","position":6,"url":"https://gamezipper.com/traffic-escape/","name":"Traffic Escape"},{"@type":"ListItem","position":6,"url":"https://gamezipper.com/slice-master/","name":"Slice Master"},{"@type":"ListItem","position":7,"url":"https://gamezipper.com/magic-tiles/","name":"Magic Tiles"}]}'
new_il = '"itemListElement":[{"@type":"ListItem","position":1,"name":"GameZipper Free Games Collection","url":"https://gamezipper.com/"},{"@type":"ListItem","position":2,"url":"https://gamezipper.com/number-nexus/","name":"Number Nexus"},{"@type":"ListItem","position":3,"url":"https://gamezipper.com/poly-art-3d/","name":"Poly Art 3D"},{"@type":"ListItem","position":5,"url":"https://gamezipper.com/ball-sort/","name":"Ball Sort Puzzle"},{"@type":"ListItem","position":6,"url":"https://gamezipper.com/traffic-escape/","name":"Traffic Escape"},{"@type":"ListItem","position":6,"url":"https://gamezipper.com/slice-master/","name":"Slice Master"},{"@type":"ListItem","position":7,"url":"https://gamezipper.com/magic-tiles/","name":"Magic Tiles"},{"@type":"ListItem","position":8,"url":"https://gamezipper.com/carrom/","name":"Carrom Board"}]}'
content = content.replace(old_il, new_il)
content = content.replace('"numberOfItems":7', '"numberOfItems":8')
content = content.replace('218+ puzzle', '219+ puzzle')
content = content.replace('Play 218+ free', 'Play 219+ free')
content = content.replace('217+ Free Online Games', '218+ Free Online Games')
with open(idx_path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Step 2: Updated {idx_path}")

# === Step 3: Update sitemap.xml ===
sm_path = '/home/msdn/gamezipper.com/sitemap.xml'
with open(sm_path, 'r', encoding='utf-8') as f:
    content = f.read()

carrom_url = '  <url><loc>https://gamezipper.com/carrom/</loc></url>'
content = content.replace('</urlset>', carrom_url + '\n</urlset>')
with open(sm_path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Step 3: Updated {sm_path}")

print("All registration files updated!")
