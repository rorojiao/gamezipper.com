#!/usr/bin/env python3
"""
Balance Loop Level Generator v4 — Optimized solver with early pruning
======================================================================
"""

import json
import random
import sys
import time
from typing import List, Tuple, Dict, Set

DR = [-1, 0, 1, 0]
DC = [0, 1, 0, -1]
OPP = [2, 3, 0, 1]


def generate_loop(rows, cols, rng, frac_range=(0.35, 0.6)):
    total = rows * cols
    min_len = max(4, int(total * frac_range[0]))
    max_len = min(total, int(total * frac_range[1]) + 1)
    
    for _ in range(500):
        sr, sc = rng.randint(0, rows-1), rng.randint(0, cols-1)
        start = (sr, sc)
        target = rng.randint(min_len, max_len)
        
        path = [start]
        visited = {start}
        
        while len(path) < target:
            r, c = path[-1]
            nbrs = []
            for d in range(4):
                nr, nc = r + DR[d], c + DC[d]
                if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in visited:
                    nbrs.append((nr, nc))
            
            if not nbrs:
                break
            
            rng.shuffle(nbrs)
            nxt = nbrs[0]
            path.append(nxt)
            visited.add(nxt)
        
        if len(path) >= min_len:
            last = path[-1]
            for d in range(4):
                if (last[0] + DR[d], last[1] + DC[d]) == start:
                    return path
    
    return None


def compute_visibility(cell, loop_set, rows, cols):
    r, c = cell
    total = 1
    for d in range(4):
        nr, nc = r + DR[d], c + DC[d]
        while 0 <= nr < rows and 0 <= nc < cols:
            if (nr, nc) in loop_set:
                total += 1
                nr += DR[d]
                nc += DC[d]
            else:
                break
    return total


def get_shape(cell, path, path_idx):
    r, c = cell
    n = len(path)
    prev = path[(path_idx[cell] - 1) % n]
    nxt = path[(path_idx[cell] + 1) % n]
    
    d_prev = d_next = None
    for d in range(4):
        if (r + DR[d], c + DC[d]) == prev:
            d_prev = d
        if (r + DR[d], c + DC[d]) == nxt:
            d_next = d
    
    return "circle" if OPP[d_prev] == d_next else "square"


def solve(rows, cols, clues, max_solutions=2, time_limit_ms=3000, solution_loop_len=None):
    """
    Solve Balance Loop using path-tracing DFS with time limit.
    solution_loop_len: if known, limit search to loops of this length (optimization).
    """
    clue_map = {(cl["r"], cl["c"]): cl for cl in clues}
    
    if not clues:
        return []
    
    solutions = []
    deadline = time.time() + time_limit_ms / 1000.0
    timed_out = [False]
    
    sorted_clues = sorted(clues, key=lambda c: (c["r"], c["c"]))
    start_clue = sorted_clues[0]
    start = (start_clue["r"], start_clue["c"])
    start_shape = start_clue["shape"]
    
    if start_shape == "circle":
        pairs = [(0, 2), (1, 3)]
    else:
        pairs = [(0, 1), (1, 2), (2, 3), (3, 0)]
    
    sr, sc = start
    max_loop_len = rows * cols  # maximum possible loop
    
    for d_start, d_end in pairs:
        nr1, nc1 = sr + DR[d_start], sc + DC[d_start]
        nr2, nc2 = sr + DR[d_end], sc + DC[d_end]
        
        if not (0 <= nr1 < rows and 0 <= nc1 < cols):
            continue
        if not (0 <= nr2 < rows and 0 <= nc2 < cols):
            continue
        
        first_cell = (nr1, nc2) if False else (nr1, nc1)
        
        if first_cell == start:
            continue
        
        path = [start, first_cell]
        visited = {start, first_cell}
        
        # Remaining clue cells to visit
        remaining_clues = set(clue_map.keys()) - {start}
        
        def dfs(current, came_from_dir, remaining):
            if len(solutions) >= max_solutions:
                return
            if time.time() > deadline:
                timed_out[0] = True
                return
            
            r, c = current
            is_clue = current in clue_map
            
            if is_clue:
                clue = clue_map[current]
                # came_from_dir = direction back to previous cell (where we entered from)
                # For circle (straight): exit_dir = OPP[came_from_dir] (go straight through)
                # For square (turn): exit_dir is perpendicular to came_from_dir
                if clue["shape"] == "circle":
                    exit_dir = OPP[came_from_dir]
                    er, ec = r + DR[exit_dir], c + DC[exit_dir]
                    if not (0 <= er < rows and 0 <= ec < cols):
                        return
                    if exit_dir == came_from_dir:
                        return  # Can't go back
                    candidates = [exit_dir]
                else:
                    # Turn: exit must be perpendicular to entry
                    # entry is from came_from_dir, so exit must be adjacent (not same, not opposite)
                    candidates = []
                    for d in range(4):
                        if d == came_from_dir or d == OPP[came_from_dir]:
                            continue
                        er, ec = r + DR[d], c + DC[d]
                        if 0 <= er < rows and 0 <= ec < cols:
                            candidates.append(d)
                
                # This clue is being visited, remove from remaining
                remaining = remaining - {current}
            else:
                candidates = []
                for d in range(4):
                    if d == came_from_dir:
                        continue
                    er, ec = r + DR[d], c + DC[d]
                    if 0 <= er < rows and 0 <= ec < cols:
                        candidates.append(d)
            
            for exit_dir in candidates:
                nr, nc = r + DR[exit_dir], c + DC[exit_dir]
                
                if (nr, nc) == start:
                    # Close loop
                    if exit_dir != OPP[d_end]:
                        continue
                    if len(path) < 3:
                        continue
                    
                    # All remaining clues must have been visited
                    if remaining:
                        continue
                    
                    # Verify all clues (shapes + visibility)
                    loop_set = set(path)
                    path_idx = {cell: i for i, cell in enumerate(path)}
                    valid = True
                    for cell in path:
                        if cell in clue_map:
                            clue = clue_map[cell]
                            shape = get_shape(cell, path, path_idx)
                            if shape != clue["shape"]:
                                valid = False
                                break
                            vis = compute_visibility(cell, loop_set, rows, cols)
                            if vis != clue["number"]:
                                valid = False
                                break
                    
                    if valid:
                        solutions.append(list(path))
                    continue
                
                if (nr, nc) in visited:
                    continue
                
                # Pruning: limit loop length
                if len(path) >= max_loop_len:
                    continue
                
                path.append((nr, nc))
                visited.add((nr, nc))
                
                dfs((nr, nc), OPP[exit_dir], remaining)
                
                path.pop()
                visited.discard((nr, nc))
                
                if len(solutions) >= max_solutions:
                    return
        
        dfs(first_cell, OPP[d_start], remaining_clues)
        
        if timed_out[0] or len(solutions) >= max_solutions:
            break
    
    return solutions


