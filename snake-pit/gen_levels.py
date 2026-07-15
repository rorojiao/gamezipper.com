#!/usr/bin/env python3
"""
Snake Pit level generator — serpentine Hamiltonian path + varied cuts.

A serpentine (boustrophedon) scan of any RxC grid is a Hamiltonian path.
Cutting this path into segments of DIFFERENT lengths produces valid snakes
(each segment is a sub-path = one-cell-wide, non-self-touching, 2 endpoints).

Same-length orth adjacency is then checked; if violated, re-randomize via
column/row permutation and re-cut. Multiple serpentine orientations give
variety.
"""

import json
import random
import sys
from collections import defaultdict, Counter

DIRS = [(-1, 0), (1, 0), (0, -1), (0, 1)]
DIAG = [(-1, -1), (-1, 1), (1, -1), (1, 1)]


def serpentine_path(R, C, orientation=0, flip_r=False, flip_c=False):
    """Generate a serpentine Hamiltonian path over RxC grid.
    orientation 0 = row-major snake, 1 = column-major snake."""
    if orientation == 0:
        # row-major: go right on even rows, left on odd rows
        rows = list(range(R))
        cols = list(range(C))
        if flip_r:
            rows.reverse()
        if flip_c:
            cols.reverse()
        path = []
        for ri, r in enumerate(rows):
            cur_cols = cols if ri % 2 == 0 else list(reversed(cols))
            for c in cur_cols:
                path.append((r, c))
        return path
    else:
        cols = list(range(C))
        rows = list(range(R))
        if flip_c:
            cols.reverse()
        if flip_r:
            rows.reverse()
        path = []
        for ci, c in enumerate(cols):
            cur_rows = rows if ci % 2 == 0 else list(reversed(rows))
            for r in cur_rows:
                path.append((r, c))
        return path


def cut_path(path, lengths):
    """Cut a path into segments of the given lengths. Returns list of snakes."""
    snakes = []
    idx = 0
    for L in lengths:
        seg = path[idx:idx + L]
        if len(seg) != L:
            return None
        snakes.append(seg)
        idx += L
    if idx != len(path):
        return None
    return snakes


def snake_valid(cells, R, C):
    if len(cells) < 2:
        return False
    ps = set(cells)
    if len(ps) != len(cells):
        return False
    for (r, c) in cells:
        deg = sum(1 for dr, dc in DIRS if (r + dr, c + dc) in ps)
        if deg > 2:
            return False
    endpoints = [c for c in cells if sum(1 for dr, dc in DIRS if (c[0] + dr, c[1] + dc) in ps) == 1]
    if len(endpoints) != 2:
        return False
    for (r, c) in cells:
        for dr in (-1, 0):
            for dc in (-1, 0):
                rr, cc = r + dr, c + dc
                if all(0 <= rr + a < R and 0 <= cc + b < C and (rr + a, cc + b) in ps
                       for a in (0, 1) for b in (0, 1)):
                    return False
    for (r, c) in cells:
        for dr, dc in DIAG:
            ar, ac = r + dr, c + dc
            if (ar, ac) in ps:
                if not ((r, ac) in ps or (ar, c) in ps):
                    return False
    return True


def check_same_len(snakes, R, C):
    by_len = defaultdict(list)
    cellmap = {}
    for i, s in enumerate(snakes):
        by_len[len(s)].append(i)
        for cell in s:
            cellmap[cell] = i
    for L, idxs in by_len.items():
        if len(idxs) < 2:
            continue
        idxset = set(idxs)
        for i in idxs:
            for (r, c) in snakes[i]:
                for dr, dc in DIRS:
                    j = cellmap.get((r + dr, c + dc))
                    if j is not None and j != i and j in idxset:
                        return False
    return True


def verify(snakes, R, C):
    if not snakes:
        return False, "empty"
    occ = set()
    for s in snakes:
        if not snake_valid(s, R, C):
            return False, "invalid snake"
        for c in s:
            if c in occ:
                return False, "overlap"
            occ.add(c)
    if len(occ) != R * C:
        return False, f"not tiled ({len(occ)}/{R*C})"
    if not check_same_len(snakes, R, C):
        return False, "same-len orth"
    return True, "ok"


