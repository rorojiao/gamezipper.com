#!/usr/bin/env python3
"""
Star Loom level generator.
Circle-topology Hashi-like puzzle.

Mechanic:
- N stars placed on a circle
- Each star has clue = number of chords (lines) touching it
- Player draws chords between pairs of stars
- All stars must form ONE connected component
- 30 unique-solution levels across 5 tiers

Approach:
1. Generate random CONNECTED chord graph on N nodes
2. Compute degrees
3. ALL nodes get their degree as anchor (fully determined puzzle)
4. Verify unique solution via backtracking solver
"""
import json
import random
import time
from collections import defaultdict


def all_chords_pairs(N):
    """All possible edges including polygon edges."""
    poly = [(i, (i + 1) % N) for i in range(N)]
    chords = [(i, j) for i in range(N) for j in range(i + 2, N) if not (i == 0 and j == N - 1)]
    return poly + chords


def build_random_graph(N, rng, density=0.5, max_degree=6):
    """Build a random connected graph on N nodes."""
    in_tree = {0}
    edges = []
    cands = list(all_chords_pairs(N))
    rng.shuffle(cands)
    for (i, j) in cands:
        if (i in in_tree) != (j in in_tree):
            edges.append((i, j))
            in_tree.add(i)
            in_tree.add(j)
            if len(in_tree) == N:
                break
    if len(in_tree) != N:
        return None
    extras = [e for e in all_chords_pairs(N) if e not in edges]
    rng.shuffle(extras)
    target_extra = max(0, int(len(edges) * density))
    degrees = [0] * N
    for (i, j) in edges:
        degrees[i] += 1
        degrees[j] += 1
    for (i, j) in extras:
        if target_extra <= 0:
            break
        if degrees[i] < max_degree and degrees[j] < max_degree:
            edges.append((i, j))
            degrees[i] += 1
            degrees[j] += 1
            target_extra -= 1
    return edges, degrees


def solve_unique_fast(all_e, anchors, N, time_limit=0.5):
    """Backtracking solver with constraint propagation. Returns up to 2 solutions."""
    start = time.time()
    neighbors = [[] for _ in range(N)]
    for idx, (i, j) in enumerate(all_e):
        neighbors[i].append((j, idx))
        neighbors[j].append((i, idx))
    n_chords = len(all_e)
    used = [False] * n_chords
    current_deg = [0] * N
    solutions = []
    order = sorted(range(n_chords),
                    key=lambda idx: -min(anchors.get(all_e[idx][0], 99),
                                          anchors.get(all_e[idx][1], 99)))

    def feasible():
        for n in anchors:
            if current_deg[n] > anchors[n]:
                return False
            remaining = sum(1 for nb, eidx in neighbors[n] if not used[eidx])
            if current_deg[n] + remaining < anchors[n]:
                return False
        return True

    def backtrack(idx):
        if time.time() - start > time_limit:
            return
        if len(solutions) >= 2:
            return
        if idx == n_chords:
            ok = all(current_deg[n] == anchors[n] for n in anchors)
            if not ok:
                return
            visited = {0}
            stack = [0]
            while stack:
                cur = stack.pop()
                for nb, eidx in neighbors[cur]:
                    if used[eidx] and nb not in visited:
                        visited.add(nb)
                        stack.append(nb)
            if len(visited) == N:
                solutions.append(list(used))
            return
        ci = order[idx]
        i, j = all_e[ci]
        used[ci] = True
        current_deg[i] += 1
        current_deg[j] += 1
        if feasible():
            backtrack(idx + 1)
        current_deg[i] -= 1
        current_deg[j] -= 1
        must_exclude = ((anchors.get(i) is not None and current_deg[i] == anchors[i]) or
                        (anchors.get(j) is not None and current_deg[j] == anchors[j]))
        used[ci] = False
        if must_exclude:
            backtrack(idx + 1)
        elif feasible():
            backtrack(idx + 1)
        used[ci] = False

    backtrack(0)
    return solutions


def find_unique_level(N, max_attempts=300, time_budget=5.0, seed=None,
                      density=0.4, max_degree=6):
    if seed is None:
        seed = int(time.time() * 1000) % (2 ** 31)
    rng = random.Random(seed)
    all_e = all_chords_pairs(N)
    start = time.time()

    for attempt in range(max_attempts):
        if time.time() - start > time_budget:
            return None
        result = build_random_graph(N, rng, density=density, max_degree=max_degree)
        if result is None:
            continue
        edges, degrees = result
        if max(degrees) > max_degree:
            continue
        if len(set(degrees)) < 3:
            continue
        anchors = {n: degrees[n] for n in range(N)}
        if any(v == 0 for v in anchors.values()):
            continue
        sols = solve_unique_fast(all_e, anchors, N, time_limit=0.3)
        if len(sols) == 1:
            return {'edges': edges, 'anchors': anchors, 'degrees': degrees}
    return None


TIERS = [
    ("Beginner", 5, 0.5, 5),
    ("Easy",     6, 0.5, 5),
    ("Medium",   6, 0.4, 5),
    ("Hard",     7, 0.5, 6),
    ("Expert",   7, 0.4, 6),
]


def main():
    print("Generating Star Loom levels...")
    all_levels = []
    seed_base = 20260811

    for tier_idx, (tier_name, N, density, max_deg) in enumerate(TIERS):
        print(f"\n{tier_name} (N={N}):")
        tier_count = 0
        target = 6
        seed = seed_base + tier_idx * 50
        while tier_count < target and seed < seed_base + tier_idx * 50 + 200:
            lvl = find_unique_level(N, max_attempts=300, time_budget=4.0,
                                    seed=seed, density=density, max_degree=max_deg)
            if lvl is None:
                seed += 1
                continue
            tier_count += 1
            all_levels.append({
                "tier": tier_name,
                "tier_idx": tier_idx,
                "level_in_tier": tier_count - 1,
                "number": len(all_levels) + 1,
                "num_stars": N,
                "anchors": {str(k): v for k, v in lvl['anchors'].items()},
                "solution": [list(e) for e in lvl['edges']],
                "chord_count": len(lvl['edges']),
            })
            seed += 1
            print(f"  Lvl {tier_count}/6: degrees={lvl['degrees']}")

    print(f"\nTotal: {len(all_levels)} levels")
    with open("/home/junze/gamezipper.com/star-loom/levels.json", "w") as f:
        json.dump({"levels": all_levels}, f, indent=2)
    print("Saved levels.json")


if __name__ == "__main__":
    main()
