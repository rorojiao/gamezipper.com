#!/usr/bin/env python3
"""R456 reconstruction of r338-fingerprint2.py (script lived on sibling host
/home/junze checkout, never committed here). Semantics per prior outputs:
- tokenize each live game's index.html game logic (strip HTML chrome, comments,
  whitespace), md5 'exact' hash + token count
- EXACT = identical normalized hash across games
- NEAR-IDENTICAL = 6-gram containment Jaccard >= 0.90
Baseline: .audit/fingerprints-v2.json (resynced R454). Reports drift vs baseline
and updates fingerprints-v2.json in place (preserving cat/name/tags fields).
"""
import re, json, hashlib, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

src = open('js/games-data.js').read()
# crude GAMES extraction
m = re.search(r'const GAMES\s*=\s*\[', src)
depth = 0; i = m.end()-1
for j in range(i, len(src)):
    if src[j] == '[': depth += 1
    elif src[j] == ']':
        depth -= 1
        if depth == 0: end = j; break
arr_txt = src[i:end+1]
GAMES = json.loads(re.sub(r'(?<!\\)"', lambda x: x.group(0), arr_txt.replace("'", '"'))
                   if False else arr_txt, object_hook=lambda d: d) if False else None
# safer: eval via node
import subprocess
node = """
const fs=require('fs');
const s=fs.readFileSync('js/games-data.js','utf8');
const t=s.replace(/^const\\s+(GAME_GRADIENTS|GAMES)\\s*=/gm,'var $1=');
const GAMES=new Function(t+'; return GAMES;')();
const live=GAMES.filter(g=>g.status==='live');
console.log(JSON.stringify(live.map(g=>({url:g.url,name:g.name,cat:g.cat,tags:g.tags}))));
"""
live = json.loads(subprocess.run(['node','-e',node], capture_output=True, text=True, cwd=ROOT).stdout)

def tokenize(html, slug):
    # extract inline scripts (game logic), strip comments/whitespace
    scripts = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.DOTALL)
    txt = '\n'.join(scripts)
    # include same-dir external game JS (camel-path/zebra-path etc. keep logic in game.js)
    for jsf in ('game.js', 'data.js'):
        p2 = os.path.join(slug, jsf)
        if os.path.exists(p2):
            txt += '\n' + open(p2, errors='replace').read()
    txt = re.sub(r'/\*.*?\*/', '', txt, flags=re.DOTALL)
    txt = re.sub(r'(?m)^\s*//.*$', '', txt)
    toks = re.findall(r'[A-Za-z_$][\w$]*|\d+|[^\s\w]', txt)
    return toks

fp_path = os.path.join('.audit', 'fingerprints-v2.json')
base = json.load(open(fp_path))
new = {}
pairs = []
slug_toks = {}
for g in live:
    slug = g['url'].strip('/')
    p = os.path.join(slug, 'index.html')
    if not os.path.exists(p):
        print('MISSING', slug); continue
    toks = tokenize(open(p, errors='replace').read(), slug)
    slug_toks[slug] = toks
    exact = hashlib.md5(' '.join(toks).encode()).hexdigest()
    prev = base.get(slug, {})
    drift = prev.get('exact') != exact
    new[slug] = {'exact': exact, 'ntok': len(toks), 'cat': g['cat'], 'name': g['name'], 'tags': g['tags']}
    if drift and prev:
        print(f"DRIFT {slug}: ntok {prev.get('ntok')} -> {len(toks)}")

# exact matches
from collections import defaultdict
byhash = defaultdict(list)
for s, v in new.items(): byhash[v['exact']].append(s)
exact_pairs = [tuple(x) for x in byhash.values() if len(x) > 1]

# 6-gram containment
grams = {}
for s, toks in slug_toks.items():
    if len(toks) < 6: continue
    grams[s] = set(tuple(toks[i:i+6]) for i in range(len(toks)-5))
near = []
slugs = sorted(grams)
for i in range(len(slugs)):
    for j in range(i+1, len(slugs)):
        a, b = grams[slugs[i]], grams[slugs[j]]
        inter = len(a & b)
        if inter == 0: continue
        cont = inter / min(len(a), len(b))
        jac = inter / len(a | b)
        if cont >= 0.90:
            near.append((jac, slugs[i], slugs[j], len(grams[slugs[i]]), len(grams[slugs[j]])))

print()
print('=== EXACT normalized full-logic match ===')
for a, b in exact_pairs: print(f'  {a} <-> {b}')
if not exact_pairs: print('  (none)')
print()
print('=== NEAR-IDENTICAL (6-gram containment >= 0.90) ===')
for jac, a, b, ga, gb in sorted(near, reverse=True):
    print(f'  J={jac:.4f}  {a} <-> {b}  ({new[a]["cat"]}/{new[b]["cat"]}, sig {ga}/{gb})')
if not near: print('  (none)')
print(f'live={len(live)} fingerprinted={len(new)}')

json.dump(new, open(fp_path, 'w'), indent=1)
print('fingerprints-v2.json updated (%d entries)' % len(new))
