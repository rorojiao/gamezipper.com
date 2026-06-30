#!/usr/bin/env python3
"""Crankshaft Linkage level generator with unique-solution verification.
Optimized: per-crank angle-set intersection instead of brute force.
"""
import json, math, random

def slider_positions(n_cranks, n_pos, radius=100):
    pos = []
    for c in range(n_cranks):
        row = []
        for a in range(n_pos):
            ang = a * 2 * math.pi / n_pos
            row.append(round(radius * math.cos(ang), 1))
        pos.append(row)
    return pos

def solve_count(positions, targets, tol=0.5):
    """Return (count, one_solution). Uses per-crank angle-set product."""
    sets = []
    for c, target in enumerate(targets):
        matching = [a for a in range(len(positions[c])) if abs(positions[c][a] - target) < tol]
        if not matching:
            return 0, None
        sets.append(matching)
    # count = product of set sizes; solution = first element of each
    count = 1
    for s in sets:
        count *= len(s)
    sol = [s[0] for s in sets]
    return count, sol

def gen_level(n_cranks, n_pos, radius=100, seed=0, max_tries=3000):
    rng = random.Random(seed)
    positions = slider_positions(n_cranks, n_pos, radius)
    for _ in range(max_tries):
        combo = [rng.randrange(n_pos) for _ in range(n_cranks)]
        targets = [positions[c][combo[c]] for c in range(n_cranks)]
        cnt, sol = solve_count(positions, targets)
        if cnt == 1:
            par = sum(min(b, n_pos - b) for b in combo)
            return {
                'n_cranks': n_cranks, 'n_pos': n_pos, 'radius': radius,
                'positions': positions, 'targets': targets,
                'solution': list(combo), 'n_solutions': cnt, 'par': par, 'unique': True,
            }
    return None

def main():
    tiers = [
        (2, 6), (2, 6), (2, 6), (2, 6), (2, 6),
        (3, 8), (3, 8), (3, 8), (3, 8), (3, 8),
        (4, 8), (4, 8), (4, 8), (4, 8), (4, 8),
        (5, 10), (5, 10), (5, 10), (5, 10), (5, 10),
        (6, 10), (6, 10), (6, 10), (6, 10), (6, 10),
        (6, 12), (6, 12), (6, 12), (6, 12), (6, 12),
    ]
    levels = []
    for i, (nc, np_) in enumerate(tiers):
        radius = 80 + (i // 5) * 10
        seed = 1000 + i * 7
        lvl = None
        for s in range(seed, seed + 2000):
            lvl = gen_level(nc, np_, radius, s)
            if lvl:
                break
        if not lvl:
            print(f"FAILED level {i+1}")
            return
        levels.append(lvl)
        print(f"L{i+1:02d}: cranks={nc} pos={np_} sol={lvl['solution']} par={lvl['par']} UNIQUE={lvl['unique']}")

    all_unique = all(l['unique'] and l['n_solutions'] == 1 for l in levels)
    print(f"\nTotal: {len(levels)} levels, ALL UNIQUE: {all_unique}")

    compact = [{'n': l['n_cranks'], 'p': l['n_pos'], 'r': l['radius'],
                't': [round(x,1) for x in l['targets']], 's': l['solution'], 'par': l['par']} for l in levels]
    with open('levels.json', 'w') as f:
        json.dump(levels, f, indent=2)
    with open('levels_compact.json', 'w') as f:
        json.dump(compact, f, separators=(',',':'))
    print("Wrote levels.json + levels_compact.json")

if __name__ == '__main__':
    main()
