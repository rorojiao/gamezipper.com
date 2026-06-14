#!/usr/bin/env python3
"""Full drift repair: sync itemlist-schema.js + index.html counts to GAMES=329."""
import re

NEW = 329
OLD = 328

# ---------- 1. js/itemlist-schema.js ----------
with open('js/itemlist-schema.js', 'r') as f:
    s = f.read()
if 'arrow-puzzle' in s:
    print("SKIP itemlist-schema.js: arrow-puzzle already present")
else:
    # Insert arrow-puzzle before the closing ] of itemListElement, fix numberOfItems + description
    old_tail = '"name":"Love Balls"}],"numberOfItems":%d,"description":"%d free browser games you can play instantly"};' % (OLD, OLD)
    new_tail = ('"name":"Love Balls"},'
                '{"@type":"ListItem","position":%d,"url":"https://gamezipper.com/arrow-puzzle/","name":"Arrow Puzzle"}]'
                ',"numberOfItems":%d,"description":"%d free browser games you can play instantly"};'
                % (NEW, NEW, NEW))
    if old_tail in s:
        s = s.replace(old_tail, new_tail)
        with open('js/itemlist-schema.js', 'w') as f:
            f.write(s)
        print("OK itemlist-schema.js: added arrow-puzzle, numberOfItems=%d" % NEW)
    else:
        print("ERROR: could not find expected tail in itemlist-schema.js")
        # fallback: regex
        s = re.sub(r'\{"@type":"ListItem","position":328,"url":"[^"]*love-balls/","name":"Love Balls"\}\]',
                   '{"@type":"ListItem","position":328,"url":"https://gamezipper.com/love-balls/","name":"Love Balls"},{"@type":"ListItem","position":329,"url":"https://gamezipper.com/arrow-puzzle/","name":"Arrow Puzzle"}]', s)
        s = re.sub(r'"numberOfItems":328', '"numberOfItems":329', s)
        s = re.sub(r'"description":"328 free browser', '"description":"329 free browser', s)
        with open('js/itemlist-schema.js', 'w') as f:
            f.write(s)
        print("OK itemlist-schema.js: fixed via regex fallback")

# ---------- 2. index.html ----------
with open('index.html', 'r') as f:
    h = f.read()

orig = h
# data-count (header + footer)
h = h.replace('data-count="328"', 'data-count="329"')
# total cat-count 328 -> 329 (the span showing total games)
h = h.replace('class="cat-count">328', 'class="cat-count">329')
# puzzle cat-count 244 -> 245
h = h.replace('class="cat-count">244', 'class="cat-count">245')
# inline JSON-LD numberOfItems 330 -> 329 (my earlier deploy set it to 330 erroneously)
h = h.replace('"numberOfItems":330', '"numberOfItems":329')
# inline description "330 free" -> "329 free"
h = h.replace('"description":"330 free browser', '"description":"329 free browser')
# any remaining "328 free" -> "329 free" in meta/og
h = h.replace('"328 free browser games', '"329 free browser games')

if h != orig:
    with open('index.html', 'w') as f:
        f.write(h)
    print("OK index.html: synced counts to %d" % NEW)
else:
    print("SKIP index.html: no changes needed")

# ---------- verify ----------
with open('js/itemlist-schema.js') as f:
    sc = f.read()
print("\n=== VERIFY ===")
print("itemlist-schema arrow-puzzle:", 'arrow-puzzle' in sc, "| numberOfItems:", re.search(r'"numberOfItems":(\d+)', sc).group(1))
with open('index.html') as f:
    ih = f.read()
print("index.html data-count=329 count:", ih.count('data-count="329"'))
print("index.html cat-count>329:", ih.count('class="cat-count">329'))
print("index.html cat-count>245:", ih.count('class="cat-count">245'))
print("index.html inline numberOfItems=329:", ih.count('"numberOfItems":329'))
print("index.html inline numberOfItems=330 (should be 0):", ih.count('"numberOfItems":330'))