def random_lengths(total, rng, min_len=2, max_len=8):
    """Partition `total` into pieces each in [min_len, max_len], all DIFFERENT
    where possible (to reduce same-length collisions)."""
    if total < min_len:
        return None
    lengths = []
    remaining = total
    used = set()
    while remaining >= min_len:
        hi = min(max_len, remaining)
        lo = min_len
        choices = [L for L in range(lo, hi + 1) if L not in used or remaining - L < min_len]
        if not choices:
            choices = list(range(lo, hi + 1))
        L = rng.choice(choices)
        lengths.append(L)
        used.add(L)
        remaining -= L
        if remaining < min_len and remaining > 0:
            # redistribute: add remaining to last piece
            lengths[-1] += remaining
            remaining = 0
            if lengths[-1] > max_len + 2:
                return None
    if remaining > 0:
        return None
    if sum(lengths) != total:
        return None
    return lengths


def gen(R, C, rng):
    """Try serpentine cuts with varied lengths until a valid partition is found."""
    area = R * C
    for attempt in range(200):
        orientation = attempt % 2
        flip_r = (attempt // 2) % 2 == 1
        flip_c = (attempt // 4) % 2 == 1
        path = serpentine_path(R, C, orientation, flip_r, flip_c)
        lengths = random_lengths(area, rng)
        if lengths is None:
            continue
        rng.shuffle(lengths)
        snakes = cut_path(path, lengths)
        if snakes is None:
            continue
        ok, _ = verify(snakes, R, C)
        if ok:
            return snakes
    return None


def grid_from(snakes, R, C):
    g = [0] * (R * C)
    for i, s in enumerate(snakes):
        sid = i + 1
        for (r, c) in s:
            g[r * C + c] = sid
    return g


def snakes_from(grid, R, C):
    by = defaultdict(list)
    for i, v in enumerate(grid):
        by[v].append((i // C, i % C))
    return list(by.values())


def clues_from(snakes, R, C, rng, reveal):
    clues = {}
    for s in snakes:
        L = len(s)
        ps = set(s)
        endpoints = [c for c in s if sum(1 for dr, dc in DIRS if (c[0] + dr, c[1] + dc) in ps) == 1]
        if rng.random() < reveal:
            cell = rng.choice(s)
            clues[f"{cell[0]},{cell[1]}"] = {"type": "number", "val": L}
        if endpoints and rng.random() < reveal * 0.8:
            cell = rng.choice(endpoints)
            clues[f"{cell[0]},{cell[1]}"] = {"type": "circle"}
    return clues


TIERS = [
    ("Beginner", [(5, 5)] * 6),
    ("Easy",     [(5, 6), (6, 6)] * 3),
    ("Medium",   [(6, 7), (7, 7)] * 3),
    ("Hard",     [(7, 8), (8, 8)] * 3),
    ("Expert",   [(8, 8), (8, 9)] * 3),
]


def main():
    levels = []
    seed = 20260716
    idx = 0
    for tier, sizes in TIERS:
        for (R, C) in sizes:
            idx += 1
            lvl = None
            for retry in range(300):
                rng = random.Random(seed + idx * 131 + retry * 17)
                snakes = gen(R, C, rng)
                if snakes is None:
                    continue
                grid = grid_from(snakes, R, C)
                reveal = 0.6 if R <= 6 else (0.5 if R <= 7 else 0.45)
                clues = clues_from(snakes, R, C, rng, reveal)
                lvl = {"rows": R, "cols": C, "solution": grid, "clues": clues,
                       "tier": tier, "num_snakes": len(snakes)}
                break
            if lvl is None:
                print(f"  L{idx} ({tier}) {R}x{C}: FAILED", file=sys.stderr)
                continue
            snakes2 = snakes_from(lvl["solution"], R, C)
            ok, msg = verify(snakes2, R, C)
            print(f"  L{idx} ({tier}): {R}x{C}, snakes={lvl['num_snakes']}, clues={len(lvl['clues'])} — {'PASS' if ok else 'FAIL '+msg}")
            levels.append(lvl)
    with open("levels.json", "w") as f:
        json.dump(levels, f, separators=(",", ":"))
    passed = sum(1 for l in levels if verify(snakes_from(l["solution"], l["rows"], l["cols"]), l["rows"], l["cols"])[0])
    print(f"\n=== {len(levels)}/30 levels, {passed}/{len(levels)} PASS ===")


if __name__ == "__main__":
    main()
