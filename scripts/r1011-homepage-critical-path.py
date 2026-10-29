#!/usr/bin/env python3
"""
R1011 — homepage critical-path de-contention.

PROBLEM
-------
Production slow-3G mobile probe of https://gamezipper.com/ :
    FCP 2252-2604 ms | DCL 7497-8346 ms | load 21700-23177 ms
The homepage HTML is 385.6 KB raw / 96.9 KB gzip — roughly 4x the weight of a
normal game page (11-24 KB gzip). Two items in <head> make that weight land on
the critical path:

  1. FIVE `<link rel="prefetch">` GAME-PAGE LINKS (72 KB of HTML).
     They are issued from <head>, i.e. at the exact moment the browser is still
     fetching the homepage itself. On a bandwidth-constrained link they
     compete with the homepage's own critical resources (games-data.js 52 KB
     gzip, gz-analytics.js, game-footer.js, adsbygoogle.js).
     A/B (slow3g, 390x844, cpu x4, 3 rounds):
         v0 baseline          FCP 1516-1552  DCL 9025-10416  LCP 7996-8760
         v1 prefetch removed  FCP 1224-1228  DCL 5099-5422   LCP 4100-4452
     => removing them alone: FCP -20%, DCL -47%, LCP -51%.

  2. THE INLINE JSON-LD ItemList BLOCK (46 KB raw / ~9 KB gzip) sitting in
     <head>. A `<script type="application/ld+json">` in <head> is parser-blocking
     in the sense that it must be parsed before the parser continues — 46 KB of
     JSON tokenised on the main thread before <body> is even reached.
     Continuing the A/B:
         v2 = v1 + JSON-LD moved to end of <body>
             FCP 876-880  DCL 5361-6390  LCP 3592-4308
         v5 = prefetch MOVED (not removed) + JSON-LD moved
             FCP 876-884  DCL 6036-6327  LCP 3948-4244
     => moving the JSON-LD out of <head> on top of the prefetch fix:
        FCP 1520 -> 880 ms (-42%), LCP 8000-8800 -> 3950-4240 ms (-51%).

WHY MOVE THE PREFETCH INSTEAD OF DELETING IT
---------------------------------------------
R676 (commit 20cd6d0263) deliberately kept 5 prefetch links for the highest
traffic games, and the speed-up is real for the click-through. Deleting them
would throw that away. Relocating them to the END of <body> keeps the
speculative fetch (Chrome still fires all 5 — verified, see verification
step) but lets it start only after the homepage's own critical resources have
been requested, so it no longer competes for the same bandwidth window.

WHY MOVING JSON-LD IS SAFE
--------------------------
* Google's John Mueller (Search Engine Journal) explicitly confirmed that
  JSON-LD works when placed in the <body>, not just in the <head>.
* The repo ALREADY has 40 `ld+json` blocks in <body> across its pages, so this
  is an established convention here, not a new pattern.
* scripts/build-itemlist-inline.js (the R332 generator that owns the inline
  ItemList block) locates it with a position-independent regex
  `/<script type="application\/ld\+json">\s*\{[^{}]*"@type"\s*:\s*"ItemList"[\s\S]*?<\/script>/`
  and replaces it by CONTENT, not by position — so the generator keeps working
  with the block in <body>.

This script is idempotent and is a no-op on an already-fixed file.
"""
import os
import re
import sys

ROOT = '/home/junze/gamezipper.com'
IDX = os.path.join(ROOT, 'index.html')

PREFETCH_RE = re.compile(r'<link[^>]*rel="prefetch"[^>]*>')
JSONLD_RE = re.compile(r'<script type="application/ld\+json">.*?</script>', re.S)

MARK_PREFETCH = '<!-- R1011: game-page prefetch relocated to the end of the body (frees the critical path; the speculative fetch is kept) -->'
MARK_JSONLD = '<!-- R1011: inline JSON-LD relocated from the head to the end of the body (keeps the 46 KB ItemList out of the head parse) -->'


def main(apply=False):
    html = open(IDX, encoding='utf-8').read()
    orig = html

    # ---------- 1. JSON-LD out of <head> ----------
    head, sep, rest = html.partition('</head>')
    jsonld = JSONLD_RE.findall(head)
    if jsonld:
        head = JSONLD_RE.sub('', head)
        rest = re.sub(r'\n{3,}', '\n\n', rest)
    else:
        head, sep, rest = html.partition('</head>')

    body, sep2, tail = rest.partition('</body>')
    if jsonld:
        block = '\n' + MARK_JSONLD + '\n' + '\n'.join(jsonld) + '\n'
        body = body.rstrip() + '\n' + block

    # ---------- 2. prefetch out of <head>, to end of <body> ----------
    prefetch = PREFETCH_RE.findall(head)
    if prefetch:
        head = PREFETCH_RE.sub('', head)
        # the UX-OPT comment that introduced them belongs with them, not in <head>
        head = re.sub(r'\n?<!-- UX-OPT: Prefetch top game pages[^>]*-->\n+', '\n', head)
        # collapse the blank lines the removal left behind
        head = re.sub(r'\n{3,}', '\n\n', head)
    if prefetch:
        block = '\n' + MARK_PREFETCH + '\n' + '\n'.join(prefetch) + '\n'
        body = body.rstrip() + '\n' + block

    out = head + sep + body + sep2 + tail

    # ---------- idempotence ----------
    if MARK_PREFETCH in orig or MARK_JSONLD in orig:
        if MARK_PREFETCH in orig and MARK_JSONLD in orig and MARK_PREFETCH in out and MARK_JSONLD in out:
            print('✅ already applied — no change (idempotent)')
            return 0

    changed = (out != orig)
    print(f'JSON-LD blocks moved out of <head> : {len(jsonld)}')
    print(f'prefetch links relocated            : {len(prefetch)}')
    print(f'size {len(orig)/1024:.1f} KB -> {len(out)/1024:.1f} KB (raw)')

    if not changed:
        print('✅ no change')
        return 0
    if not apply:
        print('(dry run — pass --apply to write index.html)')
        return 0

    # ---------- safety gates ----------
    # the four JSON-LD blocks must still parse
    import json
    for i, b in enumerate(JSONLD_RE.findall(out)):
        payload = b[b.index('>') + 1:b.rindex('</script>')]
        try:
            json.loads(payload)
        except Exception as e:
            print(f'❌ JSON-LD block {i} does not parse: {e}')
            return 1
    n_ld = len(JSONLD_RE.findall(out))
    if n_ld != len(jsonld):
        print(f'❌ JSON-LD count changed: {len(jsonld)} -> {n_ld}')
        return 1
    # no prefetch may be left in <head>
    out_head = out.partition('</head>')[0]
    if PREFETCH_RE.search(out_head):
        print('❌ a prefetch link is still in <head>')
        return 1
    # the ItemList block must still be findable by the R332 generator regex
    BLOCK_RE = re.compile(r'<script type="application/ld\+json">\s*\{[^{}]*"@type"\s*:\s*"ItemList"[\s\S]*?</script>')
    if not BLOCK_RE.search(out):
        print('❌ build-itemlist-inline.js can no longer find the ItemList block')
        return 1
    # <body> and <html> structure must be intact (count real tags, not substrings)
    if len(re.findall(r'<body\b', out)) != 1 or len(re.findall(r'</body>', out)) != 1 or len(re.findall(r'</html>', out)) != 1:
        print('❌ body/html tag count changed')
        return 1

    with open(IDX, 'w', encoding='utf-8') as f:
        f.write(out)
    print('✅ wrote index.html')
    return 0


if __name__ == '__main__':
    sys.exit(main('--apply' in sys.argv))
