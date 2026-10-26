#!/usr/bin/env python3
"""
fix-canonicals.py — repair canonical tags that point at a non-existent URL.

Defect (verified 2026-10-27): 16 served pages declare a <link rel="canonical">
whose href resolves to HTTP 404. A canonical pointing at a 404 is the worst
possible canonical: Google drops the SOURCE page from the index entirely
(it is a soft-404 / "canonical points to a missing page" signal), so the
page earns zero organic traffic and zero ad revenue.

  - 13 blog posts: canonical had a trailing slash
      .../blog/best-minesweeper-online-free/      -> 404
    while the real URL is the .html file:
      .../blog/best-minesweeper-online-free.html   -> 200
  -  2 blog posts: canonical had a wrong path/slug -> 404
  -  1 game page  : sling-smash/ canonical -> /slingshot-smash/ (404)

Also normalises 4 blog posts whose canonical pointed at an extensionless URL
(/blog/X) while the sitemap + internal links use the .html form. GitHub Pages
serves /blog/X from blog/X.html, so that URL returns 200 with identical
content -- a duplicate-URL signal conflicting with the sitemap entry.

The fix: make every page self-canonical, pointing at the exact URL that the
sitemap lists and that internal links use.

Usage:
  python3 scripts/fix-canonicals.py            # check only (exit 1 if defects)
  python3 scripts/fix-canonicals.py --fix      # check + repair
"""
import os
import re
import sys
import urllib.error
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://gamezipper.com"

# Pages whose canonical resolves to 404 (verified against production 2026-10-27),
# plus extensionless-duplicate canonicals. Value = the canonical each page must have.
FIXES = {
    "blog/best-free-games-to-play-now-no-download.html":
        f"{BASE}/blog/best-free-games-to-play-now-no-download.html",
    "blog/best-free-shooting-games-online-no-download.html":
        f"{BASE}/blog/best-free-shooting-games-online-no-download.html",
    "blog/best-games-to-play-on-plane.html":
        f"{BASE}/blog/best-games-to-play-on-plane.html",
    "blog/best-minesweeper-online-free.html":
        f"{BASE}/blog/best-minesweeper-online-free.html",
    "blog/catch-games-online-free-no-download.html":
        f"{BASE}/blog/catch-games-online-free-no-download.html",
    "blog/free-online-chess-no-signup.html":
        f"{BASE}/blog/free-online-chess-no-signup.html",
    "blog/free-online-sudoku-puzzle-games.html":
        f"{BASE}/blog/free-online-sudoku-puzzle-games.html",
    "blog/friv-games-free-online-no-download.html":
        f"{BASE}/blog/friv-games-free-online-no-download.html",
    "blog/games-like-nyt-connections-free.html":
        f"{BASE}/blog/games-like-nyt-connections-free.html",
    "blog/games-to-play-when-bored-at-night-no-download.html":
        f"{BASE}/blog/games-to-play-when-bored-at-night-no-download.html",
    "blog/how-to-embed-free-games-on-your-website.html":
        f"{BASE}/blog/how-to-embed-free-games-on-your-website.html",
    "blog/play-tetris-online-free-complete-guide-2026.html":
        f"{BASE}/blog/play-tetris-online-free-complete-guide-2026.html",
    "blog/play-tetris-online-free-no-download.html":
        f"{BASE}/blog/play-tetris-online-free-no-download.html",
    "blog/play-tetris-without-internet.html":
        f"{BASE}/blog/play-tetris-without-internet.html",
    "blog/quick-games-to-play-in-5-minutes.html":
        f"{BASE}/blog/quick-games-to-play-in-5-minutes.html",
    "blog/snake-game-variations-online-free.html":
        f"{BASE}/blog/snake-game-variations-online-free.html",
    "blog/solitaire-games-free-online-no-download.html":
        f"{BASE}/blog/solitaire-games-free-online-no-download.html",
    "blog/t-rex-game-online-play-free-no-download.html":
        f"{BASE}/blog/t-rex-game-online-play-free-no-download.html",
    "blog/y8-games-free-online-no-download.html":
        f"{BASE}/blog/y8-games-free-online-no-download.html",
    "sling-smash/index.html":
        f"{BASE}/sling-smash/",
}

CANON_TAG = re.compile(r'<link\b[^>]*\brel\s*=\s*["\']?canonical["\']?[^>]*>', re.I)
HREF = re.compile(r'\bhref\s*=\s*["\']([^"\']*)["\']', re.I)


def current_canonical(txt):
    m = CANON_TAG.search(txt)
    if not m:
        return None, None
    h = HREF.search(m.group(0))
    return (h.group(1) if h else None), m.group(0)


def replace_canonical(txt, url):
    """Rewrite the href of the canonical tag, preserving attribute order/style."""
    m = CANON_TAG.search(txt)
    if m is None:
        return txt
    tag = m.group(0)
    new_tag = HREF.sub(lambda mm: 'href="%s"' % url, tag, count=1)
    return txt[:m.start()] + new_tag + txt[m.end():]


def main():
    fix = "--fix" in sys.argv
    problems, fixed = [], []
    for rel, want in sorted(FIXES.items()):
        path = os.path.join(REPO, rel)
        if not os.path.isfile(path):
            problems.append((rel, "FILE MISSING", None))
            continue
        txt = open(path, encoding="utf-8", errors="replace").read()
        cur, tag = current_canonical(txt)
        if cur is None:
            problems.append((rel, "NO CANONICAL TAG", None))
            continue
        if cur.rstrip("/") == want.rstrip("/"):
            continue  # already correct
        if not fix:
            problems.append((rel, cur, want))
            continue
        new_txt = replace_canonical(txt, want)
        # sanity: exactly one canonical tag, and it now carries the wanted URL
        tags = CANON_TAG.findall(new_txt)
        if len(tags) != 1:
            problems.append((rel, "REFUSED: %d canonical tags" % len(tags), want))
            continue
        got, _ = current_canonical(new_txt)
        if got != want:
            problems.append((rel, "REFUSED: rewrite produced %r" % got, want))
            continue
        open(path, "w", encoding="utf-8").write(new_txt)
        fixed.append((rel, cur, want))

    if fixed:
        print("FIXED %d page(s):" % len(fixed))
        for rel, old, new in fixed:
            print("   %-58s %s -> %s" % (rel, old, new))
    if problems:
        print("\n%d page(s) still defective:" % len(problems))
        for rel, cur, want in problems:
            print("   %-58s current=%s want=%s" % (rel, cur, want))
        return 1
    if not fixed:
        print("OK: all %d tracked pages have a correct self-canonical." % len(FIXES))
    return 0


if __name__ == "__main__":
    sys.exit(main())
