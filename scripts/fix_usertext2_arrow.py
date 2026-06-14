#!/usr/bin/env python3
"""Fix ALL remaining user-visible 328 -> 329 in index.html (H1, share, search, badges).
Preserves position:328 in inline JSON-LD (love-balls)."""
with open('index.html', 'r') as f:
    h = f.read()
orig = h

# All distinct user-visible 328 patterns (NOT position:328)
subs = [
    ('Browse all 328 games', 'Browse all 329 games'),
    ('search 328 Games', 'search 329 Games'),         # placeholder + JS text
    ('Check out 328+ free browser games', 'Check out 329+ free browser games'),
    ('Free Online Games — 328 Games', 'Free Online Games — 329 Games'),  # title/H1
    ('328+ free online games', '329+ free online games'),
    ('328 Games — All free', '329 Games — All free'),
    # URL-encoded share links (328%2B = 328+, 328%20 = 328 space)
    ('328%2B+free+browser', '329%2B+free+browser'),
    ('328%2B+free+browser', '329%2B+free+browser'),  # in case duplicate variant
    ('328%20free%20browser', '329%20free%20browser'),
    ('328%2B%20free%20browser', '329%2B%20free%20browser'),
    ('GameZipper%20-%20328%2B', 'GameZipper%20-%20329%2B'),
    ('GameZipper+-+328%2B', 'GameZipper+-+329%2B'),
]
for old, new in subs:
    h = h.replace(old, new)

if h != orig:
    with open('index.html', 'w') as f:
        f.write(h)
    print("OK: replaced remaining user-visible 328 -> 329")
else:
    print("SKIP: no changes")

import re
remaining = [h[max(0,m.start()-20):m.start()+20] for m in re.finditer(r'328', h)
             if 'position":328' not in h[max(0,m.start()-15):m.start()+15]]
print("Remaining non-position 328:", len(remaining))
for r in remaining[:8]:
    print("  ...", r.replace('\n',' '), "...")
