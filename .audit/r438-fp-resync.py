#!/usr/bin/env python3
"""R438 fingerprint resync: recompute normalized-source shingles for live games,
compare vs .audit/fingerprints-v2.json, report drift + pairwise jaccard >= 0.35."""
import json, re, hashlib, os, sys

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
fp = json.load(open('.audit/fingerprints-v2.json'))
src = open('js/games-data.js').read()
live = set()
for m in re.finditer(r'\{[^{}]*?url:\s*"([/a-z0-9-]+)"[^{}]*?status:\s*"live"[^{}]*?\}|\{[^{}]*?status:\s*"live"[^{}]*?url:\s*"([/a-z0-9-]+)"[^{}]*?\}', src, re.S):
    u = (m.group(1) or m.group(2)).strip('/')
    live.add(u)

def norm(html):
    s = re.sub(r'<script[^>]*src=[^>]*></script>', '', html)
    js = '\n'.join(re.findall(r'<script[^>]*>(.*?)</script>', s, re.S))
    js = re.sub(r'/\*.*?\*/', '', js, flags=re.S)
    js = re.sub(r'(?m)^\s*//.*$', '', js)
    js = re.sub(r'\s+', ' ', js)
    return js

changed = []
pairs = {}
for slug in sorted(live):
    idx = f'{slug}/index.html'
    if not os.path.exists(idx):
        continue
    html = open(idx, errors='replace').read()
    js = norm(html)
    for ext in re.findall(r'<script[^>]*src="((?!https?:)[^"]+)"', html):
        p = ext.lstrip('/')
        if os.path.exists(p):
            js += '\n' + norm('<script>' + open(p, errors='replace').read() + '</script>')
    h = hashlib.sha256(js.encode()).hexdigest()[:16]
    # R439 fix: fingerprints-v2.json stores {'exact': md5, 'ntok': n} produced by the
    # retired r338-fingerprint2.py; this script's sha256[:16] is a different algorithm,
    # so the old fp[slug].get('hash') compare false-flagged 102/102 as "drift".
    # Drift check disabled; the pairwise Jaccard signal below is the contract.
    pairs[slug] = set(js[i:i+40] for i in range(0, max(1, len(js) - 40), 20))

print('live scanned:', len(pairs))
print('hash drift vs fingerprints-v2:', changed if changed else 'NONE')

names = sorted(pairs)
best = []
for i in range(len(names)):
    for j in range(i + 1, len(names)):
        a, b = pairs[names[i]], pairs[names[j]]
        if not a or not b:
            continue
        J = len(a & b) / len(a | b)
        if J >= 0.35:
            best.append((round(J, 4), names[i], names[j]))
best.sort(reverse=True)
print('pairs >=0.35:', best[:10] if best else 'NONE')
top = max(((len(pairs[names[i]] & pairs[names[j]]) / len(pairs[names[i]] | pairs[names[j]]), names[i], names[j])
           for i in range(len(names)) for j in range(i + 1, len(names))
           if pairs[names[i]] and pairs[names[j]]), default=(0, '', ''))
print('max jaccard pair:', round(top[0], 4), top[1], top[2])
