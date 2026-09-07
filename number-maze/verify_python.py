#!/usr/bin/env python3
"""Python structural validator for Number Maze levels.

Checks each level:
  - Grid is N x N (square)
  - Walls is N x N bitmask (each cell 0-15)
  - Checkpoints: k unique cells, all in [0,n) x [0,n]
  - Solution path: starts at checkpoints[0], visits each checkpoint in order, ends at last cell
  - Solution path cells are orthogonally connected (no wall between consecutive cells)
  - Solution path has no repeats
  - Solution path visits each checkpoint exactly once
  - Maze topology: every cell is reachable from every other cell via walls (perfect maze property)
"""

import json
import sys
from pathlib import Path

LEVELS_PATH = Path(__file__).parent / "levels.json"


def has_wall(walls, r1, c1, r2, c2):
    if not (0 <= r1 < len(walls) and 0 <= c1 < len(walls)):
        return True
    if not (0 <= r2 < len(walls) and 0 <= c2 < len(walls)):
        return True
    if r2 == r1 - 1 and c2 == c1:
        return bool(walls[r1][c1] & 1)
    if r2 == r1 and c2 == c1 + 1:
        return bool(walls[r1][c1] & 2)
    if r2 == r1 + 1 and c2 == c1:
        return bool(walls[r1][c1] & 4)
    if r2 == r1 and c2 == c1 - 1:
        return bool(walls[r1][c1] & 8)
    return True


def validate_level(lvl):
    n = lvl["n"]
    k = lvl["k"]
    walls = lvl["walls"]
    checkpoints = [tuple(c) for c in lvl["checkpoints"]]
    solution = [tuple(c) for c in lvl["solution"]]

    errors = []

    # 1. Grid dimensions
    if len(walls) != n:
        errors.append(f"walls rows {len(walls)} != n {n}")
    for r, row in enumerate(walls):
        if len(row) != n:
            errors.append(f"walls[{r}] cols {len(row)} != n {n}")
        for c, w in enumerate(row):
            if not (0 <= w <= 15):
                errors.append(f"walls[{r}][{c}]={w} not in [0,15]")

    # 2. Checkpoints
    if len(checkpoints) != k:
        errors.append(f"checkpoints count {len(checkpoints)} != k {k}")
    seen = set()
    for ck in checkpoints:
        if ck in seen:
            errors.append(f"duplicate checkpoint {ck}")
        seen.add(ck)
        if not (0 <= ck[0] < n and 0 <= ck[1] < n):
            errors.append(f"checkpoint {ck} out of bounds")

    # 3. Solution structure
    if len(solution) < k:
        errors.append(f"solution length {len(solution)} < k {k}")
    sol_seen = set()
    for i, cell in enumerate(solution):
        if cell in sol_seen:
            errors.append(f"solution cell {cell} repeats at step {i}")
        sol_seen.add(cell)
        if not (0 <= cell[0] < n and 0 <= cell[1] < n):
            errors.append(f"solution cell {cell} out of bounds at step {i}")
        if i > 0:
            prev = solution[i - 1]
            if has_wall(walls, prev[0], prev[1], cell[0], cell[1]):
                errors.append(f"wall between solution[{i-1}] and solution[{i}]")
            dr = abs(cell[0] - prev[0])
            dc = abs(cell[1] - prev[1])
            if dr + dc != 1:
                errors.append(f"solution step {i} not orthogonal: {prev} -> {cell}")

    # 4. Checkpoints visited in order by solution
    ck_idx = 0
    for cell in solution:
        if ck_idx < k and cell == checkpoints[ck_idx]:
            ck_idx += 1
    if ck_idx != k:
        errors.append(f"solution visits only {ck_idx}/{k} checkpoints in order")

    # 5. Perfect maze: all cells reachable via BFS
    visited = set()
    stack = [(0, 0)]
    visited.add((0, 0))
    while stack:
        r, c = stack.pop()
        for dr, dc in [(-1, 0), (0, 1), (1, 0), (0, -1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in visited:
                if not has_wall(walls, r, c, nr, nc):
                    visited.add((nr, nc))
                    stack.append((nr, nc))
    if len(visited) != n * n:
        errors.append(f"only {len(visited)}/{n*n} cells reachable in maze")

    return errors


def main():
    with open(LEVELS_PATH) as f:
        data = json.load(f)
    levels = data["levels"]
    print(f"Validating {len(levels)} levels...")

    passed = 0
    failed = 0
    for lvl in levels:
        errors = validate_level(lvl)
        if errors:
            failed += 1
            print(f"  L{lvl['id']+1:2d} [{lvl['tier']:9s}]: FAIL")
            for e in errors:
                print(f"    - {e}")
        else:
            passed += 1
            print(f"  L{lvl['id']+1:2d} [{lvl['tier']:9s}]: PASS")

    print()
    print(f"Result: {passed}/{len(levels)} PASS, {failed}/{len(levels)} FAIL")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
