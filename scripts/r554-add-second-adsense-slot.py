#!/usr/bin/env python3
"""R554 — Add 2nd AdSense slot (7373732357) to 16 zero-fill game pages.

Pattern: parallel div after <div id="gz-ad-below-game"> close, R383 CLS-safe
wrapper (same as R548/R549/R550). Inserts after the div, NOT inside it.

Pages handled:
- 15 standard pages with <div id="gz-ad-below-game">
- 1 woodoku with gz-ad-below-game but no <ins> inside (R553 layout-skip)

Idempotent: re-running on a page that already has 737 is a no-op.

Usage:
  python3 scripts/r554-add-second-adsense-slot.py --dry-run
  python3 scripts/r554-add-second-adsense-slot.py
"""
from __future__ import annotations
import argparse
import re
import sys
from pathlib import Path

GZ_ROOT = Path("/home/junze/gamezipper.com")

# 16 zero-fill game pages from BI 7d 2026-08-29 (PV>=5 + 737 SBF=0 + 109 in HTML)
# 14 from PV>=7 shortlist + 2 mid-PV (antikythera, spiral-galaxy had only 1 fill each)
PAGES = [
    "power-wash",           # pv=10  737=0 109=1
    "klotski",              # pv=9   737=0 109=1
    "infinity-loop",        # pv=8   737=0 109=1
    "woodoku",              # pv=8   737=0 109=1  R553 layout-skip
    "centrifuge-separation",# pv=7   737=0 109=1
    "claw-machine",         # pv=7   737=0 109=1
    "kazunori",             # pv=7   737=0 109=1
    "mr-bullet",            # pv=7   737=0 109=1
    "shogi",                # pv=7   737=0 109=1
    "trivia-crack",         # pv=7   737=0 109=1
    "pattern-matrix",       # pv=6   737=0 109=1
    "black",                # pv=5   737=0 109=1
    "mid-loop",             # pv=5   737=0 109=1
    "prism-path",           # pv=5   737=0 109=1
    "renzoku",              # pv=5   737=0 109=1
    "sling-smash",          # pv=5   737=0 109=1
    "suraromu",             # pv=5   737=0 109=1
]

def find_gz_ad_below_game_close(html: str) -> int | None:
    """Return byte offset AFTER the </div> that closes <div id=\"gz-ad-below-game\">.
    Handles nested <div> correctly (some pages wrap <ins> inside the div).
    Returns None if not found."""
    m = re.search(r'<div\s+id="gz-ad-below-game"[^>]*>', html)
    if not m:
        return None
    start = m.end()
    depth = 1
    pos = start
    while pos < len(html) and depth > 0:
        next_open = html.find('<div', pos)
        next_close = html.find('</div>', pos)
        if next_close == -1:
            return None
        if next_open != -1 and next_open < next_close:
            # distinguish <div ...> from <divider> etc.
            if next_open + 4 < len(html) and html[next_open + 4] in ' \t\n\r>':
                depth += 1
                pos = next_open + 4
            else:
                pos = next_open + 4
        else:
            depth -= 1
            pos = next_close + len('</div>')
            if depth == 0:
                return pos
    return None

R554_BLOCK = (
    '<!-- ADS-OPT 2026-08-29 R554: 2nd AdSense slot (data-ad-slot=\"737...\") on 17 zero-fill game pages. '
    'BI 7d (2026-08-29): 16 of 17 pages had 0 fills despite legacy data-ad-slot=\"109...\" in HTML; '
    'woodoku was R553 layout-skip. Pattern: parallel div after gz-ad-below-game close, '
    'R383 CLS-safe wrapper (same as R548/R549/R550). -->'
    '<div id="gz-ad-r554" style="position:relative;min-height:100px;max-height:280px;'
    'margin:16px auto;max-width:728px;text-align:center;overflow:hidden;'
    'contain:layout paint style;color:#666;font-size:.7em;background:transparent;'
    'border-radius:6px;box-sizing:border-box;line-height:100px">'
    '<span aria-hidden="true" style="position:absolute;top:50%;left:50%;'
    'transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;'
    'font-weight:500;pointer-events:none;transition:opacity .15s ease">'
    'Sponsored &middot; Advertisement</span>'
    '<ins class="adsbygoogle" style="position:absolute!important;top:0!important;'
    'left:0!important;width:100%!important;max-width:728px!important;'
    'height:100%!important;max-height:280px!important;margin:0 auto!important;'
    'text-align:center;display:block" '
    'data-ad-client="ca-pub-8346383990981353" '
    'data-ad-slot="7373732357" '
    'data-ad-format="auto" data-full-width-responsive="true"></ins>'
    '<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>'
    '</div>'
)

def process_page(page: str, dry_run: bool = False) -> tuple[str, str]:
    """Returns (status, detail). status ∈ {applied, skipped, error}."""
    p = GZ_ROOT / page / "index.html"
    if not p.exists():
        return ("error", f"missing: {p}")

    html = p.read_text()

    if "gz-ad-r554" in html:
        return ("skipped", "already has gz-ad-r554 marker (R554 idempotent)")
    if "7373732357" in html:
        return ("skipped", "already has 737 slot (other round)")
    if "1099212472" not in html:
        return ("skipped", "no 109 baseline slot — not a target")

    # Find the </div> that closes <div id="gz-ad-below-game" ...>
    insert_at = find_gz_ad_below_game_close(html)
    if insert_at is None:
        return ("error", "no <div id=\"gz-ad-below-game\">...</div> match found")

    new_html = html[:insert_at] + R554_BLOCK + html[insert_at:]

    # Sanity check: 109 should still be present and unchanged
    assert html.count("1099212472") == new_html.count("1099212472"), \
        "109 count mismatch — abort"
    assert new_html.count("7373732357") == html.count("7373732357") + 1, \
        "737 count not exactly +1 — abort"
    # balance check
    old_open = html.count("<div") - html.count("</div>")
    new_open = new_html.count("<div") - new_html.count("</div>")
    if old_open != new_open:
        return ("error", f"div balance broken: {old_open} -> {new_open}")

    if dry_run:
        return ("applied-dryrun", f"{len(R554_BLOCK)} chars to insert at offset {insert_at}")

    p.write_text(new_html)
    return ("applied", f"inserted {len(R554_BLOCK)} chars after gz-ad-below-game")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--pages", nargs="*", default=PAGES, help="override page list")
    args = ap.parse_args()

    counts = {"applied": 0, "skipped": 0, "error": 0, "applied-dryrun": 0}
    for page in args.pages:
        status, detail = process_page(page, dry_run=args.dry_run)
        counts[status] = counts.get(status, 0) + 1
        print(f"  [{status:>14}] {page:<25} {detail}")

    print()
    print(f"=== Summary: applied={counts['applied']} dryrun={counts['applied-dryrun']} "
          f"skipped={counts['skipped']} error={counts['error']} ===")
    sys.exit(0 if counts["error"] == 0 else 1)


if __name__ == "__main__":
    main()