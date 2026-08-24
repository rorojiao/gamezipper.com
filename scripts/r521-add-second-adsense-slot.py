#!/usr/bin/env python3
"""
R521 — 2nd AdSense slot (7373732357) on 3 high-traffic zero-fill game pages
missing 737 slot entirely (count-master, cryptograms, traffic-escape).

BI signal (7d, post-R520 deploy 2026-08-23):
  - 7373732357 static_banner_fill: 1076 events (~150/day, +87% vs pre-R516 baseline 80/day)
  - 1099212472 static_banner_fill: 95 events (~13/day, 9x lower than 737)
  - 13 high-traffic (PV>=10/7d) zero-fill game pages remain; 10 already have 737 in HTML
    (R519/R520 covered), 3 still missing it.

Pattern (R520/R521 sibling): parallel <div id="gz-ad-r521"> wrapper inserted
AFTER <div id="gz-ad-below-game"> close (the LAST/real wrapper, not empty
placeholder <div id="gz-ad-below-game"></div>), R383 CLS-safe wrapper
(position:relative + contain:layout paint style + overflow:hidden + max-height:280px).

Run: python3 scripts/r521-add-second-adsense-slot.py
"""
import os
import re
import sys

GAMES = ["count-master", "cryptograms", "traffic-escape"]
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

R521_INSERT = """<!-- ADS-OPT 2026-08-24 R521: 2nd AdSense slot (7373732357) on remaining 3 high-traffic zero-fill game pages missing 737 slot (count-master/cryptograms/traffic-escape, PV 11-12/7d). R520 covered 18 PV>=5 pages; this batch fills the 3 remaining zero-fill games with HTML 737 not present. 7373732357 fills ~9x legacy 1099212472 (BI 7d: 1076 vs 95 SBF; 24h peak 180/day vs 9.5/day legacy). Pattern: parallel div after gz-ad-below-game close, R383 CLS-safe wrapper. -->
<div id="gz-ad-r521" style="position:relative;min-height:100px;max-height:280px;margin:16px auto;max-width:728px;text-align:center;overflow:hidden;contain:layout paint style;color:#666;font-size:.7em;background:transparent;border-radius:6px;box-sizing:border-box;line-height:100px"><span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;font-weight:500;pointer-events:none;transition:opacity .15s ease">Sponsored &middot; Advertisement</span><ins class="adsbygoogle" style="position:absolute!important;top:0!important;left:0!important;width:100%!important;max-width:728px!important;height:100%!important;max-height:280px!important;margin:0 auto!important;text-align:center;display:block" data-ad-client="ca-pub-8346383990981353" data-ad-slot="7373732357" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>
"""


def find_real_below_game_close(content):
    """Find the byte position AFTER the </div> that closes the LAST
    <div id="gz-ad-below-game" wrapper that has style/attrs and content.

    Skips empty placeholder <div id="gz-ad-below-game"></div> which is a
    no-op marker used by monetag-manager.js to inject banners later.
    """
    # Find all <div id="gz-ad-below-game"...> candidates
    candidates = list(re.finditer(r'<div\s+id="gz-ad-below-game"[^>]*>', content))
    if not candidates:
        return None

    # Find the LAST non-empty wrapper
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
                    # Check if this wrapper has actual content (not empty placeholder)
                    inner = content[open_match.end():pos - 6]
                    if inner.strip() and "1099212472" in inner:
                        return pos
                    break

    return None


def main():
    for game in GAMES:
        fp = os.path.join(REPO, game, "index.html")
        if not os.path.exists(fp):
            print(f"SKIP {game}: file not found")
            continue
        with open(fp) as f:
            content = f.read()
        if "7373732357" in content:
            print(f"SKIP {game}: 737 already present")
            continue
        if "gz-ad-below-game" not in content:
            print(f"SKIP {game}: no gz-ad-below-game placeholder")
            continue
        insert_at = find_real_below_game_close(content)
        if insert_at is None:
            print(f"FAIL {game}: could not find real gz-ad-below-game wrapper close")
            sys.exit(1)
        new_content = content[:insert_at] + R521_INSERT + content[insert_at:]
        with open(fp, "w") as f:
            f.write(new_content)
        # Re-read and verify
        with open(fp) as f:
            verify = f.read()
        div_open = verify.count("<div")
        div_close = verify.count("</div>")
        has_737 = "7373732357" in verify
        has_marker = "gz-ad-r521" in verify
        ok = div_open == div_close and has_737 and has_marker
        # Position check: r521 should come AFTER 1099212472 ins
        ins_109_pos = verify.find("1099212472")
        r521_pos = verify.find("gz-ad-r521")
        order_ok = ins_109_pos > 0 and r521_pos > ins_109_pos
        ok = ok and order_ok
        print(f"  {game}: 737={verify.count('7373732357')} r521={verify.count('gz-ad-r521')} div={div_open}/{div_close} order={'OK' if order_ok else 'WRONG'} {'PASS' if ok else 'FAIL'}")
        if not ok:
            sys.exit(1)
    print("All R521 insertions complete.")


if __name__ == "__main__":
    main()
