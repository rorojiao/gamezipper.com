#!/usr/bin/env python3
"""Deploy Arrow Puzzle: register in games-data.js, update index.html counts, sitemap.xml.
NO patch tool used on these files (per pipeline rules)."""
import json, re

GAME_NAME = "Arrow Puzzle"
GAME_SLUG = "arrow-puzzle"
GAME_EMOJI = "🧭"
GAME_DESC = "Play Arrow Puzzle free online! Tap a tile to spin it and its neighbors clockwise. Align every arrow UP to win across 30 brain-teasing levels. A neon logic puzzle. No download needed!"

# ---------- 1. games-data.js ----------
game_entry = '{name:"%s",emoji:"%s",cat:"puzzle",tags:["Puzzle","Arrow","Spin","Rotate","Logic","Brain","Grid","Lights Out","Casual","Free"],url:"/%s/",desc:"%s",isNew:true,status:"live"},' % (GAME_NAME, GAME_EMOJI, GAME_SLUG, GAME_DESC)

with open('js/games-data.js', 'r') as f:
    content = f.read()
# prevent duplicate
if 'url:"/%s/"' % GAME_SLUG in content:
    print("SKIP games-data.js: already present")
else:
    content = content.rstrip()
    if content.endswith(','):
        content = content[:-1]
    content += '\n' + game_entry + '\n'
    with open('js/games-data.js', 'w') as f:
        f.write(content)
    print("OK games-data.js: added", GAME_NAME)

# verify
with open('js/games-data.js') as f:
    gc = f.read()
cat_count = gc.count('cat:')
print("  cat: count now:", cat_count, "| arrow-puzzle present:", 'url:"/%s/"' % GAME_SLUG in gc)

# ---------- 2. index.html (ItemList + counts + meta) ----------
with open('index.html', 'r') as f:
    html = f.read()

if 'gamezipper.com/%s/' % GAME_SLUG in html:
    print("SKIP index.html: already present")
else:
    # 2a. Add ListItem to ItemList JSON-LD
    m = re.search(r'"itemListElement":\s*\[', html)
    if m:
        # find the closing of itemListElement array
        start = m.end()
        depth = 1; i = start
        while i < len(html) and depth > 0:
            if html[i] == '[': depth += 1
            elif html[i] == ']': depth -= 1
            i += 1
        arr_end = i - 1  # position of closing ]
        # count existing items
        existing = html[start:arr_end]
        pos = existing.count('"@type":"ListItem"') + 1
        new_item = json.dumps({"@type":"ListItem","position":pos,"url":"https://gamezipper.com/%s/" % GAME_SLUG,"name":GAME_NAME}, separators=(',',':'))
        # insert before closing bracket
        insert_at = arr_end
        # ensure comma separation
        before = html[:insert_at].rstrip()
        if before.endswith(']'):
            html = html[:insert_at] + ',' + new_item + html[insert_at:]
        else:
            html = html[:insert_at].rstrip().rstrip(',') + ',' + new_item + html[insert_at:]
        print("  ItemList: added position", pos)

    # 2b. Update numberOfItems + description counts
    count = html.count('"@type":"ListItem"')
    html = re.sub(r'"numberOfItems":\d+', '"numberOfItems":%d' % count, html)
    html = re.sub(r'"description":"\d+ free browser', '"description":"%d free browser' % count, html)
    # 2c. meta description counts
    html = re.sub(r'content="Play \d+ free online games', 'content="Play %d free online games' % count, html)
    html = re.sub(r'>Play \d+ free online games', '>%d free online games' % count, html)

    with open('index.html', 'w') as f:
        f.write(html)
    print("OK index.html: numberOfItems=", count)

# verify
with open('index.html') as f:
    h = f.read()
m = re.search(r'"numberOfItems":(\d+)', h)
print("  numberOfItems:", m.group(1) if m else "?", "| arrow-puzzle in html:", 'gamezipper.com/%s/' % GAME_SLUG in h)

# ---------- 3. sitemap.xml ----------
with open('sitemap.xml', 'r') as f:
    sitemap = f.read()
if 'gamezipper.com/%s/' % GAME_SLUG in sitemap:
    print("SKIP sitemap.xml: already present")
else:
    new_url = '  <url><loc>https://gamezipper.com/%s/</loc></url>\n' % GAME_SLUG
    sitemap = sitemap.replace('</urlset>', new_url + '</urlset>')
    with open('sitemap.xml', 'w') as f:
        f.write(sitemap)
    print("OK sitemap.xml: added", GAME_SLUG)

print("\n=== DEPLOY COMPLETE ===")
