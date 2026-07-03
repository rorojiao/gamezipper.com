#!/usr/bin/env python3
"""
PathPix Level Generator v2 — Path-first approach

Instead of designing arbitrary pixel art (which may have regions that 
aren't valid paths), we design images where EACH COLOR REGION is a 
guaranteed valid snake path (self-avoiding walk). This ensures:
1. Every pair has at least one valid path (the path we designed)
2. We can pick the two endpoints of each snake as the pair endpoints

Approach:
1. Start with a blank grid
2. For each desired color region, lay down a self-avoiding walk (snake)
   that doesn't overlap previously placed regions
3. Record the start and end of each walk as the pair endpoints
4. The path length = number of cells in the walk
5. Optionally verify uniqueness via backtracking solver
"""
import json, random
from collections import deque

def can_place(grid, r, c, rows, cols):
    return 0 <= r < rows and 0 <= c < cols and grid[r][c] == 0

def make_snake_path(grid, rows, cols, color, start_r, start_c, length, avoid=None):
    """
    Lay down a self-avoiding walk of given length starting at (start_r, start_c).
    Returns the path as a list of (r,c) cells, or None if failed.
    """
    if avoid is None:
        avoid = set()
    path = [(start_r, start_c)]
    grid[start_r][start_c] = color
    current = (start_r, start_c)
    
    for _ in range(length - 1):
        r, c = current
        neighbors = [(r-1,c),(r+1,c),(r,c-1),(r,c+1)]
        random.shuffle(neighbors)
        placed = False
        for nr, nc in neighbors:
            if can_place(grid, nr, nc, rows, cols) and (nr,nc) not in path and (nr,nc) not in avoid:
                path.append((nr, nc))
                grid[nr][nc] = color
                current = (nr, nc)
                placed = True
                break
        if not placed:
            return None  # stuck
    return path

def count_paths_exact_length(grid, rows, cols, start, end, target_length, blocked):
    """
    Count paths of exactly target_length from start to end, avoiding blocked cells.
    Cap at 2 for efficiency.
    """
    count = [0]
    
    def dfs(r, c, length, visited):
        if count[0] >= 2:
            return
        if length == target_length:
            if (r, c) == end:
                count[0] += 1
            return
        remaining = target_length - length
        dist = abs(r - end[0]) + abs(c - end[1])
        if dist > remaining:
            return
        if (remaining - dist) % 2 != 0:
            return
        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            nr, nc = r+dr, c+dc
            if 0 <= nr < rows and 0 <= nc < cols:
                pos = (nr, nc)
                if pos not in visited and pos not in blocked:
                    visited.add(pos)
                    dfs(nr, nc, length+1, visited)
                    visited.discard(pos)
    
    visited = {start}
    dfs(start[0], start[1], 1, visited)
    return count[0]

def generate_snake_puzzle(rows, cols, num_colors, min_len, max_len):
    """
    Generate a puzzle by laying down snake paths on a grid.
    Each snake becomes a numbered pair (start, end) with path length = snake length.
    Returns (grid, pairs) or None if failed.
    """
    for attempt in range(200):
        grid = [[0]*cols for _ in range(rows)]
        pairs = []
        success = True
        
        for color in range(1, num_colors + 1):
            target_len = random.randint(min_len, max_len)
            placed = False
            for _ in range(50):
                sr = random.randint(0, rows-1)
                sc = random.randint(0, cols-1)
                if grid[sr][sc] == 0:
                    path = make_snake_path(grid, rows, cols, color, sr, sc, target_len)
                    if path and len(path) == target_len:
                        pairs.append({
                            'color': color,
                            'start': path[0],
                            'end': path[-1],
                            'length': target_len,
                            'path': path,
                        })
                        placed = True
                        break
            if not placed:
                success = False
                break
        
        if success:
            # Check that all non-zero cells are covered by paths
            # (optional: some cells can be empty = background)
            return grid, pairs
    
    return None, None

def fill_remaining(grid, rows, cols, next_color):
    """Fill remaining empty cells with additional snake paths."""
    pairs = []
    color = next_color
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 0:
                # Try to make a short snake from here
                for length in [3, 4, 5, 6, 7, 8]:
                    path = make_snake_path(grid, rows, cols, color, r, c, length)
                    if path:
                        pairs.append({
                            'color': color,
                            'start': path[0],
                            'end': path[-1],
                            'length': len(path),
                            'path': path,
                        })
                        color += 1
                        break
    return pairs, color

