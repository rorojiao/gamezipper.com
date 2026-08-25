#!/usr/bin/env python3
"""
R520 — 2nd AdSense slot (7373732357) on 18 zero-fill game pages (PV>=5, missing 737 slot entirely).

Pattern (R516/R519 proven): parallel div after `gz-ad-below-game` close.
Slot data-ad-slot="7373732357", R383 CLS-safe wrapper style.

Why these pages:
  BI 7d PV>=5, 7373732357 static_banner_fill=0 AND no 737 slot in HTML.
  These 18 pages are NOT in R441/R442/R443/R444/R445/R446/R447/R450/R451/R452/R516/R517/R519 coverage.
  Total PV/day potential: ~7 combined (~1 fill per page per 3-5 days at 5-15 SBF/day/page baseline).

Expected impact (per R516/R517/R519 baseline): 1-5 SBF/day combined within 24-72h
on slot 7373732357 (vs 0 baseline).
"""

import re
import sys
from pathlib import Path

# 18 candidate game paths (PV>=5, 737=0, missing 737 slot, NOT covered by previous R-cycles)
CANDIDATES = [
    'chess',            # PV=9 (highest)
    'word-search',      # PV=7
    'unblock-me',       # PV=7
    'treasure-dig',     # PV=7
    'solitaire',        # PV=7
    'punch-master',     # PV=7
    'knit-off',         # PV=7
    'fulcrum-balance',  # PV=7
    'basketball-shoot', # PV=7
    'train-tracks',     # PV=6
    'slitherlink',      # PV=6
    'escape-manor',     # PV=6
    'crucible-alloy',   # PV=6
    'antistress',       # PV=6
    'sukima',           # PV=5
    'plinko',           # PV=5
    'pinball',          # PV=5
    'moto-x3m',         # PV=5
]

# R516 pattern (parallel div after gz-ad-below-game close)
SLOT_DIV_TEMPLATE = (
    '<!-- ADS-OPT 2026-08-23 R520: 2nd AdSense slot (7373732357) on 5th-tier zero-fill game pages (PV>=5, missing 737 slot). '
    'R519 covered 11 PV>=8 pages on Aug 23 11:00; this batch fills 18 leftover zero-fill pages with HTML 737 missing. '
    '7373732357 fills ~9x legacy 1099212472 (BI 7d: 626 vs 65 SBF). '
    'Pattern: parallel div after gz-ad-below-game close, R383 CLS-safe wrapper. -->\n'
    '<div id="gz-ad-r520" style="position:relative;min-height:100px;max-height:280px;margin:16px auto;max-width:728px;text-align:center;overflow:hidden;contain:layout paint style;color:#666;font-size:.7em;background:transparent;border-radius:6px;box-sizing:border-box;line-height:100px">'
    '<span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;font-weight:500;pointer-events:none;transition:opacity .15s ease">Sponsored &middot; Advertisement</span>'
    '<ins class="adsbygoogle" style="position:absolute!important;top:0!important;left:0!important;width:100%!important;max-width:728px!important;height:100%!important;max-height:280px!important;margin:0 auto!important;text-align:center;display:block" '
    'data-ad-client="ca-pub-8346383990981353" data-ad-slot="7373732357" data-ad-format="auto" data-full-width-responsive="true"></ins>'
    '<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>'
    '</div>\n'
)

REPO = Path("/home/junze/gamezipper.com")


def find_below_game_close(content: str, slug: str):
    """Find position AFTER the closing </div> of gz-ad-below-game. Returns int or None."""
    marker = 'id="gz-ad-below-game"'
    pos = content.find(marker)
    if pos == -1:
        return None
    # Walk forward from the opening tag's '>'
    tag_end = content.find('>', pos) + 1
    i = tag_end
    open_divs = 1
    while i < len(content):
        next_open = content.find('<div', i)
        next_close = content.find('</div>', i)
        if next_close == -1:
            return None
        if next_open != -1 and next_open < next_close:
            char_after = content[next_open + 4:next_open + 5]
            if char_after in (' ', '>', '\n', '\t'):
                open_divs += 1
                i = next_open + 5
            else:
                i = next_open + 4
        else:
            open_divs -= 1
            i = next_close + 6
            if open_divs == 0:
                return i
    return None


def insert_slot(game_slug: str) -> tuple[bool, str]:
    """Insert R520 div after `</div>` closing `gz-ad-below-game`. Idempotent."""
    idx_dir = REPO / game_slug
    if not idx_dir.exists():
        return False, f"missing dir: {idx_dir}"
    html_path = idx_dir / "index.html"
    if not html_path.exists():
        return False, f"missing index.html: {html_path}"
    content = html_path.read_text(encoding='utf-8', errors='replace')

    # Idempotency: check for any prior 737 slot or R520 marker
    if 'gz-ad-r520' in content:
        return False, f"already has R520 marker in {game_slug}"
    if '7373732357' in content:
        return False, f"already has 737 slot in {game_slug} (was added by another cycle)"

    insert_pos = find_below_game_close(content, game_slug)
    if insert_pos is None:
        return False, f"could not find gz-ad-below-game close in {game_slug}"

    new_content = content[:insert_pos] + SLOT_DIV_TEMPLATE + content[insert_pos:]
    html_path.write_text(new_content, encoding='utf-8')
    return True, f"inserted at pos {insert_pos}"


def validate_html(html_path: Path) -> tuple[int, int, bool]:
    content = html_path.read_text(encoding='utf-8', errors='replace')
    no_comments = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    open_count = len(re.findall(r'<div[\s>]', no_comments))
    close_count = len(re.findall(r'</div>', no_comments))
    return open_count, close_count, open_count == close_count


def main():
    results = []
    for slug in CANDIDATES:
        ok, msg = insert_slot(slug)
        results.append((slug, ok, msg))

    print("\n=== R520 insertion results ===")
    for slug, ok, msg in results:
        print(f"{'OK' if ok else 'SKIP':<4} {slug:<25} {msg}")

    print("\n=== R520 validation ===")
    for slug, ok, msg in results:
        if not ok:
            continue
        html_path = REPO / slug / "index.html"
        opens, closes, balanced = validate_html(html_path)
        content = html_path.read_text(encoding='utf-8', errors='replace')
        slot737 = content.count('7373732357')
        slot109 = content.count('1099212472')
        r520_marker = content.count('gz-ad-r520')
        print(f"{slug:<25} div={opens}/{closes} {'OK' if balanced else 'BAD'} | 737={slot737} 109={slot109} r520={r520_marker}")


if __name__ == '__main__':
    main()
