#!/usr/bin/env python3
"""
UX-OPT 2026-09-08 R669: empty-placeholder click-swallowing fix.
Add `#gz-ad-above-game:empty,#gz-ad-below-canvas:empty{pointer-events:none}`
to all games that have R347/R360 placeholder CSS.

R170 BI signal: site-wide #gz-ad-above-game empty-div click-swallowing
across 396+ games. Local probe (cookie-clicker/) confirmed: clicks at
y=471-561 land on DIV#gz-ad-above-game (empty, no children), not the
canvas underneath. Real-user rage_click on CANVAS+overlapping coordinates.

Fix: ONLY when :empty (no children), the parent div is pointer-events:none
so clicks pass through. When AdSense fills the div with <ins>/<iframe>,
:empty no longer matches → pointer-events:default (auto) → iframe works.

Idempotent — re-running `--apply` finds files needing the rule and adds it.
"""

import re
import sys
from pathlib import Path

ROOT = Path('/home/junze/gamezipper.com')

# Match the placeholder style block by its CSS rule rather than the data-attribute marker.
# This catches all 420 games with the placeholder CSS (R347/R360/R383 variants).
# Pattern: a <style> block containing the `#gz-ad-above-game,#gz-ad-below-canvas{` rule.
EMPTY_FIX = b'#gz-ad-above-game:empty,#gz-ad-below-canvas:empty{pointer-events:none}'
RULE_MARKER = b'#gz-ad-above-game,#gz-ad-below-canvas{'

def needs_fix(html_bytes: bytes) -> bool:
    if RULE_MARKER not in html_bytes:
        return False
    if EMPTY_FIX in html_bytes:
        return False
    return True

def apply_fix(html_bytes: bytes):
    """Inject the :empty pointer-events:none rule.

    Strategy: find a <style> block containing the RULE_MARKER, then prepend
    the empty-state rule inside it. If found via <style ...> opener, scope is
    local. Use the most-recent <style> tag containing the rule (rarely ambiguous).
    """
    # Find the LAST <style ...> before the rule, then its matching </style>.
    # Simple approach: find the rule's <style> tag by searching backward.
    idx = html_bytes.find(RULE_MARKER)
    if idx == -1:
        return None
    # Find the opening <style that encloses this position
    before = html_bytes[:idx]
    last_open = before.rfind(b'<style')
    if last_open == -1:
        return None
    last_close = before.rfind(b'</style>')
    if last_close > last_open:
        # Rule is in inline <style> attribute? — unlikely, skip
        return None
    # Find closing </style> after idx
    end = html_bytes.find(b'</style>', idx)
    if end == -1:
        return None
    # Insert the empty rule right after the opening tag `>`
    open_tag_end = html_bytes.find(b'>', last_open)
    if open_tag_end == -1 or open_tag_end >= end:
        return None
    insertion_point = open_tag_end + 1
    return (
        html_bytes[:insertion_point]
        + b'\n' + EMPTY_FIX + b'\n'
        + html_bytes[insertion_point:]
    )


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else '--check'
    files = sorted(ROOT.glob('*/index.html'))
    # Exclude admin / shared / non-game dirs
    skip = {'admin', 'dashboard', 'css', 'js', 'scripts', 'shared', 'blog', 'zh'}
    files = [f for f in files if f.parent.name not in skip]

    candidate = 0
    patched = 0
    already = 0
    skipped = 0
    errors = []

    for f in files:
        try:
            data = f.read_bytes()
        except Exception as e:
            errors.append((str(f), e))
            continue
        if RULE_MARKER not in data:
            skipped += 1
            continue
        if EMPTY_FIX in data:
            already += 1
            continue
        candidate += 1
        if mode == '--apply':
            new = apply_fix(data)
            if new is None:
                errors.append((str(f), 'pattern mismatch'))
                continue
            f.write_bytes(new)
            patched += 1

    print(f'Mode: {mode}')
    print(f'Total game index.html: {len(files)}')
    print(f'No R360 placeholder: {skipped}')
    print(f'Already patched: {already}')
    print(f'Candidates needing patch: {candidate}')
    if mode == '--apply':
        print(f'Patched: {patched}')
    if errors:
        print(f'Errors: {len(errors)}')
        for f, e in errors[:5]:
            print(f'  {f}: {e}')


if __name__ == '__main__':
    main()
