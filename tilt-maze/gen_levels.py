#!/usr/bin/env python3
"""Tilt Maze level generator (BFS-driven).

Mechanic:
  - Grid with walls ('#'), balls ('B'), holes ('H'), and passable cells ('.')
  - Tilt N/S/E/W: all balls roll in that direction
  - Roll rule: ball steps until next step would be (a) off-grid [INVALID, no balls move],
    (b) a wall or another ball [stop], or (c) a hole [fall in and removed].
  - Goal: all balls in holes (each ball must reach a hole).

Generation:
  - For each level design, BFS finds the canonical minimum solution.
  - Reject levels with multiple min-length solutions.
"""
import json
import sys
from collections import deque


def tilt_once(grid, direction):
    """Tilt grid in direction. Returns (new_grid, valid)."""
    H = len(grid)
    W = len(grid[0]) if H > 0 else 0
    g = [list(row) for row in grid]

    if direction == 'N':
        dr, dc = -1, 0
    elif direction == 'S':
        dr, dc = 1, 0
    elif direction == 'E':
        dr, dc = 0, 1
    elif direction == 'W':
        dr, dc = 0, -1
    else:
        raise ValueError(direction)

    ball_positions = []
    for r in range(H):
        for c in range(W):
            if g[r][c] == 'B':
                ball_positions.append((r, c))
    ball_positions.sort(key=lambda rc: rc[0] * dr + rc[1] * dc, reverse=True)

    for r, c in ball_positions:
        if g[r][c] != 'B':
            continue
        cr, cc = r, c
        landed_in_hole = False
        nr, nc = cr + dr, cc + dc
        if nr < 0 or nr >= H or nc < 0 or nc >= W:
            return [''.join(row) for row in grid], False
        while True:
            nr, nc = cr + dr, cc + dc
            if nr < 0 or nr >= H or nc < 0 or nc >= W:
                break
            cell = g[nr][nc]
            if cell == '#' or cell == 'B':
                break
            cr, cc = nr, nc
            if cell == 'H':
                landed_in_hole = True
                break
        if landed_in_hole:
            g[r][c] = '.'
            g[cr][cc] = '.'
        else:
            g[r][c] = '.'
            g[cr][cc] = 'B'
    return [''.join(row) for row in g], True


def solve_bfs(grid, max_depth=15):
    """BFS solver. Returns all min-length solutions."""
    initial_balls = sum(row.count('B') for row in grid)
    initial_holes = sum(row.count('H') for row in grid)
    if initial_balls == 0:
        return [([], 0)]
    if initial_balls != initial_holes:
        return []

    visited = {tuple(grid): 0}
    queue = deque([(tuple(grid), [])])
    solutions = []
    min_sol_len = None

    while queue:
        cur_grid, moves = queue.popleft()
        if min_sol_len is not None and len(moves) >= min_sol_len:
            continue
        balls = sum(row.count('B') for row in cur_grid)
        if balls == 0:
            solutions.append((list(moves), len(moves)))
            if min_sol_len is None or len(moves) < min_sol_len:
                min_sol_len = len(moves)
            continue
        if len(moves) >= max_depth:
            continue
        for d in 'NSEW':
            new_grid, valid = tilt_once([''.join(r) for r in cur_grid], d)
            if not valid:
                continue
            key = tuple(new_grid)
            new_depth = len(moves) + 1
            if key in visited and visited[key] <= new_depth:
                continue
            visited[key] = new_depth
            queue.append((key, moves + [d]))
    return solutions


def verify_unique(grid, max_depth=15):
    """Verify exactly 1 min-length solution. Returns (True, sol, len) or (False, reason)."""
    sols = solve_bfs(grid, max_depth=max_depth)
    if not sols:
        return False, 'NO_SOLUTION', None
    min_len = min(len(s[0]) for s in sols)
    n_min = sum(1 for s in sols if len(s[0]) == min_len)
    if n_min > 1:
        return False, 'MULTIPLE', [s[0] for s in sols if len(s[0]) == min_len]
    return True, sols[0][0], min_len


# === LEVEL DESIGNS — define grids only; BFS will find solution & verify uniqueness ===

LEVELS = []


def add(grid, tier):
    LEVELS.append({'grid': grid, 'tier': tier})


