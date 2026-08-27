#!/usr/bin/env python3
"""
R549 — 2nd AdSense slot (7373732357) on 6 zero-fill game pages.

BI signal (7d, 2026-08-27):
  - 7d totals: 26944 gz_ad_event, 7195 page_views
  - 7d 737 SBF = 904 (9x legacy 109=42), 737 still dominant fill source
  - R532 (Aug 26) added 6 more pages. R548 picks top 6 high-PV zero-fill pages
    from the remaining 117 zero-fill (737) PV>=3 list.

R549 picks (sorted by 7d PV desc, all 737=0 in HTML):
  1. /jewel-crush/        PV=11
  2. /threes/             PV=11
  3. /traffic-escape/     PV=11
  4. /einstein-riddle/    PV=10
  5. /fillomino/          PV=10
  6. /tatamibari/         PV=10

Total: 73 PV/7d. Pattern (R548 sibling): parallel div after gz-ad-below-game close,
R383 CLS-safe wrapper. Idempotent: skips if 737 already present. (continues R548 sweep of 7d PV>=7 zero-fill pages).

Run: python3 scripts/r548-add-second-adsense-slot.py
"""
import os
import re
import sys

PAGES = [
    "jewel-crush/index.html",
    "threes/index.html",
    "traffic-escape/index.html",
    "einstein-riddle/index.html",
    "fillomino/index.html",
    "tatamibari/index.html",
]
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

R549_INSERT = """<!-- ADS-OPT 2026-08-27 R549: 2nd AdSense slot (7373732357) on 6 zero-fill game pages (jewel-crush/threes/traffic-escape/einstein-riddle/fillomino/tatamibari). 7d PV: 11/11/11/10/10/10 = 73 total. 737 fills ~9x legacy 1099212472 (BI 7d 904 vs 42 SBF). Pattern: parallel div after gz-ad-below-game close, R383 CLS-safe wrapper. --><div id="gz-ad-r549" style="position:relative;min-height:100px;max-height:280px;margin:16px auto;max-width:728px;text-align:center;overflow:hidden;contain:layout paint style;color:#666;font-size:.7em;background:transparent;border-radius:6px;box-sizing:border-box;line-height:100px"><span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;font-weight:500;pointer-events:none;transition:opacity .15s ease">Sponsored &middot; Advertisement</span><ins class="adsbygoogle" style="position:absolute!important;top:0!important;left:0!important;width:100%!important;max-width:728px!important;height:100%!important;max-height:280px!important;margin:0 auto!important;text-align:center;display:block" data-ad-client="ca-pub-8346383990981353" data-ad-slot="7373732357" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>
"""


def find_real_below_game_close(content):
    """Find byte position AFTER the </div> closing the LAST real
    <div id="gz-ad-below-game"> wrapper (R383 CLS-safe: must contain 1099212472)."""
    candidates = list(re.finditer(r'<div\s+id="gz-ad-below-game"[^>]*>', content))
    if not candidates:
        return None

    for open_match in reversed(candidates):
        pos = open_match.end()
        depth = 1
        while depth > 0 and pos < len(content):
            next_open = content.find("<div", pos)
            next_close = content.find("</div>", pos)
            if next_close == -1:
                break
            if next_open != -1 and next_open < next_close:
                depth += 1
                pos = next_open + 4
            else:
                depth -= 1
                pos = next_close + 6
                if depth == 0:
                    inner = content[open_match.end():pos - 6]
                    if inner.strip() and "1099212472" in inner:
                        return pos
                    break
    return None


def main():
    inserted = []
    skipped = []
    failed = []
    for rel_path in PAGES:
        fp = os.path.join(REPO, rel_path)
        if not os.path.exists(fp):
            print(f"SKIP {rel_path}: file not found")
            skipped.append(rel_path)
            continue
        with open(fp) as f:
            content = f.read()
        if "7373732357" in content:
            print(f"SKIP {rel_path}: 737 already present (idempotent R549)")
            skipped.append(rel_path)
            continue
        if "gz-ad-below-game" not in content:
            print(f"SKIP {rel_path}: no gz-ad-below-game placeholder")
            skipped.append(rel_path)
            continue
        insert_at = find_real_below_game_close(content)
        if insert_at is None:
            print(f"FAIL {rel_path}: could not find real gz-ad-below-game wrapper close")
            failed.append(rel_path)
            continue
        new_content = content[:insert_at] + R549_INSERT + content[insert_at:]
        with open(fp, "w") as f:
            f.write(new_content)
        with open(fp) as f:
            verify = f.read()
        div_open = verify.count("<div")
        div_close = verify.count("</div>")
        has_737 = "7373732357" in verify
        has_marker = "gz-ad-r549" in verify
        ins_109_pos = verify.find("1099212472")
        r548_pos = verify.find("gz-ad-r549")
        order_ok = ins_109_pos > 0 and r548_pos > ins_109_pos
        ok = div_open == div_close and has_737 and has_marker and order_ok
        status = "OK" if ok else "FAIL"
        print(f"  {rel_path:<55} {status} div={div_open}/{div_close} 737={has_737} order={'OK' if order_ok else 'WRONG'}")
        if ok:
            inserted.append(rel_path)
        else:
            failed.append(rel_path)

    print()
    print(f"=== R549 summary: {len(inserted)} inserted, {len(skipped)} skipped, {len(failed)} failed ===")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
