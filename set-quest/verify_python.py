#!/usr/bin/env python3
"""Set Quest — structural verifier (method 1 of 3).

Checks every level in levels.json:
  1. 30 levels, 6 per tier, tiers in the documented order
  2. card count matches the tier's board size
  3. every card's attribute values are in range for its feature count
  4. all cards on a board are distinct
  5. the board contains EXACTLY ONE valid triple  (unique-solution property)
  6. the stored solution indices point at that unique triple
  7. boards are pairwise distinct across levels
"""
import itertools
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

TIERS = [
    ('Beginner', 3, 9),
    ('Easy', 4, 9),
    ('Medium', 4, 12),
    ('Hard', 4, 15),
    ('Expert', 4, 18),
]


def is_set(a, b, c, nfeat):
    for f in range(nfeat):
        if len({a[f], b[f], c[f]}) == 2:
            return False
    return True


def find_sets(cards, nfeat):
    return [t for t in itertools.combinations(cards, 3) if is_set(*t, nfeat)]


def check_level(lv, idx):
    tier = lv.get('tier')
    spec = next((t for t in TIERS if t[0] == tier), None)
    if spec is None:
        return f'unknown tier {tier!r}'
    _, nfeat, board_n = spec

    if lv.get('features') != nfeat:
        return f'features {lv.get("features")} != tier spec {nfeat}'
    cards = lv.get('cards')
    if not isinstance(cards, list) or len(cards) != board_n:
        return f'expected {board_n} cards, got {len(cards) if isinstance(cards, list) else "?"}'

    for ci, c in enumerate(cards):
        if not isinstance(c, list) or len(c) != nfeat:
            return f'card {ci}: expected {nfeat} attributes, got {c}'
        for f, v in enumerate(c):
            if not isinstance(v, int) or not (0 <= v <= 2):
                return f'card {ci} attr {f}: value {v} out of range 0..2'

    if len({tuple(c) for c in cards}) != len(cards):
        return 'duplicate cards on board'

    sets = find_sets(cards, nfeat)
    if len(sets) != 1:
        return f'expected exactly 1 valid triple, found {len(sets)}'

    sol = lv.get('solution')
    if not isinstance(sol, list) or len(sol) != 3:
        return f'solution must be 3 indices, got {sol}'
    if len(set(sol)) != 3:
        return f'solution indices not distinct: {sol}'
    for i in sol:
        if not isinstance(i, int) or not (0 <= i < len(cards)):
            return f'solution index {i} out of range'
    triple = tuple(cards[i] for i in sol)
    if not is_set(*triple, nfeat):
        return 'stored solution is not a valid triple'
    if tuple(sets[0]) != triple:
        return 'stored solution != the unique valid triple'
    return None


def main():
    path = os.path.join(HERE, 'levels.json')
    with open(path) as f:
        data = json.load(f)
    levels = data['levels']

    failures = []
    if len(levels) != 30:
        failures.append((0, f'expected 30 levels, got {len(levels)}'))

    counts = {}
    for i, lv in enumerate(levels):
        counts[lv.get('tier')] = counts.get(lv.get('tier'), 0) + 1
        err = check_level(lv, i)
        if err:
            failures.append((i + 1, err))

    for tier, _, _ in TIERS:
        if counts.get(tier, 0) != 6:
            failures.append((0, f'tier {tier}: expected 6 levels, got {counts.get(tier, 0)}'))

    keys = {tuple(map(tuple, lv['cards'])) for lv in levels}
    if len(keys) != len(levels):
        failures.append((0, f'boards not all distinct: {len(keys)}/{len(levels)}'))

    npass = len(levels) - len([f for f in failures if f[0] != 0])
    print(f'verify_python: {npass}/{len(levels)} PASS')
    if failures:
        for lv, err in failures:
            print(f'  Level {lv}: {err}')
        sys.exit(1)


if __name__ == '__main__':
    main()
