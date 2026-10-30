"""Tapa puzzle generator with solver verification.

DEPRECATED — 2026-10-31 (R339).

This script was the original Tapa generator and it shipped a LIVE P0: it
computed each clue's run lengths from the 8 neighbours in ROW-MAJOR order,
while the shipped engine (tapa/index.html) interprets a clue as the runs
around the CLOCKWISE ring of the 8 surrounding cells. The two protocols
disagree, so every generated clue was unreadable under the engine's own
rules: 0/30 shipped levels were rule-coherent and 120 clue cells were
arithmetically impossible. Independent audit confirmed 30/30 levels had NO
solution under the engine's rule.

The canonical generator is `tapa/gen.py`, which implements the SAME
clockwise-ring protocol as the engine and additionally proves every level
solvable AND unique (see `solve(..., limit=2)`).

This file is kept only as a thin compatibility wrapper so that any tooling
still invoking `build_levels.py` produces a CORRECT catalog instead of
re-generating the broken one. All level generation now happens in
`tapa/gen.py`.

NOTE: the old row-major implementation was REMOVED rather than left in
place — even unused, it was a loaded gun: any future edit that re-enabled
it would silently re-ship the P0.
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import gen as G  # noqa: E402  (canonical generator, clockwise-ring protocol)

# Tier spec must match gen.py's own main() so both paths agree.
TIERS = [
    ('easy', 5, 8, 0.34),
    ('medium', 7, 8, 0.38),
    ('hard', 10, 8, 0.40),
    ('expert', 12, 6, 0.42),
]


def generate_set(tier_name, n, count, density):
    """Delegate to the canonical generator (same protocol as the engine)."""
    return G.build_tier(tier_name, n, count, density, G.SEED + n)


def main():
    puzzles = []
    for tier_name, n, count, density in TIERS:
        puzzles += generate_set(tier_name, n, count, density)

    print('Generated %d puzzles total' % len(puzzles))

    data = [{
        'id': p['id'],
        'tier': p['tier'],
        'size': p['size'],
        'sol': p['sol'],
        'clue': p['clue'],
    } for p in puzzles]

    out = os.path.join(HERE, 'levels.json')
    with open(out, 'w') as f:
        json.dump(data, f, indent=1)

    print('Saved %d entries to %s' % (len(data), out))

    # Re-verify with the canonical solver: every level must have exactly
    # one solution and it must equal the stored one.
    ok = 0
    for lv in data:
        n = lv['size']
        sols, exh = G.solve(lv['clue'], n, limit=2, time_budget=60.0)
        if exh and len(sols) == 1 and sols[0] == lv['sol']:
            ok += 1
    print('Verified %d/%d (unique solution == stored solution)' % (ok, len(data)))


if __name__ == '__main__':
    main()
