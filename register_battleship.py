#!/usr/bin/env python3
import json, re, os

# Step 2: Add to games-data.js
game_entry = '{name:"Battleship",emoji:"🚢",cat:"puzzle",tags:["strategy","naval","board","classic","ai"],url:"/battleship/",desc:"Play Battleship online free! Classic naval strategy game with AI opponent. Place your fleet, aim, fire, and sink all enemy ships. No download required.",isNew:true,status:"live"},'
with open('/home/msdn/gamezipper.com/js/games-data.js', 'r') as f:
    content = f.read()
content = content.rstrip()
if content.endswith(','):
    content = content[:-1]
content += '\n' + game_entry + '\n'
with open('/home/msdn/gamezipper.com/js/games-data.js', 'w') as f:
    f.write(content)
print("Added to games-data.js")

# Step 3: Add to sitemap.xml
with open('/home/msdn/gamezipper.com/sitemap.xml', 'r') as f:
    content = f.read()
new_url = '  <url><loc>https://gamezipper.com/battleship/</loc></url>\n'
content = content.replace('</urlset>', new_url + '</urlset>')
with open('/home/msdn/gamezipper.com/sitemap.xml', 'w') as f:
    f.write(content)
print("Updated sitemap.xml")

# Step 4: Update index.html
game_name = "Battleship"
game_slug = "battleship"

with open('/home/msdn/gamezipper.com/index.html', 'r') as f:
    html = f.read()

# 1. Check if already in ItemList
if game_slug in html and 'ListItem' in html:
    # Already might be there, check by URL
    if f'https://gamezipper.com/{game_slug}/' in html:
        print("Already in index.html ItemList")
    else:
        # Add to ItemList
        pattern = r'(<script type="application/ld\+json">\{.*?"itemListElement":\[.*?)(\}</script>)'
        def add_item(m):
            block = m.group(1)
            inner = m.group(0)
            data = json.loads(re.search(r'\{.*\}', inner, re.DOTALL).group())
            pos = len(data['itemListElement']) + 1
            new_item = json.dumps({"@type":"ListItem","position":pos,"url":f"https://gamezipper.com/{game_slug}/","name":game_name}, separators=(',',':'))
            return block + ',' + new_item + m.group(2)
        html = re.sub(pattern, add_item, html, count=1, flags=re.DOTALL)
        print("Added to ItemList")
else:
    print("Index structure different than expected, skipping ItemList update")

# 2. Update numberOfItems
count = html.count('"@type":"ListItem"')
if count > 0:
    # Find and update numberOfItems
    old_count_match = re.search(r'"numberOfItems":(\d+)', html)
    if old_count_match:
        old_count = int(old_count_match.group(1))
        if old_count != count:
            html = html.replace(f'"numberOfItems":{old_count}', f'"numberOfItems":{count}')
            print(f"Updated numberOfItems: {old_count} -> {count}")
    
    # Update meta descriptions with game count
    html = re.sub(r'"description":"\d+ free browser', f'"description":"{count} free browser', html)
    html = re.sub(r'Play \d+ free online games', f'Play {count} free online games', html)
    print(f"Updated meta descriptions to {count} games")

with open('/home/msdn/gamezipper.com/index.html', 'w') as f:
    f.write(html)
print("index.html updated")

print("All registration steps complete!")
