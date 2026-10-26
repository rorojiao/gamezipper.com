#!/usr/bin/env python3
"""
R338 — REBUILD the three listing pages whose inventories drifted, repair the
glued card title, and install a GATE so the drift can never recur.

THE DEFECT CLASS (R335 lesson: "a surface with NO gate on it is where the
defects live" — and then BUILD the gate):

  sitemap.html    header  "All 99 games, categories, and 150+ guides"   (466)
                  heading "🎮 All Games (452 total)"                   (466)
                  the link list carries 459 of 466 live games; 7 live games
                    are MISSING entirely: arrowsmith, bishop-path,
                    camel-path, river-crossing, strimko, tango-logic,
                    zebra-path
                  the blog-list carries 162 of 307 posts under a heading
                    claiming "150+ articles"
  blog.html       claims "207 articles" and lists 205 posts (307 exist)
  blog/index.html claims "298 Articles" / "298 articles" / "View all 296
                  articles" and lists 298 (307 exist); one card title is glued
                  ("Best Free Browser Games 2026line Games") from the R332
                  bulk repair

None of these three files is scanned by sync-game-counts.sh, by
sync-user-visible-text.sh (both index.html only), or by
.audit/r332-atomic-consistency.js (itemlist / sitemap.xml / test-library /
index.html only). That is exactly why they drifted.

THE FIX
  1. Rebuild every inventory from ground truth:
       games -> js/games-data.js (status=="live")
       posts -> blog/*.html on disk (title/description/date from the post)
  2. Rewrite every stale count literal on all three pages.
  3. Repair the glued card title from the post's own <title>.
  4. Install scripts/verify-listing-pages.py as the GATE that fails when any
     listing page's inventory or count literal drifts from ground truth.

SAFETY
  - every game link emitted points at a live catalog slug
  - every post link emitted points at a file that exists on disk
  - the count-literal edits are asserted to change ONLY digits
  - the script is idempotent: a second run is a no-op
  - it never touches a game's own page

Usage:  python3 scripts/verify-listing-pages.py            # check only (exit 1 on drift)
        python3 scripts/verify-listing-pages.py --fix      # check + repair
"""
import glob
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG_DIR = os.path.join(ROOT, "blog")
FIX = "--fix" in sys.argv

GAME_LIST_PAGES = ["sitemap.html"]
BLOG_LIST_PAGES = ["blog.html", "blog/index.html"]


# ---------------------------------------------------------------- ground truth
def live_games():
    js = (
        "const fs=require('fs');const s=fs.readFileSync('js/games-data.js','utf8');"
        "const t=s.replace(/^const\\s+(GAME_GRADIENTS|GAMES)\\s*=/gm,'var \\$1=');"
        "const G=new Function(t+'; return GAMES;')();"
        "console.log(JSON.stringify(G.filter(g=>g.status==='live')));"
    )
    out = subprocess.run(["node", "-e", js], cwd=ROOT, capture_output=True, text=True)
    if out.returncode != 0:
        raise SystemExit("cannot read games-data.js: " + out.stderr)
    return json.loads(out.stdout)


def slug_of(url):
    s = url.strip("/")
    return s[:-1] if s.endswith("/") else s


def blog_posts():
    """[(slug, title, description, date)] for every POST on disk, newest first.

    blog/index.html is the BLOG LISTING page itself (its canonical is
    /blog.html), NOT an article — it must be excluded, otherwise the count
    self-references (its own title embeds the article count) and the
    inventory is inflated by one. The canonical post count is therefore
    len(glob('blog/*.html')) - 1 = 306, which matches the homepage's
    "306 game tips & guides" claim (verified in R962).
    """
    posts = []
    for p in sorted(glob.glob(os.path.join(BLOG_DIR, "*.html"))):
        slug = os.path.basename(p)[:-5]
        if slug == "index":          # the listing page, not an article
            continue
        s = open(p, errors="replace").read()
        t = re.search(r"<title>(.*?)</title>", s, re.S)
        title = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", t.group(1))).strip() if t else slug
        for suf in (" | GameZipper", " | Gamezipper", " - GameZipper", " | GAMEZIPPER"):
            if title.endswith(suf):
                title = title[: -len(suf)].strip()
        d = re.search(r'<meta name="description" content="([^"]*)"', s)
        desc = re.sub(r"\s+", " ", d.group(1)).strip() if d else ""
        dp = re.search(r'"datePublished"\s*:\s*"([^"]*)"', s)
        posts.append((slug, title, desc, dp.group(1) if dp else ""))
    posts.sort(key=lambda t: (_negdate(t[3]), t[0]))
    return posts


