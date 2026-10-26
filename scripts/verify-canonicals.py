#!/usr/bin/env python3
"""
verify-canonicals.py — site-wide gate: every INDEXABLE page's canonical must
resolve to a real, self-consistent URL.

Why this gate exists (R1001, 2026-10-27):
  16 served pages declared a <link rel="canonical"> whose href was a 404 URL
  (mostly blog posts whose canonical had a trailing slash instead of ".html",
  plus /sling-smash/ pointing at the non-existent /slingshot-smash/).
  A canonical pointing at a 404 is the worst possible canonical: Google drops
  the SOURCE page from the index, so the page gets zero organic traffic and
  zero ad revenue. All 16 had 0 impressions in GSC for the whole 28d window
  while sibling blog posts with correct canonicals kept ranking.

  These URLs ARE in sitemap.xml (819 entries), so Google was actively being
  told to crawl pages that then disowned themselves. No existing gate caught
  this: scripts/verify_sitemap.py checks URL count/format, and
  scripts/seo_health_check.py does not inspect canonical targets at all.

Scope = the pages Google is actually told to crawl:
  - every URL in sitemap.xml
  - every game directory (/<slug>/)
  - every blog post (/blog/*.html)
Pages outside that set (utility/test helpers such as oauth-helper.html,
test-media.html, contexto/icon_*.html) are deliberately excluded: they are
not in the sitemap and are not meant to be indexed.

Checks per indexable page:
  1. a canonical tag exists
  2. the canonical href is on-site (https://gamezipper.com)
  3. the canonical href resolves to a real page in the repo
  4. the canonical href is the page's OWN final URL (not a sibling's URL that
     merely redirects) -- catches canonical pointing at a 301

Usage:
  python3 scripts/verify-canonicals.py            # check only (exit 1 on defect)
  python3 scripts/verify-canonicals.py --verbose  # list every page checked
"""
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://gamezipper.com"
SITEMAP = os.path.join(REPO, "sitemap.xml")

CANON = re.compile(r'<link\b[^>]*\brel\s*=\s*["\']?canonical["\']?[^>]*>', re.I)
HREF = re.compile(r'\bhref\s*=\s*["\']([^"\']*)["\']', re.I)
ROBOTS_NOINDEX = re.compile(r'<meta[^>]*name=["\']robots["\'][^>]*noindex', re.I)

# Pages intentionally folded into a surviving duplicate (dedup merge): the
# canonical points at the SURVIVOR, which still resolves. Adding a slug here
# is only needed if that pairing ever changes.
_dedup_merges = {
    BASE + "/blog/best-puzzle-games-free-online.html",  # <- blog/best-brain-games-free.html
}


def canonical_of(txt):
    m = CANON.search(txt)
    if not m:
        return None
    h = HREF.search(m.group(0))
    return h.group(1) if h else None


def local_path(url):
    """Map a site URL to a repo-relative path ('/' -> index.html)."""
    p = url.replace(BASE, "").split("?")[0].split("#")[0].lstrip("/")
    if p == "":
        return "index.html"
    return p


def final_url_for(rel):
    """The canonical URL a page should declare, given its repo-relative path."""
    if rel.endswith("/index.html"):
        return BASE + "/" + rel[: -len("index.html")]
    return BASE + "/" + rel


def indexable_paths():
    """Repo-relative paths of every page Google is told to crawl."""
    paths = set()

    # 1. sitemap.xml (authoritative list of published URLs)
    if os.path.isfile(SITEMAP):
        for loc in re.findall(r"<loc>([^<]+)</loc>", open(SITEMAP, encoding="utf-8").read()):
            paths.add(local_path(loc))

    # 2. every game directory
    for d in sorted(os.listdir(REPO)):
        if os.path.isdir(os.path.join(REPO, d)) and \
                os.path.isfile(os.path.join(REPO, d, "index.html")):
            paths.add(d + "/index.html")

    # 3. every blog post
    blog = os.path.join(REPO, "blog")
    if os.path.isdir(blog):
        for f in sorted(os.listdir(blog)):
            if f.endswith(".html"):
                paths.add("blog/" + f)

    return paths


def main():
    verbose = "--verbose" in sys.argv
    checked = skipped_noindex = 0
    defects = []
    for rel in sorted(indexable_paths()):
        path = os.path.join(REPO, rel)
        if not os.path.isfile(path):
            continue  # sitemap entry with no local file: not a canonical defect
        try:
            txt = open(path, encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        if ROBOTS_NOINDEX.search(txt):
            skipped_noindex += 1
            continue
        checked += 1
        canon = canonical_of(txt)
        want = final_url_for(rel)
        if canon is None:
            defects.append((rel, "NO_CANONICAL_TAG", ""))
            continue
        if not canon.startswith(BASE):
            defects.append((rel, "CANONICAL_OFFSITE", canon))
            continue
        tgt = local_path(canon)
        tgt_file = tgt if tgt.endswith(".html") else os.path.join(tgt, "index.html")
        if not os.path.isfile(os.path.join(REPO, tgt_file)):
            defects.append((rel, "CANONICAL_TARGET_MISSING", canon))
            continue
        # canonical must be the page's own final URL, UNLESS it is an
        # intentional cross-reference:
        #   - /zh/** pages canonical to their English original (translation
        #     pairing: the zh page declares the en page as primary, and the
        #     hreflang cluster on both sides makes that explicit)
        #   - /blog/ and /blog/index.html canonical to /blog.html (the single
        #     canonical blog index)
        #   - a page folded into a surviving duplicate (dedup merge)
        # In all of those the target must still RESOLVE (checked above).
        if canon.rstrip("/") != want.rstrip("/"):
            intentional = (
                rel.startswith("zh/")                       # zh -> en pairing
                or rel in ("index.html", "blog/index.html")  # blog index aliases
                or canon.rstrip("/") in _dedup_merges        # dedup -> survivor
            )
            if not intentional:
                defects.append((rel, "CANONICAL_NOT_SELF", canon))
                continue
        if verbose:
            print("   ok  %s" % rel)

    print("canonical gate: %d indexable pages checked, %d noindex skipped, %d defects"
          % (checked, skipped_noindex, len(defects)))
    if defects:
        for rel, kind, canon in defects:
            print("   FAIL %-60s %s %s" % (rel, kind, canon))
        return 1
    print("PASS: every indexable page has a self-canonical that resolves.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
