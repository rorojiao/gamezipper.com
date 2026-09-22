#!/usr/bin/env python3
"""Zebra Path — Python structural verification.

Validates 30 levels have unique shortest zebra paths.
"""
import json
import sys
from collections import deque

DIRS = [(2,3),(3,2),(2,-3),(3,-2),(-2,3),(-3,2),(-2,-3),(-3,-2)]


def bfs_shortest(n, walls_set, start, goal):
    if start == goal:
        return 0, [start]
    visited = {tuple(start): (None, 0)}
    queue = deque([tuple(start)])
    found = None
    while queue:
        cur = queue.popleft()
        cur_len = visited[cur][1]
        for dr, dc in DIRS:
            nr, nc = cur[0] + dr, cur[1] + dc
            if not (0 <= nr < n and 0 <= nc < n):
                continue
            if (nr, nc) in walls_set:
                continue
            if (nr, nc) in visited:
                continue
            visited[(nr, nc)] = (cur, cur_len + 1)
            if (nr, nc) == tuple(goal):
                found = (nr, nc)
                queue.clear()
                break
            queue.append((nr, nc))
        if found:
            break
    if not found:
        return None, None
    path = []
    cur = found
    while cur is not None:
        path.append(list(cur))
        cur = visited[cur][0]
    path.reverse()
    return visited[found][1], path


def find_all_shortest(n, walls_set, start, goal):
    if start == goal:
        return [[start]]
    visited = {tuple(start): 0}
    parents = {tuple(start): []}
    layers = [[tuple(start)]]
    found_len = None
    while True:
        last_layer = layers[-1]
        next_layer = []
        if not last_layer:
            break
        for cur in last_layer:
            for dr, dc in DIRS:
                nr, nc = cur[0] + dr, cur[1] + dc
                if not (0 <= nr < n and 0 <= nc < n):
                    continue
                if (nr, nc) in walls_set:
                    continue
                if (nr, nc) not in visited:
                    visited[(nr, nc)] = visited[cur] + 1
                    parents[(nr, nc)] = [cur]
                    next_layer.append((nr, nc))
                    if (nr, nc) == tuple(goal):
                        found_len = visited[(nr, nc)]
                elif visited[(nr, nc)] == visited[cur] + 1:
                    parents[(nr, nc)].append(cur)
        if not next_layer:
            break
        layers.append(next_layer)
        if found_len is not None:
            break
    if found_len is None:
        return []
    all_paths = []
    def _build(cur, path):
        if cur == tuple(start):
            all_paths.append(list(reversed(path + [cur])))
            return
        for p in parents.get(cur, []):
            _build(p, path + [cur])
    _build(tuple(goal), [])
    return all_paths


def main():
    with open('levels.json') as f:
        data = json.load(f)
    levels = data['levels']
    pass_count = 0
    fail = []
    for lvl in levels:
        n = lvl['n']
        start = tuple(lvl['start'])
        goal = tuple(lvl['goal'])
        walls = set(tuple(w) for w in lvl['walls'])
        path = lvl['solution_path']

        # check path starts at S, ends at G
        if path[0] != list(start):
            fail.append(f"L{lvl['id']} path doesn't start at S")
            continue
        if path[-1] != list(goal):
            fail.append(f"L{lvl['id']} path doesn't end at G")
            continue

        # check no walls in path
        if any(tuple(p) in walls for p in path):
            fail.append(f"L{lvl['id']} path crosses wall")
            continue

        # check all hops are valid zebra (2,3) leaper
        valid = True
        for i in range(len(path) - 1):
            dr = abs(path[i+1][0] - path[i][0])
            dc = abs(path[i+1][1] - path[i][1])
            if {dr, dc} != {2, 3}:
                fail.append(f"L{lvl['id']} bad hop {(dr, dc)}")
                valid = False
                break
        if not valid:
            continue

        # check no duplicates in path
        if len(set(tuple(p) for p in path)) != len(path):
            fail.append(f"L{lvl['id']} path has duplicate cells")
            continue

        # check path is shortest
        bfs_len, _ = bfs_shortest(n, walls, start, goal)
        if bfs_len != lvl['length']:
            fail.append(f"L{lvl['id']} claimed length={lvl['length']} but BFS={bfs_len}")
            continue

        # check uniqueness
        all_paths = find_all_shortest(n, walls, start, goal)
        if len(all_paths) != 1:
            fail.append(f"L{lvl['id']} {len(all_paths)} shortest paths (need 1)")
            continue

        pass_count += 1

    total = len(levels)
    print(f"Python structural: {pass_count}/{total} PASS")
    if fail:
        for f in fail:
            print(f"  FAIL: {f}")
        sys.exit(1)
    if pass_count == total:
        print("All 30 levels: structural PASS, BFS shortest, unique path, no walls crossed.")
        sys.exit(0)
    sys.exit(1)


if __name__ == '__main__':
    main()