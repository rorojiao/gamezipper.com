#!/usr/bin/env python3
"""Number Maze level generator.

Mechanic:
  - N x N grid with walls between cells (maze topology)
  - K numbered checkpoints: 1, 2, 3, ..., K
  - Player draws path from cell(1) -> cell(2) -> ... -> cell(K) -> end
  - Path moves orthogonally through cells with no wall between them
  - Path cannot revisit cells, cannot cross itself
  - Each level must have EXACTLY ONE valid solution

Generation: random maze + random checkpoint path + uniqueness validator.
If more than one valid path exists, reject the level and retry.
"""

import json
import random
import sys
from pathlib import Path

LEVELS_PATH = Path(__file__).parent / "levels.json"


# ============================================================
# Maze generation (recursive backtracker / DFS)
# ============================================================

# Walls: dict[(r,c)][direction] = True if wall exists
# Directions: N=0, E=1, S=2, W=3 (also we use 4-bit bitmask per cell)

def make_maze(n, seed):
    """Generate a perfect maze using recursive backtracker. Returns walls dict.
    walls[r][c] = bitmask of walls (N=1, E=2, S=4, W=8)
    """
    rng = random.Random(seed)
    # Start with all walls between every cell
    walls = [[15] * n for _ in range(n)]  # 0b1111 = all 4 walls
    visited = [[False] * n for _ in range(n)]

    stack = [(0, 0)]
    visited[0][0] = True

    def neighbors(r, c):
        # (dr, dc, this_wall_bit, opp_wall_bit)
        return [
            (-1, 0, 1, 4),  # N
            (0, 1, 2, 8),   # E
            (1, 0, 4, 1),   # S
            (0, -1, 8, 2),  # W
        ]

    while stack:
        r, c = stack[-1]
        unvisited = []
        for dr, dc, this_bit, opp_bit in neighbors(r, c):
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and not visited[nr][nc]:
                unvisited.append((nr, nc, this_bit, opp_bit))
        if unvisited:
            nr, nc, this_bit, opp_bit = rng.choice(unvisited)
            walls[r][c] &= ~this_bit
            walls[nr][nc] &= ~opp_bit
            visited[nr][nc] = True
            stack.append((nr, nc))
        else:
            stack.pop()

    return walls


def has_wall(walls, r1, c1, r2, c2):
    """Check if wall exists between (r1,c1) and (r2,c2)."""
    if not (0 <= r1 < len(walls) and 0 <= c1 < len(walls)):
        return True
    if not (0 <= r2 < len(walls) and 0 <= c2 < len(walls)):
        return True
    if r2 == r1 - 1 and c2 == c1:  # N
        return bool(walls[r1][c1] & 1)
    if r2 == r1 and c2 == c1 + 1:  # E
        return bool(walls[r1][c1] & 2)
    if r2 == r1 + 1 and c2 == c1:  # S
        return bool(walls[r1][c1] & 4)
    if r2 == r1 and c2 == c1 - 1:  # W
        return bool(walls[r1][c1] & 8)
    return True


# ============================================================
# Path solver: find ALL valid paths visiting checkpoints in order
# ============================================================

