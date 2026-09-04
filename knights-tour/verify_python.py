#!/usr/bin/env python3
"""Knight's Tour independent verifier.

Loads levels.json, checks each level's stored path:
  - Path visits all N*N squares exactly once (length == N*N)
  - First square matches level start
  - Every consecutive pair is a valid knight move (|dr|,|dc|) == (1,2) or (2,1)
"""
import json
import sys
from pathlib import Path

LEVELS_PATH = Path(__file__).parent / 'levels.json'


def verify_tour(size, start, path):
    """Verify a knight's tour path.

    Returns (ok: bool, reason: str)
    """
    expected = size * size
    if len(path) != expected:
        return False, f"path length {len(path)} != {expected}"

    if path[0] != list(start):
        return False, f"start mismatch: path[0]={path[0]} start={start}"

    visited = set()
    for cell in path:
        key = (cell[0], cell[1])
        if key in visited:
            return False, f"duplicate visit at {key}"
        visited.add(key)
        if not (0 <= cell[0] < size and 0 <= cell[1] < size):
            return False, f"out of bounds: {key}"

    if len(visited) != expected:
        return False, f"only {len(visited)} unique squares (expected {expected})"

    for i in range(len(path) - 1):
        r1, c1 = path[i]
        r2, c2 = path[i + 1]
        dr, dc = abs(r2 - r1), abs(c2 - c1)
        if (dr, dc) not in [(1, 2), (2, 1)]:
            return False, f"invalid knight move from ({r1},{c1}) to ({r2},{c2})"

    return True, "OK"


def main():
    levels = json.loads(LEVELS_PATH.read_text())
    passed = 0
    failed = []

    for lvl in levels:
        size = lvl["size"]
        start = lvl["start"]
        path = lvl["path"]
        ok, reason = verify_tour(size, start, path)
        if ok:
            passed += 1
        else:
            failed.append((lvl["id"], lvl["tier"], size, start, reason))

    print("=== Knight's Tour Independent Verifier ===")
    print(f"Total: {len(levels)}, Passed: {passed}, Failed: {len(failed)}")

    if failed:
        for lid, tier, size, start, reason in failed:
            print(f"  L{lid} ({tier} {size}x{size} start={start}): FAIL — {reason}")
        sys.exit(1)
    else:
        print(f"ALL {len(levels)} LEVELS PASS ✓")


if __name__ == "__main__":
    main()
