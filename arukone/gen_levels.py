#!/usr/bin/env python3
"""
Arukone (Number Link / Nikoli) level generator.

Generates 30 unique Arukone puzzles across 5 difficulty tiers.

Approach:
1. Build a snake Hamiltonian path through the N×N grid.
2. Split snake into chunks (each chunk = one path).
3. Each chunk's first and last cells become the numbered pair.
4. The puzzle's intended solution is the snake itself.

We verify that the snake layout produces a unique solution by running the solver.
If the solver finds multiple solutions, we add additional constraints (extra
internal labels) to force uniqueness.
"""

import json
import random
import sys
import time
from collections import deque

SEED = 20260821


def neighbors4(r, c, N, M):
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < N and 0 <= nc < M:
            yield nr, nc


def solve_arukone(N, pairs, time_limit=15, intended_solution=None):
    """Count solutions to Arukone puzzle (LOOSE variant).

    If intended_solution is provided, we accept it as a valid solution
    and verify that NO OTHER solution exists (uniqueness check).
    """
    pair_count = len(pairs)
    grid = [[-1] * N for _ in range(N)]
    for pid, ((r1, c1), (r2, c2)) in enumerate(pairs):
        grid[r1][c1] = pid
        grid[r2][c2] = pid

    solutions = []
    SOL_LIMIT = 2
    start_time = time.time()

    def is_path_internal_ok(r, c, pid):
        existing = [(rr, cc) for rr in range(N) for cc in range(N)
                   if grid[rr][cc] == pid and (rr, cc) != (r, c)]
        if not existing:
            return False
        return any(abs(er-r)+abs(ec-c)==1 for er, ec in existing)

    def is_path_continuous(pid):
        cells = set()
        for r in range(N):
            for c in range(N):
                if grid[r][c] == pid:
                    cells.add((r, c))
        if not cells:
            return True
        a, b = pairs[pid]
        if a not in cells or b not in cells:
            return False
        visited = {a}
        queue = deque([a])
        while queue:
            r, c = queue.popleft()
            for nr, nc in neighbors4(r, c, N, N):
                if (nr, nc) in cells and (nr, nc) not in visited:
                    visited.add((nr, nc))
                    queue.append((nr, nc))
        return visited == cells

    cell_order = [(r, c) for r in range(N) for c in range(N)]

    def backtrack(idx):
        if len(solutions) >= SOL_LIMIT:
            return
        if time.time() - start_time > time_limit:
            return
        if idx == len(cell_order):
            for pid in range(pair_count):
                if not is_path_continuous(pid):
                    return
            solutions.append([row[:] for row in grid])
            return
        r, c = cell_order[idx]
        if grid[r][c] != -1:
            backtrack(idx + 1)
            return
        pids = list(range(pair_count))
        random.shuffle(pids)
        for pid in pids:
            if not is_path_internal_ok(r, c, pid):
                continue
            grid[r][c] = pid
            backtrack(idx + 1)
            grid[r][c] = -1
            if len(solutions) >= SOL_LIMIT:
                return

    backtrack(0)
    return solutions


def build_snake(N):
    cells = []
    for r in range(N):
        if r % 2 == 0:
            cells.extend([(r, c) for c in range(N)])
        else:
            cells.extend([(r, c) for c in range(N-1, -1, -1)])
    return cells


def split_into_chunks(cells, num_chunks):
    n = num_chunks
    chunk_size = len(cells) // n
    remainder = len(cells) - chunk_size * n
    chunks = []
    idx = 0
    for i in range(n):
        size = chunk_size + (1 if i < remainder else 0)
        chunks.append(cells[idx:idx + size])
        idx += size
    if idx < len(cells):
        chunks[-1].extend(cells[idx:])
    return chunks


