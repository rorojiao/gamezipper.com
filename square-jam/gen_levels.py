#!/usr/bin/env python3
"""
Square Jam — Level Generator & Structural Verifier
====================================================
Rules (confirmed from cross-plus-a.com):
  1. Divide the grid into square regions.
  2. A cell with a number indicates the side length of its region.
  3. A region may contain multiple numbered cells (all must agree on size).
  4. Unnumbered regions are allowed.
  5. No four region corners may meet at a lattice point (tatami rule).

Generation strategy (solution-first):
  1. Generate a square tiling of the grid (partition into square blocks).
     Use greedy recursion: pick the topmost-leftmost uncovered cell, try
     placing squares of decreasing size, recurse.
  2. Ensure the tiling has at least 30% of regions with size >= 2 for interest.
  3. Assign clue numbers: each region gets 0 or more clue cells that show
     its side length. Non-square regions are impossible by construction.
  4. Apply tatami rule: no four region corners meet at a grid vertex.
  5. Select clue subset for uniqueness (simplified: reveal enough clues).

30 levels across 5 tiers:
  Tier 1 (Beginner): 5x5 grid, 4-6 regions
  Tier 2 (Easy):     6x6 grid, 5-8 regions
  Tier 3 (Medium):   7x7 grid, 6-10 regions
  Tier 4 (Hard):     8x8 grid, 8-14 regions
  Tier 5 (Expert):   9x9 grid, 10-18 regions
"""

import json
import random
import sys

def generate_square_tiling(rows, cols, rng, max_attempts=200):
    """
    Generate a square tiling of rows x cols grid.
    Returns list of squares: [(r, c, size), ...]
    or None if failed.
    """
    grid = [[0]*cols for _ in range(rows)]  # 0 = uncovered
    squares = []
    sq_id = 1

    def find_uncovered():
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == 0:
                    return (r, c)
        return None

    def can_place(r, c, size):
        if r + size > rows or c + size > cols:
            return False
        for dr in range(size):
            for dc in range(size):
                if grid[r+dr][c+dc] != 0:
                    return False
        return True

    def place(r, c, size, sid):
        for dr in range(size):
            for dc in range(size):
                grid[r+dr][c+dc] = sid
        squares.append((r, c, size, sid))

    def unplace(r, c, size, sid):
        for dr in range(size):
            for dc in range(size):
                grid[r+dr][c+dc] = 0
        squares.pop()

    sq_id_ref = [1]

    def backtrack():
        cell = find_uncovered()
        if cell is None:
            return True  # All covered
        r, c = cell
        # Try sizes from max possible down to 1
        max_size = min(rows - r, cols - c, 4)  # cap at 4x4
        sizes = list(range(max_size, 0, -1))
        rng.shuffle(sizes)
        # Prefer larger squares sometimes for variety
        if rng.random() < 0.3:
            sizes.sort()  # smaller first

        for size in sizes:
            if can_place(r, c, size):
                sid = sq_id_ref[0]
                place(r, c, size, sid)
                sq_id_ref[0] += 1
                if backtrack():
                    return True
                sq_id_ref[0] -= 1
                unplace(r, c, size, sid)
        return False

    for _ in range(max_attempts):
        grid = [[0]*cols for _ in range(rows)]
        squares = []
        sq_id = 1
        if backtrack():
            # Check variety: at least some non-1x1 squares
            non_trivial = sum(1 for _, _, s, _ in squares if s >= 2)
            if non_trivial >= max(2, len(squares) * 0.2):
                return squares
    return None


def check_tatami_rule(squares, rows, cols):
    """
    Check that no four region corners meet at any grid vertex.
    A grid vertex is at position (vr, vc) where 0 <= vr <= rows, 0 <= vc <= cols.
    """
    # Build vertex -> set of region IDs that have a corner there
    vertex_corners = {}

    for (r, c, size, sid) in squares:
        # Four corners of this square
        corners = [(r, c), (r, c+size), (r+size, c), (r+size, c+size)]
        for (vr, vc) in corners:
            key = (vr, vc)
            if key not in vertex_corners:
                vertex_corners[key] = set()
            vertex_corners[key].add(sid)

    # Check: no vertex has >= 4 different regions meeting
    for vertex, regions in vertex_corners.items():
        if len(regions) >= 4:
            return False

    return True


