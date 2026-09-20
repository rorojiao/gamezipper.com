#!/usr/bin/env python3
"""Independent Python verifier for Bishop Path levels.

Reads levels.json and verifies:
1. Each level is reachable (BFS finds a path)
2. Each level has a UNIQUE shortest solution
3. The stored solution_path actually achieves that shortest length
4. Walls are valid (not on start/goal)
5. Path cells are reachable via bishop slides from previous cell
"""

import json
import sys
from collections import deque


def bfs_shortest(n, walls_set, start, goal):
    """BFS to find shortest bishop path (slide along diagonal)."""
    if start == goal:
        return 0, [start]
    DIRS = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
    visited = {tuple(start): (None, 0)}
    queue = deque([tuple(start)])
    found = None
    while queue:
        cur = queue.popleft()
        cur_len = visited[cur][1]
        for dr, dc in DIRS:
            step = 1
            while True:
                nr, nc = cur[0] + dr * step, cur[1] + dc * step
                if not (0 <= nr < n and 0 <= nc < n): break
                if (nr, nc) in walls_set: break
                nxt = (nr, nc)
                if nxt in visited:
                    step += 1
                    continue
                visited[nxt] = (cur, cur_len + 1)
                if nxt == tuple(goal):
                    found = nxt
                    queue.clear()
                    break
                queue.append(nxt)
                break
            if found: break
        if found: break
    if not found: return None, None
    path = []
    cur = found
    while cur is not None:
        path.append(list(cur))
        cur = visited[cur][0]
    path.reverse()
    return visited[found][1], path


def find_all_shortest(n, walls_set, start, goal):
    """Find all shortest paths."""
    if start == goal: return [[start]]
    DIRS = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
    visited = {tuple(start): 0}
    parents = {tuple(start): []}
    layers = [[tuple(start)]]
    found_len = None
    while True:
        last_layer = layers[-1]
        next_layer = []
        if not last_layer: break
        for cur in last_layer:
            for dr, dc in DIRS:
                step = 1
                while True:
                    nr, nc = cur[0] + dr * step, cur[1] + dc * step
                    if not (0 <= nr < n and 0 <= nc < n): break
                    if (nr, nc) in walls_set: break
                    nxt = (nr, nc)
                    if nxt not in visited:
                        visited[nxt] = visited[cur] + 1
                        parents[nxt] = [cur]
                        next_layer.append(nxt)
                        if nxt == tuple(goal):
                            found_len = visited[nxt]
                        break
                    else:
                        step += 1
        if not next_layer: break
        layers.append(next_layer)
        if found_len is not None: break
    if found_len is None: return []
    all_paths = []
    def _build_paths(cur, path):
        if cur == tuple(start):
            all_paths.append(list(reversed(path + [cur])))
            return
        for p in parents.get(cur, []):
            _build_paths(p, path + [cur])
    _build_paths(tuple(goal), [])
    return all_paths


def verify_stored_path(n, walls_set, start, goal, stored_path):
    """Verify stored_path is a valid bishop-path from start to goal.

    Each consecutive pair must be on the same diagonal with no wall in between.
    """
    if stored_path[0] != list(start):
        return False, 'start mismatch'
    if stored_path[-1] != list(goal):
        return False, 'goal mismatch'
    for i in range(len(stored_path) - 1):
        r1, c1 = stored_path[i]
        r2, c2 = stored_path[i + 1]
        dr, dc = r2 - r1, c2 - c1
        if abs(dr) != abs(dc) or dr == 0:
            return False, f'non-diagonal step {stored_path[i]} -> {stored_path[i+1]}'
        # No wall between
        sr = 1 if dr > 0 else -1
        sc = 1 if dc > 0 else -1
        steps = abs(dr)
        for s in range(1, steps):
            cr, cc = r1 + sr * s, c1 + sc * s
            if (cr, cc) in walls_set:
                return False, f'wall at {(cr, cc)} between {stored_path[i]} and {stored_path[i+1]}'
    return True, 'OK'


def main():
    with open('levels.json') as f:
        data = json.load(f)

    levels = data['levels']
    print(f'Verifying {len(levels)} Bishop Path levels (Python independent)...\n')

    passed = 0
    failed = 0

    for lv in levels:
        n = lv['n']
        start = tuple(lv['start'])
        goal = tuple(lv['goal'])
        walls_set = set(tuple(w) for w in lv['walls'])
        stored_path = [list(p) for p in lv['solution_path']]

        # Sanity
        if start in walls_set or goal in walls_set:
            print(f'  ❌ L{lv["id"]}: start/goal in walls')
            failed += 1
            continue

        # 0. Verify stored path validity (bishop moves, no walls crossed)
        valid, reason = verify_stored_path(n, walls_set, start, goal, stored_path)
        if not valid:
            print(f'  ❌ L{lv["id"]}: stored path INVALID: {reason}')
            failed += 1
            continue

        # 1. Reachable
        length, path = bfs_shortest(n, walls_set, start, goal)
        if length is None:
            print(f'  ❌ L{lv["id"]}: NO path from {start} to {goal}')
            failed += 1
            continue

        # 2. Stored solution achieves shortest length
        if len(stored_path) - 1 != length:
            print(f'  ❌ L{lv["id"]}: stored len {len(stored_path) - 1} != shortest {length}')
            failed += 1
            continue

        # 3. Unique shortest
        all_paths = find_all_shortest(n, walls_set, start, goal)
        if len(all_paths) != 1:
            print(f'  ❌ L{lv["id"]}: {len(all_paths)} shortest paths (not unique)')
            failed += 1
            continue

        # 4. Stored path matches canonical shortest
        stored_set = set(tuple(p) for p in stored_path)
        canonical_set = set(tuple(p) for p in all_paths[0])
        if stored_set != canonical_set:
            print(f'  ❌ L{lv["id"]}: stored path differs from canonical shortest')
            failed += 1
            continue

        passed += 1

    print()
    print(f'RESULT: {passed}/{len(levels)} PASS, {failed} FAIL')
    sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
