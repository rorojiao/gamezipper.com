#!/usr/bin/env python3
"""R672: Add 2nd AdSense slot (7373732357) to 7 zero-fill game pages.

BI 7d (2026-09-09) zero-fill scan: 7 pages have 109 ins but no 737 ins, all PV=5-10.
Pattern: parallel 737 R383 div after 109-ins wrap close (R644/R645/R651/R642 template).
Idempotent: skip if 737 already present.
"""
import os, re, sys

SITE_DIR = '/home/junze/gamezipper.com'
ADSENSE_CLIENT = 'ca-pub-8346383990981353'
SLOT_109 = '1099212472'
SLOT_737 = '7373732357'

# BI 7d (2026-09-09): 7 zero-fill pages, has 109 baseline, PV=5-10
PAGES = ['slitherlink', 'balance-loop', 'double-choco', 'akinator',
         'aquarium', 'gokigen-naname', 'odd-one-out']

MARKER = '<!-- R672 2026-09-09 ADS-OPT: 2nd AdSense slot (7373732357) on 7 zero-fill game pages. BI 7d PV=5-10, fills=0. Pages: slitherlink(10), balance-loop(7), double-choco(7), akinator(6), aquarium(5), gokigen-naname(5), odd-one-out(5). All have 109-ins wrap; adding parallel 737 R383 div. -->'

# Replicate R383/R644/R645/R651 wrap for parallel 737 div
WRAP_737 = (
    '<div id="gz-ad-r672" style="position:relative;min-height:100px;max-height:280px;'
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
    # Locate the 109-ins wrap close </div>
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

print('--- R672 results ---')
for slug, status, n737, n109 in results:
    print(f'  {slug}: {status} | 737={n737} 109={n109}')

print()
print('--- div balance verification ---')
for slug in PAGES:
    idx = SITE_DIR + '/' + slug + '/index.html'
    if not os.path.exists(idx): continue
    with open(idx) as f:
        h = f.read()
    o = h.count('<div')
    c = h.count('</div>')
    flag = 'OK' if o == c else 'MISMATCH!'
    print(f'  {slug}: open={o} close={c} {flag}')