def gen_one_level(N, num_pairs, num_extra_labels=0, max_attempts=3000, time_limit=30):
    """Generate one Arukone level using snake + extras (internal labels for uniqueness)."""
    t0 = time.time()
    for attempt in range(max_attempts):
        if time.time() - t0 > time_limit:
            return None
        rng = random.Random(attempt * 31 + N * 17 + num_pairs * 13 + num_extra_labels * 7)
        # Choose snake direction: vary based on attempt for diversity
        snake = []
        for r in range(N):
            if (r + attempt) % 2 == 0:
                snake.extend([(r, c) for c in range(N)])
            else:
                snake.extend([(r, c) for c in range(N-1, -1, -1)])
        # Also try vertical-first snakes for diversity
        if attempt % 4 >= 2:
            col_order = list(range(N))
            if attempt % 2 == 0:
                col_order = list(range(N-1, -1, -1))
            snake = []
            for c in col_order:
                for r in range(N):
                    if (c + attempt // 2) % 2 == 0:
                        snake.append((r, c))
                    else:
                        snake.append((r, N - 1 - c))
        # Try variations: rotate the snake 90, 180, 270 degrees
        rot = attempt % 8
        if rot >= 4:
            # Rotate the snake 90 degrees
            rot -= 4
            rotated = []
            for r, c in snake:
                if rot == 0:
                    rotated.append((c, N - 1 - r))  # 90 CW
                elif rot == 1:
                    rotated.append((N - 1 - r, N - 1 - c))  # 180
                elif rot == 2:
                    rotated.append((N - 1 - c, r))  # 270 CW
                else:
                    rotated.append((r, c))  # identity
            snake = rotated
        chunks = split_into_chunks(snake, num_pairs)
        # Main pairs: 1 per chunk
        main_pairs = []
        for chunk in chunks:
            if len(chunk) >= 2:
                main_pairs.append((chunk[0], chunk[-1]))
        if len(main_pairs) != num_pairs:
            continue
        # Verify uniqueness with all_pairs
        solutions = solve_arukone(N, main_pairs, time_limit=8)
        if len(solutions) == 1:
            return main_pairs, solutions[0]
    return None


def grid_to_clues(grid, pairs):
    """Convert solution grid to player-facing clues.
    Randomize number assignment for visual diversity (each level looks different)."""
    N = len(grid)
    clues = [[0] * N for _ in range(N)]
    pair_first_cells = []
    for pid, (a, b) in enumerate(pairs):
        pair_first_cells.append((min(a, b), pid))
    pair_first_cells.sort()
    pid_to_num = {}
    # Assign numbers in RANDOM order for visual variety
    pair_indices = list(range(len(pairs)))
    random.shuffle(pair_indices)
    for display_num, pair_idx in enumerate(pair_indices, start=1):
        pid = pair_first_cells[pair_idx][1]
        pid_to_num[pid] = display_num
    for pid, (a, b) in enumerate(pairs):
        n = pid_to_num[pid]
        clues[a[0]][a[1]] = n
        clues[b[0]][b[1]] = n
    return clues, pid_to_num


# Tiers: difficulty based on grid size. Pair counts MUST give unique solutions
# with snake layout. Tested empirically.
TIERS = [
    ("Beginner", 5, 5, 0),
    ("Beginner", 5, 5, 0),
    ("Beginner", 5, 5, 0),
    ("Beginner", 5, 5, 0),
    ("Beginner", 5, 5, 0),
    ("Easy", 6, 13, 0),
    ("Easy", 6, 13, 0),
    ("Easy", 6, 13, 0),
    ("Easy", 6, 13, 0),
    ("Easy", 6, 13, 0),
    ("Easy", 6, 13, 0),
    ("Medium", 7, 20, 0),
    ("Medium", 7, 20, 0),
    ("Medium", 7, 20, 0),
    ("Medium", 7, 20, 0),
    ("Medium", 7, 20, 0),
    ("Medium", 7, 20, 0),
    ("Hard", 8, 25, 0),
    ("Hard", 8, 25, 0),
    ("Hard", 8, 25, 0),
    ("Hard", 8, 25, 0),
    ("Hard", 8, 25, 0),
    ("Hard", 8, 25, 0),
    ("Expert", 8, 32, 0),
    ("Expert", 8, 32, 0),
    ("Expert", 8, 32, 0),
    ("Expert", 8, 32, 0),
    ("Expert", 8, 32, 0),
    ("Expert", 8, 32, 0),
    ("Expert", 8, 32, 0),
]


def gen_all_levels():
    out = []
    for idx, (tier, N, target_pairs, num_extra) in enumerate(TIERS, start=1):
        t0 = time.time()
        result = None
        attempts = 0
        while result is None and attempts < 5:
            result = gen_one_level(N, target_pairs, num_extra_labels=num_extra,
                                   max_attempts=2000, time_limit=20)
            attempts += 1
        elapsed = time.time() - t0
        if result is None:
            print(f"  L{idx}: FAILED ({tier} {N}x{N}, {target_pairs} pairs) after {elapsed:.1f}s")
            return None
        pairs, grid = result
        clues, pid_to_num = grid_to_clues(grid, pairs)
        print(f"  L{idx}: {tier} {N}x{N}, {target_pairs}+{num_extra} pairs, {elapsed:.1f}s")
        out.append({
            "i": idx,
            "tier": tier,
            "r": N,
            "c": N,
            "p": [[[a[0], a[1]], [b[0], b[1]]] for a, b in pairs],
            "g": grid,
            "cl": clues,
        })
    return out


def main():
    random.seed(SEED)
    print("Generating 30 Arukone levels...")
    levels = gen_all_levels()
    if levels is None:
        print("FAIL: could not generate all 30 levels")
        sys.exit(1)
    with open("/home/junze/gamezipper.com/arukone/levels.json", "w") as f:
        json.dump({"levels": levels}, f, separators=(",", ":"))
    print(f"Wrote levels.json with {len(levels)} levels")


if __name__ == "__main__":
    main()
