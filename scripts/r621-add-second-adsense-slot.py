#!/usr/bin/env python3
"""R621 — Add 2nd AdSense slot (7373732357) to 8 remaining zero-fill pages.

Context (2026-08-31 BI signal):
  - R559 added 737 to 12 zero-fill game pages (PV>=6 cutoff, 101 PV/7d cumulative).
    Lesson from R559 MEMORY: "STOP adding 737: only 17 remaining PV>=7 candidates.
    Per-page fill economics don't justify."
  - BUT 8 high-PV pages (PV>=5) still lack 737 entirely:
    * 6 blog pages (zero-fill despite PV=5-10) — R441 cohort showed blog 737 = 5-7
      fills/day on PV=10-15, so adding 737 here = expected +3-6 SBF/week combined.
    * 2 game pages (soap-slice PV=13, zip-tie PV=12) — borderline but no 737 ins.
  - These 8 pages have combined ~52 PV/7d (7.4/day). Per R441 evidence (1.1 SBF per
    page-view for blog), expected +1-2 SBF/day combined. Cumulative: +10-15/week.

Targets (R621, total 8 pages):
  Blog pages (6) — R441/R442 R383-CLS-safe wrapper pattern:
    - /blog/best-single-player-games-online-free.html (PV=10)
    - /blog/best-free-browser-games-no-signup.html (PV=8)
    - /blog/hidden-google-games-you-can-play-free.html (PV=6)
    - /blog/best-browser-games-2026-no-download.html (PV=5)
    - /blog/best-io-games-unblocked-2026.html (PV=5)
    - /blog/games-to-play-when-bored-at-night-no-download.html (PV=5)

  Game pages (2) — R557/R559 gz-ad-below-game R383 pattern:
    - /soap-slice/ (PV=13)
    - /zip-tie/ (PV=12)

Pattern:
  - Blog pages: insert R621 BLOCK before </body>, parallel to existing 109 ins.
    Use unique div id `gz-ad-r621-<slug>` per page.
  - Game pages: insert R621 BLOCK after </div> of `gz-ad-below-game`, parallel
    to existing 109 ins. (R559 script handles this — but R559 already locked
    the 12 page list. These 2 were missed.)

Idempotent: skip if `gz-ad-r621-` already present.
Robustness:
  - Skip if 737 already in HTML
  - For game pages: use depth-aware </div> scanner (R554 lesson)
  - For blog pages: insert before final </body> (or </main>+ fallback)
  - div_balance check before/after to ensure no DOM corruption

Verification:
  - div balance unchanged
  - 737 ins present
  - git diff --stat per file: 1 line semantic change each
"""
from __future__ import annotations
import argparse
import re
import sys
from pathlib import Path

ROOT = Path("/home/junze/gamezipper.com")

# (path_type, path, anchor_slug, anchor_pattern)
BLOG_TARGETS = [
    ("blog", "blog/best-single-player-games-online-free.html", "best-single-player", "end-of-body"),
    ("blog", "blog/best-free-browser-games-no-signup.html", "best-no-signup", "end-of-body"),
    ("blog", "blog/hidden-google-games-you-can-play-free.html", "hidden-games", "end-of-body"),
    ("blog", "blog/best-browser-games-2026-no-download.html", "best-2026-nodownload", "end-of-body"),
    ("blog", "blog/best-io-games-unblocked-2026.html", "best-io-unblocked", "end-of-body"),
    ("blog", "blog/games-to-play-when-bored-at-night-no-download.html", "bored-night", "end-of-body"),
]

GAME_TARGETS = [
    ("game", "soap-slice/index.html", "soap-slice", "after-gz-ad-below-game"),
    ("game", "zip-tie/index.html", "zip-tie", "after-gz-ad-below-game"),
]

# Blog R621 block — inserted before </body> (or before analytics script tags)
BLOG_BLOCK = '''<!-- ADS-OPT 2026-08-31 R621: 2nd AdSense slot 7373732357 on 6 zero-fill blog pages. BI 7d (2026-08-31): 6 pages had 0 SBF despite PV=5-10/7d. Pattern: parallel div before analytics scripts (R441 R383 CLS-safe wrapper). R441 cohort evidence: 1.0-1.1 SBF per page-view on PV=10-15. -->
<div id="gz-ad-r621-{slug}" style="position:relative;min-height:100px;max-height:280px;margin:24px auto;max-width:728px;text-align:center;overflow:hidden;contain:layout paint style;color:#666;font-size:.7em;background:transparent;border-radius:6px;box-sizing:border-box;line-height:100px"><span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;font-weight:500;pointer-events:none;transition:opacity .15s ease">Sponsored &middot; Advertisement</span>
<ins class="adsbygoogle" style="position:absolute!important;top:0!important;left:0!important;width:100%!important;max-width:728px!important;height:100%!important;max-height:280px!important;margin:0 auto!important;text-align:center;display:block" data-ad-client="ca-pub-8346383990981353" data-ad-slot="7373732357" data-ad-format="auto" data-full-width-responsive="true"></ins>
<script>(adsbygoogle=window.adsbygoogle||[]).push({{}});</script>
</div>
'''

