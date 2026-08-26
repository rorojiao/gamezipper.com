#!/usr/bin/env python3
"""
R532 — 2nd AdSense slot (7373732357) on 6 zero-fill pages missing 737 slot.

BI signal (7d, 2026-08-26):
  - 7373732357 static_banner_fill still dominates (~9x legacy 1099212472)
  - R527 (Aug 25) was partially orphaned by merge-adopt d3cc0486af on 2 of 4 pages:
      find-n-merge/, there-is-no-game/ — 737 slot silently dropped
      spiral-galaxy/, zh/blog/games-like-minecraft-free-browser.html — survived (3 hits each)
  - 7d scan shows 20 PV>=3 zero-fill pages without 737. Top 6 by PV picked for R532:
      2 R527 orphans (re-apply): find-n-merge/ (6 PV), there-is-no-game/ (5 PV)
      4 NEW high-PV zero-fill: antikythera-mechanism/ (10 PV), balance-scale/ (8 PV),
        mekorama/ (6 PV), eggy-car/ (6 PV)
  - Pattern (R521/R527 sibling): parallel <div id="gz-ad-r532"> wrapper inserted
    AFTER <div id="gz-ad-below-game"> close (the LAST/real wrapper containing
    1099212472 ins, skipping empty placeholder). R383 CLS-safe wrapper.

Idempotent: skips page if 737 already present.

Run: python3 scripts/r532-add-second-adsense-slot.py
"""
import os
import re
import sys

PAGES = [
    # 2 R527 orphans (re-apply after merge-adopt d3cc0486af silently dropped 737)
    "find-n-merge/index.html",
    "there-is-no-game/index.html",
    # 4 NEW high-PV zero-fill pages (7d PV >= 6, fills=0, 737 NOT in HTML)
    "antikythera-mechanism/index.html",
    "balance-scale/index.html",
    "mekorama/index.html",
    "eggy-car/index.html",
]
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

R532_INSERT = """<!-- ADS-OPT 2026-08-26 R532: 2nd AdSense slot (7373732357) on 6 zero-fill pages missing 737 slot. Re-applies R527 to 2 pages lost in merge-adopt (find-n-merge, there-is-no-game) and adds 4 new high-PV zero-fill pages (antikythera-mechanism, balance-scale, mekorama, eggy-car). 7d PV: 6/6/10/8/6/6. 737 fills ~9x legacy 1099212472 (BI 7d 1346 vs 95 SBF). Pattern: parallel div after gz-ad-below-game close, R383 CLS-safe wrapper. -->
<div id="gz-ad-r532" style="position:relative;min-height:100px;max-height:280px;margin:16px auto;max-width:728px;text-align:center;overflow:hidden;contain:layout paint style;color:#666;font-size:.7em;background:transparent;border-radius:6px;box-sizing:border-box;line-height:100px"><span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;font-weight:500;pointer-events:none;transition:opacity .15s ease">Sponsored &middot; Advertisement</span><ins class="adsbygoogle" style="position:absolute!important;top:0!important;left:0!important;width:100%!important;max-width:728px!important;height:100%!important;max-height:280px!important;margin:0 auto!important;text-align:center;display:block" data-ad-client="ca-pub-8346383990981353" data-ad-slot="7373732357" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>
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
            print(f"SKIP {rel_path}: 737 already present (idempotent)")
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
        new_content = content[:insert_at] + R532_INSERT + content[insert_at:]
        with open(fp, "w") as f:
            f.write(new_content)
        with open(fp) as f:
            verify = f.read()
        div_open = verify.count("<div")
        div_close = verify.count("</div>")
        has_737 = "7373732357" in verify
        has_marker = "gz-ad-r532" in verify
        ins_109_pos = verify.find("1099212472")
        r532_pos = verify.find("gz-ad-r532")
        order_ok = ins_109_pos > 0 and r532_pos > ins_109_pos
        ok = div_open == div_close and has_737 and has_marker and order_ok
        status = "OK" if ok else "FAIL"
        print(f"  {rel_path:<55} {status} div={div_open}/{div_close} 737={has_737} order={'OK' if order_ok else 'WRONG'}")
        if ok:
            inserted.append(rel_path)
        else:
            failed.append(rel_path)

    print()
    print(f"=== R532 summary: {len(inserted)} inserted, {len(skipped)} skipped, {len(failed)} failed ===")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())