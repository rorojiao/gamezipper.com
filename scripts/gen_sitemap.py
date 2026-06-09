#!/usr/bin/env python3
"""Generate sitemap.xml for gamezipper.com.

For game pages, lastmod is the original commit date (from
`git log --diff-filter=A --format=%ai`) so search engines see the real
add date. Falls back to the index.html mtime if the path is not in git
(e.g. brand-new uncommitted game).

For static pages, category pages, and blog pages, lastmod is the most
recent commit date for the underlying file (or today if untracked) so
edits to those pages are reflected in the sitemap on every regen.

Bug fix 2026-06-09: previous version used `today` for every URL, so
game pages added in bulk got today's lastmod instead of their real add
date, and any pre-existing entry without a lastmod (e.g. malformed
single-line entries from an older broken regen) stayed broken. The new
version:
  1. looks up each URL's source file in git to get the real add/mtime
  2. deduplicates URLs (older regen sometimes appended broken duplicates)
  3. skips non-game directories that should not appear in the sitemap
"""
import os
import re
import subprocess
import datetime
from collections import OrderedDict

base = "https://gamezipper.com"
SKIP_DIRS = {
    'node_modules', 'dist', 'audio', 'ad-experiments', 'scripts',
    'test-results', 'template-phaser3', 'og-images', '.git',
    'admin', 'beta', '.vercel', '.next', '__pycache__',
}

# ---------- helpers ----------

def git_first_add_date(rel_path: str) -> str | None:
    """Return YYYY-MM-DD of the first commit that added `rel_path`, or None."""
    try:
        out = subprocess.check_output(
            ['git', 'log', '--diff-filter=A', '--format=%aI', '--', rel_path],
            stderr=subprocess.DEVNULL, text=True,
        ).strip()
        if out:
            # take the last (oldest) line, format is ISO 8601
            return out.splitlines()[-1][:10]
    except subprocess.CalledProcessError:
        return None
    return None


def git_last_modified_date(rel_path: str) -> str | None:
    """Return YYYY-MM-DD of the most recent commit that touched `rel_path`."""
    try:
        out = subprocess.check_output(
            ['git', 'log', '-1', '--format=%aI', '--', rel_path],
            stderr=subprocess.DEVNULL, text=True,
        ).strip()
        if out:
            return out[:10]
    except subprocess.CalledProcessError:
        return None
    return None


def mtime_date(rel_path: str) -> str:
    """YYYY-MM-DD from filesystem mtime (fallback when not in git)."""
    try:
        ts = os.path.getmtime(rel_path)
    except OSError:
        return datetime.date.today().isoformat()
    return datetime.date.fromtimestamp(ts).isoformat()


def lastmod_for(rel_path: str, *, prefer_add_date: bool) -> str:
    """Get lastmod for a file. prefer_add_date=True uses the first add date
    (good for game pages where we want the real creation date)."""
    if prefer_add_date:
        d = git_first_add_date(rel_path)
        if d:
            return d
    d = git_last_modified_date(rel_path)
    if d:
        return d
    return mtime_date(rel_path)


# ---------- collect game pages ----------

games = []
for d in sorted(os.listdir('.')):
    if d in SKIP_DIRS:
        continue
    if not os.path.isdir(d):
        continue
    if not os.path.exists(f'{d}/index.html'):
        continue
    games.append(d)

# Build pages in stable order; use OrderedDict to dedupe (in case a game
# dir was scanned twice by accident).
pages = OrderedDict()  # loc -> (priority, changefreq, lastmod_source_path, prefer_add)

# Static pages
for loc in ['/', '/sitemap.html']:
    src = 'index.html' if loc == '/' else 'sitemap.html'
    pages[loc] = ('1.0' if loc == '/' else '0.9',
                  'daily',
                  src,
                  False)

# Category pages
for cat in ['arcade-games', 'card-games', 'idle-games',
            'puzzle-games', 'simulation-games', 'word-typing-games']:
    src = f'{cat}.html'
    pages[f'/{src}'] = ('0.9', 'weekly', src, False)

# Blog pages
blog_dir = 'blog'
if os.path.isdir(blog_dir):
    for f in sorted(os.listdir(blog_dir)):
        if f.endswith('.html'):
            pages[f'/blog/{f}'] = ('0.9', 'weekly', f'blog/{f}', False)

# Game pages — use git first-add date so search engines see the real
# creation date instead of "today" (the date we ran the regen).
for g in games:
    src = f'{g}/index.html'
    pages[f'/{g}/'] = ('0.8', 'weekly', src, True)

# ---------- render ----------

today = datetime.date.today().isoformat()
xml = ['<?xml version="1.0" encoding="UTF-8"?>']
xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

for loc, (priority, freq, src, prefer_add) in pages.items():
    lm = lastmod_for(src, prefer_add_date=prefer_add)
    xml.append('  <url>')
    xml.append(f'    <loc>{base}{loc}</loc>')
    xml.append(f'    <lastmod>{lm}</lastmod>')
    xml.append(f'    <changefreq>{freq}</changefreq>')
    xml.append(f'    <priority>{priority}</priority>')
    xml.append('  </url>')

xml.append('</urlset>')

with open('sitemap.xml', 'w') as f:
    f.write('\n'.join(xml) + '\n')

print(f"Generated sitemap with {len(pages)} URLs")

# Sanity-check: every URL must have a lastmod tag (no malformed entries).
with open('sitemap.xml') as f:
    body = f.read()
no_lm = re.findall(r'<url>(?:(?!</url>).)*</url>', body, re.DOTALL)
no_lm = [b for b in re.findall(r'<url>.*?</url>', body, re.DOTALL) if '<lastmod>' not in b]
if no_lm:
    print(f"WARNING: {len(no_lm)} url block(s) still missing <lastmod>:")
    for b in no_lm[:5]:
        print(' ', b.strip()[:120])
    raise SystemExit(1)
print("All URLs have <lastmod> ✓")