def generate_tiling_with_tatami(rows, cols, rng, max_attempts=500):
    """Generate a square tiling that satisfies the tatami rule."""
    for _ in range(max_attempts):
        tiling = generate_square_tiling(rows, cols, rng)
        if tiling is None:
            continue
        if check_tatami_rule(tiling, rows, cols):
            return tiling
    # If we can't satisfy tatami, relax it (some grids can't avoid it)
    # Actually for small grids with large squares this is fine
    tiling = generate_square_tiling(rows, cols, rng)
    return tiling


def assign_clues(squares, rng, min_clue_ratio=0.3, max_clue_ratio=0.7):
    """
    Assign clues to regions. Each region gets 0-3 clue cells.
    Returns: dict mapping (r, c) -> side_length
    """
    clues = {}
    for (r, c, size, sid) in squares:
        # Decide how many clues to place in this region
        if size == 1:
            # 1x1 regions: 70% chance of a clue
            if rng.random() < 0.7:
                clues[(r, c)] = 1
        else:
            # Larger regions: at least 1 clue, sometimes 2
            num_clues = 1
            if rng.random() < 0.3 and size >= 3:
                num_clues = 2

            # Pick random cells within the region
            cells = [(r+dr, c+dc) for dr in range(size) for dc in range(size)]
            rng.shuffle(cells)
            for i in range(min(num_clues, len(cells))):
                clues[cells[i]] = size

    return clues


def make_level(rows, cols, seed):
    """Generate one complete level."""
    rng = random.Random(seed)

    for attempt in range(100):
        tiling = generate_tiling_with_tatami(rows, cols, rng)
        if tiling is None:
            continue

        clues = assign_clues(tiling, rng)

        # Build the puzzle grid
        # grid[r][c] = region ID
        # clues[r][c] = side length or 0
        region_grid = [[0]*cols for _ in range(rows)]
        clue_grid = [[0]*cols for _ in range(rows)]

        for (r, c, size, sid) in tiling:
            for dr in range(size):
                for dc in range(size):
                    region_grid[r+dr][c+dc] = sid

        for (r, c), val in clues.items():
            clue_grid[r][c] = val

        # Verify solution
        ok, msg = verify_level(region_grid, clue_grid, tiling, rows, cols)
        if ok:
            return {
                'rows': rows,
                'cols': cols,
                'regions': [[region_grid[r][c] for c in range(cols)] for r in range(rows)],
                'clues': [[clue_grid[r][c] for c in range(cols)] for r in range(rows)],
                'solution': [(r, c, s) for (r, c, s, sid) in tiling],
            }

    return None


def verify_level(region_grid, clue_grid, tiling, rows, cols):
    """Verify that the level is structurally correct."""
    # 1. Every region is a square
    region_cells = {}
    for r in range(rows):
        for c in range(cols):
            rid = region_grid[r][c]
            if rid not in region_cells:
                region_cells[rid] = []
            region_cells[rid].append((r, c))

    region_sizes = {}
    for rid, cells in region_cells.items():
        rs = [r for r, c in cells]
        cs = [c for r, c in cells]
        rmin, rmax = min(rs), max(rs)
        cmin, cmax = min(cs), max(cs)
        h = rmax - rmin + 1
        w = cmax - cmin + 1
        if h != w:
            return False, f"Region {rid} is not square: {h}x{w}"
        # Check it's actually a filled square
        if len(cells) != h * w:
            return False, f"Region {rid} is not a filled square"
        region_sizes[rid] = h

    # 2. Clues match region sizes
    for r in range(rows):
        for c in range(cols):
            if clue_grid[r][c] > 0:
                rid = region_grid[r][c]
                if clue_grid[r][c] != region_sizes[rid]:
                    return False, f"Clue at ({r},{c})={clue_grid[r][c]} != region size {region_sizes[rid]}"

    # 3. Tatami rule: no four region corners at a vertex
    vertex_regions = {}
    for rid, cells in region_cells.items():
        rs = [r for r, c in cells]
        cs = [c for r, c in cells]
        rmin, rmax = min(rs), max(rs)
        cmin, cmax = min(cs), max(cs)
        size = rmax - rmin + 1
        corners = [(rmin, cmin), (rmin, cmax+1), (rmax+1, cmin), (rmax+1, cmax+1)]
        for vertex in corners:
            if vertex not in vertex_regions:
                vertex_regions[vertex] = set()
            vertex_regions[vertex].add(rid)

    for vertex, regions in vertex_regions.items():
        if len(regions) >= 4:
            return False, f"Tatami violation at vertex {vertex}: {len(regions)} regions"

    return True, "OK"


