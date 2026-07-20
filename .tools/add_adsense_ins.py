#!/usr/bin/env python3
"""
Add AdSense `<ins>` tag + adsbygoogle.js library to games that lack them.
Pattern (matches heyawake canonical template):

Head insertion (right after gz-analytics.js line):
  <script src="/gz-analytics.js?v=..." defer></script>
+ <!-- AdSense Auto Ads: 2026-06-20 page-level integration (mirrors tools.gamezipper.com) -->
+ <meta content="ca-pub-8346383990981353" name="google-adsense-platform-account">
+ <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8346383990981353" crossorigin="anonymous"></script>

Body insertion (right after gz-ad-below-game div):
+ <!-- AdSense display ad (moved from head to body) -->
+ <ins class="adsbygoogle" style="display:block;text-align:center;margin:16px auto;max-width:728px" data-ad-client="ca-pub-8346383990981353" data-ad-slot="1099212472" data-ad-format="auto" data-full-width-responsive="true"></ins>
+ <script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>

Idempotent: skips files that already contain <ins class="adsbygoogle".

Usage: python3 add_adsense_ins.py [game1] [game2] ...
       python3 add_adsense_ins.py --top  (use top-20 list from BI)
"""
import sys, re, json, os, glob
from pathlib import Path

ROOT = Path('/home/msdn/gamezipper.com')

# Top 20 missing-Adsense games (ordered by 7d PV — measured 2026-07-20)
TOP20 = [
    'akichiwake', 'anagram', 'renzoku', 'anemometer-wind-map', 'araf',
    'double-choco', 'armillary-align', 'chocona', 'bowling-master', 'codewords',
    'doppelblock', 'evolomino', 'hexxagon', 'laser-maze', 'balance-loop',
    'blob-pop', 'audio-rhythm-puzzle', 'toichika', 'treasure-dig', 'usotatami',
]

# Markers
HAS_INS = '<ins class="adsbygoogle"'
HAS_LIB = 'pagead2.googlesyndication.com'
# Anchor: gz-analytics.js script line — accept absolute / or relative ../ or no / prefix.
GZ_ANALYTICS_RE = re.compile(
    r'<script\s+src="(?:\.\./|\./|/)gz-analytics\.js(?:\?[^"]*)?"(?:\s+defer)?\s*></script>'
)
GZ_BELOW_RE = re.compile(r'<div\s+(?:id="gz-ad-below-game"[^>]*|class="gz-ad-below-game"\s+id="gz-ad-below-game")>')

# Templates
HEAD_BLOCK = (
    '\n<!-- AdSense Auto Ads: 2026-06-20 page-level integration (mirrors tools.gamezipper.com) -->'
    '\n<meta content="ca-pub-8346383990981353" name="google-adsense-platform-account">'
    '\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8346383990981353" crossorigin="anonymous"></script>'
)

BODY_BLOCK = (
    '\n<!-- AdSense display ad (moved from head to body) -->'
    '\n<ins class="adsbygoogle" style="display:block;text-align:center;margin:16px auto;max-width:728px" data-ad-client="ca-pub-8346383990981353" data-ad-slot="1099212472" data-ad-format="auto" data-full-width-responsive="true"></ins>'
    '\n<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>'
)

def needs_fix(content):
    return HAS_INS not in content or HAS_LIB not in content

def apply_fix(game):
    path = ROOT / game / 'index.html'
    if not path.exists():
        return 'missing', None, None
    content = path.read_text()
    original = content

    if HAS_INS in content and HAS_LIB in content:
        return 'already', None, None

    # Head insert: after gz-analytics.js script line
    m = GZ_ANALYTICS_RE.search(content)
    if not m:
        return 'no-analytics-anchor', None, None
    gz_line = m.group(0)
    new_head = gz_line + HEAD_BLOCK
    content = content.replace(gz_line, new_head, 1)

    # Body insert: after gz-ad-below-game div
    m2 = GZ_BELOW_RE.search(content)
    if not m2:
        return 'no-below-anchor', None, None
    below = m2.group(0)
    new_body = below + BODY_BLOCK
    content = content.replace(below, new_body, 1)

    if content == original:
        return 'no-change', None, None

    # Write back. Bump cache-bust on gz-analytics
    path.write_text(content)
    return 'fixed', original, content

def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--top':
        targets = TOP20
    else:
        targets = sys.argv[1:]
        if not targets:
            # default to TOP20
            targets = TOP20

    results = []
    for game in targets:
        status, old, new = apply_fix(game)
        results.append((game, status))

    fixed = sum(1 for _, s in results if s == 'fixed')
    skipped = sum(1 for _, s in results if s in ('already',))
    print(f"\n=== Results ===")
    for g, s in results:
        marker = '✅' if s == 'fixed' else ('⏭️' if s == 'already' else '⚠️')
        print(f"  {marker} {g:<25} {s}")
    print(f"\nFixed: {fixed} / Already-OK: {skipped}")

if __name__ == '__main__':
    main()
