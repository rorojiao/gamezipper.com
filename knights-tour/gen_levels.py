#!/usr/bin/env python3
"""Knight's Tour level generator.

Mechanic:
  - N x N board with a starting square for the knight.
  - Knight must visit every square exactly once via L-shaped moves (2+1 in any direction).
  - Goal: visit all squares (reach N*N moves from start).

Generation:
  - For each level, pick a board size and starting position.
  - Use Warnsdorff's heuristic (always move to the square with the fewest onward moves)
    to construct a candidate tour. If it fails, retry with backtracking search.
  - Each level has a unique starting configuration (board size + start position).
  - Levels are designed to have at least one valid tour solution, with a stored
    canonical solution path used for verification.
"""
import json
import random
import sys
from pathlib import Path

# Knight move offsets (L-shapes)
KNIGHT_MOVES = [
    (-2, -1), (-2, 1), (-1, -2), (-1, 2),
    (1, -2), (1, 2), (2, -1), (2, 1),
]

LEVELS_PATH = Path(__file__).parent / 'levels.json'


def is_valid(board_size, r, c, visited):
    """Check if knight can move to (r, c)."""
    return (
        0 <= r < board_size
        and 0 <= c < board_size
        and not visited[r][c]
    )


def get_degree(board_size, r, c, visited):
    """Count onward moves from (r, c)."""
    count = 0
    for dr, dc in KNIGHT_MOVES:
        nr, nc = r + dr, c + dc
        if is_valid(board_size, nr, nc, visited):
            count += 1
    return count


def warnsdorff_tour(board_size, start_r, start_c):
    """Try Warnsdorff's heuristic to construct a tour.

    Returns list of (r, c) moves or None if failed.
    """
    visited = [[False] * board_size for _ in range(board_size)]
    visited[start_r][start_c] = True
    path = [(start_r, start_c)]
    r, c = start_r, start_c

    for step in range(board_size * board_size - 1):
        candidates = []
        for dr, dc in KNIGHT_MOVES:
            nr, nc = r + dr, c + dc
            if is_valid(board_size, nr, nc, visited):
                deg = get_degree(board_size, nr, nc, visited)
                candidates.append((deg, nr, nc))
        if not candidates:
            return None  # dead end
        # Sort by degree (Warnsdorff), then randomize ties for variety
        candidates.sort(key=lambda x: (x[0], random.random()))
        _, nr, nc = candidates[0]
        visited[nr][nc] = True
        path.append((nr, nc))
        r, c = nr, nc

    return path


def backtrack_tour(board_size, start_r, start_c, max_steps=1000000):
    """DFS with Warnsdorff heuristic to find a tour.

    Returns list of (r, c) moves or None.
    """
    visited = [[False] * board_size for _ in range(board_size)]
    visited[start_r][start_c] = True
    path = [(start_r, start_c)]

    def dfs(r, c, depth, step_count):
        if step_count[0] > max_steps:
            return False
        step_count[0] += 1
        if depth == board_size * board_size:
            return True
        candidates = []
        for dr, dc in KNIGHT_MOVES:
            nr, nc = r + dr, c + dc
            if is_valid(board_size, nr, nc, visited):
                deg = get_degree(board_size, nr, nc, visited)
                candidates.append((deg, nr, nc))
        candidates.sort(key=lambda x: (x[0], random.random()))
        for _, nr, nc in candidates:
            visited[nr][nc] = True
            path.append((nr, nc))
            if dfs(nr, nc, depth + 1, step_count):
                return True
            path.pop()
            visited[nr][nc] = False
        return False

    step_count = [0]
    if dfs(start_r, start_c, 1, step_count):
        return path
    return None


def generate_tour(board_size, start_r, start_c, max_attempts=200):
    """Try Warnsdorff with multiple seeds, then fall back to backtracking."""
    # Try Warnsdorff with random shuffles
    for attempt in range(max_attempts):
        path = warnsdorff_tour(board_size, start_r, start_c)
        if path is not None:
            return path
    # Fall back to backtracking (much slower but always succeeds for solvable configs)
    return backtrack_tour(board_size, start_r, start_c)


def verify_tour(board_size, start_r, start_c, path):
    """Verify a tour: all N*N squares visited exactly once, knight moves valid."""
    if len(path) != board_size * board_size:
        return False, f"Path length {len(path)} != {board_size * board_size}"
    if path[0] != (start_r, start_c):
        return False, "Start mismatch"
    visited = set()
    for r, c in path:
        if (r, c) in visited:
            return False, f"Duplicate visit at ({r},{c})"
        visited.add((r, c))
    if len(visited) != board_size * board_size:
        return False, f"Only {len(visited)} unique squares"
    for i in range(len(path) - 1):
        r1, c1 = path[i]
        r2, c2 = path[i + 1]
        dr, dc = r2 - r1, c2 - c1
        if (abs(dr), abs(dc)) not in [(1, 2), (2, 1)]:
            return False, f"Invalid move from ({r1},{c1}) to ({r2},{c2})"
    return True, "OK"


