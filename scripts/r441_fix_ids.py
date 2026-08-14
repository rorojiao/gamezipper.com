#!/usr/bin/env python3
"""R441 cleanup: remove duplicate r441-r441- prefix from IDs (cosmetic only)."""
from pathlib import Path

ROOT = Path("/home/junze/gamezipper.com/blog")
FILES = [
    "free-games-no-wifi-no-download.html",
    "free-games-to-play-on-airplane-no-wifi.html",
    "free-antistress-online.html",
]
RENAMES = {
    "gz-ad-r441-r441-wifi": "gz-ad-r441-wifi",
    "gz-ad-r441-r441-airplane": "gz-ad-r441-airplane",
    "gz-ad-r441-r441-antistress": "gz-ad-r441-antistress",
}

for filename in FILES:
    path = ROOT / filename
    text = path.read_text()
    n = 0
    for old, new in RENAMES.items():
        if old in text:
            text = text.replace(old, new)
            n += 1
    if n:
        path.write_text(text)
        print(f"OK {filename} — fixed {n} IDs")
    else:
        print(f"SKIP {filename} — already clean")
