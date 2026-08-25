#!/usr/bin/env python3
"""
R527 — 2nd AdSense slot (7373732357) on 4 zero-fill game/blog pages missing 737 slot.

BI signal (7d, 2026-08-25):
  - 7373732357 static_banner_fill dominates (per R521 evidence: ~9x legacy 1099212472)
  - Top zero-fill pages PV>=5 (excl home/embed):
      spiral-galaxy/ (10 PV, 0 fills, 109 only)
      zh/blog/games-like-minecraft-free-browser.html (8 PV, 0 fills, 109 only)
      find-n-merge/ (6 PV, 0 fills, 109 only)
      there-is-no-game/ (5 PV, 0 fills, 109 only)

Pattern (R521 sibling): parallel <div id="gz-ad-r527"> wrapper inserted
AFTER <div id="gz-ad-below-game"> close (the LAST/real wrapper containing
1099212472 ins, skipping empty placeholder). R383 CLS-safe wrapper
(position:relative + contain:layout paint style + overflow:hidden + max-height:280px).

Run: python3 scripts/r527-add-second-adsense-slot.py
"""
import os
import re
import sys

PAGES = [
    "spiral-galaxy/index.html",
    "find-n-merge/index.html",
    "there-is-no-game/index.html",
    "zh/blog/games-like-minecraft-free-browser.html",
]
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

R527_INSERT = """<!-- ADS-OPT 2026-08-25 R527: 2nd AdSense slot (7373732357) on 4 zero-fill pages missing 737 slot (spiral-galaxy, find-n-merge, there-is-no-game, zh/blog/games-like-minecraft-free-browser). PV 5-10/7d, 0 fills all 4. R521 covered 3 similar pages; cumulative now ~182 covered. 7373732357 fills ~9x legacy 1099212472 (BI 7d: 1076 vs 95 SBF). Pattern: parallel div after gz-ad-below-game close, R383 CLS-safe wrapper. -->
<div id="gz-ad-r527" style="position:relative;min-height:100px;max-height:280px;margin:16px auto;max-width:728px;text-align:center;overflow:hidden;contain:layout paint style;color:#666;font-size:.7em;background:transparent;border-radius:6px;box-sizing:border-box;line-height:100px"><span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;font-weight:500;pointer-events:none;transition:opacity .15s ease">Sponsored &middot; Advertisement</span><ins class="adsbygoogle" style="position:absolute!important;top:0!important;left:0!important;width:100%!important;max-width:728px!important;height:100%!important;max-height:280px!important;margin:0 auto!important;text-align:center;display:block" data-ad-client="ca-pub-8346383990981353" data-ad-slot="7373732357" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>
"""


def find_real_below_game_close(content):
    """Find the byte position AFTER the </div> that closes the LAST
    <div id="gz-ad-below-game" wrapper that has actual content (not empty
    placeholder <div id="gz-ad-below-game"></div>).
    """
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
    for rel_path in PAGES:
        fp = os.path.join(REPO, rel_path)
        if not os.path.exists(fp):
            print(f"SKIP {rel_path}: file not found")
            continue
        with open(fp) as f:
            content = f.read()
        if "7373732357" in content:
            print(f"SKIP {rel_path}: 737 already present")
            continue
        if "gz-ad-below-game" not in content:
            print(f"SKIP {rel_path}: no gz-ad-below-game placeholder")
            continue
        insert_at = find_real_below_game_close(content)
        if insert_at is None:
            print(f"FAIL {rel_path}: could not find real gz-ad-below-game wrapper close")
            sys.exit(1)
        new_content = content[:insert_at] + R527_INSERT + content[insert_at:]
        with open(fp, "w") as f:
            f.write(new_content)
        with open(fp) as f:
            verify = f.read()
        div_open = verify.count("<div")
        div_close = verify.count("</div>")
        has_737 = "7373732357" in verify
        has_marker = "gz-ad-r527" in verify
        ok = div_open == div_close and has_737 and has_marker
        ins_109_pos = verify.find("1099212472")
        r527_pos = verify.find("gz-ad-r527")
        order_ok = ins_109_pos > 0 and r527_pos > ins_109_pos
        ok = ok and order_ok
        print(f"  {rel_path}: 737={verify.count('7373732357')} r527={verify.count('gz-ad-r527')} div={div_open}/{div_close} order={'OK' if order_ok else 'WRONG'} {'PASS' if ok else 'FAIL'}")
        if not ok:
            sys.exit(1)
    print("All R527 insertions complete.")


if __name__ == "__main__":
    main()
