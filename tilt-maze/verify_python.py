#!/usr/bin/env python3
"""Independent Python verifier for Tilt Maze levels.

Loads levels.json, applies each level's `solution` to its grid, and checks
that the result is a win (no balls remaining). Reports pass/fail per level.
"""
import json
import sys
from pathlib import Path

LEVELS_PATH = Path(__file__).parent / 'levels.json'


def tilt_once(grid, direction):
    """Same tilt logic as gen_levels.py (independent verification)."""
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


def main():
    levels = json.loads(LEVELS_PATH.read_text())
    passed = 0
    failed = []
    for lvl in levels:
        grid = lvl['grid']
        sol = lvl['solution']
        g = grid
        ok = True
        for d in sol:
            g, valid = tilt_once(g, d)
            if not valid:
                ok = False
                break
        balls = sum(r.count('B') for r in g)
        if ok and balls == 0:
            passed += 1
        else:
            failed.append((lvl['id'], lvl['tier'], 'INVALID' if not ok else f'BALLS_LEFT={balls}'))

    print(f"=== Tilt Maze Independent Verifier ===")
    print(f"Total: {len(levels)}, Passed: {passed}, Failed: {len(failed)}")
    if failed:
        for fid, tier, reason in failed:
            print(f"  L{fid} ({tier}): FAIL — {reason}")
        sys.exit(1)
    else:
        print(f"ALL {len(levels)} LEVELS PASS ✓")


if __name__ == '__main__':
    main()