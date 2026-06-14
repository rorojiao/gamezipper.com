#!/usr/bin/env python3
"""Fix user-visible 328 -> 329 in index.html (title, meta, og, twitter, noscript, h1).
Avoids touching the inline JSON-LD position:328 (love-balls)."""
with open('index.html', 'r') as f:
    h = f.read()
orig = h

# Targeted replacements (user-visible count contexts only)
replacements = [
    ('Play 328 free unblocked games', 'Play 329 free unblocked games'),
    ('Free Online Games 328', 'Free Online Games 329'),
    ('328 Free Online Browser Games', '329 Free Online Browser Games'),
    ('328 Free Online Games', '329 Free Online Games'),
    ('Play 328 Browser Games', 'Play 329 Browser Games'),
    ('GameZipper — 328 Free', 'GameZipper — 329 Free'),
    # H1 variants
    ('>328<', '>329<'),  # any >328< (h1/span text node)
]
for old, new in replacements:
    h = h.replace(old, new)

# meta description count
h = h.replace('content="Play 328 free unblocked games', 'content="Play 329 free unblocked games')

if h != orig:
    with open('index.html', 'w') as f:
        f.write(h)
    n = sum(1 for a,b in replacements if a in orig)
    print("OK index.html: replaced user-visible 328 -> 329")
else:
    print("SKIP: no changes")

# verify: count remaining standalone "328" that are NOT position:328 in JSON-LD
import re
remaining = []
for m in re.finditer(r'328', h):
    ctx = h[max(0,m.start()-25):m.start()+25]
    if 'position":328' not in ctx and 'position:328' not in ctx:
        remaining.append(ctx.replace('\n',' '))
print("Remaining 328 (non-position):", len(remaining))
for r in remaining[:5]:
    print("  ...", r, "...")