# Game R621 block — inserted after </div> of <div id="gz-ad-below-game">
GAME_BLOCK = '''<!-- ADS-OPT 2026-08-31 R621: 2nd AdSense slot 7373732357 on soap-slice/zip-tie. BI 7d (2026-08-31): 0 SBF despite PV=12-13/7d. R559 batch missed these 2 game pages (had 109 but not 737). R559 pattern + R383 CLS-safe wrapper. -->
<div id="gz-ad-r621-{slug}" style="position:relative;min-height:100px;max-height:280px;margin:16px auto;max-width:728px;text-align:center;overflow:hidden;contain:layout paint style;color:#666;font-size:.7em;background:transparent;border-radius:6px;box-sizing:border-box;line-height:100px"><span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;font-weight:500;pointer-events:none;transition:opacity .15s ease">Sponsored &middot; Advertisement</span><ins class="adsbygoogle" style="position:absolute!important;top:0!important;left:0!important;width:100%!important;max-width:728px!important;height:100%!important;max-height:280px!important;margin:0 auto!important;text-align:center;display:block" data-ad-client="ca-pub-8346383990981353" data-ad-slot="7373732357" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({{}});</script></div>
'''


def find_close_div(html: str, open_pos: int) -> int:
    """Find the matching </div> for the <div> starting at open_pos, skipping HTML comments."""
    depth = 1
    i = open_pos + 1
    n = len(html)
    while i < n:
        c = html[i]
        if c == '<':
            if html[i:i+4] == '<!--':
                end = html.find('-->', i + 4)
                if end < 0:
                    return -1
                i = end + 3
                continue
            if html[i:i+5] == '<div ' or html[i:i+5] == '<div>':
                depth += 1
                i += 5
                continue
            if html[i:i+6] == '</div>':
                depth -= 1
                if depth == 0:
                    return i + 6
                i += 6
                continue
        i += 1
    return -1


def insert_after_gz_ad_below_game(html: str, block: str) -> str:
    """Insert block immediately after </div> closing gz-ad-below-game."""
    # Find <div id="gz-ad-below-game"
    marker = '<div id="gz-ad-below-game"'
    open_pos = html.find(marker)
    if open_pos < 0:
        raise ValueError("gz-ad-below-game not found")
    # Walk to the end of the opening <div ...>
    open_end = html.find('>', open_pos)
    if open_end < 0:
        raise ValueError("gz-ad-below-game open tag malformed")
    close_end = find_close_div(html, open_end)
    if close_end < 0:
        raise ValueError("gz-ad-below-game close </div> not found")
    return html[:close_end] + block + html[close_end:]


def insert_before_end_of_body(html: str, block: str) -> str:
    """Insert block before the analytics scripts tag cluster (which sits near </body>)."""
    # Try before the </body> tag first
    body_close = html.rfind('</body>')
    if body_close > 0:
        return html[:body_close] + block + html[body_close:]
    # Fallback: insert before </html>
    html_close = html.rfind('</html>')
    if html_close > 0:
        return html[:html_close] + block + html[html_close:]
    raise ValueError("Neither </body> nor </html> found")


def div_balance(html: str) -> int:
    """Count <div> minus </div> outside comments — positive means unbalanced."""
    # Strip comments first
    text = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
    open_count = len(re.findall(r'<div[\s>]', text))
    close_count = text.count('</div>')
    return open_count - close_count


def process_target(target: tuple) -> tuple[bool, str]:
    path_type, rel_path, slug, anchor = target
    full_path = ROOT / rel_path
    if not full_path.exists():
        return False, f"SKIP {rel_path} — file not found"

    text = full_path.read_text()

    if f"gz-ad-r621-{slug}" in text:
        return True, f"SKIP {rel_path} — already has gz-ad-r621-{slug}"

    if "7373732357" in text:
        return True, f"SKIP {rel_path} — already has 737 ins"

    pre_balance = div_balance(text)

    if path_type == "blog":
        block = BLOG_BLOCK.format(slug=slug)
        try:
            new_text = insert_before_end_of_body(text, block)
        except ValueError as e:
            return False, f"ERROR {rel_path} — {e}"
    else:  # game
        block = GAME_BLOCK.format(slug=slug)
        try:
            new_text = insert_after_gz_ad_below_game(text, block)
        except ValueError as e:
            return False, f"ERROR {rel_path} — {e}"

    post_balance = div_balance(new_text)
    if post_balance != pre_balance:
        return False, f"ERROR {rel_path} — div balance changed {pre_balance} → {post_balance}"

    if "7373732357" not in new_text:
        return False, f"ERROR {rel_path} — 737 not in result"

    full_path.write_text(new_text)
    return True, f"OK {rel_path} — added gz-ad-r621-{slug} ({len(new_text) - len(text)} bytes)"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    all_targets = BLOG_TARGETS + GAME_TARGETS
    success_count = 0
    skip_count = 0
    error_count = 0
    for target in all_targets:
        if args.dry_run:
            # In dry-run, just verify state
            path_type, rel_path, slug, anchor = target
            full_path = ROOT / rel_path
            if not full_path.exists():
                print(f"MISSING {rel_path}")
                continue
            text = full_path.read_text()
            has_r621 = f"gz-ad-r621-{slug}" in text
            has_737 = "7373732357" in text
            has_109 = "1099212472" in text
            bal = div_balance(text)
            status = "ALREADY_DONE" if has_r621 else ("HAS_737" if has_737 else "NEEDS_R621")
            print(f"[{status}] {rel_path} | 109={has_109} 737={has_737} bal={bal}")
            continue

        ok, msg = process_target(target)
        if ok and "OK" in msg:
            success_count += 1
        elif "SKIP" in msg:
            skip_count += 1
        else:
            error_count += 1
        print(msg)

    if not args.dry_run:
        print(f"\nSummary: {success_count} added, {skip_count} skipped, {error_count} errors (of {len(all_targets)} total)")


if __name__ == "__main__":
    main()