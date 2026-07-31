#!/usr/bin/env python3
"""
Strip fabricated aggregateRating JSON-LD objects from game index.html files.

Removes P0 SEO spam — Google Search quality guidelines ban "generated reviews"
and "fabricated rating counts". gamezipper.com has no /api/reviews endpoint,
so all aggregateRating fields are synthetic (4.6-4.8 ratings with 18-12500
reviewCount values).

This handles THREE observed variants:
  - Variant A: multi-line indented JSON-LD (8 games)
  - Variant B: single-line compact `"aggregateRating":{...}` (146 games)
  - "Other":  single-line with whitespace `"aggregateRating": {...}` (63 games)

Field values may be either quoted strings OR numbers (e.g. `"ratingValue":4.8`
without quotes). This script accepts both.

Validation: After every fix, all `<script type="application/ld+json">` blocks
are JSON-parsed to ensure the surrounding VideoGame schema is still valid.
Exit 0 if all games clean, exit 1 if any game had a parse error or unstripped
remainder.

Usage:
  python3 scripts/strip-fabricated-aggregate-rating.py [--apply]
    --scan-only  : dry run, only report (default)
    --apply      : actually write files
    --slug X     : only process <X>/index.html (else all games)
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path("/home/msdn/gamezipper.com")

# Variant A: multi-line indented JSON-LD
PAT_A = re.compile(
    r',\s*\n\s*"aggregateRating"\s*:\s*\{\s*\n'
    r'(?:\s*"[^"]+"\s*:\s*(?:"[^"]*"|\d+(?:\.\d+)?)\s*,?\s*\n)*'
    r'\s*\}',
    re.MULTILINE,
)

# Variant B + "Other": single-line (with or without whitespace before {)
PAT_B = re.compile(
    r',?\s*"aggregateRating"\s*:\s*\{'
    r'\s*"@type"\s*:\s*"AggregateRating"'
    r'(?:\s*,\s*"[^"]+"\s*:\s*(?:"[^"]*"|\d+(?:\.\d+)?))*'
    r'\s*\}'
)


def strip_aggregate(content: str) -> tuple[str, int]:
    new, n_a = PAT_A.subn('', content)
    new, n_b = PAT_B.subn('', new)
    return new, n_a + n_b


def validate_json_ld(content: str) -> list[str]:
    errors = []
    for i, m in enumerate(re.findall(
        r'<script type="application/ld\+json">([\s\S]*?)</script>', content
    )):
        try:
            json.loads(m)
        except Exception as e:
            errors.append(f"block #{i}: {e}")
    return errors


def iter_games(slug: str | None = None):
    if slug:
        d = REPO_ROOT / slug
        if not d.is_dir():
            sys.exit(f"ERROR: {d} not a directory")
        yield slug, d / "index.html"
        return
    for entry in sorted(REPO_ROOT.iterdir()):
        if not entry.is_dir() or entry.name.startswith("."):
            continue
        if entry.name in {"js", "css", "assets", "data", "og-images",
                          "public", "admin", "api", "tools", "test-library",
                          "node_modules", "scripts", ".audit", "docs", "blog"}:
            continue
        idx = entry / "index.html"
        if idx.exists():
            yield entry.name, idx


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true",
                        help="Actually write files (default: dry-run)")
    parser.add_argument("--scan-only", action="store_true",
                        help="Alias for default dry-run")
    parser.add_argument("--slug", type=str, default=None,
                        help="Process single slug")
    args = parser.parse_args()
    apply = args.apply and not args.scan_only

    stats = {"scanned": 0, "fixed": 0, "skipped_no_match": 0,
             "remaining_after": 0, "json_err": 0}

    for slug, idx in iter_games(args.slug):
        orig = idx.read_text(encoding="utf-8", errors="replace")
        if "aggregateRating" not in orig:
            continue
        stats["scanned"] += 1
        new, n = strip_aggregate(orig)
        if n == 0:
            stats["skipped_no_match"] += 1
            print(f"  NO MATCH: {slug}")
            continue
        remaining = new.count("aggregateRating")
        if remaining > 0:
            stats["remaining_after"] += 1
            print(f"  PARTIAL: {slug} (removed {n} but {remaining} remain)")
            continue
        errors = validate_json_ld(new)
        if errors:
            stats["json_err"] += 1
            print(f"  JSON_ERR: {slug}")
            for e in errors[:3]:
                print(f"    {e}")
            continue
        if apply:
            idx.write_text(new, encoding="utf-8")
        stats["fixed"] += 1

    print(f"\n=== aggregateRating strip ===")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    if not apply:
        print(f"  (dry-run; use --apply to write)")
    sys.exit(0 if stats["json_err"] == 0 and stats["remaining_after"] == 0 else 1)


if __name__ == "__main__":
    main()