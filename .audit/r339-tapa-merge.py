#!/usr/bin/env python3
"""R339 — assemble the R339 tapa catalog from the per-tier JSON files.

The canonical generator (tapa/gen.py) builds each tier from an INDEPENDENT
seed (SEED + n), so building the tiers in parallel processes yields exactly
the same catalog the serial generator would have produced — only the ORDER in
which each tier is COMPUTED changes.

This script merges .audit/r339-tiers/<tier>.json back into the canonical tier
order (easy, medium, hard, expert), writes tapa/levels.json, and then runs the
R338 injector's own independent re-validation as a hard gate.

Usage: python3 .audit/r339-tapa-merge.py
"""
import json
import os
import subprocess
import sys

ROOT = '/home/junze/gamezipper.com'
TIER_DIR = os.path.join(ROOT, '.audit/r339-tiers')
TIERS = ['easy', 'medium', 'hard', 'expert']
OUT = os.path.join(ROOT, 'tapa/levels.json')


def main():
    merged = []
    for t in TIERS:
        p = os.path.join(TIER_DIR, t + '.json')
        if not os.path.exists(p):
            print('MISSING tier file: %s' % p)
            sys.exit(2)
        got = json.load(open(p))
        print('%-8s %d levels' % (t, len(got)))
        merged += got

    # id uniqueness + id order within the canonical tier order
    ids = [lv['id'] for lv in merged]
    if len(set(ids)) != len(ids):
        dup = [i for i in set(ids) if ids.count(i) > 1]
        print('DUPLICATE ids: %s' % dup)
        sys.exit(2)

    with open(OUT, 'w') as f:
        json.dump(merged, f, indent=1)
    print('wrote %s (%d levels)' % (OUT, len(merged)))

    # HARD GATE: the R338 injector's own independent re-validation must pass
    r = subprocess.run(['node', os.path.join(ROOT, '.audit/r338-tapa-inject.js'), '--check'],
                       capture_output=True, text=True, timeout=300)
    print('--- r338 --check ---')
    print(r.stdout.strip()[-2000:])
    if r.stderr.strip():
        print('STDERR:', r.stderr.strip()[-800:])
    print('r338 --check exit = %d' % r.returncode)
    sys.exit(r.returncode)


if __name__ == '__main__':
    main()
