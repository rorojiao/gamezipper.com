#!/usr/bin/env python3
"""River Crossing level generator.

Mechanic:
  - N pieces on left bank
  - Boat holds up to CAP pieces
  - Boatman ALWAYS rows the boat
  - Goal: move all pieces to right bank
  - Constraint: certain pairs cannot be left alone (no boatman) together

Verification: for each level, BFS finds the canonical min-length solution.
Many river crossing puzzles have multiple min-length solutions; the game
records the canonical one (lexicographically smallest) and the player
can use ANY valid min-length solution to win.
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


def bfs_solve(pieces, constraints, cap, max_states=300000):
    """BFS for min-move solution.  Returns (solutions, min_dist)."""
    pieces_set = frozenset(pieces)
    start = (pieces_set, 'L')
    if len(start[0]) == 0:
        return [[]], 0

    visited = {start: 0}
    frontier = deque([(start, [])])
    solutions = []
    min_dist = None
    while frontier:
        if len(visited) > max_states:
            break
        state, path = frontier.popleft()
        dist = visited[state]
        if min_dist is not None and dist >= min_dist:
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
                # The OLD side is now alone (no boatman) and must satisfy constraints.
                alone_bank = new_left if new_state[1] == 'R' else pieces_set - new_left
                if not is_valid_alone(alone_bank, constraints):
                    continue
                new_dist = dist + 1
                if new_state in visited and visited[new_state] < new_dist:
                    continue
                visited[new_state] = new_dist
                new_path = path + [(new_state[1], list(carried))]
                if len(new_left) == 0:
                    if min_dist is None:
                        min_dist = new_dist
                    if new_dist == min_dist:
                        solutions.append(new_path)
                else:
                    frontier.append((new_state, new_path))
    return solutions, min_dist


def shortest_and_unique(pieces, constraints, cap, max_states=300000):
    solutions, min_dist = bfs_solve(pieces, constraints, cap, max_states)
    if not solutions:
        return None, False, None, 0
    canonical = min(solutions, key=lambda p: tuple((s, tuple(c)) for s, c in p))
    return canonical, len(solutions) == 1, min_dist, len(solutions)


# --- Level definitions (hand-curated) ------------------------------------------
# Each level is solvable via BFS.  We aim for unique solutions where possible,
# but the canonical min-length solution is always recorded.

LEVELS = [
    # Tier 1: Beginner — classic 3-piece, cap=1, 6 levels (solvable, multi-sol)
    {"tier": "Beginner", "pieces": ["wolf", "goat", "cabbage"],
     "constraints": [("wolf", "goat"), ("goat", "cabbage")], "cap": 1,
     "story": "Wolf, goat, cabbage"},
    {"tier": "Beginner", "pieces": ["fox", "chicken", "grain"],
     "constraints": [("fox", "chicken"), ("chicken", "grain")], "cap": 1,
     "story": "Fox, chicken, grain"},
    {"tier": "Beginner", "pieces": ["cat", "mouse", "cheese"],
     "constraints": [("cat", "mouse"), ("mouse", "cheese")], "cap": 1,
     "story": "Cat, mouse, cheese"},
    {"tier": "Beginner", "pieces": ["dog", "cat", "fish"],
     "constraints": [("dog", "cat"), ("cat", "fish")], "cap": 1,
     "story": "Dog, cat, fish"},
    {"tier": "Beginner", "pieces": ["snake", "frog", "fly"],
     "constraints": [("snake", "frog"), ("frog", "fly")], "cap": 1,
     "story": "Snake, frog, fly"},
    {"tier": "Beginner", "pieces": ["hawk", "rabbit", "carrot"],
     "constraints": [("hawk", "rabbit"), ("rabbit", "carrot")], "cap": 1,
     "story": "Hawk, rabbit, carrot"},

    # Tier 2: Easy — 4 pieces, cap=1, constraints form a chain A eats B eats C, no other constraints
    # The 4th piece is harmless (no constraints involving it)
    {"tier": "Easy", "pieces": ["fox", "chicken", "grain", "sheep"],
     "constraints": [("fox", "chicken"), ("chicken", "grain")], "cap": 1,
     "story": "Fox, chicken, grain, sheep (sheep is harmless)"},
    {"tier": "Easy", "pieces": ["wolf", "goat", "cabbage", "duck"],
     "constraints": [("wolf", "goat"), ("goat", "cabbage")], "cap": 1,
     "story": "Wolf, goat, cabbage, duck (duck is harmless)"},
    {"tier": "Easy", "pieces": ["cat", "mouse", "cheese", "parrot"],
     "constraints": [("cat", "mouse"), ("mouse", "cheese")], "cap": 1,
     "story": "Cat, mouse, cheese, parrot (parrot is harmless)"},
    {"tier": "Easy", "pieces": ["snake", "frog", "fly", "rabbit"],
     "constraints": [("snake", "frog"), ("frog", "fly")], "cap": 1,
     "story": "Snake, frog, fly, rabbit (rabbit is harmless)"},
    {"tier": "Easy", "pieces": ["hawk", "rabbit", "carrot", "fish"],
     "constraints": [("hawk", "rabbit"), ("rabbit", "carrot")], "cap": 1,
     "story": "Hawk, rabbit, carrot, fish (fish is harmless)"},
    {"tier": "Easy", "pieces": ["dog", "cat", "fish", "mouse"],
     "constraints": [("dog", "cat"), ("cat", "fish")], "cap": 1,
     "story": "Dog, cat, fish, mouse (mouse is harmless)"},

    # Tier 3: Medium — 4 pieces, cap=2, 2 independent constraints
    # 3-piece chain + 1 independent predator/prey pair
    {"tier": "Medium", "pieces": ["fox", "chicken", "grain", "dog"],
     "constraints": [("fox", "chicken"), ("chicken", "grain"), ("dog", "chicken")], "cap": 2,
     "story": "Fox, chicken, grain, dog — boat holds 2"},
    {"tier": "Medium", "pieces": ["wolf", "goat", "cabbage", "fox"],
     "constraints": [("wolf", "goat"), ("goat", "cabbage"), ("fox", "goat")], "cap": 2,
     "story": "Wolf, goat, cabbage, fox — boat holds 2"},
    {"tier": "Medium", "pieces": ["cat", "mouse", "cheese", "snake"],
     "constraints": [("cat", "mouse"), ("mouse", "cheese"), ("snake", "mouse")], "cap": 2,
     "story": "Cat, mouse, cheese, snake — boat holds 2"},
    {"tier": "Medium", "pieces": ["dog", "cat", "fish", "owl"],
     "constraints": [("dog", "cat"), ("cat", "fish"), ("owl", "fish")], "cap": 2,
     "story": "Dog, cat, fish, owl — boat holds 2"},
    {"tier": "Medium", "pieces": ["snake", "frog", "fly", "hawk"],
     "constraints": [("snake", "frog"), ("frog", "fly"), ("hawk", "snake")], "cap": 2,
     "story": "Snake, frog, fly, hawk — boat holds 2"},
    {"tier": "Medium", "pieces": ["hawk", "rabbit", "carrot", "fox"],
     "constraints": [("hawk", "rabbit"), ("rabbit", "carrot"), ("fox", "rabbit")], "cap": 2,
     "story": "Hawk, rabbit, carrot, fox — boat holds 2"},

    # Tier 4: Hard — 5 pieces, cap=2, 3 constraints chain
    {"tier": "Hard", "pieces": ["fox", "chicken", "grain", "dog", "cat"],
     "constraints": [("fox", "chicken"), ("chicken", "grain"), ("dog", "cat")], "cap": 2,
     "story": "5 pieces — fox, chicken, grain, dog, cat"},
    {"tier": "Hard", "pieces": ["wolf", "goat", "cabbage", "sheep", "fox"],
     "constraints": [("wolf", "goat"), ("goat", "cabbage"), ("fox", "sheep")], "cap": 2,
     "story": "5 pieces — wolf, goat, cabbage, sheep, fox"},
    {"tier": "Hard", "pieces": ["cat", "mouse", "cheese", "owl", "snake"],
     "constraints": [("cat", "mouse"), ("mouse", "cheese"), ("owl", "mouse"), ("snake", "mouse")], "cap": 2,
     "story": "5 pieces — cat, mouse, cheese, owl, snake"},
    {"tier": "Hard", "pieces": ["dog", "cat", "fish", "parrot", "mouse"],
     "constraints": [("dog", "cat"), ("cat", "fish"), ("parrot", "fish")], "cap": 2,
     "story": "5 pieces — dog, cat, fish, parrot, mouse"},
    {"tier": "Hard", "pieces": ["hawk", "rabbit", "carrot", "hen", "fox"],
     "constraints": [("hawk", "rabbit"), ("rabbit", "carrot"), ("fox", "hen")], "cap": 2,
     "story": "5 pieces — hawk, rabbit, carrot, hen, fox"},
    {"tier": "Hard", "pieces": ["snake", "frog", "fly", "mouse", "rabbit"],
     "constraints": [("snake", "frog"), ("frog", "fly"), ("snake", "mouse"), ("hawk", "rabbit")], "cap": 2,
     "story": "5 pieces — snake, frog, fly, mouse, rabbit"},

    # Tier 5: Expert — 5 pieces, cap=2, complex constraints (only solvable ones)
    {"tier": "Expert", "pieces": ["fox", "chicken", "grain", "dog", "cat"],
     "constraints": [("fox", "chicken"), ("chicken", "grain"), ("dog", "cat")], "cap": 2,
     "story": "5 pieces — two chains"},
    {"tier": "Expert", "pieces": ["wolf", "goat", "cabbage", "sheep", "fox"],
     "constraints": [("wolf", "goat"), ("goat", "cabbage"), ("fox", "sheep")], "cap": 2,
     "story": "5 pieces — chain + independent pair"},
    {"tier": "Expert", "pieces": ["cat", "mouse", "cheese", "owl", "snake"],
     "constraints": [("cat", "mouse"), ("mouse", "cheese"), ("snake", "mouse")], "cap": 2,
     "story": "5 pieces — mouse is prey for 3"},
    {"tier": "Expert", "pieces": ["dog", "cat", "fish", "parrot", "owl"],
     "constraints": [("dog", "cat"), ("cat", "fish"), ("owl", "fish")], "cap": 2,
     "story": "5 pieces — fish is prey for 2"},
    {"tier": "Expert", "pieces": ["hawk", "rabbit", "carrot", "hen", "fox"],
     "constraints": [("hawk", "rabbit"), ("rabbit", "carrot"), ("fox", "hen")], "cap": 2,
     "story": "5 pieces — chain + predator pair"},
    {"tier": "Expert", "pieces": ["snake", "frog", "fly", "mouse", "grain"],
     "constraints": [("snake", "frog"), ("frog", "fly"), ("mouse", "grain")], "cap": 2,
     "story": "5 pieces — two chains"},
]


def gen():
    out = []
    skipped = []
    for i, lvl in enumerate(LEVELS):
        pieces = lvl["pieces"]
        constraints = [frozenset(c) for c in lvl["constraints"]]
        cap = lvl["cap"]
        assert len(set(pieces)) == len(pieces), f"L{i+1}: duplicate pieces"
        solution, unique, n_moves, n_sols = shortest_and_unique(pieces, constraints, cap)
        if solution is None:
            skipped.append((i + 1, "no solution"))
            continue
        out.append({
            "id": i + 1,
            "tier": lvl["tier"],
            "story": lvl["story"],
            "pieces": pieces,
            "constraints": lvl["constraints"],
            "cap": cap,
            "moves": solution,
            "n_moves": len(solution),
            "unique": unique,
            "n_solutions_at_min": n_sols,
        })
    if skipped:
        print("WARNING skipped levels:", skipped, file=sys.stderr)
    return out


if __name__ == "__main__":
    levels = gen()
    LEVELS_PATH.write_text(json.dumps(levels, indent=2))
    print(f"Wrote {len(levels)} levels to {LEVELS_PATH}")
    unique_count = sum(1 for l in levels if l["unique"])
    print(f"Unique solutions: {unique_count}/{len(levels)}")
    from collections import Counter
    by_tier = Counter(l["tier"] for l in levels)
    for t, n in by_tier.items():
        print(f"  {t}: {n}")
    for l in levels[:6]:
        print(f"  L{l['id']} ({l['tier']}, {l['n_moves']} moves, {l['n_solutions_at_min']} sols):")
        for side, carried in l["moves"]:
            tag = "+".join(carried) if carried else "alone"
            print(f"    -> {side} ({tag})")