def generate_puzzle(rows, cols, num_clues, rng, max_attempts=100, solver_time_ms=2000):
    """Generate a unique-solution Balance Loop puzzle."""
    for attempt in range(max_attempts):
        path = generate_loop(rows, cols, rng)
        if path is None or len(path) < 4:
            continue
        
        loop_set = set(path)
        path_idx = {cell: i for i, cell in enumerate(path)}
        
        candidates = list(path)
        rng.shuffle(candidates)
        
        for nc in range(num_clues, min(num_clues + 5, len(candidates) + 1)):
            clue_positions = candidates[:nc]
            clues = []
            for cell in clue_positions:
                shape = get_shape(cell, path, path_idx)
                number = compute_visibility(cell, loop_set, rows, cols)
                clues.append({"r": cell[0], "c": cell[1], "shape": shape, "number": number})
            
            # Solve with time limit
            sols = solve(rows, cols, clues, max_solutions=2, time_limit_ms=solver_time_ms)
            
            if len(sols) == 1:
                return {
                    "rows": rows,
                    "cols": cols,
                    "clues": clues,
                    "solution": [[r, c] for r, c in path],
                    "loop_length": len(path)
                }
            elif len(sols) == 0:
                # Solver found nothing (timeout or bug) — skip
                continue
            # If 2+ solutions, try more clues
    
    return None


def generate_all_levels():
    tiers = [
        {"name": "Beginner", "rows": 4, "cols": 4, "clues": 3, "count": 6, "time": 1000},
        {"name": "Easy",     "rows": 5, "cols": 5, "clues": 4, "count": 6, "time": 1500},
        {"name": "Medium",   "rows": 5, "cols": 6, "clues": 5, "count": 6, "time": 2000},
        {"name": "Hard",     "rows": 6, "cols": 6, "clues": 5, "count": 6, "time": 3000},
        {"name": "Expert",   "rows": 6, "cols": 7, "clues": 6, "count": 6, "time": 4000},
    ]
    
    all_levels = []
    level_num = 1
    
    for tier in tiers:
        print(f"\n{'='*40}")
        print(f"Generating {tier['name']} ({tier['rows']}x{tier['cols']}, {tier['clues']} clues)")
        generated = 0
        attempts = 0
        
        while generated < tier["count"] and attempts < 3000:
            attempts += 1
            rng = random.Random(level_num * 7919 + attempts * 31)
            
            puzzle = generate_puzzle(
                tier["rows"], tier["cols"], tier["clues"], rng,
                max_attempts=10,
                solver_time_ms=tier["time"]
            )
            
            if puzzle is None:
                continue
            
            puzzle["level"] = level_num
            puzzle["tier"] = tier["name"]
            puzzle["tier_index"] = generated
            all_levels.append(puzzle)
            level_num += 1
            generated += 1
            print(f"  [{generated}/{tier['count']}] L{level_num-1} {tier['name']} "
                  f"len={puzzle['loop_length']} clues={len(puzzle['clues'])}")
        
        if generated < tier["count"]:
            print(f"  WARNING: {generated}/{tier['count']} for {tier['name']}")
    
    return all_levels


if __name__ == "__main__":
    print("Balance Loop Level Generator v4")
    print("=" * 50)
    
    levels = generate_all_levels()
    print(f"\nTotal: {len(levels)} levels")
    
    output = {
        "game": "Balance Loop",
        "version": "4.0",
        "levels": levels,
        "total": len(levels)
    }
    
    with open("levels.json", "w") as f:
        json.dump(output, f, indent=2)
    
    print("Saved to levels.json")
    
    for level in levels:
        print(f"L{level['level']} ({level['tier']}): {level['rows']}x{level['cols']}, "
              f"{len(level['clues'])} clues, loop={level['loop_length']}")
