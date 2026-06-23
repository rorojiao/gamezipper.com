#!/usr/bin/env python3
"""
Stostone level generator v6 — region-first approach.
1. Create small polyomino regions (3-6 cells each)
2. Use column-pattern solver to find a valid shading (no clues)
3. Derive clues from solution
4. Check uniqueness, dig holes

Key insight: small regions with high clue-to-size ratio → more likely unique.
"""
import json, random, sys, time
from collections import deque
from itertools import combinations

def neighbors4(i, n):
    r, c = divmod(i, n)
    for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
        nr2, nc2 = r + dr, c + dc
        if 0 <= nr2 < n and 0 <= nc2 < n:
            yield nr2 * n + nc2

def is_connected(cells, n):
    if len(cells) <= 1:
        return True
    cs = set(cells)
    start = next(iter(cs))
    visited = {start}
    q = deque([start])
    while q:
        i = q.popleft()
        for ni in neighbors4(i, n):
            if ni in cs and ni not in visited:
                visited.add(ni)
                q.append(ni)
    return len(visited) == len(cs)

def make_regions(n, seed=None):
    """Create small polyomino regions (2-5 cells each)."""
    if seed is not None:
        random.seed(seed)
    grid = [-1] * (n * n)
    rid = 0
    cells = list(range(n * n))
    random.shuffle(cells)
    
    for start in cells:
        if grid[start] != -1:
            continue
        # Grow a region of random size 2-5
        target = random.choice([2, 3, 3, 4, 4, 5])
        grid[start] = rid
        frontier = [start]
        placed = 1
        while placed < target and frontier:
            random.shuffle(frontier)
            cell = frontier.pop()
            for ni in neighbors4(cell, n):
                if grid[ni] == -1:
                    grid[ni] = rid
                    frontier.append(ni)
                    placed += 1
                    if placed >= target:
                        break
        rid += 1
    
    # Fill any remaining -1
    for i in range(n * n):
        if grid[i] == -1:
            for ni in neighbors4(i, n):
                if grid[ni] != -1:
                    grid[i] = grid[ni]
                    break
            if grid[i] == -1:
                grid[i] = 0
    
    return grid, rid

def solve_stostone(grid, n, nr, clues, limit=2, timeout_s=5, find_any=False):
    """
    Column-pattern solver. If find_any=True, returns first solution found.
    clues[r] = exact count or None (unconstrained, min 1).
    """
    half = n // 2
    t0 = time.time()
    solutions = []

    all_pats = list(combinations(range(n), half))
    col_pats = [[] for _ in range(n)]
    col_pat_regions = [[] for _ in range(n)]

    for col in range(n):
        for pat in all_pats:
            valid = True
            for r in pat:
                cell = r * n + col
                rid = grid[cell]
                if r > 0 and (r - 1) in pat:
                    if grid[(r - 1) * n + col] != rid:
                        valid = False
                        break
            if valid:
                col_pats[col].append(pat)
                deltas = {}
                for r in pat:
                    rid = grid[r * n + col]
                    deltas[rid] = deltas.get(rid, 0) + 1
                col_pat_regions[col].append(deltas)

    def cross_ok(col, pat, prev_pat):
        for r in pat:
            cell = r * n + col
            rid = grid[cell]
            if r in prev_pat:
                if grid[r * n + (col - 1)] != rid:
                    return False
        return True

    region_cells = [[] for _ in range(nr)]
    for i in range(n * n):
        region_cells[grid[i]].append(i)

    def check_final(shade_arr):
        for r in range(nr):
            shaded = [i for i in region_cells[r] if shade_arr[i] == 1]
            if len(shaded) == 0:
                return False
            if clues[r] is not None and len(shaded) != clues[r]:
                return False
            if not is_connected(shaded, n):
                return False
        return True

    def backtrack(col, reg_counts, prev_pat, shade_arr):
        if len(solutions) >= limit:
            return
        if time.time() - t0 > timeout_s:
            return
        if col >= n:
            if check_final(shade_arr):
                solutions.append(list(shade_arr))
            return

        for pi, pat in enumerate(col_pats[col]):
            if col > 0 and not cross_ok(col, pat, prev_pat):
                continue
            deltas = col_pat_regions[col][pi]
            new_counts = list(reg_counts)
            ok = True
            for rid, delta in deltas.items():
                new_counts[rid] += delta
                if clues[rid] is not None and new_counts[rid] > clues[rid]:
                    ok = False
                    break
            if not ok:
                continue
            # Future feasibility
            remaining = n - col - 1
            for r in range(nr):
                if clues[r] is not None:
                    need = clues[r] - new_counts[r]
                    if need < 0 or need > remaining * half:
                        ok = False
                        break
            if not ok:
                continue

            for r in pat:
                shade_arr[r * n + col] = 1
            backtrack(col + 1, new_counts, pat, shade_arr)
            for r in pat:
                shade_arr[r * n + col] = 0

    backtrack(0, [0] * nr, None, [0] * (n * n))
    return solutions

def generate_level(n, seed=None, timeout_s=5):
    for attempt in range(60):
        s = (seed or 0) * 100 + attempt
        grid, nr = make_regions(n, seed=s)
        if nr < max(4, n):
            continue

        # Find a valid solution (no clues)
        clues_none = [None] * nr
        sols = solve_stostone(grid, n, nr, clues_none, limit=1, timeout_s=timeout_s)
        if not sols:
            continue
        
        solution = sols[0]
        
        # Derive clues
        region_counts = [0] * nr
        for i in range(n * n):
            if solution[i] == 1:
                region_counts[grid[i]] += 1
        clues = list(region_counts)
        
        # Check uniqueness with full clues
        sols = solve_stostone(grid, n, nr, clues, limit=2, timeout_s=timeout_s)
        if len(sols) != 1:
            continue
        
        # Dig holes
        random.seed(s + 7777)
        clue_order = list(range(nr))
        random.shuffle(clue_order)
        for ci in clue_order:
            trial = list(clues)
            trial[ci] = None
            sols = solve_stostone(grid, n, nr, trial, limit=2, timeout_s=timeout_s)
            if len(sols) == 1:
                clues = trial
        
        return {'n': n, 'nr': nr, 'g': grid, 'c': clues, 's': solution}
    return None

def main():
    levels = []
    tiers = [
        ("Beginner", 6, 4),
        ("Easy", 6, 4),
        ("Medium", 8, 4),
        ("Hard", 8, 5),
        ("Expert", 8, 5),
        ("Master", 8, 4),
    ]
    seed_base = 100000

    for tier_name, grid_size, count in tiers:
        tier_levels = []
        attempts = 0
        while len(tier_levels) < count and attempts < 100:
            attempts += 1
            seed = seed_base + len(levels) * 17 + attempts
            lvl = generate_level(grid_size, seed=seed)
            if lvl is None:
                continue
            lvl['tier'] = tier_name
            lvl['lvl'] = len(tier_levels) + 1
            tier_levels.append(lvl)
            nc = sum(1 for c in lvl['c'] if c is not None)
            print(f"  ✅ {tier_name} L{len(tier_levels)} ({grid_size}x{grid_size}, "
                  f"{lvl['nr']} regions, {nc}/{lvl['nr']} clues)", flush=True)
        if len(tier_levels) < count:
            print(f"  ⚠️ {tier_name}: {len(tier_levels)}/{count} after {attempts}")
        levels.extend(tier_levels)

    with open('stostone/levels.json', 'w') as f:
        json.dump({'levels': levels, 'count': len(levels)}, f)
    print(f"\n✅ Generated {len(levels)} levels")

if __name__ == '__main__':
    main()
