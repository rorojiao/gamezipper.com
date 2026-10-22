#!/usr/bin/env python3
import os as _gzos
_GZ_DIR = _gzos.path.dirname(_gzos.path.abspath(__file__))
import os
"""Camel Path level generator.

Rules:
- N x N grid with walls (impassable cells).
- Player draws a path from START to GOAL using only CAMEL moves:
  (1,3) leaper — 8 directions, like a chess knight but with a longer stride.
  (|dr|,|dc|) = (1,3) or (3,1)
- A camel hop is a single jump from one cell to another (no intermediate cells).
- Walls block the path (cannot step on wall cells).
- Each level has a unique shortest camel path.
"""

import json
import random
import sys
from collections import deque


DIRS = [(1,3),(3,1),(1,-3),(3,-1),(-1,3),(-3,1),(-1,-3),(-3,-1)]


def bfs_shortest(n, walls_set, start, goal):
    """BFS shortest camel path. Returns (length, path) or (None, None)."""
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
    """Find all shortest camel paths start->goal."""
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
                    if cur not in parents[(nr, nc)]:
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


def generate_level(n, walls_count, rng, min_len=3, max_len=14, max_attempts=300):
    """Generate one valid camel-path level with unique shortest path.

    min_len/max_len bound the solution length so each difficulty tier can ask for
    a genuinely longer path. Without an explicit min_len the generator always
    accepted the first (shortest) candidate, so every level came out at the
    minimum length and the tier curve collapsed to a flat line.
    """
    for attempt in range(max_attempts):
        cells = [(r, c) for r in range(n) for c in range(n)]
        rng.shuffle(cells)
        start = cells[0]

        # Compute reachable cells from start with no walls
        visited = {tuple(start): 0}
        queue = deque([tuple(start)])
        while queue:
            cur = queue.popleft()
            cur_len = visited[cur]
            for dr, dc in DIRS:
                nr, nc = cur[0] + dr, cur[1] + dc
                if not (0 <= nr < n and 0 <= nc < n):
                    continue
                if (nr, nc) in visited:
                    continue
                visited[(nr, nc)] = cur_len + 1
                queue.append((nr, nc))

        # Pick a goal that's reachable and far enough
        candidates = [g for g in visited if g != tuple(start) and visited[g] >= min_len]
        if not candidates:
            continue
        rng.shuffle(candidates)

        # Prefer the farthest candidates first so long tiers can actually be long.
        candidates.sort(key=lambda g: -visited[g])

        for goal in candidates:
            # Try wall configurations
            for wattempt in range(40):
                wall_cells = [(r, c) for r in range(n) for c in range(n)
                              if (r, c) != start and (r, c) != goal]
                rng.shuffle(wall_cells)
                walls = wall_cells[:walls_count]
                walls_set = set(tuple(w) for w in walls)

                length, path = bfs_shortest(n, walls_set, start, goal)
                if length is None or length < min_len or length > max_len:
                    continue

                all_paths = find_all_shortest(n, walls_set, start, goal)
                if len(all_paths) == 1:
                    return {
                        'n': n,
                        'start': list(start),
                        'goal': list(goal),
                        'walls': [list(w) for w in walls],
                        'solution_path': [list(p) for p in path],
                        'length': length,
                    }
    return None


def main():
    rng = random.Random(20260921)

    levels = []
    # (tier, n, walls_count, count, min_len)
    # min_len rises per tier so the advertised 5-tier difficulty curve is real:
    # a bigger board with more walls forces a longer forced path.
    tier_specs = [
        ('Beginner', 5, 1, 6, 3),
        ('Easy',     6, 3, 6, 3),
        ('Medium',   7, 5, 6, 4),
        ('Hard',     8, 8, 6, 5),
        ('Expert',   9, 12, 6, 5),
    ]

    level_id = 0
    for tier_name, n, walls_count, count, min_len in tier_specs:
        attempts = 0
        tier_count = 0
        while tier_count < count and attempts < count * 400:
            attempts += 1
            lvl = generate_level(n, walls_count, rng, min_len=min_len)
            if lvl is None:
                continue
            lvl['id'] = level_id
            lvl['name'] = f'{tier_name} {tier_count + 1}'
            lvl['tier'] = tier_name
            levels.append(lvl)
            tier_count += 1
            level_id += 1

        lens = [l['length'] for l in levels if l['tier'] == tier_name]
        print(f'{tier_name} ({n}x{n}): generated {tier_count}/{count}  lengths={lens}')

    output = {
        'name': 'Camel Path',
        'slug': 'camel-path',
        'description': 'Draw a camel path from start to goal through walls.',
        'levels': levels,
    }

    with open(os.path.join(_GZ_DIR, 'levels.json'), 'w') as f:
        json.dump(output, f, indent=2)
    print(f'\nTotal: {len(levels)} levels written to levels.json')


if __name__ == '__main__':
    main()