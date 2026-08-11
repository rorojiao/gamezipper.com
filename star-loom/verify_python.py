#!/usr/bin/env python3
"""
Star Loom - Python structural verifier.

Checks each level:
1. Solution edges form valid connected graph
2. All chord degrees match anchor clues
3. Each anchor has correct degree
4. Solution uses only valid edges (no duplicates)
"""
import json
import sys


def verify_level(level):
    """Returns (passed: bool, error: str|None)"""
    N = level['num_stars']
    anchors = {int(k): v for k, v in level['anchors'].items()}
    solution = [tuple(e) for e in level['solution']]

    # All edges valid (i,j) with i<j
    for (i, j) in solution:
        if not (0 <= i < N and 0 <= j < N):
            return False, f"Edge ({i},{j}) has invalid node"
        if i == j:
            return False, f"Self-loop ({i},{j})"

    # No duplicates
    if len(set(solution)) != len(solution):
        return False, "Duplicate edges in solution"

    # Check degree matches anchors
    degrees = [0] * N
    for (i, j) in solution:
        degrees[i] += 1
        degrees[j] += 1

    for n, clue in anchors.items():
        if degrees[n] != clue:
            return False, f"Star {n} degree {degrees[n]} != clue {clue}"

    # Check connectivity (BFS)
    if solution:
        adj = {n: set() for n in range(N)}
        for (i, j) in solution:
            adj[i].add(j)
            adj[j].add(i)
        visited = {0}
        stack = [0]
        while stack:
            cur = stack.pop()
            for nb in adj[cur]:
                if nb not in visited:
                    visited.add(nb)
                    stack.append(nb)
        if len(visited) != N:
            return False, f"Graph disconnected: {visited}"

    # Solution must include at least one edge per non-anchor star (degree >= 1 for any node that needs connection)
    # Actually non-anchor stars have NO constraint, so degree can be 0 (but they'd be isolated)
    # For graph connectivity, all nodes must be reachable
    # Since we already checked connectivity, all nodes have degree >= 1

    return True, None


def main():
    with open('/home/junze/gamezipper.com/star-loom/levels.json') as f:
        data = json.load(f)

    levels = data['levels']
    passed = 0
    failed = []
    for lvl in levels:
        ok, err = verify_level(lvl)
        if ok:
            passed += 1
        else:
            failed.append((lvl['number'], err))

    print(f"Python verify: {passed}/{len(levels)} PASS")
    if failed:
        for num, err in failed:
            print(f"  Level {num} FAIL: {err}")
        sys.exit(1)
    else:
        print("All levels PASS structural check")


if __name__ == "__main__":
    main()