def find_paths(walls, n, checkpoints):
    """Find all paths from checkpoints[0] to checkpoints[-1] visiting in order.
    Returns list of paths (each path is list of (r,c))."""
    paths = []

    def dfs(idx, r, c, visited, path):
        if idx == len(checkpoints):
            paths.append(list(path))
            return
        target = checkpoints[idx]
        if (r, c) == target:
            # Move to next checkpoint
            dfs(idx + 1, r, c, visited, path)
            return
        # Explore neighbors
        for dr, dc in [(-1, 0), (0, 1), (1, 0), (0, -1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in visited:
                if not has_wall(walls, r, c, nr, nc):
                    visited.add((nr, nc))
                    path.append((nr, nc))
                    dfs(idx, nr, nc, visited, path)
                    path.pop()
                    visited.remove((nr, nc))

    start = checkpoints[0]
    dfs(1, start[0], start[1], {start}, [start])
    return paths


# ============================================================
# Level generation: pick checkpoints on a random walk, then validate
# ============================================================

def generate_level(n, k, seed, max_attempts=200):
    """Generate a level with grid n x n and k checkpoints (1..k+1 cells used for path + end).
    Try multiple maze/checkpoint combinations to find one with EXACTLY ONE solution.
    Returns (walls, checkpoints, solution_path) or None.
    """
    rng = random.Random(seed)
    for attempt in range(max_attempts):
        maze_seed = seed * 1000 + attempt
        walls = make_maze(n, maze_seed)

        # Generate a random path of length k+1 (k checkpoints + end)
        path_len = k + 1  # cells: 1, 2, ..., k, end
        path = generate_random_path(walls, n, path_len, rng)
        if path is None:
            continue

        # Checkpoints are cells 0..k-1, end is cell k
        checkpoints = path[:k]

        # Count solutions
        paths = find_paths(walls, n, checkpoints)
        if len(paths) == 1:
            return walls, checkpoints, paths[0]

    return None


def generate_random_path(walls, n, length, rng):
    """Generate a random simple path of given length using self-avoiding walk."""
    # Try a few starting positions
    for _ in range(50):
        start = (rng.randint(0, n - 1), rng.randint(0, n - 1))
        path = [start]
        visited = {start}
        if self_avoiding_walk(walls, n, start, length - 1, visited, path, rng, max_steps=length * 10):
            return path
    return None


def self_avoiding_walk(walls, n, pos, remaining, visited, path, rng, max_steps):
    """Extend the path by `remaining` steps using self-avoiding walk."""
    if remaining == 0:
        return True
    if max_steps <= 0:
        return False

    directions = [(-1, 0), (0, 1), (1, 0), (0, -1)]
    rng.shuffle(directions)
    r, c = pos
    for dr, dc in directions:
        nr, nc = r + dr, c + dc
        if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in visited:
            if not has_wall(walls, r, c, nr, nc):
                visited.add((nr, nc))
                path.append((nr, nc))
                if self_avoiding_walk(walls, n, (nr, nc), remaining - 1, visited, path, rng, max_steps - 1):
                    return True
                path.pop()
                visited.remove((nr, nc))
    return False


# ============================================================
# Level generation pipeline
# ============================================================

TIER_CONFIGS = [
    # (tier_name, n, k_checkpoints, count, seed_base)
    ("Beginner", 4, 3, 6, 100),    # 4x4, 3 checkpoints
    ("Easy",     5, 4, 6, 200),    # 5x5, 4 checkpoints
    ("Medium",   6, 5, 6, 300),    # 6x6, 5 checkpoints
    ("Hard",     7, 6, 6, 400),    # 7x7, 6 checkpoints
    ("Expert",   8, 7, 6, 500),    # 8x8, 7 checkpoints
]


def generate_all_levels():
    levels = []
    level_id = 0
    for tier_name, n, k, count, seed_base in TIER_CONFIGS:
        seed = seed_base
        attempts_for_tier = 0
        for i in range(count):
            while True:
                attempts_for_tier += 1
                if attempts_for_tier > 5000:
                    print(f"FAILED to generate tier {tier_name} level {i+1} after 5000 attempts")
                    sys.exit(1)
                result = generate_level(n, k, seed + i * 100 + attempts_for_tier)
                if result is not None:
                    walls, checkpoints, solution = result
                    levels.append({
                        "id": level_id,
                        "tier": tier_name,
                        "n": n,
                        "k": k,
                        "walls": walls,
                        "checkpoints": [list(p) for p in checkpoints],
                        "solution": [list(p) for p in solution],
                    })
                    level_id += 1
                    break
    return levels


if __name__ == "__main__":
    levels = generate_all_levels()
    with open(LEVELS_PATH, "w") as f:
        json.dump({"levels": levels}, f, indent=2)
    print(f"Generated {len(levels)} levels -> {LEVELS_PATH}")
    for lvl in levels:
        sol_len = len(lvl["solution"])
        print(f"  {lvl['tier']:9s} L{lvl['id']+1:2d}: {lvl['n']}x{lvl['n']} grid, {lvl['k']} checkpoints, solution length {sol_len}")
