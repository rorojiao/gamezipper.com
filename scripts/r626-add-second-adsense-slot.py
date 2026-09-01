#!/usr/bin/env python3
"""R626 — Add 2nd AdSense slot (7373732357) to 5 zero-fill game pages with 109 baseline but no 737.

BI 7d (2026-09-01 post-R621): 5 high-PV zero-fill pages still using only 109 slot.
R559-R621 PV>=6 cutoff skipped these (PV=9-12 burst just landed).
Total 51 PV/7d. Pattern: same as R622.

Pattern: parallel div after <div id="gz-ad-below-game"> close, R383 CLS-safe
wrapper. Inserts AFTER the closing </div>, never inside HTML comments.

Robustness fixes (vs R554):
  * Skip <!-- ... --> comment regions when searching
  * Reject empty `<div id="gz-ad-below-game"></div>` literal pattern
  * Verify the inserted block landed outside any comment

Usage:
  python3 scripts/r626-add-second-adsense-slot.py --dry-run
  python3 scripts/r626-add-second-adsense-slot.py
"""
from __future__ import annotations
import argparse
import re
import sys
from pathlib import Path

GZ_ROOT = Path("/home/junze/gamezipper.com")

PAGES = [
    "little-alchemy", "flow-connect", "impossible-quiz", "circuit-logic", "number-match",
]

OPEN_TAG_RE = re.compile(r'<div\s+id="gz-ad-below-game"[^>]*>')


def find_next_div_token(html: str, pos: int) -> tuple[str, int, int] | None:
    """Return (kind, abs_start, abs_end) for next div_open or div_close at or after pos.
    Skips positions inside HTML comments.
    Returns None if not found before end of string."""
    n = len(html)
    scan = pos
    while scan < n:
        # Find next comment start or div token
        c_open = html.find('<!--', scan)
        d_open_idx = html.find('<div', scan)
        d_close_idx = html.find('</div>', scan)

        candidates = []
        if d_open_idx != -1:
            candidates.append((d_open_idx, 'div_open'))
        if d_close_idx != -1:
            candidates.append((d_close_idx, 'div_close'))
        if c_open != -1:
            candidates.append((c_open, 'comment_open'))

        if not candidates:
            return None

        candidates.sort(key=lambda x: x[0])
        first_pos, first_kind = candidates[0]

        if first_kind == 'comment_open':
            # Skip to end of comment and continue
            c_close = html.find('-->', first_pos + 4)
            if c_close == -1:
                return None
            scan = c_close + 3
            continue

        if first_kind == 'div_open':
            # Verify it's a real <div ...> (next char must be space/tab/newline/>)
            after = first_pos + 4
            if after < n and html[after] in ' \t\n\r>':
                # Find end of open tag (next '>')
                tag_end = html.find('>', first_pos) + 1
                return ('div_open', first_pos, tag_end)
            else:
                # It's <divider> etc. Skip past it.
                scan = after
                continue

        if first_kind == 'div_close':
            return ('div_close', first_pos, first_pos + 6)

    return None


def find_gz_ad_below_game_close(html: str) -> int | None:
    """Return byte offset AFTER the </div> closing the real <div id="gz-ad-below-game">."""
    # Find all candidate open tag positions via regex (these match anywhere, comments or not)
    open_positions = [m.start() for m in OPEN_TAG_RE.finditer(html)]
    if not open_positions:
        return None

    for op in open_positions:
        # Check it's not inside a comment
        # Count <!-- and --> before op; if more <!-- than -->, skip
        prefix = html[:op]
        if prefix.count('<!--') > prefix.count('-->'):
            continue

        # Get end of open tag
        tag_end = html.find('>', op) + 1

        # Check if this is the empty literal pattern `<div id="gz-ad-below-game"></div>`
        if html[tag_end:tag_end + 6] == '</div>':
            # That's the literal in R383 comment, skip
            continue

        # Walk depth from tag_end
        depth = 1
        pos = tag_end
        while pos < len(html) and depth > 0:
            tok = find_next_div_token(html, pos)
            if tok is None:
                return None
            kind, s, e = tok
            if kind == 'div_open':
                depth += 1
                pos = e
            elif kind == 'div_close':
                depth -= 1
                pos = e
                if depth == 0:
                    return pos
            else:
                pos = e
        return None

    return None


R626_BLOCK = (
    '<!-- ADS-OPT 2026-09-01 R626: 2nd AdSense slot (data-ad-slot="737...") on 4 high-signal zero-fill (PV>=8) game pages. '
    'BI 7d (2026-09-01 post-R621): 5 zero-fill pages still using only 109 slot. '
    'PV: little-alchemy=12, flow-connect=11, impossible-quiz=10, circuit-logic=9, number-match=9. '
    'R559-R621 PV>=6 cutoff skipped these (PV just landed 7d after deploy). '
    'R621 cohort proved blog SBF/PV=1.0-1.1 within hours. Pattern: parallel div after gz-ad-below-game close, '
    'R383 CLS-safe wrapper (same as R548/R549/R550/R554/R622). -->'
    '<div id="gz-ad-r626" style="position:relative;min-height:100px;max-height:280px;'
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
    p = GZ_ROOT / page / "index.html"
    if not p.exists():
        return ("error", f"missing: {p}")

    html = p.read_text()

    if "gz-ad-r626" in html:
        return ("skipped", "already has gz-ad-r626 marker (R626 idempotent)")
    if "7373732357" in html:
        return ("skipped", "already has 737 slot (other round)")
    if "1099212472" not in html:
        return ("skipped", "no 109 baseline slot — not a target")

    insert_at = find_gz_ad_below_game_close(html)
    if insert_at is None:
        return ("error", "no <div id=\"gz-ad-below-game\">...</div> match found (or all candidates inside comments)")

    # Sanity: char after </div> shouldn't be '>' or another '<' continuation
    char_after = html[insert_at] if insert_at < len(html) else ''
    if char_after == '<':
        return ("error", f"insert position is mid-token (char_after='<'), abort")

    new_html = html[:insert_at] + R626_BLOCK + html[insert_at:]

    assert html.count("1099212472") == new_html.count("1099212472"), "109 count mismatch — abort"
    assert new_html.count("7373732357") == html.count("7373732357") + 1, "737 count not +1 — abort"
    old_open = html.count("<div") - html.count("</div>")
    new_open = new_html.count("<div") - new_html.count("</div>")
    if old_open != new_open:
        return ("error", f"div balance broken: {old_open} -> {new_open}")

    # Verify gz-ad-r626 is NOT inside a comment
    r622_pos = new_html.find('gz-ad-r626')
    r622_ins_block_pos = new_html.rfind('<!--', 0, r622_pos)
    if r622_ins_block_pos != -1:
        # Check if there's a --> between r622_ins_block_pos and r622_pos
        between = new_html[r622_ins_block_pos:r622_pos]
        if between.count('-->') == 0:
            return ("error", "gz-ad-r626 landed inside an HTML comment — abort")

    if dry_run:
        return ("applied-dryrun", f"{len(R626_BLOCK)} chars at offset {insert_at}; char_after={char_after!r}")

    p.write_text(new_html)
    return ("applied", f"inserted {len(R626_BLOCK)} chars after gz-ad-below-game close at offset {insert_at}")


def main_runner():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--pages", nargs="*", default=PAGES)
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
    main_runner()
