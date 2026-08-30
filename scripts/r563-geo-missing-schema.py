#!/usr/bin/env python3
"""R563 — GEO missing-schema fix: add BreadcrumbList + HowTo (templated) to 13 games + og:image meta to 1 page.

Targets:
  - 13 game pages missing BreadcrumbList schema (klotski/hex-haven/canal-lock/circuit-logic/etc.)
  - 1 page missing og:image meta (trebuchet-trajectory)

Idempotent: re-running on already-fixed pages is safe (skips via marker check).
"""
import os
import re
import json

BASE = "/home/junze/gamezipper.com"

# 13 games missing BreadcrumbList (verified via /tmp/geo-scan/full-coverage.txt)
# Each entry: slug -> (Game Name, Category URL, Category Display Name)
BREADCRUMB_TARGETS = [
    ("canal-lock", "Canal Lock", "https://gamezipper.com/puzzle-games.html", "Puzzle Games"),
    ("circuit-logic", "Circuit Logic", "https://gamezipper.com/puzzle-games.html", "Puzzle Games"),
    ("cover-orange", "Cover Orange", "https://gamezipper.com/puzzle-games.html", "Puzzle Games"),
    ("draw-one-part", "Draw One Part", "https://gamezipper.com/puzzle-games.html", "Puzzle Games"),
    ("helix-jump", "Helix Jump", "https://gamezipper.com/arcade-games.html", "Arcade Games"),
    ("hex-haven", "Hex Haven", "https://gamezipper.com/puzzle-games.html", "Puzzle Games"),
    ("klotski", "Klotski", "https://gamezipper.com/puzzle-games.html", "Puzzle Games"),
    ("killer-sudoku", "Killer Sudoku", "https://gamezipper.com/puzzle-games.html", "Puzzle Games"),
    ("pips", "Pips", "https://gamezipper.com/puzzle-games.html", "Puzzle Games"),
    ("tentai-show", "Tentai Show", "https://gamezipper.com/puzzle-games.html", "Puzzle Games"),
    ("tower-of-hanoi", "Tower of Hanoi", "https://gamezipper.com/puzzle-games.html", "Puzzle Games"),
    ("valve-network", "Valve Network", "https://gamezipper.com/puzzle-games.html", "Puzzle Games"),
    ("windmill-sudoku", "Windmill Sudoku", "https://gamezipper.com/puzzle-games.html", "Puzzle Games"),
]

# Marker for idempotency — embedded in the inserted block
R563_MARKER = "GEO-OPT R563 BreadcrumbList schema (idempotent)"

# Pages to add HowTo too (only those marked as high GEO value / missing HowTo)
# We'll do a small batch for HowTo - just tower-of-hanoi + klotski which are classic Nikoli/Chin puzzles high PV
HOWTO_TARGETS = [
    ("klotski", "Klotski", "Slide the blocks horizontally or vertically to create a path and free the special block (typically Cao Cao in red) through the gap in the wall to the exit."),
    ("tower-of-hanoi", "Tower of Hanoi", "Move stacked disks one at a time from the left peg to the right peg, using the middle peg as a buffer. Never place a larger disk on top of a smaller one. Solve all levels in the minimum number of moves."),
    ("hex-haven", "Hex Haven", "Tap two adjacent hex cells to draw a bridge between them, building connected paths. Match the visual clue pattern on each level to advance through 30 hand-crafted puzzles."),
    ("canal-lock", "Canal Lock", "Tap the lock gates at the right moment to raise or lower water levels and guide boats safely through the canal. Time your moves to avoid collisions and complete all 30 levels."),
    ("circuit-logic", "Circuit Logic", "Drag components onto the board and tap wire endpoints to draw circuit paths. Power the target light bulb by completing a closed electrical circuit from the battery to the bulb."),
]

# 1 page missing og:image meta tag
OG_IMAGE_TARGETS = [
    ("trebuchet-trajectory", "/trebuchet-trajectory/og-image.jpg"),
]


def make_breadcrumb_schema(slug, name, cat_url, cat_name):
    """Build a BreadcrumbList schema.org block (markdown multiline, mirrors existing games)."""
    return json.dumps({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://gamezipper.com/"},
            {"@type": "ListItem", "position": 2, "name": cat_name, "item": cat_url},
            {"@type": "ListItem", "position": 3, "name": name, "item": f"https://gamezipper.com/{slug}/"},
        ]
    }, indent=0, separators=(",", ":"))


