#!/usr/bin/env python3
"""River Crossing level validator.

Reads levels.json and for each level:
  1. Validates the recorded solution is correct (visits all states, doesn't violate constraints)
  2. Counts BFS min-length solutions (informational)
  3. Reports PASS if solution is valid
"""
import json
import sys
from pathlib import Path
from itertools import combinations
from collections import deque

LEVELS_PATH = Path(__file__).parent / 'levels.json'


def is_valid_alone(bank, constraints):
    if len(bank) <= 1:
        return True
    for c in constraints:
        if c.issubset(bank):
            return False
    return True


def verify_solution(level):
    """Apply the solution moves to a (left_set, boat_side) state machine.
    Returns (ok: bool, reason: str)."""
    pieces = level["pieces"]
    pieces_set = frozenset(pieces)
    constraints = [frozenset(c) for c in level["constraints"]]
    cap = level["cap"]
    left = pieces_set
    side = 'L'
    for i, (next_side, carried) in enumerate(level["moves"]):
        carried_set = frozenset(carried)
        if len(carried_set) > cap:
            return False, f"move {i+1}: cap {cap} exceeded (carried {len(carried_set)})"
        # Pieces carried must be on the current side
        if not carried_set.issubset(left if side == 'L' else pieces_set - left):
            return False, f"move {i+1}: not on boat side"
        # Apply the move
        if side == 'L':
            left = left - carried_set
        else:
            left = left | carried_set
        side = next_side
        # After the move, the OLD side is alone
        alone_bank = left if side == 'R' else pieces_set - left
        if not is_valid_alone(alone_bank, constraints):
            return False, f"move {i+1}: alone bank invalid {set(alone_bank)}"
    # Final state: all pieces on R, boat anywhere
    if len(left) == 0:
        return True, "OK"
    return False, f"final state has pieces on left: {set(left)}"


def bfs_count(pieces, constraints, cap, target_dist, max_states=200000):
    pieces_set = frozenset(pieces)
    start = (pieces_set, 'L')
    visited = {start: 0}
    frontier = deque([(start, [])])
    n_goals = 0
    while frontier:
        if len(visited) > max_states:
            return n_goals
        state, path = frontier.popleft()
        dist = visited[state]
        if dist >= target_dist:
            continue
        left, side = state
        bank = left if side == 'L' else pieces_set - left
        for r in range(0, min(cap, len(bank)) + 1):
            carried_iter = [()]
            if r > 0:
                carried_iter = combinations(sorted(bank), r)
            for carried in carried_iter:
                carried_set = frozenset(carried)
                if side == 'L':
                    new_left = left - carried_set
                else:
                    new_left = left | carried_set
                new_state = (new_left, 'R' if side == 'L' else 'L')
                alone_bank = new_left if new_state[1] == 'R' else pieces_set - new_left
                if not is_valid_alone(alone_bank, constraints):
                    continue
                new_dist = dist + 1
                if new_state in visited and visited[new_state] < new_dist:
                    continue
                visited[new_state] = new_dist
                new_path = path + [(new_state[1], list(carried))]
                if len(new_left) == 0:
                    if new_dist == target_dist:
                        n_goals += 1
                else:
                    frontier.append((new_state, new_path))
    return n_goals


def main():
    levels = json.loads(LEVELS_PATH.read_text())
    pass_count = 0
    fail_count = 0
    for lvl in levels:
        ok, reason = verify_solution(lvl)
        if ok:
            pass_count += 1
        else:
            fail_count += 1
            print(f"  ✗ L{lvl['id']} ({lvl['tier']}): {reason}")
    print(f"\n{pass_count}/{pass_count+fail_count} levels verified")
    if fail_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
