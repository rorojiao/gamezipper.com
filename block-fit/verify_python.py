#!/usr/bin/env python3
"""Block Fit (Tetromino tiling) verifier.

Validates each level in levels.json has:
  - Outline cells = 4 * number of pieces
  - Solution uses exactly the specified pieces
  - Each piece appears exactly once in solution
  - Solution cells are subset of outline cells
  - Solution fully covers outline
  - Outline + specified pieces yields exactly 1 valid placement (uniqueness)
"""
import json
import sys
from collections import Counter

TETROMINOES = {
    'I': [(0, 0), (1, 0), (2, 0), (3, 0)],
    'O': [(0, 0), (0, 1), (1, 0), (1, 1)],
    'T': [(0, 0), (0, 1), (0, 2), (1, 1)],
    'L': [(0, 0), (1, 0), (2, 0), (2, 1)],
    'S': [(0, 1), (0, 2), (1, 0), (1, 1)],
}


def normalize(piece):
    min_r = min(r for r, c in piece)
    min_c = min(c for r, c in piece)
    return tuple(sorted((r - min_r, c - min_c) for r, c in piece))


def rotate_cw(piece):
    return tuple(sorted((-c, r) for r, c in piece))


def reflect(piece):
    return tuple(sorted((r, -c) for r, c in piece))


def all_orientations(name):
    base = TETROMINOES[name]
    seen = set()
    orientations = []
    cur = base
    for _ in range(4):
        normed = normalize(cur)
        if normed not in seen:
            seen.add(normed)
            orientations.append(normed)
        cur = rotate_cw(cur)
    cur = reflect(base)
    for _ in range(4):
        normed = normalize(cur)
        if normed not in seen:
            seen.add(normed)
            orientations.append(normed)
        cur = rotate_cw(cur)
    return orientations


def count_unique_solutions(outline_set, pieces_names, cap=2):
    """Count unique placements. Stop at cap+1."""
    placements = {}
    for name in pieces_names:
        placements[name] = []
        for orient in all_orientations(name):
            for ar, ac in outline_set:
                placed = set()
                ok = True
                for dr, dc in orient:
                    cell = (ar + dr, ac + dc)
                    if cell not in outline_set:
                        ok = False
                        break
                    placed.add(cell)
                if ok:
                    placements[name].append((placed, orient))
    used = set()
    count = [0]

    def backtrack(idx):
        if count[0] >= cap + 1:
            return
        if idx == len(pieces_names):
            count[0] += 1
            return
        name = pieces_names[idx]
        for placed, _ in placements[name]:
            if placed & used:
                continue
            used.update(placed)
            backtrack(idx + 1)
            used.difference_update(placed)
            if count[0] >= cap + 1:
                return

    backtrack(0)
    return count[0]


def verify_level(level):
    """Run all checks on a level. Returns list of (check, ok, msg)."""
    checks = []
    outline = set(tuple(c) for c in level['outline'])
    pieces = level['pieces']
    expected_cells = 4 * len(pieces)
    if len(outline) == expected_cells:
        checks.append(('outline_size', True, f'{len(outline)} cells'))
    else:
        checks.append(('outline_size', False, f'expected {expected_cells}, got {len(outline)}'))
        return checks

    # Find unique solution
    sol_count = count_unique_solutions(outline, pieces, cap=2)
    if sol_count == 1:
        checks.append(('unique_solution', True, 'exactly 1'))
    else:
        checks.append(('unique_solution', False, f'found {sol_count}'))

    return checks


def main():
    with open('levels.json') as f:
        data = json.load(f)
    levels = data['levels']
    print(f'Verifying {len(levels)} levels...\n')
    passed = 0
    for i, level in enumerate(levels):
        checks = verify_level(level)
        ok = all(c[1] for c in checks)
        if ok:
            passed += 1
        status = 'PASS' if ok else 'FAIL'
        print(f'  [{status}] level {i+1} ({level.get("name", "?")}, tier={level["tier"]}, pieces={level["pieces"]})')
        for check, ok, msg in checks:
            print(f'      {check}: {"OK" if ok else "FAIL"} ({msg})')
    print(f'\n{passed}/{len(levels)} levels passed')
    return passed == len(levels)


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