def make_howto_schema(slug, name, play_desc):
    return json.dumps({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": f"How to Play {name}",
        "description": f"Step-by-step guide to playing {name} on GameZipper.",
        "totalTime": "PT2M",
        "step": [
            {"@type": "HowToStep", "position": 1, "name": "Open the game", "text": f"Navigate to gamezipper.com/{slug}/ in any modern browser. No download or installation needed."},
            {"@type": "HowToStep", "position": 2, "name": "Pick a level", "text": "Tap any unlocked level on the menu to start. Locked levels unlock as you complete earlier ones."},
            {"@type": "HowToStep", "position": 3, "name": "Play", "text": play_desc},
            {"@type": "HowToStep", "position": 4, "name": "Progress", "text": "Complete all levels to earn 3 stars. Use the restart button to try again if you get stuck."},
        ],
    }, separators=(",", ":"))


def make_breadcrumb_block(slug, name, cat_url, cat_name):
    """Mirror existing format: <script type=\"application/ld+json\">...</script> on its own line."""
    schema = make_breadcrumb_schema(slug, name, cat_url, cat_name)
    return f'\n<script type="application/ld+json">{schema}</script>\n<!-- {R563_MARKER} -->'


def make_howto_block(slug, name, play_desc):
    schema = make_howto_schema(slug, name, play_desc)
    return f'\n<script type="application/ld+json">{schema}</script>\n<!-- GEO-OPT R563 HowTo schema (idempotent) -->'


def fix_breadcrumb(slug, name, cat_url, cat_name):
    """Append BreadcrumbList schema block right before </head>. Idempotent via marker."""
    path = f"{BASE}/{slug}/index.html"
    with open(path, encoding="utf-8") as f:
        html = f.read()

    if R563_MARKER in html:
        return ("skip", "already has R563 marker")

    block = make_breadcrumb_block(slug, name, cat_url, cat_name)
    new_html, n = re.subn(r"\s*</head>", block + "</head>", html, count=1)
    if n != 1:
        return ("fail", f"</head> not found in {path}")

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_html)

    return ("ok", "BreadcrumbList appended")


def fix_howto(slug, name, play_desc):
    path = f"{BASE}/{slug}/index.html"
    with open(path, encoding="utf-8") as f:
        html = f.read()

    if "GEO-OPT R563 HowTo schema" in html:
        return ("skip", "HowTo already added")

    block = make_howto_block(slug, name, play_desc)
    # Insert before BreadcrumbList (which is right before </head>)
    new_html, n = re.subn(
        r'(<script type="application/ld\+json">[^<]*BreadcrumbList[^<]*</script>)',
        r'\1' + block,
        html, count=1
    )
    if n != 1:
        return ("fail", "BreadcrumbList anchor not found")

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_html)

    return ("ok", "HowTo appended")


def fix_og_image(slug, img_url):
    path = f"{BASE}/{slug}/index.html"
    with open(path, encoding="utf-8") as f:
        html = f.read()

    if 'name="og:image"' in html or 'property="og:image"' in html:
        return ("skip", "og:image already exists")

    # Insert og:image + og:image:width/height + twitter:image right after og:description or title
    insert_html = (
        f'\n<meta property="og:image" content="https://gamezipper.com{img_url}">'
        f'\n<meta property="og:image:width" content="1200">'
        f'\n<meta property="og:image:height" content="630">'
        f'\n<meta name="twitter:image" content="https://gamezipper.com{img_url}">'
        f'\n<!-- GEO-OPT R563 og:image meta (idempotent) -->'
    )
    # Try inserting after og:description
    new_html, n = re.subn(
        r'(<meta\s+property="og:description"[^>]*content="[^"]*"[^>]*>)',
        r'\1' + insert_html,
        html, count=1
    )
    if n == 0:
        # Fallback: insert after title
        new_html, n = re.subn(
            r'(</title>)',
            r'\1' + insert_html,
            html, count=1
        )
        if n != 1:
            return ("fail", "no og:description or </title> anchor")

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_html)

    return ("ok", "og:image meta appended")


def main():
    print("=== R563 — GEO missing-schema fix ===")
    print("Phase 1: BreadcrumbList (13 pages)")
    for slug, name, cat_url, cat_name in BREADCRUMB_TARGETS:
        status, msg = fix_breadcrumb(slug, name, cat_url, cat_name)
        print(f"  {status:4s} {slug:25s} {msg}")

    print("\nPhase 2: HowTo schema (5 pages — high GEO value subset)")
    for slug, name, play_desc in HOWTO_TARGETS:
        status, msg = fix_howto(slug, name, play_desc)
        print(f"  {status:4s} {slug:25s} {msg}")

    print("\nPhase 3: og:image meta (1 page)")
    for slug, img in OG_IMAGE_TARGETS:
        status, msg = fix_og_image(slug, img)
        print(f"  {status:4s} {slug:25s} {msg}")

    print("\n=== Done ===")


if __name__ == "__main__":
    main()
