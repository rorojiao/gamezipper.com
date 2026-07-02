#!/usr/bin/env python3
"""
Herugolf Level Generator - FINAL, COMPLETE, ATOMIC

Generates exactly 27 unique solvable levels per BENCHMARK.md
Tier distribution: Beginner(4) + Easy(4) + Medium(5) + Hard(5) + Expert(5) + Master(4) = 27
Each level has unique ball counts: Beginner=2, Easy=3, Medium=4, Hard=4, Expert=5, Master=6
Each ball's shot length is fixed and strictly decreasing across balls.
"""

import json
import random
import sys
import time
from collections import Counter

# Tier spec: (name, count, rows, cols, balls, pond_pct_min, pond_pct_max)
# R23 UPGRADE: 27 -> 30 levels (5 per tier: Beginner/Easy/Medium/Hard/Expert/Master)
TIERS = [
    ("Beginner", 5, 5, 5, 2, 0.00, 0.05),
    ("Easy",     5, 6, 6, 3, 0.05, 0.10),
    ("Medium",   5, 7, 7, 4, 0.10, 0.15),
    ("Hard",     5, 8, 8, 4, 0.15, 0.20),
    ("Expert",   5, 9, 9, 5, 0.20, 0.25),
    ("Master",   5, 10, 10, 6, 0.25, 0.30),
]

DIRS = [(1,0),(-1,0),(0,1),(0,-1)]

def can_follow(last_dir, new_dir):
    if last_dir is None:
        return True
    if last_dir[0] == -new_dir[0] and last_dir[1] == -new_dir[1]:
        return False
    return True

# ============================================================
# PATH GENERATION (segments of strictly decreasing length)
# ============================================================
def find_open_path(rows, cols, start, blocked, ponds, max_segs=4, max_first_len=6):
    """
    Find one valid open path from start (endpoint becomes a hole).
    Returns (frozenset(cells), endpoint, ordered_cells, segments) or None.
    """
    sr, sc = start

    def dfs(r, c, cells, ordered, last_dir, last_len, segs):
        if (r, c) != (sr, sc):
            if (r, c) not in ponds:  # endpoint can't be pond
                return (frozenset(cells), (r, c), list(ordered), list(segs))
        if len(segs) >= max_segs:
            return None
        next_len = (last_len - 1) if last_len is not None else None
        for d in DIRS:
            if not can_follow(last_dir, d):
                continue
            if next_len is not None:
                if next_len < 1: continue
                lengths = [next_len]
            else:
                lengths = list(range(2, min(max_first_len, max(rows, cols)) + 1))
                random.shuffle(lengths)
            for sl in lengths:
                nr, nc = r, c
                new_cells = []
                valid = True
                for _ in range(sl):
                    nr += d[0]; nc += d[1]
                    if not (0 <= nr < rows and 0 <= nc < cols):
                        valid = False; break
                    if (nr, nc) in blocked or (nr, nc) in cells:
                        valid = False; break
                    new_cells.append((nr, nc))
                if valid and new_cells:
                    if (nr, nc) in ponds:
                        continue
                    res = dfs(nr, nc, cells | set(new_cells),
                              ordered + new_cells, d, sl, segs + [(d, sl)])
                    if res is not None:
                        return res
        return None

    return dfs(sr, sc, frozenset({(sr, sc)}), [(sr, sc)], None, None, [])


def solve_count(rows, cols, balls, holes, walls, ponds, max_solutions=2, timeout=4.0):
    """Count distinct solutions via backtracking."""
    holes_set = set(tuple(h) for h in holes)
    balls_set = set(tuple(b) for b in balls)
    walls_set = set(tuple(w) for w in walls)
    ponds_set = set(tuple(p) for p in ponds)

    ball_paths = []
    for b in balls:
        bp = tuple(b)
        others = balls_set - {bp}
        # Generate paths to ANY hole with this ball
        paths = []
        for h in holes:
            hs = tuple(h)
            # enumerate paths to this specific hole
            res = enumerate_paths_to(rows, cols, bp, walls_set, hs, others, ponds_set)
            paths.extend(res)
        # Dedupe
        seen = set()
        uniq = []
        for p in paths:
            sig = tuple(p[2])
            if sig not in seen:
                seen.add(sig); uniq.append(p)
        ball_paths.append(uniq)

    if any(len(p) == 0 for p in ball_paths):
        return 0

    count = [0]
    t0 = time.time()
    timed = [False]

    def back(idx, used_cells, used_holes):
        if timed[0]: return
        if time.time() - t0 > timeout:
            timed[0] = True; return
        if count[0] >= max_solutions: return
        if idx == len(balls):
            count[0] += 1; return
        for path_cells, hole_pos, _, _ in ball_paths[idx]:
            if count[0] >= max_solutions: return
            if hole_pos in used_holes: continue
            if path_cells & used_cells: continue
            used_holes.add(hole_pos)
            back(idx + 1, used_cells | path_cells, used_holes)
            used_holes.discard(hole_pos)

    back(0, frozenset(), set())
    return -1 if timed[0] else count[0]