# === TIER 1: BEGINNER (4x4, 1 ball, 1 hole) ===
add(['B...', '....', '....', '...H'], 'Beginner')  # L1
add(['....', '.B..', '....', 'H...'], 'Beginner')  # L2
add(['....', '....', 'B...', '...H'], 'Beginner')  # L3
add(['B#..', '....', '....', '..H.'], 'Beginner')  # L4
add(['....', '.B..', '....', '.H..'], 'Beginner')  # L5
add(['....', '....', '.B..', '...H'], 'Beginner')  # L6

# === TIER 2: EASY (5x5, 1 ball, 1 hole) ===
add(['B....', '.....', '.....', '.....', '...H.'], 'Easy')  # L7
add(['B....', '.....', '.....', '.....', '.H...'], 'Easy')  # L8
add(['.....', '.B...', '.....', '.....', '..H..'], 'Easy')  # L9
add(['B....', '.....', '#....', '.....', '...H.'], 'Easy')  # L10
add(['.....', 'B....', '.....', '.....', '..H..'], 'Easy')  # L11
add(['..B..', '.....', '.....', '.....', '..H..'], 'Easy')  # L12

# === TIER 3: MEDIUM (5x5, 1-2 balls, walls) ===
add(['B..B.', '.....', '.....', '.....', 'H...H'], 'Medium')  # L13
add(['B.B..', '..#..', '.....', '.....', '.H.H.'], 'Medium')  # L14
add(['B..B.', '..#..', '.....', '.....', 'H...H'], 'Medium')  # L15
add(['B....', '.B...', '.....', '....H', '..H..'], 'Medium')  # L16
add(['B....', '.#...', '.....', '.#...', '....H'], 'Medium')  # L17
add(['B..B.', '.....', '..#..', '.....', 'H...H'], 'Medium')  # L18

# === TIER 4: HARD (5x5, more balls, walls) ===
add(['B..B.', '.....', '..#..', '.....', 'H...H'], 'Hard')  # L19
add(['B..B.', '.....', '.....', '..#..', 'H...H'], 'Hard')  # L20
add(['.B.B.', '..#..', '.....', '..#..', '.H.H.'], 'Hard')  # L21
add(['B..B.', '..#..', '.....', '.....', 'H...H'], 'Hard')  # L22
add(['B..B.', '.....', '..#..', '.....', '.H.H.'], 'Hard')  # L23
add(['.B.B.', '.....', '..#..', '.....', '.H.H.'], 'Hard')  # L24

# === TIER 5: EXPERT (6x6, multiple balls, walls) ===
add(['B..B..', '......', '..#...', '......', '...#..', 'H....H'], 'Expert')  # L25
add(['B..B..', '......', '..#...', '......', '...#..', '.H..H.'], 'Expert')  # L26
add(['B..B..', '......', '..#...', '......', '......', 'H....H'], 'Expert')  # L27
add(['.B.B..', '......', '..#...', '......', '......', '.H..H.'], 'Expert')  # L28
add(['B..B..', '......', '......', '...#..', '......', 'H....H'], 'Expert')  # L29
add(['B..B..', '......', '......', '..#...', '......', 'H....H'], 'Expert')  # L30


def main():
    out = []
    print(f"Total designed: {len(LEVELS)}")
    for i, lvl in enumerate(LEVELS):
        grid = lvl['grid']
        H = len(grid)
        W = len(grid[0])
        balls = sum(r.count('B') for r in grid)
        holes = sum(r.count('H') for r in grid)
        if balls != holes:
            print(f"  L{i+1}: SKIP — balls ({balls}) != holes ({holes})")
            continue
        ok, sol_or_reason, n = verify_unique(grid, max_depth=12)
        if not ok:
            print(f"  L{i+1}: REJECT — {sol_or_reason}")
            if sol_or_reason == 'MULTIPLE':
                print(f"    alt solutions: {n}")
            continue
        print(f"  L{i+1}: OK ({lvl['tier']}, {n} moves, {H}x{W}, {balls} balls, unique)")
        out.append({
            'id': i + 1,
            'tier': lvl['tier'],
            'grid': grid,
            'solution': sol_or_reason,
            'moves': n,
            'size': f'{H}x{W}'
        })

    print(f"\nTotal verified: {len(out)}")

    with open('levels.json', 'w') as f:
        json.dump(out, f, indent=2)

    print(f"Written to levels.json")


if __name__ == '__main__':
    main()