#!/usr/bin/env python3
"""R432 replacement for the lost r332-redirect-leak-detector.py + r332-internal-link-audit.py
(the .py originals were never committed — global *.py gitignore — and lived only on the
old junze machine). Checks:
 [a] homepage inline ItemList numberOfItems vs actual itemListElement count
 [b] game-footer.js related-games rail pointing at redirect slugs
 [c] live game pages linking to redirect slugs (excluding redirect pages themselves)
 [d] internal links across live pages resolving to 404 slugs (not in GAMES, not a redirect page, no dir on disk)
"""
import json, os, re, sys
ROOT = os.path.dirname(os.path.abspath(__file__)) or '.'
ROOT = os.getcwd()

src = open(os.path.join(ROOT, 'js/games-data.js')).read()
m = re.search(r'const\s+GAMES\s*=\s*(\[[\s\S]*?\]);?\s*$', src, re.M)
# crude entry extraction: url + status per object
entries = re.findall(r'\{name:.*?\}', src)
games = []
for e in entries:
    u = re.search(r'url:"([^"]+)"', e)
    s = re.search(r'status:"([^"]+)"', e)
    if u:
        games.append((u.group(1), s.group(1) if s else 'live'))
live = {u.strip('/') for u, s in games if s == 'live'}
allslugs = {u.strip('/') for u, s in games}

# redirect pages: dirs with index.html containing meta refresh/canonical to another game
redirects = set()
for d in sorted(os.listdir(ROOT)):
    idx = os.path.join(ROOT, d, 'index.html')
    if not os.path.isdir(os.path.join(ROOT, d)) or d.startswith('.') or d in ('js','css','assets','data','og-images','public','admin','api','tools','test-library','node_modules','scripts'):
        continue
    if not os.path.exists(idx):
        continue
    h = open(idx, errors='replace').read()
    if re.search(r'http-equiv="refresh"[^>]*url=https://gamezipper\.com/', h) and d not in live:
        redirects.add(d)

print(f'live games = {len(live)} | redirect pages on disk = {len(redirects)}')

# [a] homepage inline ItemList
home = open(os.path.join(ROOT, 'index.html'), errors='replace').read()
m = re.search(r'"numberOfItems":\s*(\d+)', home)
n_items = len(re.findall(r'"@type":"ListItem"', home))
print(f'\n[a] homepage inline ItemList: numberOfItems={m.group(1) if m else None}  actual itemListElement={n_items}  {"ok" if m and int(m.group(1))==n_items else "MISMATCH"}')

# [b] game-footer.js rail
gf = open(os.path.join(ROOT, 'game-footer.js'), errors='replace').read()
rail_hits = [s for s in redirects if f'/{s}/' in gf]
print(f'\n[b] game-footer.js related-games rail: {len(rail_hits)} entries point at redirect pages' + (f' {rail_hits}' if rail_hits else ''))

# [c] live pages linking to redirect slugs
leaks = {}
for slug in sorted(live):
    idx = os.path.join(ROOT, slug, 'index.html')
    if not os.path.exists(idx):
        continue
    h = open(idx, errors='replace').read()
    hits = [r for r in redirects if re.search(rf'(href|src|url=)="?(https://gamezipper\.com)?/?{re.escape(r)}/', h)]
    if hits:
        leaks[slug] = hits
print(f'\n[c] live-page links to redirect slugs: {len(leaks)}')
for k, v in list(leaks.items())[:10]:
    print(f'  {k} -> {v}')

# [d] internal links to dead slugs
dead = {}
for slug in sorted(live | redirects):
    idx = os.path.join(ROOT, slug, 'index.html')
    if not os.path.exists(idx):
        continue
    h = open(idx, errors='replace').read()
    for mm in re.finditer(r'href="(?:https://gamezipper\.com)?(/[a-z0-9-]+/)"', h):
        p = mm.group(1).strip('/')
        if p in ('', 'games', 'blog', 'about', 'contact', 'terms', 'privacy', 'cookie-policy', 'fun-web-games', 'tools'):
            continue
        if p not in allslugs and p not in redirects and not os.path.isdir(os.path.join(ROOT, p)):
            dead.setdefault(slug, set()).add(p)
print(f'\n[d] internal links to dead slugs: {len(dead)}')
for k, v in list(dead.items())[:10]:
    print(f'  {k} -> {sorted(v)}')

bad = (m and int(m.group(1)) != n_items) or rail_hits or leaks or dead
print('\n=== SUMMARY ===')
print(f'  homepage ItemList leaks : {0 if m and int(m.group(1))==n_items else 1}')
print(f'  footer rail leaks       : {len(rail_hits)}')
print(f'  redirect slugs linked   : {len(leaks)}')
print(f'  dead internal links     : {len(dead)}')
sys.exit(1 if bad else 0)
