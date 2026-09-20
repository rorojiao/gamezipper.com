#!/usr/bin/env python3
"""Bishop Path level generator.

Rules:
- N x N grid with walls (impassable cells).
- Player draws a path from START to GOAL using only BISHOP moves:
  any number of cells diagonally (4 directions: NW, NE, SW, SE).
- A single bishop move slides along a diagonal until it hits a wall or edge
  (or chooses to stop at any empty cell).
- Walls block the path (path cannot pass through wall cells).
- Each level has a unique shortest bishop-path.
"""

import json
import random
import sys
from collections import deque


def bfs_shortest(n, walls_set, start, goal):
    """BFS to find shortest bishop path (each step = slide along one diagonal).

    Returns (length, path) where length = number of moves (edges) in path.
    """
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
            # Slide from cur along this diagonal
            step = 1
            while True:
                nr, nc = cur[0] + dr * step, cur[1] + dc * step
                if not (0 <= nr < n and 0 <= nc < n):
                    break  # off grid
                if (nr, nc) in walls_set:
                    break  # wall blocks
                nxt = (nr, nc)
                if nxt in visited:
                    step += 1
                    continue  # can pass over visited, but not stop
                visited[nxt] = (cur, cur_len + 1)
                if nxt == tuple(goal):
                    found = nxt
                    queue.clear()
                    break
                queue.append(nxt)
                break  # bishop path step stops at first unvisited cell on this diagonal
            if found:
                break
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
    """Find ALL shortest bishop paths from start to goal."""
    if start == goal:
        return [[start]]

    DIRS = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
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
                step = 1
                while True:
                    nr, nc = cur[0] + dr * step, cur[1] + dc * step
                    if not (0 <= nr < n and 0 <= nc < n):
                        break
                    if (nr, nc) in walls_set:
                        break
                    nxt = (nr, nc)
                    if nxt not in visited:
                        visited[nxt] = visited[cur] + 1
                        parents[nxt] = [cur]
                        next_layer.append(nxt)
                        if nxt == tuple(goal):
                            found_len = visited[nxt]
                        break  # stop at first new cell
                    else:
                        step += 1  # can pass over visited cells
        if not next_layer:
            break
        layers.append(next_layer)
        if found_len is not None:
            break

    if found_len is None:
        return []

    all_paths = []
    def _build_paths(cur, path):
        if cur == tuple(start):
            all_paths.append(list(reversed(path + [cur])))
            return
        for p in parents.get(cur, []):
            _build_paths(p, path + [cur])

    _build_paths(tuple(goal), [])
    return all_paths


def generate_level(n, walls_count, rng, max_attempts=200):
    """Generate one valid bishop-path level."""
    for _ in range(max_attempts):
        cells = [(r, c) for r in range(n) for c in range(n)]
        rng.shuffle(cells)
        start = cells[0]
        candidates = [(r, c) for (r, c) in cells[1:] if (r + c) % 2 == (start[0] + start[1]) % 2]
        if not candidates:
            continue
        rng.shuffle(candidates)
        goal = None
        for g in candidates:
            # Need at least 2 cells away diagonally
            if abs(g[0] - start[0]) >= 2 and abs(g[1] - start[1]) >= 2:
                goal = g
                break
        if goal is None:
            continue

        for attempt in range(50):
            wall_cells = [(r, c) for r in range(n) for c in range(n)
                          if (r, c) != start and (r, c) != goal]
            rng.shuffle(wall_cells)
            walls = wall_cells[:walls_count]
            walls_set = set(tuple(w) for w in walls)

            length, path = bfs_shortest(n, walls_set, start, goal)
            if length is None or length < 2 or length > 14:
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
    rng = random.Random(20260920)

    levels = []
    tier_specs = [
        ('Beginner', 5, 0, 6),
        ('Easy',     6, 2, 6),
        ('Medium',   7, 4, 6),
        ('Hard',     8, 6, 6),
        ('Expert',   9, 9, 6),
    ]

    level_id = 0
    for tier_name, n, walls_count, count in tier_specs:
        attempts = 0
        tier_count = 0
        while tier_count < count and attempts < count * 100:
            attempts += 1
            lvl = generate_level(n, walls_count, rng)
            if lvl is None:
                continue
            lvl['id'] = level_id
            lvl['name'] = f'{tier_name} {tier_count + 1}'
            lvl['tier'] = tier_name
            levels.append(lvl)
            tier_count += 1
            level_id += 1

        print(f'{tier_name} ({n}x{n}): generated {tier_count}/{count}')

    output = {
        'name': 'Bishop Path',
        'slug': 'bishop-path',
        'description': 'Draw a bishop path from start to goal through walls.',
        'levels': levels,
    }

    with open('levels.json', 'w') as f:
        json.dump(output, f, indent=2)
    print(f'\nTotal: {len(levels)} levels written to levels.json')


if __name__ == '__main__':
    main()
