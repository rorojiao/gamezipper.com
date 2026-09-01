#!/usr/bin/env python3
"""Pentomino Fill verifier.

Validates each level in levels.json has:
  - Outline + solution grid match in dimensions
  - Outline cells = 5 * number of pieces
  - Solution uses exactly the specified pieces
  - Each piece appears exactly once in solution
  - Solution cells are subset of outline cells
  - Solution fully covers outline
  - Outline + specified pieces yields exactly 1 valid placement (uniqueness)
"""
import json
import sys
from collections import Counter

PENTOMINOES = {
    'F': [(0, 1), (1, 0), (1, 1), (1, 2), (2, 0)],
    'I': [(0, 0), (1, 0), (2, 0), (3, 0), (4, 0)],
    'L': [(0, 0), (1, 0), (2, 0), (3, 0), (3, 1)],
    'N': [(0, 1), (1, 1), (2, 1), (3, 0), (3, 1)],
    'P': [(0, 0), (0, 1), (1, 0), (1, 1), (2, 0)],
    'T': [(0, 0), (0, 1), (0, 2), (1, 1), (2, 1)],
    'U': [(0, 0), (0, 1), (1, 0), (2, 0), (2, 1)],
    'V': [(0, 0), (1, 0), (2, 0), (2, 1), (2, 2)],
    'W': [(0, 0), (1, 0), (1, 1), (2, 1), (2, 2)],
    'X': [(0, 1), (1, 0), (1, 1), (1, 2), (2, 1)],
    'Y': [(0, 1), (1, 1), (2, 0), (2, 1), (3, 1)],
    'Z': [(0, 0), (0, 1), (1, 1), (2, 1), (2, 2)],
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
    base = PENTOMINOES[name]
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
    """Count unique placements up to `cap`."""
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
                    placements[name].append((frozenset(placed), ar, ac))
        unique = []
        seen = set()
        for cells, ar, ac in placements[name]:
            if cells not in seen:
                seen.add(cells)
                unique.append((cells, ar, ac))
        placements[name] = unique

    solutions = []
    pieces_order = list(pieces_names)

    def backtrack(idx, used_cells, current):
        if len(solutions) >= cap:
            return
        if idx == len(pieces_order):
            solutions.append(tuple(sorted(c[0] for c in current)))
            return
        name = pieces_order[idx]
        for placed, ar, ac in placements[name]:
            if placed & used_cells:
                continue
            current.append((placed, name))
            backtrack(idx + 1, used_cells | placed, current)
            current.pop()

    backtrack(0, set(), [])
    return len(solutions)


def parse_grid(grid):
    return [list(line) for line in grid]


def verify_level(level):
    """Verify a single level. Returns list of (check_name, passed, detail)."""
    checks = []

    rows = level['rows']
    cols = level['cols']
    pieces = level['pieces']
    outline_strs = level['outline']
    solution_strs = level['solution']

    # 1. Outline and solution grid dimensions match
    outline_grid = parse_grid(outline_strs)
    solution_grid = parse_grid(solution_strs)
    dim_ok = (len(outline_grid) == rows and len(solution_grid) == rows and
              all(len(r) == cols for r in outline_grid) and
              all(len(r) == cols for r in solution_grid))
    checks.append(('dimensions', dim_ok, f'{rows}x{cols}'))

    # 2. Outline cells = 5 * n_pieces
    outline_cells = set()
    for r in range(rows):
        for c in range(cols):
            if outline_grid[r][c] == '#':
                outline_cells.add((r, c))
    cells_ok = len(outline_cells) == 5 * len(pieces)
    checks.append(('outline_cell_count', cells_ok,
                   f'{len(outline_cells)} cells, expected {5*len(pieces)}'))

    # 3. Pieces are all valid pentomino names
    valid_pieces = all(p in PENTOMINOES for p in pieces)
    no_dup = len(set(pieces)) == len(pieces)
    checks.append(('pieces_valid', valid_pieces and no_dup,
                   f'{len(pieces)} unique pieces'))

    # 4. Solution uses exactly the specified pieces
    sol_pieces = []
    for r in range(rows):
        for c in range(cols):
            ch = solution_grid[r][c]
            if ch != '.':
                sol_pieces.append(ch)
    sol_counter = Counter(sol_pieces)
    pieces_used_ok = (set(sol_pieces) == set(pieces) and
                      all(sol_counter[p] == 5 for p in pieces))
    checks.append(('pieces_used', pieces_used_ok,
                   f'solution uses {dict(sol_counter)}'))

    # 5. Solution cells are subset of outline cells
    sol_cells = set()
    for r in range(rows):
        for c in range(cols):
            if solution_grid[r][c] != '.':
                sol_cells.add((r, c))
    subset_ok = sol_cells.issubset(outline_cells)
    checks.append(('solution_subset', subset_ok,
                   f'{len(sol_cells)} sol cells, {len(outline_cells)} outline cells'))

    # 6. Solution fully covers outline
    cover_ok = sol_cells == outline_cells
    checks.append(('solution_covers_outline', cover_ok,
                   'covers all outline cells'))

    # 7. Each piece in solution has the correct shape (5 connected cells)
    shape_ok = True
    for piece_name in pieces:
        piece_cells = [(r, c) for r in range(rows) for c in range(cols)
                       if solution_grid[r][c] == piece_name]
        if len(piece_cells) != 5:
            shape_ok = False
            break
        # Check connectivity (BFS)
        visited = {piece_cells[0]}
        queue = [piece_cells[0]]
        while queue:
            cr, cc = queue.pop()
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = cr + dr, cc + dc
                if (nr, nc) in piece_cells and (nr, nc) not in visited:
                    visited.add((nr, nc))
                    queue.append((nr, nc))
        if len(visited) != 5:
            shape_ok = False
            break
    checks.append(('piece_shapes_connected', shape_ok, 'all pieces connected'))

    # 8. Pieces don't overlap
    no_overlap = len(sol_cells) == len(pieces) * 5
    checks.append(('no_overlap', no_overlap, 'no cell covered twice'))

    # 9. Uniqueness: outline + pieces has exactly 1 valid placement
    n_sols = count_unique_solutions(outline_cells, pieces, cap=2)
    unique_ok = (n_sols == 1)
    checks.append(('unique_solution', unique_ok,
                   f'{n_sols} solutions found (cap=2)'))

    return checks


def main():
    import os
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'levels.json')) as f:
        data = json.load(f)
    levels = data['levels']

    all_pass = True
    for i, lv in enumerate(levels):
        checks = verify_level(lv)
        passed = all(ok for _, ok, _ in checks)
        all_pass = all_pass and passed
        status = '✓' if passed else '✗'
        tier = lv.get('tier', '?')
        print(f'Level {i+1:2d} [{tier:8s}] {status}')
        if not passed:
            for name, ok, detail in checks:
                mark = '✓' if ok else '✗'
                print(f'  {mark} {name}: {detail}')

    print(f'\n{"PASS" if all_pass else "FAIL"}: {len(levels)} levels, '
          f'{sum(1 for lv in levels if all(ok for _, ok, _ in verify_level(lv)))} '
          f'unique-solution verified')
    return 0 if all_pass else 1


if __name__ == '__main__':
    sys.exit(main())
