#!/usr/bin/env python3
"""Clean Python structural verifier for Giraffe Path levels.

Verifies:
1. Each level's stored solution_path uses only valid giraffe moves (1,4 leaper).
2. Each level's solution_path does not step on walls.
3. Each level has a UNIQUE shortest giraffe-path from start to goal that matches
   the stored path (verified via BFS counting shortest paths).
"""

import json
import sys
import time
from collections import deque
from pathlib import Path

LEVELS_PATH = Path(__file__).parent / "levels.json"

GIRAFFE_DELTAS = [(1, 4), (4, 1), (-1, 4), (-4, 1),
                  (1, -4), (4, -1), (-1, -4), (-4, -1)]


def giraffe_moves(r, c, n):
    for dr, dc in GIRAFFE_DELTAS:
        nr, nc = r + dr, c + dc
        if 0 <= nr < n and 0 <= nc < n:
            yield nr, nc


def count_shortest_paths(n, start, goal, walls):
    """BFS that counts distinct shortest paths from start to goal.
    Returns (length, count) where count is the number of distinct shortest paths.
    Capped at 100.
    """
    dist = [[-1] * n for _ in range(n)]
    parent_count = [[0] * n for _ in range(n)]
    dist[start[0]][start[1]] = 0
    parent_count[start[0]][start[1]] = 1
    q = deque([start])
    goal_dist = -1
    while q:
        r, c = q.popleft()
        if goal_dist != -1 and dist[r][c] >= goal_dist:
            continue
        for nr, nc in giraffe_moves(r, c, n):
            if (nr, nc) in walls:
                continue
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
    if goal_dist == -1:
        return (-1, 0)
    return (goal_dist, parent_count[goal[0]][goal[1]])


def verify_level(level):
    n = level["n"]
    start = tuple(level["start"])
    goal = tuple(level["goal"])
    walls = set(tuple(w) for w in level["walls"])
    sol_path = [tuple(p) for p in level["solution_path"]]
    # 1. Path starts at start, ends at goal
    if sol_path[0] != start:
        return False, f"path starts at {sol_path[0]} but start is {start}"
    if sol_path[-1] != goal:
        return False, f"path ends at {sol_path[-1]} but goal is {goal}"
    # 2. No walls in path
    for cell in sol_path:
        if cell in walls:
            return False, f"path crosses wall at {cell}"
    # 3. Each consecutive pair is a valid giraffe move
    for i in range(len(sol_path) - 1):
        a, b = sol_path[i], sol_path[i + 1]
        dr = b[0] - a[0]
        dc = b[1] - a[1]
        if (dr, dc) not in GIRAFFE_DELTAS and (dr, dc) not in [(d, c) for c, d in [(dc, dr)]]:
            return False, f"step {i}: {a} -> {b} is not a giraffe move"
    # 4. Unique shortest path
    length, count = count_shortest_paths(n, start, goal, walls)
    if length == -1:
        return False, "no path from start to goal"
    if count != 1:
        return False, f"{count} shortest paths exist (not unique)"
    if length != len(sol_path) - 1:
        return False, f"solution length {len(sol_path)-1} != BFS shortest {length}"
    return True, "OK"


def main():
    with open(LEVELS_PATH) as f:
        data = json.load(f)
    levels = data["levels"]
    print(f"Verifying {len(levels)} levels...")
    passed = 0
    failed = 0
    for lvl in levels:
        ok, msg = verify_level(lvl)
        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
            print(f"  [{status}] {lvl['tier']} {lvl['name']}: {msg}")
    print(f"\n{passed}/{len(levels)} levels verified ({failed} failed)")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