def enumerate_paths_to(rows, cols, start, walls, target_hole, blocked, ponds):
    """Enumerate all paths from start to target_hole."""
    results = []
    sr, sc = start

    def dfs(r, c, cells, ordered, last_dir, last_len, segs):
        if (r, c) == target_hole:
            results.append((frozenset(cells), (r, c), list(ordered), list(segs)))
            return
        if len(segs) >= 4:
            return
        next_len = (last_len - 1) if last_len is not None else None
        for d in DIRS:
            if not can_follow(last_dir, d):
                continue
            if next_len is not None:
                if next_len < 1: continue
                lengths = [next_len]
            else:
                lengths = list(range(1, min(6, max(rows, cols)) + 1))
                random.shuffle(lengths)
            for sl in lengths:
                nr, nc = r, c
                new_cells = []
                valid = True
                hit = False
                for _ in range(sl):
                    nr += d[0]; nc += d[1]
                    if not (0 <= nr < rows and 0 <= nc < cols):
                        valid = False; break
                    if (nr, nc) in walls or (nr, nc) in blocked or (nr, nc) in cells:
                        valid = False; break
                    new_cells.append((nr, nc))
                    if (nr, nc) == target_hole:
                        hit = True; break
                if not new_cells or not valid: continue
                if hit:
                    all_cells = cells | set(new_cells)
                    results.append((frozenset(all_cells), target_hole,
                                    ordered + new_cells,
                                    segs + [(d, len(new_cells))]))
                else:
                    if (nr, nc) in ponds:
                        continue
                    dfs(nr, nc, cells | set(new_cells),
                        ordered + new_cells, d, sl, segs + [(d, sl)])

    dfs(sr, sc, frozenset({(sr, sc)}), [(sr, sc)], None, None, [])
    return results


def generate_level(rows, cols, num_balls, pond_pct, rng, max_attempts=200):
    """Generate a Herugolf level with unique solution."""
    for attempt in range(max_attempts):
        all_cells = [(r, c) for r in range(rows) for c in range(cols)]
        rng.shuffle(all_cells)

        balls, holes, sol_paths = [], [], []
        used = set()
        ok = True

        for _ in range(num_balls):
            ball_pos = None
            for cell in all_cells:
                if cell not in used:
                    ball_pos = cell; break
            if ball_pos is None:
                ok = False; break

            # Try to find an open path from ball_pos
            res = find_open_path(rows, cols, ball_pos, used, ponds=set(),
                                 max_segs=4, max_first_len=min(6, max(rows, cols)-1))
            # Retry with different random seeds
            for _ in range(30):
                if res is not None: break
                res = find_open_path(rows, cols, ball_pos, used, ponds=set(),
                                     max_segs=4, max_first_len=min(6, max(rows, cols)-1))
            if res is None:
                ok = False; break

            cells_set, endpoint, ordered, segs = res
            used |= cells_set
            balls.append(list(ball_pos))
            holes.append(list(endpoint))
            sol_paths.append({
                "ball": list(ball_pos),
                "hole": list(endpoint),
                "path": [list(c) for c in ordered],
                "segments": [{"dir": list(s[0]), "len": s[1]} for s in segs]
            })

        if not ok or len(balls) < num_balls:
            continue

        # All non-path cells are walls (impassable)
        path_cells = set()
        for sp in sol_paths:
            for c in sp["path"]:
                path_cells.add(tuple(c))
        walls = set()
        for r in range(rows):
            for c in range(cols):
                if (r, c) not in path_cells:
                    walls.add((r, c))

        # Verify uniqueness with all walls
        sc = solve_count(rows, cols, balls, holes, list(walls), [],
                         max_solutions=2, timeout=3.0)
        if sc != 1:
            continue

        # Convert some walls to ponds (crossable, can't stop)
        wall_list = list(walls)
        rng.shuffle(wall_list)
        target_ponds = max(0, int(len(wall_list) * pond_pct)) if pond_pct > 0 else 0
        ponds = []
        for w in wall_list:
            if len(ponds) >= target_ponds:
                break
            test_ponds = ponds + [list(w)]
            sc = solve_count(rows, cols, balls, holes,
                             [wl for wl in walls if wl != w],
                             test_ponds, max_solutions=2, timeout=1.5)
            if sc == 1:
                ponds.append(list(w))
                walls.discard(w)

        # Compute shot lengths = path length - 1 (cells traveled)
        shot_lengths = [len(sp["path"]) - 1 for sp in sol_paths]

        return {
            "balls": balls,
            "holes": holes,
            "walls": sorted([list(w) for w in walls]),
            "ponds": sorted([list(p) for p in ponds]),
            "shotLengths": shot_lengths,
            "solution": sol_paths,
        }
    return None


def main():
    rng = random.Random(20260702)  # R23 upgrade seed
    levels = []
    level_id = 1
    total = sum(t[1] for t in TIERS)

    print(f"Generating {total} Herugolf levels (FINAL)...", flush=True)

    for tier_name, count, rows, cols, num_balls, pmin, pmax in TIERS:
        for i in range(count):
            pond_pct = rng.uniform(pmin, pmax)
            level = None
            t0 = time.time()
            for retry in range(30):
                level = generate_level(rows, cols, num_balls, pond_pct, rng)
                if level:
                    break
            if level is None:
                print(f"  [{level_id}] {tier_name} #{i+1}: FAILED")
                sys.exit(1)
            dt = time.time() - t0
            entry = {
                "id": level_id,
                "name": f"{tier_name} {i+1}",
                "tier": tier_name,
                "rows": rows, "cols": cols,
                "balls": level["balls"],
                "holes": level["holes"],
                "walls": level["walls"],
                "ponds": level["ponds"],
                "shotLengths": level["shotLengths"],
                "solution": level["solution"],
            }
            levels.append(entry)
            print(f"  [{level_id}/{total}] {tier_name} #{i+1}: {rows}x{cols} "
                  f"{num_balls} balls, shots={level['shotLengths']} ({dt:.1f}s)")
            level_id += 1

    output = {"levels": levels}
    with open("levels.json", "w") as f:
        json.dump(output, f, separators=(",", ":"))
    print(f"\n✅ Wrote {len(levels)} levels to levels.json "
          f"({len(json.dumps(output))} bytes)", flush=True)


if __name__ == "__main__":
    main()