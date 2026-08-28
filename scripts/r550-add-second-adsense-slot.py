#!/usr/bin/env python3
"""
R550 — 2nd AdSense slot (7373732357) on 6 zero-fill game pages.

BI signal (7d, 2026-08-28):
  - 7d totals: ~34288 gz_ad_event, ~8864 page_view (post-R443 ingest)
  - 7d SBF by zone: 109=1138, 737=1190 (gap narrowing per R549)
  - R548 picks (24h ago): slice-master/laser-maze/save-the-doge/hourglass-swap/gravity-flip/count-master
  - R549 picks (22h ago): jewel-crush/threes/traffic-escape/einstein-riddle/fillomino/tatamibari
  - R550 picks 6 NEW top-PV zero-fill pages NOT yet covered:

R550 picks (sorted by 7d PV desc, all 737=0):
  1. /cut-the-rope/        PV=24
  2. /go/                 PV=19
  3. /checkers/           PV=18
  4. /liquid-connect/     PV=10
  5. /merge-sweets/       PV=10
  6. /kitchen-rush/       PV=9

Total: 90 PV/7d (4-5x R549 baseline; high-traffic pages get faster fill).

Pattern (R549 sibling): parallel div after gz-ad-below-game close, R383 CLS-safe wrapper.
Idempotent: skips if 737 already present.

Run: python3 scripts/r550-add-second-adsense-slot.py
"""
import os
import re
import sys

PAGES = [
    "cut-the-rope/index.html",
    "go/index.html",
    "checkers/index.html",
    "liquid-connect/index.html",
    "merge-sweets/index.html",
    "kitchen-rush/index.html",
]
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

R550_INSERT = """<!-- ADS-OPT 2026-08-28 R550: 2nd AdSense slot (7373732357) on 6 zero-fill game pages (cut-the-rope/go/checkers/liquid-connect/merge-sweets/kitchen-rush). 7d PV: 24/19/18/10/10/9 = 90 total. 737 fills ~1.04x legacy 1099212472 (BI 7d 1190 vs 1138 SBF). Pattern: parallel div after gz-ad-below-game close, R383 CLS-safe wrapper. --><div id="gz-ad-r550" style="position:relative;min-height:100px;max-height:280px;margin:16px auto;max-width:728px;text-align:center;overflow:hidden;contain:layout paint style;color:#666;font-size:.7em;background:transparent;border-radius:6px;box-sizing:border-box;line-height:100px"><span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;font-weight:500;pointer-events:none;transition:opacity .15s ease">Sponsored &middot; Advertisement</span><ins class="adsbygoogle" style="position:absolute!important;top:0!important;left:0!important;width:100%!important;max-width:728px!important;height:100%!important;max-height:280px!important;margin:0 auto!important;text-align:center;display:block" data-ad-client="ca-pub-8346383990981353" data-ad-slot="7373732357" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>
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
            print(f"SKIP {rel_path}: 737 already present (idempotent R550)")
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
        new_content = content[:insert_at] + R550_INSERT + content[insert_at:]
        with open(fp, "w") as f:
            f.write(new_content)
        with open(fp) as f:
            verify = f.read()
        div_open = verify.count("<div")
        div_close = verify.count("</div>")
        has_737 = "7373732357" in verify
        has_marker = "gz-ad-r550" in verify
        ins_109_pos = verify.find("1099212472")
        r550_pos = verify.find("gz-ad-r550")
        order_ok = ins_109_pos > 0 and r550_pos > ins_109_pos
        ok = div_open == div_close and has_737 and has_marker and order_ok
        status = "OK" if ok else "FAIL"
        print(f"  {rel_path:<55} {status} div={div_open}/{div_close} 737={has_737} order={'OK' if order_ok else 'WRONG'}")
        if ok:
            inserted.append(rel_path)
        else:
            failed.append(rel_path)

    print()
    print(f"=== R550 summary: {len(inserted)} inserted, {len(skipped)} skipped, {len(failed)} failed ===")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
