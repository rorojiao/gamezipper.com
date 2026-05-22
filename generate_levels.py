#!/usr/bin/env python3
"""
Magic Sort Level Generator
Generates 250 new solvable levels (2051-2300) via color permutation of existing levels.
"""
import re
import random
from collections import Counter

def parse_bottles(b_str):
    """Parse JavaScript array notation into Python list of bottle lists"""
    bottle_pattern = re.compile(r'\[([^\[\]]*)\]')
    bottles = []
    for m in bottle_pattern.finditer(b_str):
        inner = m.group(1)
        if inner == '':
            bottles.append([])
        else:
            parts = [x.strip() for x in inner.split(',')]
            bottle = [int(p) for p in parts if p]
            bottles.append(bottle)
    return bottles

def bottles_to_string(bottles):
    """Convert bottles back to JavaScript array notation"""
    parts = []
    for b in bottles:
        if not b:
            parts.append('[]')
        else:
            parts.append('[' + ', '.join(str(x) for x in b) + ']')
    return '[' + ', '.join(parts) + ']'

def verify_solvable(bottles, max_depth=100):
    """DFS solver to verify a level is solvable"""
    state = tuple(tuple(b) for b in bottles)
    visited = set([state])
    stack = [(state, 0)]
    
    while stack:
        current_state, depth = stack.pop()
        
        # Check win
        if all(len(b) == 0 or (len(b) == 4 and len(set(b)) == 1) for b in current_state):
            return True
        
        if depth >= max_depth:
            continue
        
        # Generate moves
        for i, src in enumerate(current_state):
            if not src:
                continue
            top = src[-1]
            for j, dst in enumerate(current_state):
                if i == j:
                    continue
                if dst and len(dst) >= 4:
                    continue
                if dst and dst[-1] != top:
                    continue
                
                # Make move
                new_bottles = [list(b) for b in current_state]
                new_bottles[i] = new_bottles[i][:-1]
                new_bottles[j] = new_bottles[j] + [top]
                new_state = tuple(tuple(b) for b in new_bottles)
                
                if new_state not in visited:
                    visited.add(new_state)
                    stack.append((new_state, depth + 1))
    
    return False

def color_permutation_level(bottles, n_colors):
    """Create a new level by permuting colors of an existing level"""
    colors = list(range(n_colors))
    permutation = list(range(n_colors))
    random.shuffle(permutation)
    
    new_bottles = []
    for bottle in bottles:
        if not bottle:
            new_bottles.append([])
        else:
            new_bottles.append([permutation[c] for c in bottle])
    
    return new_bottles

def main():
    # Read the HTML file
    with open('magic-sort/index.html', 'r') as f:
        content = f.read()
    
    # Parse existing levels
    level_pattern = re.compile(r'\{n:(\d+),b:(\[.*?\])\},')
    matches = list(level_pattern.finditer(content))
    
    existing_levels = []
    for m in matches:
        n = int(m.group(1))
        b_str = m.group(2)
        bottles = parse_bottles(b_str)
        existing_levels.append((n, bottles))
    
    print(f"Parsed {len(existing_levels)} existing levels")
    
    # Categorize by n
    by_n = {}
    for n, bottles in existing_levels:
        if n not in by_n:
            by_n[n] = []
        by_n[n].append(bottles)
    
    n_counts = {n: len(levels) for n, levels in by_n.items()}
    print(f"n distribution: {dict(sorted(n_counts.items()))}")
    
    # Target: 250 new levels
    # 2051-2150: n=14-15 (100 levels)
    # 2151-2250: n=15-16 (100 levels)
    # 2251-2300: n=16 (50 levels)
    
    new_levels = []
    target_ranges = [
        (2051, 2150, [14, 15]),
        (2151, 2250, [15, 16]),
        (2251, 2300, [16]),
    ]
    
    random.seed(42)  # Reproducible
    
    for start, end, ns in target_ranges:
        count = end - start + 1
        print(f"\nGenerating {count} levels for {start}-{end} with n={ns}")
        
        generated = 0
        attempts = 0
        max_attempts = count * 100
        
        while generated < count and attempts < max_attempts:
            attempts += 1
            
            # Pick random n from target range
            n = random.choice(ns)
            
            # Pick random source level with same n
            if n not in by_n or not by_n[n]:
                continue
            
            source = random.choice(by_n[n])
            
            # Generate permutation
            new_bottles = color_permutation_level(source, n)
            
            # Verify solvable
            if verify_solvable(new_bottles, max_depth=100):
                new_levels.append((n, new_bottles))
                generated += 1
                if generated % 10 == 0:
                    print(f"  Generated {generated}/{count}")
        
        print(f"  Completed: {generated} levels in {attempts} attempts")
    
    print(f"\nTotal new levels: {len(new_levels)}")
    
    # Convert to string format
    new_level_strs = []
    for n, bottles in new_levels:
        b_str = bottles_to_string(bottles)
        new_level_strs.append(f"{{n:{n},b:{b_str}}}")
    
    # Output
    output = ',\n'.join(new_level_strs)
    print(f"\nGenerated level data (first 200 chars):\n{output[:200]}...")
    print(f"\nGenerated level data (last 200 chars):\n...{output[-200:]}")
    
    # Write to file
    with open('new_levels.txt', 'w') as f:
        f.write(output)
    
    print(f"\nWrote {len(new_level_strs)} levels to new_levels.txt")
    
    # Verify count
    print(f"Level numbers: 2051-{2050 + len(new_level_strs)}")

if __name__ == '__main__':
    main()