def main():
    random.seed(20260904)  # deterministic

    # Define 30 levels across 5 tiers.
    # Each entry: (tier, board_size, start_r, start_c)
    # Verified: each starting position has a tour solution.
    tier_specs = {
        "Beginner": {
            "size": 5,
            "starts": [
                (0, 0),
                (0, 2),
                (0, 4),
                (1, 1),
                (1, 3),
                (2, 0),
                (2, 4),
            ],  # 7 boards
        },
        "Easy": {
            "size": 6,
            "starts": [
                (0, 1), (1, 0),
                (2, 2),
                (3, 3),
                (4, 5),
                (5, 4),
            ],  # 6 boards
        },
        "Medium": {
            "size": 7,
            "starts": [
                (0, 0),
                (0, 6),
                (1, 1),
                (4, 0),
                (6, 6),
            ],  # 5 boards
        },
        "Hard": {
            "size": 8,
            "starts": [
                (0, 0), (1, 1),
                (3, 4),
                (5, 6),
                (7, 7),
                (4, 4),
            ],  # 6 boards
        },
        "Expert": {
            "size": 10,
            "starts": [
                (0, 0),
                (3, 5),
                (6, 8),
                (4, 2),
                (7, 1),
                (2, 7),
            ],  # 6 boards
        },
    }

    # Pre-test all starts are solvable with Warnsdorff+random
    levels = []
    lid = 1
    print("Generating levels...")
    MAX_LEVELS = 30

    for tier, spec in tier_specs.items():
        if lid > MAX_LEVELS:
            break
        size = spec["size"]
        for start_r, start_c in spec["starts"]:
            if lid > MAX_LEVELS:
                break
            print(f"  L{lid} {tier} {size}x{size} start=({start_r},{start_c})... ", end="", flush=True)
            path = None
            for attempt in range(500):
                path = warnsdorff_tour(size, start_r, start_c)
                if path is not None:
                    break
            if path is None:
                # Fall back to backtracking
                print(f"Warnsdorff failed, trying backtrack... ", end="", flush=True)
                path = backtrack_tour(size, start_r, start_c)
            if path is None:
                print(f"FAILED (unsolvable start)")
                continue
            ok, msg = verify_tour(size, start_r, start_c, path)
            if not ok:
                print(f"VERIFY FAIL: {msg}")
                continue
            print(f"OK ({len(path)} moves)")
            levels.append({
                "id": lid,
                "tier": tier,
                "size": size,
                "start": [start_r, start_c],
                "path": [[r, c] for r, c in path],
            })
            lid += 1

    print(f"\nTotal levels: {len(levels)}")

    if len(levels) != 30:
        print(f"WARNING: expected 30 levels, got {len(levels)}")
        # Pad with simple 5x5 starts if needed
        if len(levels) < 30:
            extras_needed = 30 - len(levels)
            extra_starts = [
                (0, 1), (0, 3),
                (1, 0), (1, 2), (1, 4),
                (2, 1), (2, 3),
                (3, 0), (3, 2), (3, 4),
                (4, 0), (4, 1), (4, 3), (4, 4),
                (0, 2), (4, 2),
            ]
            idx = 0
            while len(levels) < 30 and idx < len(extra_starts):
                start_r, start_c = extra_starts[idx]
                idx += 1
                # Skip if already in levels
                if any(l["start"] == [start_r, start_c] and l["size"] == 5 for l in levels):
                    continue
                print(f"  padding L{len(levels)+1} 5x5 start=({start_r},{start_c})... ", end="", flush=True)
                path = None
                for attempt in range(50):
                    path = warnsdorff_tour(5, start_r, start_c)
                    if path is not None:
                        break
                if path is None:
                    path = backtrack_tour(5, start_r, start_c)
                if path is None:
                    print(f"FAILED")
                    continue
                ok, _ = verify_tour(5, start_r, start_c, path)
                if not ok:
                    print(f"VERIFY FAIL")
                    continue
                print(f"OK")
                levels.append({
                    "id": len(levels) + 1,
                    "tier": "Beginner",
                    "size": 5,
                    "start": [start_r, start_c],
                    "path": [[r, c] for r, c in path],
                })

    LEVELS_PATH.write_text(json.dumps(levels, indent=2))
    print(f"\nWrote {len(levels)} levels to {LEVELS_PATH}")

    # Distribution by tier
    from collections import Counter
    tier_count = Counter(l["tier"] for l in levels)
    print("\nTier distribution:")
    for tier, count in tier_count.items():
        print(f"  {tier}: {count}")

    size_count = Counter(l["size"] for l in levels)
    print("\nSize distribution:")
    for size, count in sorted(size_count.items()):
        print(f"  {size}x{size}: {count}")


if __name__ == "__main__":
    main()
