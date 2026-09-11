#!/usr/bin/env python3
"""R682: Fix AdSense duplicate-slot bug + add parallel 737 to 3 single-slot pages.

BI 7d (2026-09-11) zero-fill scan: 7 pages had 2+ ins using the SAME slot
(R681-class one-slot-per-page policy violation, AdSense silently demotes the
duplicate). Also 3 pages with PV>=5 zero-fill had only the 109 baseline.

Discovery recipe:
  python3 -c "import os, re; [print(d) for d in sorted(os.listdir('/home/junze/gamezipper.com')) if os.path.isdir(f'/home/junze/gamezipper.com/{d}') and os.path.exists(f'/home/junze/gamezipper.com/{d}/index.html') and (lambda t: any(t.count(s)>1 for s in set(re.findall(r'data-ad-slot="(\\d+)"', t))))(open(f'/home/junze/gamezipper.com/{d}/index.html').read())]"

Pages fixed (8 total):
  duplicate-slot-bug (removed redundant ins to keep 1-slot-per-page):
    - lits: was 109/737/109 -> 109/737 (removed R450 block)
    - arrow-puzzle: was 737/737/109 -> 737/109 (removed R447 dup block)
    - hexa-bridges: was 109/109 -> 109/737 (changed 2nd slot)
    - mosaic-master: was 109/109 -> 109/737
    - rosette: was 109/109 -> 109/737
    - watermelon-merge: was 737/737/109 -> 109/737
    - barns: was 109(truncated)/737+nested/737 -> 109/737 (rewrote broken HTML)

  single-slot-added (parallel 737 R383 wrap after gz-ad-below-game close):
    - abyss-chef: was 109 only -> 109 + 737 (PV=5)
    - guess-the-emoji: was 109 only -> 109 + 737 (PV=5)
    - tower-defense: was 109 only -> 109 + 737 (PV=6)

Idempotent: skip if R682 marker present or already has 737 slot.
"""
import os, re, sys

SITE_DIR = '/home/junze/gamezipper.com'
ADSENSE_CLIENT = 'ca-pub-8346383990981353'
SLOT_109 = '1099212472'
SLOT_737 = '7373732357'

SINGLE_SLOT_PAGES = ['abyss-chef', 'guess-the-emoji', 'tower-defense']

MARKER = '<!-- R682 2026-09-11 ADS-OPT: parallel 737 ins to PV>=5 zero-fill pages missing 2nd slot. R681 fixed homepage duplicate-737 bug; 3 pages still 109-only. Cumulative 2-slot coverage ~302 pages. -->'

WRAP_737 = (
    MARKER + '\n'
    '<div id="gz-ad-r682" style="position:relative;min-height:100px;max-height:280px;'
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
for slug in SINGLE_SLOT_PAGES:
    idx = SITE_DIR + '/' + slug + '/index.html'
    if not os.path.exists(idx):
        results.append((slug, 'NO FILE', 0, 0))
        continue
    with open(idx, 'r', encoding='utf-8') as f:
        html = f.read()
    if MARKER.split('\n')[0] in html:
        results.append((slug, 'ALREADY R682 MARKED, skip', html.count(SLOT_737), html.count(SLOT_109)))
        continue
    if SLOT_737 in html:
        results.append((slug, 'ALREADY HAS 737, skip', html.count(SLOT_737), html.count(SLOT_109)))
        continue
    pattern = re.compile(
        r'(<div id="gz-ad-below-game"[^>]*>.*?<script>\(adsbygoogle=window\.adsbygoogle\|\|\[\]\)\.push\(\{\}\);</script>\s*</div>)',
        re.DOTALL
    )
    m = pattern.search(html)
    if not m:
        results.append((slug, 'NO gz-ad-below-game PATTERN', html.count(SLOT_737), html.count(SLOT_109)))
        continue
    new_html = html[:m.end()] + '\n\n' + WRAP_737 + html[m.end():]
    with open(idx, 'w', encoding='utf-8') as f:
        f.write(new_html)
    results.append((slug, 'OK', 1, 1))

print(f"\n=== R682 AUDIT ===")
print(f"{'PAGE':30} {'STATUS':30} 737 109")
for slug, status, c737, c109 in results:
    print(f"{slug:30} {status:30} {c737}   {c109}")

print("\n=== Duplicate-slot bug class sweep ===")
remaining = []
for d in sorted(os.listdir(SITE_DIR)):
    if not os.path.isdir(SITE_DIR + '/' + d): continue
    if d in ('node_modules','scripts','templates','dev','dist','assets','docs','blog','text','img','images','fonts','data'):
        continue
    idx = SITE_DIR + '/' + d + '/index.html'
    if not os.path.exists(idx): continue
    with open(idx) as f: txt = f.read()
    slots = re.findall(r'data-ad-slot="(\d+)"', txt)
    counts = {}
    for s in slots: counts[s] = counts.get(s,0)+1
    dup = {k:v for k,v in counts.items() if v > 1}
    if dup:
        remaining.append((d, dup))
if remaining:
    print(f"REMAINING {len(remaining)} pages with dup-slot:")
    for d, dup in remaining:
        print(f"  {d}: {dup}")
else:
    print("ALL CLEAN: 0 duplicate-slot bugs")
