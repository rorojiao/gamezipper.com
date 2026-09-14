#!/usr/bin/env python3
"""
R689: Add parallel 737 AdSense slot to single-slot blog posts.

Discovery (2026-09-14): 258 blog/*.html had only 1×1099212472 slot.
R516 partial-fixed 10 in 2026-08-22; never extended.

Slot 109 fills ~6x less than 737 (BI 7d: 56 vs 374 SBF on game pages).
Pattern: insert parallel 737 wrap AFTER first h2 (R516 CLS-safe).
Marker comment before wrap enables idempotent re-run.

Expected: +20-50 fills/day at 7d post-deploy (vs R644/R645 game-page cohort).

Usage:
    python3 scripts/r689-add-737-to-blog-posts.py [--dry-run]
"""
import os, re, sys, argparse

GZ_ROOT = '/home/junze/gamezipper.com'

MARKER = '<!-- ADS-OPT 2026-09-14 R689: 2nd AdSense slot (7373732357) for 258 single-slot blog posts. Slot 1099212472 fills ~6x less than 7373732357 (BI 7d: 374 vs 56 SBF). Pattern mirrors R516 (mid-content after first h2). Marker. -->'

WRAP_737 = '''<div style="position:relative;min-height:100px;max-height:280px;margin:24px auto;max-width:728px;text-align:center;overflow:hidden;contain:layout paint style;color:#666;font-size:.7em;background:transparent;border-radius:6px;box-sizing:border-box;line-height:100px"><span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;font-weight:500;pointer-events:none;transition:opacity .15s ease">Sponsored &middot; Advertisement</span><ins class="adsbygoogle" style="position:absolute!important;top:0!important;left:0!important;width:100%!important;max-width:728px!important;height:100%!important;max-height:280px!important;margin:0 auto!important;text-align:center;display:block" data-ad-client="ca-pub-8346383990981353" data-ad-slot="7373732357" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>'''


def fix_blog(fpath, dry_run=False):
    """Add 737 wrap after first h2 in single-slot blog. Idempotent."""
    html = open(fpath).read()

    # Skip if already has 737
    if '7373732357' in html:
        return 'SKIP_ALREADY_737'
    # Must have 109
    if '1099212472' not in html:
        return 'SKIP_NO_109'
    # Must have R383 wrap (canonical single-slot pattern)
    if 'R383' not in html:
        return 'SKIP_NO_R383'
    # Must have at least one h2 to anchor insertion
    if '<h2' not in html:
        return 'SKIP_NO_H2'
    # Must NOT already have R689 marker (idempotent)
    if 'R689' in html:
        return 'SKIP_ALREADY_R689'

    # Find first h2
    m = re.search(r'<h2[^>]*>.*?</h2>', html, re.DOTALL)
    if not m:
        return 'SKIP_NO_H2'
    insert_pos = m.end()

    # Find next structural element after </h2>: prefer after </p>, after <hr>, before <ul>
    p_match = re.search(r'</p>', html[insert_pos:])
    ul_match = re.search(r'<ul[^>]*>', html[insert_pos:])
    hr_match = re.search(r'<hr[^>]*>', html[insert_pos:])

    candidates = []
    if p_match:
        candidates.append(('p', insert_pos + p_match.end()))
    if ul_match:
        candidates.append(('ul', insert_pos + ul_match.start()))
    if hr_match:
        candidates.append(('hr', insert_pos + hr_match.start()))

    if candidates:
        candidates.sort(key=lambda x: x[1])
        elem_type, elem_pos = candidates[0]
        if elem_type == 'p':
            insert_pos = elem_pos
        elif elem_type == 'hr':
            hr_end = html.find('>', elem_pos) + 1
            insert_pos = hr_end
        elif elem_type == 'ul':
            insert_pos = elem_pos

    new_html = html[:insert_pos] + '\n' + MARKER + '\n' + WRAP_737 + '\n' + html[insert_pos:]

    if dry_run:
        return 'DRY_FIXED'

    with open(fpath, 'w') as f:
        f.write(new_html)
    return 'FIXED'


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--dry-run', action='store_true')
    p.add_argument('--root', default=GZ_ROOT)
    args = p.parse_args()

    fixed = 0
    skipped = {}
    errors = []

    for f in sorted(os.listdir(f'{args.root}/blog')):
        if not f.endswith('.html') or f == 'index.html':
            continue
        fpath = f'{args.root}/blog/{f}'
        try:
            status = fix_blog(fpath, dry_run=args.dry_run)
            skipped[status] = skipped.get(status, 0) + 1
            if status == 'FIXED' or status == 'DRY_FIXED':
                fixed += 1
        except Exception as e:
            errors.append((f, str(e)))

    print(f"\n=== R689 Summary ({'DRY-RUN' if args.dry_run else 'APPLIED'}) ===")
    print(f"FIXED: {fixed}")
    print(f"ERRORS: {len(errors)}")
    for s, c in skipped.items():
        print(f"  {s}: {c}")
    for f, err in errors[:10]:
        print(f"  ERROR {f}: {err}")


if __name__ == '__main__':
    main()