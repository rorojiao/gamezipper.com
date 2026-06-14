#!/usr/bin/env python3
"""Drift repair for arrow-block-escape: sync itemlist-schema.js + index.html counts to GAMES=339."""
import re

NEW = 339
OLD = 338
PUZZLE_OLD = 254  # current puzzle count
PUZZLE_NEW = 255  # after adding arrow-block-escape

# ---------- 1. js/itemlist-schema.js ----------
with open('js/itemlist-schema.js', 'r') as f:
    s = f.read()

if 'arrow-block-escape' in s:
    print("SKIP itemlist-schema.js: arrow-block-escape already present")
else:
    # Find the last entry and add ours after it
    # The last entry should be chroma-zen or whatever is at position 338
    # Strategy: find the closing ] of itemListElement and insert before it
    # The structure ends with: ...,"name":"<Name>"}],"numberOfItems":N,...
    # Find position 338 entry (the last one)
    m = re.search(r'(\{"@type":"ListItem","position":338,"url":"[^"]+","name":"[^"]+"\})\]', s)
    if m:
        last_entry = m.group(1)
        new_entry = ',{"@type":"ListItem","position":339,"url":"https://gamezipper.com/arrow-block-escape/","name":"Arrow Block Escape"}]'
        s = s.replace(m.group(0), last_entry + new_entry, 1)
        print("Inserted arrow-block-escape at position 339")
    else:
        # Fallback: just append before the closing ]
        # Find the last } before ],"numberOfItems"
        m2 = re.search(r'\}(\],"numberOfItems")', s)
        if m2:
            insert_pos = m2.start(1)
            s = s[:insert_pos] + ',{"@type":"ListItem","position":339,"url":"https://gamezipper.com/arrow-block-escape/","name":"Arrow Block Escape"}' + s[insert_pos:]
            print("Inserted arrow-block-escape via fallback")
        else:
            print("ERROR: could not find insertion point in itemlist-schema.js")

    # Update numberOfItems
    s = re.sub(r'"numberOfItems":\d+', f'"numberOfItems":{NEW}', s)
    # Update description
    s = re.sub(r'"\d+ free browser games', f'"{NEW} free browser games', s)

    with open('js/itemlist-schema.js', 'w') as f:
        f.write(s)
    print(f"OK itemlist-schema.js: numberOfItems={NEW}")

# ---------- 2. index.html — update ALL count references ----------
with open('index.html', 'r') as f:
    h = f.read()

orig = h

# data-count (header + footer)
h = h.replace(f'data-count="{OLD}"', f'data-count="{NEW}"')

# Total cat-count
h = h.replace(f'class="cat-count">{OLD}', f'class="cat-count">{NEW}')

# Puzzle cat-count (254 -> 255)
h = h.replace(f'class="cat-count">{PUZZLE_OLD}', f'class="cat-count">{PUZZLE_NEW}')

# Inline JSON-LD numberOfItems (already set to 339 by our earlier edit, but fix description "340 free" -> "339 free")
h = h.replace(f'"numberOfItems":{NEW+1}', f'"numberOfItems":{NEW}')
h = re.sub(r'"\d+ free browser games you can play instantly', f'"{NEW} free browser games you can play instantly', h)

# All standalone "338" references in user-visible text → "339"
# Be careful: only replace standalone 338, not 3380 or similar
# Patterns to update: "338 free", "338 Games", "338 Browser", "338 games", "Play 338", "Games 338", "338 Free"
h = re.sub(r'\b338\b', str(NEW), h)

if h != orig:
    with open('index.html', 'w') as f:
        f.write(h)
    print(f"OK index.html: synced all counts to {NEW}")
else:
    print("SKIP index.html: no changes needed")

# ---------- verify ----------
with open('js/itemlist-schema.js') as f:
    sc = f.read()
print("\n=== VERIFY ===")
print("itemlist-schema arrow-block-escape:", 'arrow-block-escape' in sc)
print("itemlist-schema numberOfItems:", re.search(r'"numberOfItems":(\d+)', sc).group(1))

with open('index.html') as f:
    ih = f.read()
print("index.html data-count=339:", ih.count(f'data-count="{NEW}"'))
print("index.html cat-count>339:", ih.count(f'class="cat-count">{NEW}'))
print("index.html cat-count>255 (puzzle):", ih.count(f'class="cat-count">{PUZZLE_NEW}'))
print("index.html remaining '338':", len(re.findall(r'\b338\b', ih)))
print("index.html '339' occurrences:", len(re.findall(r'\b339\b', ih)))
