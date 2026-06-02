#!/usr/bin/env python3
"""
Register Coin Merge Machine game in GameZipper site files.
"""
import re
import os

GZ_PATH = '/home/msdn/gamezipper.com'
os.chdir(GZ_PATH)

# ============================================================
# Step 1: Append to games-data.js
# ============================================================
games_data_path = os.path.join(GZ_PATH, 'js/games-data.js')

with open(games_data_path, 'r') as f:
    content = f.read()

# The new game entry to append (starts with comma since it comes after last entry)
new_entry = ',{name:"Coin Merge Machine",emoji:"🪙",cat:"arcade",tags:["Coin","Merge","Puzzle","Physics","Arcade","Casual","Brain","Drop","Browser","Free","HTML5"],url:"/coin-machine/",desc:"Drop coins into the machine and merge identical ones to create higher-value coins! Physics-based merge puzzle with 11 coin types from Copper to Legendary. Free online, no download!",isNew:true,status:"live"}'

# Find the closing bracket of the GAMES array and insert before it
if content.rstrip().endswith('}'):
    last_brace = content.rfind('}')
    if last_brace > 0:
        content = content[:last_brace] + new_entry + content[last_brace:]

with open(games_data_path, 'w') as f:
    f.write(content)

print(f"Step 1: Updated {games_data_path}")

with open(games_data_path, 'r') as f:
    cat_count = f.read().count('cat:')
print(f"  cat: count = {cat_count}")

# ============================================================
# Step 2: Update index.html ItemList
# ============================================================
index_path = os.path.join(GZ_PATH, 'index.html')

with open(index_path, 'r') as f:
    index_content = f.read()

# Add the new ListItem entry for Coin Merge Machine
new_listitem = ',{"@type": "ListItem", "position": 14, "name": "Coin Merge Machine", "url": "https://gamezipper.com/coin-machine/"}'

# Find the last ListItem (position 13: Chain Reaction) and add our new one after it
index_content = re.sub(
    r'(\{"@type": "ListItem", "position": 13, "name": "Chain Reaction", "url": "https://gamezipper\.com/chain-reaction/"\})',
    r'\1' + new_listitem,
    index_content
)

# Update numberOfItems
index_content = re.sub(r'"numberOfItems":13', '"numberOfItems":14', index_content)

# Update game count in meta descriptions (224+ -> 225+)
index_content = re.sub(r'224\+', '225+', index_content)

with open(index_path, 'w') as f:
    f.write(index_content)

print(f"Step 2: Updated {index_path}")

with open(index_path, 'r') as f:
    num_match = re.search(r'"numberOfItems":(\d+)', f.read())
    print(f"  numberOfItems = {num_match.group(1) if num_match else 'NOT FOUND'}")

# ============================================================
# Step 3: Update sitemap.html
# ============================================================
sitemap_html_path = os.path.join(GZ_PATH, 'sitemap.html')

with open(sitemap_html_path, 'r') as f:
    sitemap_html = f.read()

new_link = '<a href="https://gamezipper.com/coin-machine/">Coin Merge Machine</a>'
if new_link not in sitemap_html:
    sitemap_html = sitemap_html.rstrip() + '\n' + new_link + '\n'

with open(sitemap_html_path, 'w') as f:
    f.write(sitemap_html)

print(f"Step 3: Updated {sitemap_html_path}")

with open(sitemap_html_path, 'r') as f:
    sitemap_lines = len(f.readlines())
print(f"  sitemap.html lines = {sitemap_lines}")

# ============================================================
# Step 4: Update sitemap.xml
# ============================================================
sitemap_xml_path = os.path.join(GZ_PATH, 'sitemap.xml')

with open(sitemap_xml_path, 'r') as f:
    sitemap_xml = f.read()

new_url = '<url><loc>https://gamezipper.com/coin-machine/</loc><lastmod>2026-06-03</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>'
if 'coin-machine' not in sitemap_xml:
    sitemap_xml = sitemap_xml.replace('</urlset>', new_url + '\n</urlset>')

with open(sitemap_xml_path, 'w') as f:
    f.write(sitemap_xml)

print(f"Step 4: Updated {sitemap_xml_path}")

with open(sitemap_xml_path, 'r') as f:
    loc_count = f.read().count('<loc>')
print(f"  <loc> count = {loc_count}")

# ============================================================
# Step 5: Update game-footer.js recommendations
# ============================================================
footer_path = os.path.join(GZ_PATH, 'game-footer.js')

with open(footer_path, 'r') as f:
    footer_content = f.read()

coin_machine_entry = ",{n:'Coin Merge Machine',e:'🪙',u:'/coin-machine/',c:'arcade'}"

if "coin-machine" not in footer_content:
    last_bracket = footer_content.rfind(']')
    if last_bracket > 0:
        footer_content = footer_content[:last_bracket] + coin_machine_entry + footer_content[last_bracket:]

with open(footer_path, 'w') as f:
    f.write(footer_content)

print(f"Step 5: Updated {footer_path}")

# ============================================================
# Step 6: Git commit
# ============================================================
import subprocess

os.chdir(GZ_PATH)
subprocess.run(['git', 'add', '-A'], check=True)
result = subprocess.run(['git', 'commit', '-m', 'feat: add coin-machine — physics merge coin puzzle (S-grade)'], 
                       capture_output=True, text=True)
print(f"Step 6: Git commit")
print(f"  stdout: {result.stdout}")
print(f"  stderr: {result.stderr}")

hash_result = subprocess.run(['git', 'rev-parse', 'HEAD'], capture_output=True, text=True)
commit_hash = hash_result.stdout.strip()
print(f"  commit hash: {commit_hash}")

# ============================================================
# Step 7: Data consistency self-check
# ============================================================
print("\n=== DATA CONSISTENCY CHECK ===")

with open(games_data_path, 'r') as f:
    gd_cat_count = f.read().count('cat:')
print(f"games-data.js cat: count: {gd_cat_count}")

with open(index_path, 'r') as f:
    html_content = f.read()
    listitem_count = html_content.count('"@type":"ListItem"')
print(f"index.html ListItem count: {listitem_count}")

with open(sitemap_xml_path, 'r') as f:
    xml_content = f.read()
    loc_count = xml_content.count('<loc>')
print(f"sitemap.xml <loc> count: {loc_count}")

with open(sitemap_html_path, 'r') as f:
    sitemap_lines = len(f.readlines())
print(f"sitemap.html line count: {sitemap_lines}")

print(f"\nCommit hash: {commit_hash}")
print(f"Consistency: games-data.js={gd_cat_count}, index.html={listitem_count}, sitemap.xml={loc_count}, sitemap.html={sitemap_lines}")
