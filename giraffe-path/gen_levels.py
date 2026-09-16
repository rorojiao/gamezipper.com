#!/usr/bin/env python3
"""Giraffe Path puzzle generator.

Mechanic:
- The player draws a path from START to GOAL on an NxN grid using only GIRAFFE
  moves (1,4) leaper: (r±1, c±4) or (r±4, c±1).
- Some cells are walls (impassable). Some cells are optional checkpoints.
- Goal: reach GOAL in the minimum number of moves.

Uniqueness:
- Each level is generated so the giraffe-BFS shortest path from START to GOAL is
  unique (i.e., only ONE shortest path exists of length L). The player must find
  it.

Why unique:
- BFS from START through the wall layout computes the shortest distance to GOAL.
- If exactly one path of that length exists, the puzzle is uniquely solvable.
- We enforce this by adding walls until the shortest-path tree has exactly one
  leaf reaching GOAL with the min distance.

3-method verification:
- Python structural: verify start, goal, walls match the BFS.
- Node.js independent: BFS shortest path on the same graph.
- In-engine: checkSolution() in game.js uses BFS to verify the player's path
  equals the unique shortest path.
"""

import json
import random
import time
from pathlib import Path
from collections import deque

LEVELS_PATH = Path(__file__).parent / "levels.json"

GIRAFFE_DELTAS = [(1, 4), (4, 1), (-1, 4), (-4, 1),
                  (1, -4), (4, -1), (-1, -4), (-4, -1)]


def giraffe_moves(r, c, n):
    for dr, dc in GIRAFFE_DELTAS:
        nr, nc = r + dr, c + dc
        if 0 <= nr < n and 0 <= nc < n:
            yield nr, nc


def bfs_distances(n, start, walls):
    """BFS from start through non-wall cells. Returns dist[r][c] or -1."""
    dist = [[-1] * n for _ in range(n)]
    dist[start[0]][start[1]] = 0
    q = deque([start])
    while q:
        r, c = q.popleft()
        for nr, nc in giraffe_moves(r, c, n):
            if (nr, nc) in walls: continue
            if dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                q.append((nr, nc))
    return dist


def shortest_paths(n, start, goal, walls):
    """BFS counting the number of distinct shortest paths from start to goal.
    Returns (length, count) where count is the number of distinct shortest paths.
    Capped at 100.
    """
    dist = [[-1] * n for _ in range(n)]
    dist[start[0]][start[1]] = 0
    parent_count = [[0] * n for _ in range(n)]
    parent_count[start[0]][start[1]] = 1
    q = deque([start])
    goal_dist = -1
    while q:
        r, c = q.popleft()
        if goal_dist != -1 and dist[r][c] >= goal_dist:
            continue
        for nr, nc in giraffe_moves(r, c, n):
            if (nr, nc) in walls: continue
            if dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                parent_count[nr][nc] = parent_count[r][c]
                if (nr, nc) == goal:
                    goal_dist = dist[nr][nc]
                q.append((nr, nc))
            elif dist[nr][nc] == dist[r][c] + 1:
                parent_count[nr][nc] += parent_count[r][c]
                if parent_count[nr][nc] > 100:
                    parent_count[nr][nc] = 100
    return (goal_dist, parent_count[goal[0]][goal[1]] if goal_dist != -1 else 0)


def reconstruct_one_shortest(n, start, goal, walls, dist):
    """Reconstruct one shortest path from start to goal using parent pointers."""
    if dist[goal[0]][goal[1]] == -1:
        return None
    # Walk back greedily: at each cell, find a child whose dist = current_dist + 1
    path = [goal]
    cur = goal
    while cur != start:
        for nr, nc in giraffe_moves(cur[0], cur[1], n):
            if (nr, nc) in walls: continue
            if dist[nr][nc] == dist[cur[0]][cur[1]] - 1:
                cur = (nr, nc)
                path.append(cur)
                break
        else:
            return None
    path.reverse()
    return path


def generate_level(n, difficulty, rng):
    """Generate ONE uniquely-solvable giraffe-path level.
    difficulty: integer 1..5 (1=easy, 5=hard).
    Returns dict level or None.
    """
    # Pick random start and goal at opposite sides
    side_pairs = [
        ((0, rng.randrange(n)), (n - 1, rng.randrange(n))),
        ((rng.randrange(n), 0), (rng.randrange(n), n - 1)),
        ((0, 0), (n - 1, n - 1)),
    ]
    start, goal = rng.choice(side_pairs)
    if start == goal:
        return None

    # Compute initial BFS distance without walls
    initial_dist = bfs_distances(n, start, set())
    if initial_dist[goal[0]][goal[1]] == -1:
        return None  # not reachable

    # Start with empty wall set
    walls = set()
    cells = [(r, c) for r in range(n) for c in range(n) if (r, c) != start and (r, c) != goal]
    rng.shuffle(cells)

    # Wall density based on difficulty: more walls = harder / more constrained
    wall_budget = {1: int(0.05 * n * n), 2: int(0.10 * n * n), 3: int(0.15 * n * n),
                   4: int(0.20 * n * n), 5: int(0.25 * n * n)}[difficulty]

    added = 0
    for cell in cells:
        if added >= wall_budget:
            break
        walls.add(cell)
        length, count = shortest_paths(n, start, goal, walls)
        if length == -1 or count == 0:
            # Wall disconnected — undo
            walls.discard(cell)
            continue
        if count > 1:
            # Multiple shortest paths — try harder walls to constrain
            walls.discard(cell)
            continue
        # Uniquely solvable so far
        added += 1
    # Final verify
    length, count = shortest_paths(n, start, goal, walls)
    if length < 3 or count != 1:
        return None
    dist = bfs_distances(n, start, walls)
    path = reconstruct_one_shortest(n, start, goal, walls, dist)
    if path is None:
        return None
    return {
        "n": n,
        "start": list(start),
        "goal": list(goal),
        "walls": [list(w) for w in sorted(walls)],
        "solution_path": [list(p) for p in path],
        "length": length,
    }


def main():
    """5 tiers x 6 levels = 30 levels."""
    tier_configs = [
        # (tier_name, n, difficulty, count)
        ("Beginner", 6, 1, 6),
        ("Easy", 7, 2, 6),
        ("Medium", 8, 3, 6),
        ("Hard", 9, 4, 6),
        ("Expert", 10, 5, 6),
    ]
    all_levels = []
    overall_id = 0
    for tier_idx, (tier_name, n, diff, k) in enumerate(tier_configs):
        print(f"  {tier_name:10s} n={n} difficulty={diff}: target {k} levels")
        rng = random.Random(0x9E7B + tier_idx * 31)
        levels = []
        attempts = 0
        while len(levels) < k and attempts < 400:
            attempts += 1
            lvl = generate_level(n, diff, rng)
            if lvl is None:
                continue
            levels.append({
                "id": overall_id,
                "name": f"{tier_name} {len(levels) + 1}",
                "tier": tier_name,
                **lvl,
            })
            overall_id += 1
        print(f"    generated {len(levels)}/{k} (attempts={attempts})")
        all_levels.extend(levels)
    payload = {
        "name": "Giraffe Path",
        "levels": all_levels,
    }
    with open(LEVELS_PATH, "w") as f:
        json.dump(payload, f, indent=2)
    print(f"\nWrote {len(all_levels)} levels to {LEVELS_PATH}")


if __name__ == "__main__":
    main()