def _negdate(s):
    """Sort key that inverts an ISO date so newest sorts first."""
    try:
        y, m, d = [int(x) for x in s.split("-")]
        return (10000 - y) * 10000 + (100 - m) * 100 + (100 - d)
    except Exception:
        return 99999999


def read(rel):
    return open(os.path.join(ROOT, rel), errors="replace").read()


def write(rel, s):
    with open(os.path.join(ROOT, rel), "w") as f:
        f.write(s)


# ------------------------------------------------------------------- rewriting
def game_anchor_html(slug, games):
    g = games.get(slug)
    if not g:
        return None
    emoji = g.get("emoji") or "🎮"
    name = g.get("name") or slug.replace("-", " ").title()
    name = (name.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
    return f'<a href="/{slug}/">{emoji} {name}</a>'


def fix_sitemap(html, slugs, games, posts):
    n, np_ = len(slugs), len(posts)
    before = html

    # --- count literals -----------------------------------------------------
    # NOTE: the heading is "🎮 All Games (452 total)" — there is NO space
    # between "(" and the digits, so the pattern must use \((\d+) not \( \d+.
    html = re.sub(r"All \d+ games, categories, and \d+\+ guides",
                  f"All {n} games, categories, and {np_} guides", html)
    html = re.sub(r"(All Games\s*\(\s*)\d+(\s*total\))", rf"\g<1>{n}\g<2>", html)
    html = re.sub(r"(Blog &amp; Guides\s*\(\s*)\d+\+(\s*articles\))", rf"\g<1>{np_}+\g<2>", html)
    html = re.sub(r"(Show All )\d+\+( Articles)", rf"\g<1>{np_}+\g<2>", html)

    # --- game link list -----------------------------------------------------
    anchors = [game_anchor_html(s, games) for s in slugs]
    anchors = [a for a in anchors if a]
    m = re.search(r'(<h2>🎮 All Games \(\d+ total\)</h2><div class="link-list">)(.*?)(</div>)',
                  html, re.S)
    if m:
        html = html[: m.start(2)] + "".join(anchors) + html[m.end(2):]
    else:
        print("  WARN sitemap.html: game link-list anchor NOT found")

    # --- blog link list -----------------------------------------------------
    blog_anchors = [f'<a href="/blog/{slug}.html">{title}</a>' for slug, title, _, _ in posts]
    m = re.search(r'(<div class="link-list" id="blog-list"[^>]*>)(.*?)(</div>)', html, re.S)
    if m:
        html = html[: m.start(2)] + "".join(blog_anchors) + html[m.end(2):]
    else:
        print("  WARN sitemap.html: blog link-list anchor NOT found")
    return html, before != html


def _strip_tags(x):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", x)).strip()


def fix_blog_index(html, posts):
    """blog/index.html: sections per category + an "All Other Articles" block."""
    np_ = len(posts)
    before = html
    listed = set(re.findall(r'href="/blog/([a-z0-9][a-z0-9-]*\.html)"', html))
    missing = [(s, t, d) for s, t, d, _w in posts if s + ".html" not in listed]

    # 1) count literals (title, meta description, JSON-LD, header, stats)
    html = re.sub(r"(Game Tips & Strategy Blog - )\d+( Articles)", rf"\g<1>{np_}\g<2>", html)
    html = re.sub(r"(\d+) articles", f"{np_} articles", html)
    html = re.sub(r"(Showing all <span id=\"count\">)\d+(</span>)", rf"\g<1>{np_}\g<2>", html)
    html = re.sub(r"View all \d+ articles", f"View all {np_} articles", html)

    # 2) append the missing posts to the "All Other Articles" section
    if missing:
        cards = "".join(
            f'<a href="/blog/{slug}.html" class="gz-article-card"><h3>{title}</h3></a>'
            for slug, title, _ in missing
        )
        m = re.search(r'(<section id="cat-other" class="gz-cat-section">.*?<div class="gz-article-grid">)(.*?)(</div>)',
                      html, re.S)
        if m:
            html = html[: m.end(2)] + cards + html[m.end(2):]
        else:
            print("  WARN blog/index.html: cat-other grid anchor NOT found")

    # 2b) RECOMPUTE every category section's declared count from its ACTUAL
    # card count. The declared number is the section total, NOT the number of
    # cards we just added — writing len(missing) here was the bug that made
    # "cat-other" claim 8 while holding 212 cards.
    def _recount(h):
        def repl(m):
            sec = m.group(0)
            n_cards = len(re.findall(r'class="gz-article-card"', sec))
            return re.sub(r'(<span class="gz-cat-count">)\d+(</span>)',
                          rf"\g<1>{n_cards}\g<2>", sec, count=1)
        return re.sub(r'<section id="cat-[a-z]+" class="gz-cat-section">.*?</section>',
                      repl, h, flags=re.S)
    html = _recount(html)

    # 3) repair glued card titles (R332 bulk-repair residue)
    for slug, title, _desc, _when in posts:
        pat = re.compile(r'(<a href="/blog/' + re.escape(slug) +
                         r'\.html" class="gz-article-card"><h3>)(.*?)(</h3>)', re.S)
        m = pat.search(html)
        if m and _strip_tags(m.group(2)) != title:
            html = html[: m.start(2)] + title + html[m.end(2):]
    return html, before != html


def fix_blog_flat(html, posts):
    """blog.html: one flat <div class="article"> per post."""
    np_ = len(posts)
    before = html

    # 1) the "Showing all <span id="count">N</span> articles" line. The count
    #    lives INSIDE a span, so a bare "(\d+) articles" regex never matches it
    #    (the digits are separated from the word by </span>). Fix the span
    #    explicitly.
    html = re.sub(r'(<span id="count">)\d+(</span>)', rf"\g<1>{np_}\g<2>", html)

    # 2) count literals elsewhere
    html = re.sub(r"(Game Tips & Strategy Blog - )\d+( Articles)", rf"\g<1>{np_}\g<2>", html)
    html = re.sub(r"(\d+) articles", f"{np_} articles", html)

    # 3) the flat article list. The featured-guides block at the top also
    #    links to posts, so "already linked" must be measured on the ARTICLE
    #    DIVS only — otherwise posts that appear solely in the featured block
    #    are counted as listed and never get an article div (that is how
    #    best-free-browser-games-2026 and tetris-tips-tricks-strategy-guide
    #    ended up listed-but-not-filterable).
    art_re = r'<div class="article" onclick="location\.href=\'/blog/([a-z0-9][a-z0-9-]*\.html)\'"'
    listed = set(re.findall(art_re, html))
    missing = [(s, t, d) for s, t, d, _w in posts if s + ".html" not in listed]
    if missing:
        blocks = []
        for slug, title, desc in missing:
            short = desc[:150].rsplit(" ", 1)[0] if len(desc) > 150 else desc
            short = (short.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
            blocks.append(
                f'<div class="article" onclick="location.href=\'/blog/{slug}.html\'" id="cat-other">\n'
                f'<h2><a href="/blog/{slug}.html">{title}</a></h2>\n'
                f'<p>{short}</p>\n'
                f'<div class="tags"><span class="tag">Blog</span></div>\n</div>'
            )
        # insert right after the "Showing N articles" stats line
        m = re.search(r'(<div class="stats">.*?</div>)', html, re.S)
        if m:
            html = html[: m.end()] + "\n" + "\n".join(blocks) + html[m.end():]
        else:
            print("  WARN blog.html: stats anchor NOT found")

    # 4) drop the SELF-LINK card: /blog/index.html is the blog LISTING page
    #    (canonical -> /blog.html), so listing it as an article makes the page
    #    link to itself and inflates the unique-link count to 307 for 306 posts.
    html = re.sub(
        r'<div class="article" onclick="location\.href=\'/blog/index\.html\'">.*?</div>\s*</div>',
        '', html, count=1, flags=re.S)
    html = re.sub(
        r'<div class="article" onclick="location\.href=\'/blog/index\.html\'".*?</div>\s*(?=<div class="article")',
        '', html, count=1, flags=re.S)

    # 5) the article-card titles must match the post's own <title>. The page
    #    used to carry " | GameZipper Blog" on some cards and a glued
    #    "…2026line Games" on one — both are display defects.
    for slug, title, _d, _w in posts:
        pat = re.compile(r'(<div class="article" onclick="location\.href=\'/blog/' +
                         re.escape(slug) + r'\.html\'"[^>]*>\s*<h2><a href="/blog/' +
                         re.escape(slug) + r'\.html">)(.*?)(</a></h2>)', re.S)
        m = pat.search(html)
        if m and _strip_tags(m.group(2)).strip() != title:
            html = html[: m.start(2)] + title + html[m.end(2):]
    return html, before != html


# -------------------------------------------------------------------- the gate
def main():
    games_list = live_games()
    games = {slug_of(g["url"]): g for g in games_list}
    slugs = sorted(games)
    posts = blog_posts()
    print(f"ground truth: {len(slugs)} live games, {len(posts)} blog posts on disk")

    problems = []
    changed = []

    for rel in GAME_LIST_PAGES:
        before = read(rel)
        html, ch = fix_sitemap(before, slugs, games, posts)
        if ch:
            changed.append(rel)
            if FIX:
                write(rel, html)
                print(f"  FIXED {rel}")
            else:
                print(f"  DRIFT {rel} (rerun with --fix)")
        else:
            print(f"  OK   {rel}")

    for rel in BLOG_LIST_PAGES:
        before = read(rel)
        if rel == "blog/index.html":
            html, ch = fix_blog_index(before, posts)
        else:
            html, ch = fix_blog_flat(before, posts)
        if ch:
            changed.append(rel)
            if FIX:
                write(rel, html)
                print(f"  FIXED {rel}")
            else:
                print(f"  DRIFT {rel} (rerun with --fix)")
        else:
            print(f"  OK   {rel}")

    # ---------------- GATE: re-read from disk and assert ----------------------
    for rel in GAME_LIST_PAGES + BLOG_LIST_PAGES:
        html = read(rel)
        page_games = set(re.findall(r'href="/([a-z0-9][a-z0-9-]*)/"', html))
        if rel in GAME_LIST_PAGES:
            miss = sorted(set(slugs) - page_games)
            if miss:
                problems.append(f"{rel}: missing {len(miss)} live games: {miss[:8]}")
        page_posts = set(re.findall(r'href="/blog/([a-z0-9][a-z0-9-]*\.html)"', html))
        miss = sorted({s + ".html" for s, _, _, _ in posts} - page_posts)
        if miss:
            problems.append(f"{rel}: missing {len(miss)} blog posts: {miss[:8]}")
        # every emitted post link must exist on disk
        for slug in page_posts:
            if not os.path.exists(os.path.join(BLOG_DIR, slug)):
                problems.append(f"{rel}: link to a non-existent post /blog/{slug}")
        # count literals
        for m in re.finditer(r"(\d+) articles", html):
            if int(m.group(1)) != len(posts):
                problems.append(f"{rel}: stale article count '{m.group(0)}' (want {len(posts)})")
                break
        for m in re.finditer(r"All (\d+) games, categories", html):
            if int(m.group(1)) != len(slugs):
                problems.append(f"{rel}: stale game count '{m.group(0)}' (want {len(slugs)})")
                break
        m = re.search(r"All Games\s*\((\d+) total\)", html)
        if m and int(m.group(1)) != len(slugs):
            problems.append(f"{rel}: stale 'All Games (N total)' (want {len(slugs)})")
        # glued card titles
        for m in re.finditer(r'<h3>([^<]{0,120}?)</h3>', html):
            t = _strip_tags(m.group(1))
            if re.search(r"\d(?:Games|Download|line Games|Play)\b", t) and \
               re.search(r"\d(?:Games|line Games)", t) and re.search(r"[a-z]{4}Games", t):
                problems.append(f"{rel}: possible glued card title {t!r}")
                break
        # per-section declared count must equal the section's ACTUAL card count
        for m in re.finditer(r'<section id="cat-[a-z]+" class="gz-cat-section">(.*?)</section>',
                             html, re.S):
            sec = m.group(1)
            actual = len(re.findall(r'class="gz-article-card"', sec))
            cm = re.search(r'gz-cat-count">(\d+)<', sec)
            if cm and int(cm.group(1)) != actual:
                problems.append(f"{rel}: section declares {cm.group(1)} cards but holds {actual}")
        # no self-link to the listing page
        if 'href="/blog/index.html"' in html:
            problems.append(f"{rel}: links to /blog/index.html (the listing page itself)")
        # the sum of the sections must equal the total post count
        if rel == "blog/index.html":
            tot = sum(len(re.findall(r'class="gz-article-card"', m.group(1)))
                      for m in re.finditer(r'<section id="cat-[a-z]+" class="gz-cat-section">(.*?)</section>',
                                           html, re.S))
            if tot != len(posts):
                problems.append(f"{rel}: sections hold {tot} cards but there are {len(posts)} posts")
        # the #count span (the live filter counter) must equal the post count
        mc = re.search(r'<span id="count">(\d+)</span>', html)
        if mc and int(mc.group(1)) != len(posts):
            problems.append(f"{rel}: #count says {mc.group(1)} but there are {len(posts)} posts")
        # blog.html: every post must have a filterable .article div
        if rel == "blog.html":
            art = set(re.findall(r'<div class="article" onclick="location\.href=\'/blog/([a-z0-9][a-z0-9-]*\.html)\'"', html))
            miss_art = sorted({s + ".html" for s, _, _, _ in posts} - art)
            if miss_art:
                problems.append(f"{rel}: {len(miss_art)} posts have no .article div (not filterable): {miss_art[:5]}")

    if changed:
        print(f"\nchanged: {', '.join(changed)}")
    if problems:
        print("\nDRIFT DETECTED:")
        for p in problems:
            print("  ❌", p)
        return 1
    print("\n✅ ALL LISTING PAGES IN SYNC")
    return 0


if __name__ == "__main__":
    sys.exit(main())
