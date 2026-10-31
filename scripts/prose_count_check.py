#!/usr/bin/env python3
"""
Prose count drift check (R1015).

Why this exists:
  The structured sync checks (GAMES array / JSON-LD numberOfItems / data-count
  spans / cat-count spans / api/games.json) can ALL be green while the
  human-readable marketing copy still advertises the previous catalog size.
  R1015 shipped exactly that: production said "466+ games" while the catalog
  and every structured counter already said 467.

  A wrong game count on the landing pages is a revenue problem, not a cosmetic
  one: it under-states inventory to advertisers/partners and it mismatches the
  catalog the search engines index.

SCOPE — only PUBLISHED pages are scanned:
    <root>/*.html, <root>/blog/*.html, <root>/llms*.txt
Dev artifacts (references/, test-library/, .phase0-*.md notes, per-game
BENCHMARK.md, scripts/, tests/) are intentionally NOT scanned: they are
historical records that legitimately quote old catalog sizes.

What counts as a "count":
  A standalone 3-digit number immediately followed by the word "games"
  (optionally with '+', an optional qualifier such as "free"/"HTML5"/
  "browser"/"online"/"mobile" in between). Both the plain form ("467+ games")
  and the URL-encoded form ("467%20%2B%20games", e.g. a Twitter share URL) are
  detected.

  Deliberately NOT counted:
    - JSON-LD "position":466  (an item position, not a total)
    - per-category totals like "392+ games" for the Puzzle category
    - numbers inside a longer digit run (e.g. 2026, 1012)
    - JS milestone maps ("100 Games! Legendary")

Usage:  prose_count_check.py <live_game_count> <category_counts_json>
Exit codes: 0 = no drift, 1 = drift found (or the check itself failed to run).
"""
import json
import os
import re
import sys

# 3-digit standalone number, then optional '+', whitespace, an optional
# qualifier ("free"/"HTML5"/"browser"/"online"/"mobile"/"instant"), then the
# word "games".
#
# The text is NORMALIZED before matching: percent-encoded copies are decoded
# first ("467%20%2B%20free%20browser%20games" -> "467 + free browser games").
# That is both simpler and more robust than trying to regex the encoded form —
# and it matters, because in the encoded form the digits are preceded by the
# "0" of "%20", which would trip a naive (?<!\d) lookbehind and silently miss
# exactly the case that shipped as a real bug (R1015's Twitter share URL).
SEP = r"(?:\+)?(?:\s+)"
QUAL = r"(?:free|html5|browser|online|mobile|instant)?"
COUNT_RE = re.compile(
    r"(?<!\d)(\d{3})(?!\d)" + SEP + r"(?:" + QUAL + SEP + r")*[Gg]ames",
    re.IGNORECASE)


def normalize(text):
    """Decode the percent-encoding used in share URLs so both forms match."""
    return (text.replace("%20", " ")
                .replace("%2B", "+")
                .replace("%2b", "+"))

MILESTONE_RE = re.compile(r"milestones\s*=|milestoneMap|achievements\s*=", re.IGNORECASE)

# Legitimate SUBSITE / floor claims that are intentionally NOT the catalog
# total. These are audited by hand, not auto-derived, so each one carries the
# reason it is allowed. Anything not in this map and not equal to the live
# catalog or a per-category total is treated as drift.
SUBSET_ALLOWED = {
    "100": "embeddable-games floor claim ('100+ free HTML5 games with "
           "copy-paste iframe codes') — every live game has an embedUrl, so "
           "this is a conservative marketing floor, not a catalog total",
}


def published_files(root):
    """Only the pages users/engines actually see."""
    out = []
    try:
        for fn in sorted(os.listdir(root)):
            p = os.path.join(root, fn)
            if os.path.isfile(p) and (fn.endswith(".html") or
                                      (fn.startswith("llms") and fn.endswith(".txt"))):
                out.append(p)
    except OSError:
        return []
    blog = os.path.join(root, "blog")
    if os.path.isdir(blog):
        try:
            for fn in sorted(os.listdir(blog)):
                p = os.path.join(blog, fn)
                if os.path.isfile(p) and fn.endswith(".html"):
                    out.append(p)
        except OSError:
            pass
    return out


def collect(root):
    hits = []
    for path in published_files(root):
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                for lineno, line in enumerate(fh, 1):
                    if MILESTONE_RE.search(line):
                        continue
                    norm = normalize(line)
                    for m in COUNT_RE.finditer(norm):
                        hits.append((os.path.relpath(path, root), lineno,
                                     m.group(1), line.strip()[:110]))
        except OSError:
            continue
    return hits


def main():
    if len(sys.argv) < 3:
        print("usage: prose_count_check.py <live_game_count> <category_counts_json>")
        return 1
    try:
        live = int(sys.argv[1])
        cats = json.loads(sys.argv[2])
    except (ValueError, TypeError) as e:
        print("prose check FAILED to parse inputs: %s" % e)
        return 1

    allowed = {live}
    for v in (cats.values() if isinstance(cats, dict) else cats):
        try:
            allowed.add(int(v))
        except (TypeError, ValueError):
            pass
    allowed |= {int(k) for k in SUBSET_ALLOWED}

    hits = collect(os.getcwd())
    if not hits:
        print("prose check FAILED: no count phrases matched at all — the regex "
              "or the published-file scope no longer matches this repo's copy "
              "(do not treat as pass)")
        return 1

    stale = [h for h in hits if int(h[2]) not in allowed]
    found = sorted({int(h[2]) for h in hits})
    print("prose counts found: %s (live=%d, files_scanned=%d)"
          % (found, live, len(published_files(os.getcwd()))))
    if stale:
        print("❌ PROSE count DRIFT — %d occurrence(s) advertise a count that is "
              "neither the live catalog nor a per-category total:" % len(stale))
        for f, ln, num, ctx in stale[:25]:
            print("   %s:%s  %s  | %s" % (f, ln, num, ctx))
        return 1
    print("prose counts OK — every count equals the live catalog (%d) or a "
          "per-category total" % live)
    return 0


if __name__ == "__main__":
    sys.exit(main())
