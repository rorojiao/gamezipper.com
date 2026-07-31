#!/usr/bin/env python3
"""
R372 Blog batch: inject AdSense display ad library (<script src="adsbygoogle.js">)
into all /blog/*.html that have <ins> but missing the loader.

Pattern (matches /blog/index.html + R349 canonical template):
  <!-- AdSense Auto Ads: 2026-07-31 page-level integration (R372 blog batch) -->
  <meta content="ca-pub-8346383990981353" name="google-adsense-platform-account">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8346383990981353" crossorigin="anonymous"></script>

Inserted before </head>. Idempotent: skips files that already contain
pagead2.googlesyndication.com (library loader present).

Usage: python3 add_adsense_lib_blog.py [--apply]
"""
import sys
import glob

HEAD_INSERT = (
    '\n<!-- AdSense Auto Ads: 2026-07-31 page-level integration (R372 blog batch) -->'
    '\n<meta content="ca-pub-8346383990981353" name="google-adsense-platform-account">'
    '\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8346383990981353" crossorigin="anonymous"></script>'
)

HAS_LIB = 'pagead2.googlesyndication.com'
HEAD_END = '</head>'
APPLY = '--apply' in sys.argv


def main():
    files = sorted(glob.glob('blog/*.html'))
    fixed = 0
    already = 0
    skipped = 0
    for p in files:
        # Skip blog/index.html (canonical which already has the lib)
        if p.endswith('/blog/index.html'):
            already += 1
            continue
        with open(p) as f:
            t = f.read()
        if HAS_LIB in t:
            already += 1
            continue
        if HEAD_END not in t:
            skipped += 1
            continue
        patched = t.replace(HEAD_END, HEAD_INSERT + '\n\n' + HEAD_END, 1)
        if not APPLY:
            print(f'  would fix: {p}')
        else:
            with open(p, 'w') as f:
                f.write(patched)
        fixed += 1
    print(f'\nSummary: {fixed} would-fix, {already} skipped (already OK), {skipped} skipped (no </head>)')
    if not APPLY:
        print('Run with --apply to write changes')


if __name__ == '__main__':
    main()
