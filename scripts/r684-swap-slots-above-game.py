#!/usr/bin/env python3
"""R684: Swap AdSense slots on game pages — 737 first in DOM order, 109 second.

BI 7d (2026-09-04..2026-09-11) analysis: 192 game pages have 109 standalone <ins>
in body AFTER gz-ad-r451/r516/below-game div (which contains 737). AdSense's
auto-placement algorithm picks the first eligible ins; 737 fills (374 total),
109 gets demoted (42 total, mostly on pages without explicit 737).

Fix: swap the data-ad-slot attribute values so 737 is in the first-ins position
and 109 is in the second. R681 proved this on homepage: 109 mid-slot started
filling (6 in 7d) after the swap from 737 → 109 in the mid banner.

The marker comment goes BEFORE the entire <ins>...</ins> block, not inside.

Idempotent: skip if R684 marker present.
"""
import os, re, sys

SITE_DIR = '/home/junze/gamezipper.com'
SLOT_109 = '1099212472'
SLOT_737 = '7373732357'

MARKER = '<!-- R684 2026-09-12 ADS-OPT: swap 109/737 — 737 first in DOM (workhorse, fills 100%), 109 second (R681 dedup lesson). BI 7d 109=42 vs 737=374 fills. -->'


def find_candidates():
    """Find game pages where 109 <ins> appears BEFORE 737 <ins> in DOM order."""
    candidates = []
    for entry in sorted(os.listdir(SITE_DIR)):
        if not os.path.isdir(os.path.join(SITE_DIR, entry)): continue
        if entry.startswith('.') or entry.startswith('_'): continue
        idx = os.path.join(SITE_DIR, entry, 'index.html')
        if not os.path.exists(idx): continue
        if entry in ('embed-games.html', 'index.html', 'tools', 'blog', 'zh', 'css', 'js',
                     'fonts', 'assets', 'thumbs', 'og-images', 'shared'): continue
        try:
            html = open(idx, encoding='utf-8', errors='ignore').read()
        except:
            continue
        if MARKER in html: continue

        # Find ALL <ins ... data-ad-slot="N"> ... </ins> blocks
        ins_blocks = list(re.finditer(
            r'<ins class="adsbygoogle"[^>]*data-ad-slot="(' + SLOT_109 + '|' + SLOT_737 + ')"[^>]*></ins>',
            html
        ))
        # Get the slot for each ins block
        slot_positions = []
        for m in ins_blocks:
            slot = re.search(r'data-ad-slot="(\d+)"', m.group(0)).group(1)
            slot_positions.append((slot, m.start(), m.end()))

        # Need at least one of each
        has_109 = any(s == SLOT_109 for s, _, _ in slot_positions)
        has_737 = any(s == SLOT_737 for s, _, _ in slot_positions)
        if not (has_109 and has_737): continue

        # First 109 must be BEFORE first 737 → swap needed
        first_109 = next((s for s, _, _ in slot_positions if s == SLOT_109), None)
        first_737 = next((s for s, _, _ in slot_positions if s == SLOT_737), None)
        if first_109 != SLOT_109 or first_737 != SLOT_737: continue
        # Get positions
        pos_109 = next(p for s, p, _ in slot_positions if s == SLOT_109)
        pos_737 = next(p for s, p, _ in slot_positions if s == SLOT_737)
        if pos_109 >= pos_737: continue

        candidates.append((entry, idx, slot_positions))
    return candidates


def swap_first_two_slots(html, slot_positions):
    """Swap data-ad-slot of first 109 and first 737 in DOM order.

    Returns (new_html, success).
    """
    # Find first 109 and first 737
    first_109 = next((p, e) for s, p, e in slot_positions if s == SLOT_109)
    first_737 = next((p, e) for s, p, e in slot_positions if s == SLOT_737)

    # Process from END to START so positions remain valid
    # Build the new ins strings
    if first_109[0] < first_737[0]:
        # 109 before 737 → swap them: change first 109's slot to 737, change first 737's slot to 109
        # We do this by doing string replacements, but only on the FIRST occurrence of each
        # of the data-ad-slot attributes within the ins blocks.

        # Locate the exact substring within each ins block
        # For the first 109 ins: replace data-ad-slot="1099212472" → data-ad-slot="7373732357"
        # But ONLY within that specific ins block (between first_109[0] and first_109[1])

        new_html = html

        # Replace 109 → 737 in first 109 block
        ins_start, ins_end = first_109
        block = new_html[ins_start:ins_end]
        new_block = block.replace('data-ad-slot="' + SLOT_109 + '"',
                                  'data-ad-slot="' + SLOT_737 + '"')
        new_html = new_html[:ins_start] + new_block + new_html[ins_end:]

        # Replace 737 → 109 in first 737 block. Position shifted by same delta (slot id lengths equal)
        ins_start, ins_end = first_737
        block = new_html[ins_start:ins_end]
        new_block = block.replace('data-ad-slot="' + SLOT_737 + '"',
                                  'data-ad-slot="' + SLOT_109 + '"')
        new_html = new_html[:ins_start] + new_block + new_html[ins_end:]

        return new_html, True
    else:
        return html, False


def process_page(slug, idx, slot_positions):
    with open(idx, 'r', encoding='utf-8') as f:
        html = f.read()

    if MARKER in html:
        return slug, 'SKIP (R684 marker present)', 0, 0

    new_html, ok = swap_first_two_slots(html, slot_positions)
    if not ok:
        return slug, 'SKIP (wrong order)', 0, 0

    # Insert marker comment BEFORE the first ins (which is now 737 after swap)
    # Find first <ins with 737
    m = re.search(r'<ins class="adsbygoogle"[^>]*data-ad-slot="' + SLOT_737 + '"', new_html)
    if m:
        # Insert marker comment on the line BEFORE the ins
        # Find the start of the line containing the ins
        line_start = new_html.rfind('\n', 0, m.start()) + 1
        new_html = new_html[:line_start] + MARKER + '\n' + new_html[line_start:]

    with open(idx, 'w', encoding='utf-8') as f:
        f.write(new_html)

    return slug, 'OK', new_html.count(SLOT_109), new_html.count(SLOT_737)


def main():
    candidates = find_candidates()
    print(f'Found {len(candidates)} candidate pages (109-before-737 in DOM)')
    if len(sys.argv) > 1 and sys.argv[1] == '--list':
        for slug, _, _ in candidates:
            print(f'  {slug}')
        return

    results = []
    for slug, idx, slot_positions in candidates:
        results.append(process_page(slug, idx, slot_positions))

    print(f'\n=== Results ({len(results)} pages) ===')
    ok = [r for r in results if r[1] == 'OK']
    skip = [r for r in results if r[1].startswith('SKIP')]
    err = [r for r in results if r[1].startswith('ERR')]
    print(f'OK: {len(ok)}, SKIP: {len(skip)}, ERR: {len(err)}')
    for slug, status, c109, c737 in ok[:30]:
        print(f'  {slug}: {status}  109={c109} 737={c737}')
    if len(ok) > 30:
        print(f'  ... and {len(ok) - 30} more')
    if skip:
        print(f'\nSKIP reasons:')
        from collections import Counter
        reasons = Counter(r[1] for r in skip)
        for reason, n in reasons.most_common():
            print(f'  {reason}: {n}')


if __name__ == '__main__':
    main()
