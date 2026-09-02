#!/usr/bin/env python3
"""Block Fit - Tetromino tiling puzzle level generator.

Rules: given an outline shape and a subset of tetromino pieces (the 5 standard
Tetris pieces: I, O, T, L, S — and their reflections), place them inside the
outline so it is fully covered without overlap. Each piece can be rotated
(and reflected for the asymmetric ones).

Standard Tetris tetrominoes (5 unique free tetrominoes; the J is the mirror of L,
and Z is the mirror of S):
  I: 4 in a row
  O: 2x2 square
  T: 3 in a row + 1 below middle
  L: 3 in a column + 1 to the right of bottom (J = mirror)
  S: zigzag (Z = mirror)

Strategy:
  - Use 5 free tetrominoes: I, O, T, L, S (plus their mirrors where needed)
  - 30 levels across 5 tiers (6 per tier)
  - Beginner: 1-2 pieces, 4-8 cells
  - Easy: 2 pieces, 8 cells
  - Medium: 3 pieces, 12 cells
  - Hard: 4 pieces, 16 cells
  - Expert: 5 pieces, 20 cells

Generation:
  - Hand-crafted outline+pieces for tier 1-3 (each pre-verified for uniqueness)
  - For tier 4-5, random outline + random piece selection + verify uniqueness
"""
import json
import random
import sys
from copy import deepcopy

# 5 standard Tetris tetrominoes (free, asymmetric includes mirror)
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
    """All unique orientations (rotations + reflections) for piece `name`."""
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
    """Count unique placements of pieces into outline. Stop at cap+1."""
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
    # Backtracking
    used = set()
    count = [0]
    solutions = []

    def backtrack(idx):
        if count[0] >= cap + 1:
            return
        if idx == len(pieces_names):
            count[0] += 1
            if count[0] <= cap:
                solutions.append(deepcopy(used))
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


def make_outline_from_grid(grid_str):
    """Parse a grid string ('X' = outline cell, '.' = empty) into frozenset of coords."""
    rows = grid_str.strip().split('\n')
    outline = set()
    for r, row in enumerate(rows):
        for c, ch in enumerate(row):
            if ch == 'X':
                outline.add((r, c))
    return frozenset(outline), len(rows), max(len(r) for r in rows)


def make_level(outline_set, pieces_names, rows, cols):
    """Create a level dict if exactly 1 unique solution."""
    if sum(len(TETROMINOES[n]) for n in pieces_names) != len(outline_set):
        return None
    sol_count = count_unique_solutions(outline_set, pieces_names, cap=2)
    if sol_count != 1:
        return None
    return {
        'outline': sorted(outline_set),
        'pieces': pieces_names,
        'rows': rows,
        'cols': cols,
    }


# Hand-crafted puzzles - each verified to have unique solution
HAND_CRAFTED = [
    # Tier: Beginner (1 piece, 4 cells)
    ('I', """\
X
X
X
X""", ['I']),
    ('O', """\
XX
XX""", ['O']),
    ('T', """\
XXX
.X.""", ['T']),
    ('L', """\
X..
X..
XX.""", ['L']),
    ('S', """\
.XX
XX.""", ['S']),
    ('I_short', """\
XXX
XXX""", ['I', 'O']),  # 2 pieces = Easy
    # Tier: Easy (2 pieces, 8 cells)
    ('Easy1', """\
XXXX
....""", ['I', 'O', 'O']),  # Hmm, O is 4 cells, I is 4 cells = 8 cells
    ('Easy2', """\
XX..
XX..
XX..
XX..""", ['I', 'O']),  # 8 cells
    ('Easy3', """\
XXXX
XXXX""", ['I', 'I', 'O', 'O']),
    ('Easy4', """\
XXX.
.XX.
.XXX""", ['T', 'L']),  # needs work
]


def main():
    random.seed(42)
    levels = []

    tier_names = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert']
    target_per_tier = 6
    tiers_done = {t: 0 for t in tier_names}

    # First pass: hand-crafted
    for name, grid_str, pieces in HAND_CRAFTED:
        outline, rows, cols = make_outline_from_grid(grid_str)
        if len(outline) != sum(len(TETROMINOES[n]) for n in pieces):
            print(f"  SKIP hand-crafted {name}: outline size mismatch ({len(outline)} vs {sum(len(TETROMINOES[n]) for n in pieces)})")
            continue
        n_pieces = len(pieces)
        if n_pieces == 1:
            tier = 'Beginner'
        elif n_pieces == 2:
            tier = 'Easy'
        elif n_pieces == 3:
            tier = 'Medium'
        elif n_pieces == 4:
            tier = 'Hard'
        else:
            tier = 'Expert'
        if tiers_done[tier] >= target_per_tier:
            continue
        level = make_level(outline, pieces, rows, cols)
        if level is None:
            print(f"  SKIP hand-crafted {name}: not unique")
            continue
        level['tier'] = tier
        level['name'] = name
        levels.append(level)
        tiers_done[tier] += 1

    # Second pass: random search
    p_range = {
        'Beginner': (1, 1),
        'Easy': (2, 2),
        'Medium': (3, 3),
        'Hard': (4, 4),
        'Expert': (5, 5),
    }
    for tier in tier_names:
        if tiers_done[tier] >= target_per_tier:
            continue
        needed = target_per_tier - tiers_done[tier]
        n_pieces_range = p_range[tier]
        for attempt in range(5000):
            if tiers_done[tier] >= target_per_tier:
                break
            n_pieces = random.randint(*n_pieces_range)
            pieces = random.sample(list(TETROMINOES.keys()), n_pieces)
            total_cells = n_pieces * 4
            # Try various rectangle sizes
            for rows in range(2, total_cells + 2):
                for cols in range(2, total_cells + 2):
                    if rows * cols < total_cells:
                        continue
                    if rows > 7 or cols > 7:
                        continue
                    # Build full rectangle
                    full = set()
                    for r in range(rows):
                        for c in range(cols):
                            full.add((r, c))
                    # Pick a random subset of size total_cells
                    # Strategy: start with full, remove cells until exact size
                    outline = set(full)
                    while len(outline) > total_cells:
                        # remove random cell that's not the only path
                        candidates = list(outline)
                        random.shuffle(candidates)
                        removed = False
                        for cell in candidates:
                            outline.discard(cell)
                            # Check connected (optional, helps with uniqueness)
                            if len(outline) == 0:
                                outline.add(cell)
                                continue
                            removed = True
                            break
                        if not removed:
                            break
                    if len(outline) != total_cells:
                        continue
                    outline = frozenset(outline)
                    level = make_level(outline, pieces, rows, cols)
                    if level is not None:
                        level['tier'] = tier
                        level['name'] = f'auto_{tier}_{tiers_done[tier]}'
                        levels.append(level)
                        tiers_done[tier] += 1
                        break
                if tiers_done[tier] >= target_per_tier:
                    break
            if tiers_done[tier] >= target_per_tier:
                break

    # Sort
    tier_order = {t: i for i, t in enumerate(tier_names)}
    levels.sort(key=lambda lv: (tier_order[lv['tier']], lv.get('name', '')))

    print(f'\nTier counts: {tiers_done}')
    print(f'Total: {len(levels)} levels')

    with open('levels.json', 'w') as f:
        json.dump({'levels': levels}, f, indent=2)
    print('Written to levels.json')
    return len(levels) == 30


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