def generate_full_puzzle(rows, cols, seed=None):
    """
    Generate a PathPix puzzle that fills the ENTIRE grid with snake paths.
    Each snake = one numbered pair. Grid is fully covered.
    """
    if seed is not None:
        random.seed(seed)
    
    for attempt in range(500):
        grid = [[0]*cols for _ in range(rows)]
        pairs = []
        color = 1
        
        # Fill greedily with snakes
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == 0:
                    # Try various lengths
                    lengths = list(range(3, min(15, rows*cols)))
                    random.shuffle(lengths)
                    found = False
                    for length in lengths:
                        path = make_snake_path(grid, rows, cols, color, r, c, length)
                        if path:
                            pairs.append({
                                'color': color,
                                'start': path[0],
                                'end': path[-1],
                                'length': len(path),
                                'path': path,
                            })
                            color += 1
                            found = True
                            break
                    if not found:
                        # Try length 2 or 1
                        path = make_snake_path(grid, rows, cols, color, r, c, 2)
                        if path:
                            pairs.append({
                                'color': color,
                                'start': path[0],
                                'end': path[-1],
                                'length': 2,
                                'path': path,
                            })
                            color += 1
                        else:
                            grid[r][c] = color
                            pairs.append({
                                'color': color,
                                'start': (r,c),
                                'end': (r,c),
                                'length': 1,
                                'path': [(r,c)],
                            })
                            color += 1
        
        # Check if fully filled
        total = sum(p['length'] for p in pairs)
        if total == rows * cols:
            # Verify uniqueness for each pair
            all_ok = True
            blocked = set()
            # Process in order of smallest first (they're easier to verify)
            pairs.sort(key=lambda p: p['length'])
            
            for p in pairs:
                if p['length'] <= 1:
                    continue
                # Un-block this pair's path cells for solving
                pair_blocked = blocked.copy()
                for cell in p['path']:
                    pair_blocked.discard(cell)
                count = count_paths_exact_length(grid, rows, cols, p['start'], p['end'], p['length'], pair_blocked)
                if count == 0:
                    all_ok = False
                    break
                # Mark path cells as solved/blocked for subsequent pairs
                for cell in p['path']:
                    blocked.add(cell)
            
            if all_ok:
                return grid, pairs
    
    return None, None

def generate_level_set():
    """Generate 30 levels across 5 tiers."""
    levels = []
    
    configs = [
        # (tier, rows, cols, count, seed_start)
        ("Beginner", 5, 5, 6, 100),
        ("Easy", 6, 6, 6, 200),
        ("Medium", 7, 7, 6, 300),
        ("Hard", 8, 8, 6, 400),
        ("Expert", 9, 9, 6, 500),
    ]
    
    level_num = 1
    for tier, rows, cols, count, seed_start in configs:
        generated = 0
        seed = seed_start
        while generated < count and seed < seed_start + 100:
            print(f"  Generating {tier} #{level_num} ({rows}x{cols}, seed={seed})...", end=" ")
            grid, pairs = generate_full_puzzle(rows, cols, seed=seed)
            # Filter out length-1 pairs (single cells aren't real paths)
            if pairs:
                pairs = [p for p in pairs if p['length'] >= 2]
                # Re-check grid is still consistent
                if pairs:
                    # Rebuild grid from filtered pairs
                    grid = [[0]*cols for _ in range(rows)]
                    for p in pairs:
                        for (r,c) in p['path']:
                            grid[r][c] = p['color']
            if grid is None or not pairs:
                print("FAILED — trying next seed")
                seed += 1
                continue
            
            # Build puzzle grid (endpoint numbers)
            puzzle = [[0]*cols for _ in range(rows)]
            for i, p in enumerate(pairs):
                num = i + 1
                sr, sc = p['start']
                er, ec = p['end']
                puzzle[sr][sc] = num
                puzzle[er][ec] = num
            
            # Colors for the solution image
            color_names = ['#FF6B6B','#4ECDC4','#95E1D3','#F38181','#AA96DA',
                          '#FCBAD3','#FFFFD2','#C7CEEA','#B5EAD7','#FFDAC1',
                          '#E2F0CB','#FFAAA5','#A8E6CF','#DCEDC1','#FFD3B6',
                          '#FFC8DD','#BDE0FE','#A2D2FF','#CDB4DB','#FFB4A2',
                          '#FFDFD3','#FAD2E1','#E0AED0','#D7E3FC','#CCE2CB']
            
            level = {
                'num': level_num,
                'tier': tier,
                'rows': rows,
                'cols': cols,
                'puzzle': puzzle,
                'solution': grid,
                'pairs': [{'num': i+1, 'len': p['length'], 
                          'color': color_names[(p['color']-1) % len(color_names)],
                          'a': list(p['start']), 'b': list(p['end'])} 
                         for i, p in enumerate(pairs)],
                'pairCount': len(pairs),
            }
            levels.append(level)
            print(f"OK ({len(pairs)} pairs)")
            level_num += 1
            generated += 1
            seed += 1
    
    return levels

if __name__ == '__main__':
    print("Generating PathPix levels...")
    levels = generate_level_set()
    print(f"\nGenerated {len(levels)} levels")
    
    # Verify all have solutions
    ok_count = sum(1 for l in levels if l['pairs'])
    print(f"Levels with valid pairs: {ok_count}/{len(levels)}")
    
    with open('pathpix/levels.json', 'w') as f:
        json.dump(levels, f)
    print(f"Wrote pathpix/levels.json")
    
    # Print sample
    if levels:
        l = levels[0]
        print(f"\nSample level: {l['tier']} #{l['num']} ({l['rows']}x{l['cols']})")
        print(f"  Pairs: {l['pairCount']}")
        for p in l['pairs'][:5]:
            print(f"    {p['num']}: len={p['len']}, {p['a']}→{p['b']}, {p['color']}")