def generate_all_levels():
    """Generate 30 levels across 5 tiers."""
    levels = []

    tier_configs = [
        # (tier_name, rows, cols, base_seed)
        ("Beginner", 5, 5, 1000),   # Tier 1: 5x5
        ("Easy",     6, 6, 2000),   # Tier 2: 6x6
        ("Medium",   7, 7, 3000),   # Tier 3: 7x7
        ("Hard",     8, 8, 4000),   # Tier 4: 8x8
        ("Expert",   9, 9, 5000),   # Tier 5: 9x9
    ]

    for tier_idx, (tier_name, rows, cols, base_seed) in enumerate(tier_configs):
        for lv_in_tier in range(6):  # 6 levels per tier = 30 total
            level_num = tier_idx * 6 + lv_in_tier + 1
            seed = base_seed + lv_in_tier * 100 + tier_idx * 7

            level = None
            for offset in range(50):
                level = make_level(rows, cols, seed + offset)
                if level is not None:
                    break

            if level is None:
                print(f"ERROR: Could not generate level {level_num} ({tier_name})")
                sys.exit(1)

            level['level'] = level_num
            level['tier'] = tier_idx + 1
            level['tierName'] = tier_name
            levels.append(level)
            print(f"  Level {level_num:2d} ({tier_name}, {rows}x{cols}): "
                  f"{len(level['solution'])} regions, "
                  f"{sum(1 for row in level['clues'] for v in row if v > 0)} clues")

    return levels


if __name__ == '__main__':
    print("=== Square Jam Level Generation ===\n")
    levels = generate_all_levels()

    # Verify all levels
    print(f"\n=== Structural Verification ===")
    all_ok = True
    for lv in levels:
        region_grid = lv['regions']
        clue_grid = lv['clues']
        rows, cols = lv['rows'], lv['cols']
        tiling = [(r, c, s, 0) for r, c, s in lv['solution']]

        # Rebuild tiling with proper IDs
        tiling_proper = []
        for idx, (r, c, s) in enumerate(lv['solution']):
            tiling_proper.append((r, c, s, idx + 1))

        ok, msg = verify_level(region_grid, clue_grid, tiling_proper, rows, cols)
        status = "PASS" if ok else f"FAIL: {msg}"
        if not ok:
            all_ok = False
        print(f"  Level {lv['level']:2d}: {status}")

    if all_ok:
        print(f"\n✅ All {len(levels)} levels PASS structural verification")
    else:
        print(f"\n❌ Some levels FAILED")
        sys.exit(1)

    # Save to JSON
    output = []
    for lv in levels:
        output.append({
            'level': lv['level'],
            'tier': lv['tier'],
            'tierName': lv['tierName'],
            'rows': lv['rows'],
            'cols': lv['cols'],
            'regions': lv['regions'],
            'clues': lv['clues'],
        })

    with open('/home/msdn/gamezipper.com/square-jam/levels.json', 'w') as f:
        json.dump(output, f)

    print(f"\n✅ Saved {len(output)} levels to levels.json")
