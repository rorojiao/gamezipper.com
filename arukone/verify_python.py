#!/usr/bin/env python3
"""
Arukone (Number Link) verifier — Python implementation.

Reads arukone/levels.json and verifies each level is solvable with a unique solution.
"""
import json
import sys
import time
from collections import deque


def neighbors4(r, c, N):
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < N and 0 <= nc < N:
            yield nr, nc


def solve_arukone(N, pairs, time_limit=15):
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
            for nr, nc in neighbors4(r, c, N):
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
        import random
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


def main():
    with open("/home/junze/gamezipper.com/arukone/levels.json") as f:
        data = json.load(f)

    levels = data["levels"]
    passed = 0
    failed = 0
    for lv in levels:
        N = lv["r"]
        pairs = [(tuple(p[0]), tuple(p[1])) for p in lv["p"]]
        sols = solve_arukone(N, pairs, time_limit=10)
        if len(sols) == 1:
            passed += 1
        else:
            failed += 1
            print(f"L{lv['i']}: FAIL ({len(sols)} solutions)")
    print(f"verify_python.py: {passed}/{len(levels)} PASS")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
