#!/usr/bin/env python3
"""R645: Add 2nd AdSense slot (7373732357) to 18 PV>=30 game pages with only 109 slot.

These pages were missed by R635 (PV>=5) and R644 (PV=5-9 cohort) sweeps because they
already had 109 but no 737 — single-slot pages still doing PV=30-47/7d.

Pages by 7d PV (descending):
  yajilin(47), helix-jump(43), sugar-sugar(42), zen-garden(41), star-battle(41),
  nurimeizu(40), hangman(40), tile-master(39), kenken(37), tetravex(34),
  100-doors(34), kojun(33), gear-chain(33), tower-of-hanoi(32), ring-toss(32),
  knit-off(32), futoshiki(32), block-out(30)
Cumulative 7d PV: 671 (vs R644's 30 PV/5d)

Idempotent: skip if 737 already present.
Reuses R644 regex-based insertion via R347+R383+R389+R384+R451+R642 parallel div template.
"""
import os, re, sys

SITE_DIR = '/home/junze/gamezipper.com'
ADSENSE_CLIENT = 'ca-pub-8346383990981353'
SLOT_109 = '1099212472'
SLOT_737 = '7373732357'

PAGES = [
    'yajilin', 'helix-jump', 'sugar-sugar', 'zen-garden', 'star-battle',
    'nurimeizu', 'hangman', 'tile-master', 'kenken', 'tetravex',
    '100-doors', 'kojun', 'gear-chain', 'tower-of-hanoi', 'ring-toss',
    'knit-off', 'futoshiki', 'block-out'
]

MARKER = '<!-- R645 2026-09-04 ADS-OPT: 2nd AdSense slot (7373732357) on 18 PV>=30 zero-fill game pages. BI 7d PV=30-47, only 109 baseline. Cumulative 671 PV/7d (22x R644 cohort). R347+R383+R389+R384+R451+R642+R644 template parallel 737 div. -->'

WRAP_737 = (
    '<div id="gz-ad-r645" style="position:relative;min-height:100px;max-height:280px;'
    'margin:16px auto;max-width:728px;text-align:center;overflow:hidden;'
    'contain:layout paint style;color:#666;font-size:.7em;background:transparent;'
    'border-radius:6px;box-sizing:border-box;line-height:100px">'
    '<span aria-hidden="true" style="position:absolute;top:50%;left:50%;'
    'transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;'
    'font-weight:500;pointer-events:none;transition:opacity .15s ease">'
    'Sponsored &middot; Advertisement</span>'
    '<ins class="adsbygoogle" style="position:absolute!important;top:0!important;'
    'left:0!important;width:100%!important;max-width:728px!important;height:100%!important;'
    'max-height:280px!important;margin:0 auto!important;text-align:center;display:block" '
    'data-ad-client="' + ADSENSE_CLIENT + '" data-ad-slot="' + SLOT_737 + '" '
    'data-ad-format="auto" data-full-width-responsive="true"></ins>'
    '<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>'
    '</div>'
)

results = []
for slug in PAGES:
    idx = SITE_DIR + '/' + slug + '/index.html'
    if not os.path.exists(idx):
        results.append((slug, 'NO FILE', 0, 0))
        continue
    with open(idx, 'r', encoding='utf-8') as f:
        html = f.read()
    orig = html
    if SLOT_737 in html:
        results.append((slug, 'ALREADY HAS 737, skip', html.count(SLOT_737), html.count(SLOT_109)))
        continue
    if SLOT_109 not in html:
        results.append((slug, 'NO 109 baseline, abort', 0, 0))
        continue
    pattern = re.compile(
        r'(<ins[^>]*data-ad-slot="' + SLOT_109 + r'"[^>]*></ins>\s*'
        r'<script>\(adsbygoogle[^<]*</script>\s*</div>)',
        re.MULTILINE
    )
    m = pattern.search(html)
    if not m:
        pattern2 = re.compile(
            r'(<ins[^>]*data-ad-slot="' + SLOT_109 + r'"[^>]*></ins>\s*'
            r'<script>\(adsbygoogle[^<]*</script>)\s*</div>',
            re.MULTILINE
        )
        m = pattern2.search(html)
    if not m:
        results.append((slug, 'COULD NOT MATCH 109-ins wrap close', 0, 0))
        continue
    insertion = '\n' + MARKER + '\n' + WRAP_737
    html = html[:m.end()] + insertion + html[m.end():]
    with open(idx, 'w', encoding='utf-8') as f:
        f.write(html)
    diff_open = html.count('<div') - orig.count('<div')
    diff_close = html.count('</div>') - orig.count('</div>')
    results.append((slug, 'PATCHED', html.count(SLOT_737), html.count(SLOT_109)))
    if diff_open != 1 or diff_close != 1:
        print(f'  WARN {slug}: div imbalance +{diff_open}/+{diff_close}')

print('--- R645 results ---')
for slug, status, n737, n109 in results:
    print(f'  {slug}: {status} | 737={n737} 109={n109}')

print()
print('--- div balance verification ---')
for slug in PAGES:
    idx = SITE_DIR + '/' + slug + '/index.html'
    with open(idx) as f:
        h = f.read()
    o = h.count('<div')
    c = h.count('</div>')
    flag = 'OK' if o == c else 'MISMATCH!'
    print(f'  {slug}: open={o} close={c} {flag}')
