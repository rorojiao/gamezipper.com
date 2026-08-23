#!/usr/bin/env python3
"""
R519 — 2nd AdSense slot (7373732357) on 11 zero-fill game pages (PV>=8, NOT covered by R516/R517).

Pattern (R516 proven): parallel div after `gz-ad-below-game` close.
Slot data-ad-slot="7373732357", R383 CLS-safe wrapper style.

Why these pages:
  BI 7d PV>=8, 7373732357 static_banner_fill=0, NOT in R516/R517 coverage list.
  Total PV/day potential: ~165 combined.

Expected impact (per R516/R517 baseline): 5-15 SBF/day combined within 24-48h
on slot 7373732357 (vs 0 baseline).
"""

import re
import sys
from pathlib import Path

# 11 candidate game paths (PV>=8, 737=0, NOT in R516/R517 list)
CANDIDATES = [
    'laser-maze',
    'text-twist',
    'qwirkle',
    'still-pond',
    'tower-defense',
    'akari',
    'gravity-flip',
    'nerdle',
    'onet',
    'barns',
    'tic-tac-toe',
]

# R516 pattern (parallel div after gz-ad-below-game close)
SLOT_DIV_TEMPLATE = (
    '<!-- ADS-OPT 2026-08-23 R519: 2nd AdSense slot (7373732357) on 4th-tier zero-fill game pages (PV>=8). '
    'R516 covered PV 7-22, R517 PV 8-11; 11 pages still 1099212472-only with PV 8-21. '
    '7373732357 fills ~8x legacy 1099212472 (BI 7d: 614 vs 65 SBF). '
    'Pattern: parallel div after gz-ad-below-game close, R383 CLS-safe wrapper. -->\n'
    '<div id="gz-ad-r519" style="position:relative;min-height:100px;max-height:280px;margin:16px auto;max-width:728px;text-align:center;overflow:hidden;contain:layout paint style;color:#666;font-size:.7em;background:transparent;border-radius:6px;box-sizing:border-box;line-height:100px">'
    '<span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;font-weight:500;pointer-events:none;transition:opacity .15s ease">Sponsored &middot; Advertisement</span>'
    '<ins class="adsbygoogle" style="position:absolute!important;top:0!important;left:0!important;width:100%!important;max-width:728px!important;height:100%!important;max-height:280px!important;margin:0 auto!important;text-align:center;display:block" '
    'data-ad-client="ca-pub-8346383990981353" data-ad-slot="7373732357" data-ad-format="auto" data-full-width-responsive="true"></ins>'
    '<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>'
    '</div>'
)

REPO = Path("/home/junze/gamezipper.com")

def insert_slot(game_slug: str) -> tuple[bool, str]:
    """Insert R519 div after `</div>` closing `gz-ad-below-game`. Idempotent."""
    idx_dir = REPO / game_slug
    # Some games live directly under /<slug>/index.html
    if not idx_dir.exists():
        return False, f"missing dir: {idx_dir}"
    html_path = idx_dir / "index.html"
    if not html_path.exists():
        return False, f"missing index.html: {html_path}"
    content = html_path.read_text(encoding='utf-8', errors='replace')

    # Idempotency: check for marker
    if 'gz-ad-r519' in content:
        return False, f"already has R519 marker in {game_slug}"

    # Find the gz-ad-below-game div's closing </div>
    # Use depth-counter to be safe (R516 pattern relies on this)
    marker = 'id="gz-ad-below-game"'
    pos = content.find(marker)
    if pos == -1:
        return False, f"no gz-ad-below-game in {game_slug}"

    # Walk forward, count div depth, find matching close
    open_divs = 0
    i = pos
    # Count the opening div
    open_divs += 1  # gz-ad-below-game's <div
    # Search for next <div or </div> after gz-ad-below-game's opening tag close
    tag_end = content.find('>', pos) + 1
    i = tag_end
    while i < len(content) and open_divs > 0:
        # Look for next <div (with space or > after) or </div>
        next_open = content.find('<div', i)
        next_close = content.find('</div>', i)
        if next_close == -1:
            return False, f"unbalanced divs in {game_slug}"
        if next_open != -1 and next_open < next_close:
            # Check it's actually a div tag (not <divisor)
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
                # Found closing of gz-ad-below-game's wrapping div
                insert_pos = i
                break
    else:
        return False, f"could not find close for gz-ad-below-game in {game_slug}"

    new_content = content[:insert_pos] + '\n' + SLOT_DIV_TEMPLATE + content[insert_pos:]
    html_path.write_text(new_content, encoding='utf-8')
    return True, f"inserted after pos {insert_pos}"


def validate_html(html_path: Path) -> tuple[int, int, bool]:
    """Return (open_divs, close_divs, balanced)."""
    content = html_path.read_text(encoding='utf-8', errors='replace')
    # Strip comments first
    no_comments = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    open_count = len(re.findall(r'<div[\s>]', no_comments))
    close_count = len(re.findall(r'</div>', no_comments))
    return open_count, close_count, open_count == close_count


def main():
    results = []
    for slug in CANDIDATES:
        ok, msg = insert_slot(slug)
        results.append((slug, ok, msg))

    print("\n=== R519 insertion results ===")
    for slug, ok, msg in results:
        print(f"{'OK' if ok else 'SKIP':<4} {slug:<25} {msg}")

    print("\n=== R519 validation ===")
    for slug, ok, msg in results:
        if not ok:
            continue
        html_path = REPO / slug / "index.html"
        opens, closes, balanced = validate_html(html_path)
        content = html_path.read_text(encoding='utf-8', errors='replace')
        slot737 = content.count('7373732357')
        slot109 = content.count('1099212472')
        r519_marker = content.count('gz-ad-r519')
        print(f"{slug:<25} div={opens}/{closes} {'OK' if balanced else 'BAD'} | 737={slot737} 109={slot109} r519={r519_marker}")


if __name__ == '__main__':
    main()