#!/usr/bin/env python3
"""
nonblock_google_fonts.py
========================
Convert blocking Google Fonts <link rel="stylesheet"> to non-blocking preload pattern.
Improves FCP on game pages by ~100-300ms on cold cache (typical Google Fonts CSS RTT).

Pattern:
  BEFORE: <link href="https://fonts.googleapis.com/css2?..." rel="stylesheet">
  AFTER:  <link rel="preload" href="https://fonts.googleapis.com/css2?..." as="style" onload="this.rel='stylesheet'">
          <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?..."></noscript>

Idempotent: skips files already converted (detects "as=\"style\"" + onload pattern).

Usage:
  python3 .tools/nonblock_google_fonts.py <game_dir_1> [game_dir_2 ...]
  python3 .tools/nonblock_google_fonts.py --top-30     # auto-pick top-30 by 7d PV
  python3 .tools/nonblock_google_fonts.py --all-known  # all 152 known blocking pages

Verified safe:
- body already declares font-family with system fallback ('Segoe UI', Arial, sans-serif)
  so first paint renders in fallback font, then swap happens
- <noscript> preserves SEO crawlability and JS-disabled users
- onload swap is well-supported in all evergreen browsers
"""
import os, sys, re, sqlite3

BLOCKING_RE_A = re.compile(
    r'<link([^>]*?)href="(https://fonts\.googleapis\.com/css[^"]+)"([^>]*?)rel="stylesheet"([^>]*?)>',
    re.IGNORECASE,
)
BLOCKING_RE_B = re.compile(
    r'<link([^>]*?)rel="stylesheet"([^>]*?)href="(https://fonts\.googleapis\.com/css[^"]+)"([^>]*?)>',
    re.IGNORECASE,
)
ALREADY_DONE_RE = re.compile(
    r'<link[^>]*rel="preload"[^>]*href="https://fonts\.googleapis\.com/css[^"]+"[^>]*as="style"[^>]*>',
    re.IGNORECASE,
)

def patch_one(path: str, dry_run: bool = False) -> tuple[bool, str]:
    """Returns (changed, status_msg)."""
    try:
        with open(path, encoding='utf-8') as fp:
            html = fp.read()
    except (UnicodeDecodeError, FileNotFoundError) as e:
        return False, f'skip: {e}'

    if ALREADY_DONE_RE.search(html):
        return False, 'already-converted'

    # Find the URL
    m_a = BLOCKING_RE_A.search(html)
    m_b = BLOCKING_RE_B.search(html) if not m_a else None
    if not (m_a or m_b):
        return False, 'no-blocking-gfonts'

    if m_a:
        url = m_a.group(2)
        full_match = m_a.group(0)
    else:
        url = m_b.group(3)
        full_match = m_b.group(0)

    replacement = (
        f'<link rel="preload" href="{url}" as="style" '
        f'onload="this.rel=\'stylesheet\';this.onload=null">'
        f'<noscript><link rel="stylesheet" href="{url}"></noscript>'
    )
    new_html = html.replace(full_match, replacement, 1)

    # Sanity: ensure exactly one block was replaced
    if new_html.count(full_match) != html.count(full_match) - 1:
        return False, 'replace-count-mismatch'

    # Sanity: new html must not still have the blocking pattern for this URL
    if f'href="{url}"' in new_html and 'rel="stylesheet"' in new_html.split('href="' + url + '"', 1)[0][-300:]:
        # check if there's still a blocking line for this URL
        for line in new_html.split('\n'):
            if url in line and 'rel="stylesheet"' in line and '<noscript>' not in line and 'rel="preload"' not in line:
                return False, f'still-blocking: {line.strip()[:100]}'

    if dry_run:
        return True, f'would-patch: {full_match[:60]}... -> {replacement[:60]}...'

    with open(path, 'w', encoding='utf-8') as fp:
        fp.write(new_html)
    return True, 'patched'


def top_n_blocking_games(n: int = 30, db: str = '/home/msdn/gamezipper-bi/data/analytics.db') -> list[str]:
    """Return top-N game dirs by 7d PV that currently have blocking Google Fonts."""
    try:
        con = sqlite3.connect(db)
        rows = con.execute("""
          SELECT path, COUNT(*) as pv FROM events
          WHERE ts > datetime('now','-7 days') AND site='gamezipper.com' AND event='page_view'
          GROUP BY path ORDER BY pv DESC
        """).fetchall()
        con.close()
    except Exception as e:
        print(f'WARN: BI query failed: {e}', file=sys.stderr)
        return []

    out = []
    seen = set()
    for path, pv in rows:
        f = path.rstrip('/').lstrip('/')
        if not f or f in seen: continue
        seen.add(f)
        idx = os.path.join(f, 'index.html')
        if not os.path.isfile(idx):
            idx = f + '.html'
            if not os.path.isfile(idx):
                continue
        try:
            with open(idx, encoding='utf-8') as fp:
                html = fp.read()
        except: continue
        if BLOCKING_RE_A.search(html) or BLOCKING_RE_B.search(html):
            out.append(f)
            if len(out) >= n: break
    return out


def main():
    args = sys.argv[1:]
    dry_run = '--dry-run' in args
    args = [a for a in args if a != '--dry-run']

    if '--top-30' in args:
        targets = top_n_blocking_games(30)
        print(f'Auto-selected top-30 by 7d PV with blocking Google Fonts: {len(targets)}')
    elif '--all-known' in args:
        # All 152 known game dirs with blocking GFonts
        targets = []
        for d in sorted(os.listdir('.')):
            f = os.path.join(d, 'index.html')
            if not os.path.isfile(f): continue
            try:
                with open(f, encoding='utf-8') as fp:
                    html = fp.read()
            except: continue
            if BLOCKING_RE_A.search(html) or BLOCKING_RE_B.search(html):
                targets.append(d)
        print(f'Auto-selected all-known blocking-GFonts dirs: {len(targets)}')
    else:
        targets = args

    if not targets:
        print('No targets. Use --top-30, --all-known, or pass game dirs.')
        return

    patched = 0
    skipped = 0
    errors = 0
    for t in targets:
        f = os.path.join(t, 'index.html')
        if not os.path.isfile(f):
            f = t + '.html'
            if not os.path.isfile(f):
                print(f'  MISS: {t}')
                errors += 1
                continue
        ok, msg = patch_one(f, dry_run=dry_run)
        if ok:
            patched += 1
            print(f'  ✓ {t}: {msg}')
        else:
            skipped += 1
            if msg not in ('already-converted', 'no-blocking-gfonts'):
                print(f'  · {t}: {msg}')
    print(f'\nSummary: patched={patched} skipped={skipped} errors={errors} dry_run={dry_run}')


if __name__ == '__main__':
    main()