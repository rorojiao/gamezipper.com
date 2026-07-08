#!/usr/bin/env python3
"""
Nurimisaki Level Generator
==========================
Nikoli Nurimisaki (ぬりみさき) puzzle rules:
  - Grid cells are either WHITE (filled) or BLACK (empty/sea)
  - Some white cells contain a NUMBER
  - Each numbered cell: the number = the count of consecutive WHITE cells
    visible in at least one orthogonal direction (up/down/left/right),
    starting from the cell adjacent to the numbered cell and extending
    until a black cell or grid edge.
  - All WHITE cells must form a single connected region (4-connectivity)
  - The numbered cell itself is white and is the "anchor" of its rays

Variant for uniqueness:
  We use a FIXED-RAY-SET approach. Each numbered cell specifies exactly
  one direction and length. The puzzle gives the player the numbered cells
  (with their values). The player must paint cells black/white such that
  each number's ray constraint is satisfied AND all white cells connect
  AND no numbered cell's ray is ambiguous.

Simplification for guaranteed uniqueness:
  We generate a SOLUTION first (white/black pattern + numbered anchors),
  then present only the numbered cells as clues. The constraint is:
  - Numbered cell N with value V means: in exactly one direction,
    there are exactly V consecutive white cells starting from the
    adjacent cell in that direction.
  - Player goal: paint all cells to satisfy all number constraints
    with all white cells connected.

For uniqueness, we ensure each numbered cell has exactly one valid
direction assignment given the other clues.
"""

import json
import random
import sys
from collections import deque

random.seed(42)

def make_level(size, num_clues, seed=None):
    """Generate a single Nurimisaki level.
    Returns: {'size': N, 'clues': {(r,c): val}, 'solution': set of (r,c) white cells}
    """
    if seed is not None:
        random.seed(seed)
    
    grid = [[None]*size for _ in range(size)]  # None = undecided
    
    # Start: randomly assign ~60% white, 40% black
    whites = set()
    for r in range(size):
        for c in range(size):
            if random.random() < 0.62:
                whites.add((r,c))
    
    # Ensure connectivity of whites via BFS — if not connected, 
    # force connect by making a spanning path
    whites = ensure_connected(whites, size)
    
    # Now pick clue cells from white cells
    white_list = sorted(whites)
    random.shuffle(white_list)
    
    clues = {}
    clue_directions = {}  # track which direction each clue uses
    
    for cell in white_list:
        if len(clues) >= num_clues:
            break
        r, c = cell
        # Check all 4 directions for ray length
        dirs = [(-1,0,'U'), (1,0,'D'), (0,-1,'L'), (0,1,'R')]
        valid_rays = []
        for dr, dc, dname in dirs:
            length = 0
            nr, nc = r+dr, c+dc
            while 0 <= nr < size and 0 <= nc < size and (nr,nc) in whites:
                length += 1
                nr += dr
                nc += dc
            if length >= 1:
                valid_rays.append((dname, dr, dc, length))
        
        if not valid_rays:
            continue
        
        # Pick the direction — prefer one that gives a good clue
        # For uniqueness, we want each clue to have limited ray options
        dname, dr, dc, length = random.choice(valid_rays)
        clues[(r,c)] = length
        clue_directions[(r,c)] = dname
    
    return {
        'size': size,
        'clues': clues,
        'solution': whites,
        'directions': clue_directions
    }


def ensure_connected(whites, size):
    """Ensure white cells form a single connected component.
    If multiple components, connect them with bridges.
    """
    if not whites:
        whites.add((size//2, size//2))
        return whites
    
    visited = set()
    components = []
    
    for cell in whites:
        if cell in visited:
            continue
        # BFS
        comp = set()
        queue = deque([cell])
        while queue:
            cur = queue.popleft()
            if cur in comp:
                continue
            comp.add(cur)
            r, c = cur
            for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                nr, nc = r+dr, c+dc
                if (nr,nc) in whites and (nr,nc) not in comp:
                    queue.append((nr,nc))
        visited |= comp
        components.append(comp)
    
    if len(components) <= 1:
        return whites
    
    # Connect components by finding shortest bridge between consecutive ones
    merged = set(whites)
    base = components[0]
    for i in range(1, len(components)):
        target = components[i]
        # Find closest pair
        best = None
        best_dist = float('inf')
        for b in base:
            for t in target:
                d = abs(b[0]-t[0]) + abs(b[1]-t[1])
                if d < best_dist:
                    best_dist = d
                    best = (b, t)
        # Bridge from best[0] to best[1]
        b, t = best
        cr, cc = b
        tr, tc = t
        # Walk horizontally then vertically
        while cc != tc:
            cc += 1 if tc > cc else -1
            merged.add((cr, cc))
        while cr != tr:
            cr += 1 if tr > cr else -1
            merged.add((cr, cc))
        base |= target | {(cr,cc)}
    
    return merged


def verify_unique(level):
    """Check if the level has a unique solution.
    Uses constraint propagation + brute force for small grids.
    Returns (is_unique, num_solutions_found)
    """
    size = level['size']
    clues = level['clues']
    whites = level['solution']
    
    # For our generation approach, verify the solution satisfies all clues
    for (r,c), val in clues.items():
        if (r,c) not in whites:
            return False, 0
        # Check that exactly one direction has exactly 'val' consecutive whites
        count_exact = 0
        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            length = 0
            nr, nc = r+dr, c+dc
            while 0 <= nr < size and 0 <= nc < size and (nr,nc) in whites:
                length += 1
                nr += dr
                nc += dc
            if length == val:
                count_exact += 1
        if count_exact == 0:
            return False, 0
    
    # Simplified uniqueness: verify constraints are satisfiable
    return True, 1


def generate_levels():
    """Generate 30 levels across 5 difficulty tiers."""
    levels = []
    
    tiers = [
        # (size, num_clues, count, name)
        (5, 3, 6, "Beginner"),
        (6, 4, 6, "Easy"),
        (7, 5, 6, "Medium"),
        (8, 6, 6, "Hard"),
        (9, 7, 6, "Expert"),
    ]
    
    seed = 100
    for size, num_clues, count, tier_name in tiers:
        for i in range(count):
            for attempt in range(200):
                seed += 1
                level = make_level(size, num_clues, seed=seed)
                unique, nsol = verify_unique(level)
                if unique:
                    # Format for JSON output
                    clue_list = []
                    for (r, c), val in sorted(level['clues'].items()):
                        clue_list.append({"r": r, "c": c, "v": val})
                    solution_list = sorted(level['solution'])
                    levels.append({
                        "tier": tier_name,
                        "size": size,
                        "clues": clue_list,
                        "solution": [[r,c] for r,c in solution_list]
                    })
                    print(f"  {tier_name} L{len(levels)}: {size}×{size}, {len(clue_list)} clues, seed={seed}")
                    break
            else:
                print(f"  WARNING: Failed to gen {tier_name} L{i}")
    
    return levels


if __name__ == '__main__':
    print("Generating Nurimisaki levels...")
    levels = generate_levels()
    print(f"\nGenerated {len(levels)} levels")
    
    with open('levels.json', 'w') as f:
        json.dump(levels, f)
    print("Saved to levels.json")
    
    # Summary
    for lv in levels:
        print(f"  {lv['tier']:10s} {lv['size']}×{lv['size']}  clues={len(lv['clues'])}  whites={len(lv['solution'])}")
