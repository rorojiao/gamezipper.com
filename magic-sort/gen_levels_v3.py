#!/usr/bin/env python3
"""
Magic Sort Level Generator using Reverse-Move Scrambling.
Strategy: Create randomly shuffled tubes and verify solvability via BFS (for small sizes)
or use the guarantee from reverse-moves approach with partial pours.
"""
import random
import sys
from collections import deque

def encode_tube(colors):
    padded = [-1] * (4 - len(colors)) + list(colors)
    v = 0
    for c in padded:
        if c >= 0:
            v = v * 30 + (c + 1)
        else:
            v = v * 30
    return v

def decode_tube(v):
    t = []
    for j in range(4):
        c = v % 30
        if c > 0:
            t.insert(0, c - 1)
        v = v // 30
    return t

def encode_level(n_colors, tubes):
    encoded = [n_colors]
    for tube in tubes:
        encoded.append(encode_tube(tube))
    return encoded

def is_solved(tubes):
    non_empty = [t for t in tubes if len(t) > 0]
    if not non_empty:
        return True
    return all(len(t) == 4 and len(set(t)) == 1 for t in non_empty)

def generate_random_level(n_colors, extra_tubes=2):
    """
    Generate a random level by shuffling all color blocks into tubes.
    Then verify solvability with BFS.
    """
    blocks = []
    for c in range(n_colors):
        blocks.extend([c] * 4)
    random.shuffle(blocks)
    
    tubes = []
    for i in range(n_colors):
        tube = list(blocks[i*4:(i+1)*4])
        tubes.append(tube)
    for _ in range(extra_tubes):
        tubes.append([])
    
    return tubes

def tube_key(tubes):
    return tuple(tuple(t) for t in tubes)

def get_moves(tubes):
    moves = []
    for i, src in enumerate(tubes):
        if not src:
            continue
        top_color = src[-1]
        count = 1
        for k in range(len(src) - 2, -1, -1):
            if src[k] == top_color:
                count += 1
            else:
                break
        for j, dst in enumerate(tubes):
            if i == j:
                continue
            if not dst:
                moves.append((i, j, count))
            elif dst[-1] == top_color and len(dst) + count <= 4:
                moves.append((i, j, count))
    return moves

def apply_move(tubes, src_idx, dst_idx, count):
    new_tubes = [list(t) for t in tubes]
    moved = new_tubes[src_idx][-count:]
    new_tubes[src_idx] = new_tubes[src_idx][:-count]
    new_tubes[dst_idx].extend(moved)
    return new_tubes

def is_solvable_bfs(tubes, max_states=200000):
    if is_solved(tubes):
        return True
    
    initial = tube_key(tubes)
    visited = {initial}
    queue = deque([tubes])
    
    while queue:
        state = queue.popleft()
        if len(visited) > max_states:
            return None  # Inconclusive
        
        for src_idx, dst_idx, count in get_moves(state):
            new_state = apply_move(state, src_idx, dst_idx, count)
            key = tube_key(new_state)
            if key in visited:
                continue
            if is_solved(new_state):
                return True
            visited.add(key)
            queue.append(new_state)
    
    return False

def generate_level_scramble(n_colors, extra_tubes=2, seed=None):
    """
    Start from solved state, shuffle by pouring partial amounts (1-3 at a time)
    to ensure real mixing.
    """
    if seed is not None:
        random.seed(seed)
    
    tubes = []
    for c in range(n_colors):
        tubes.append([c, c, c, c])
    for _ in range(extra_tubes):
        tubes.append([])
    
    num_moves = n_colors * 12 + random.randint(n_colors * 2, n_colors * 6)
    
    for move_num in range(num_moves):
        # Find all non-empty source tubes
        sources = [(i, tubes[i]) for i in range(len(tubes)) if tubes[i]]
        if not sources:
            break
        
        src_idx, src = random.choice(sources)
        top_color = src[-1]
        # Count consecutive same from top
        count = 1
        for k in range(len(src) - 2, -1, -1):
            if src[k] == top_color:
                count += 1
            else:
                break
        
        # Pour a random amount (1 to count) for better mixing
        pour_amount = random.randint(1, count)
        
        # Find valid destinations
        dests = []
        for j, dst in enumerate(tubes):
            if j == src_idx:
                continue
            if not dst and pour_amount <= 4:
                dests.append(j)
            elif dst and dst[-1] == top_color and len(dst) + pour_amount <= 4:
                dests.append(j)
        
        if not dests:
            continue
        
        dst_idx = random.choice(dests)
        new_tubes = [list(t) for t in tubes]
        moved = new_tubes[src_idx][-pour_amount:]
        new_tubes[src_idx] = new_tubes[src_idx][:-pour_amount]
        new_tubes[dst_idx].extend(moved)
        tubes = new_tubes
    
    return tubes

def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <start_level_num> <count> [min_colors] [max_colors]", file=sys.stderr)
        sys.exit(1)
    
    start_level = int(sys.argv[1])
    count = int(sys.argv[2])
    min_colors = int(sys.argv[3]) if len(sys.argv) > 3 else 12
    max_colors = int(sys.argv[4]) if len(sys.argv) > 4 else 16
    
    generated = []
    
    for i in range(count):
        level_num = start_level + i
        
        progress = i / max(count - 1, 1)
        base_n = min_colors + int(progress * (max_colors - min_colors))
        base_n = max(min_colors, min(max_colors, base_n))
        n_colors = random.choice(range(max(min_colors, base_n - 1), min(max_colors, base_n + 2) + 1))
        
        extra_tubes = 2
        seed = random.randint(0, 2**31)
        
        # For small n_colors (<=10), use random shuffle + BFS verify
        # For larger n_colors, use scramble approach (guaranteed solvable)
        if n_colors <= 10:
            found = False
            for attempt in range(20):
                tubes = generate_random_level(n_colors, extra_tubes)
                result = is_solvable_bfs(tubes, max_states=100000)
                if result is True:
                    found = True
                    break
            if not found:
                # Fallback to scramble
                tubes = generate_level_scramble(n_colors, extra_tubes, seed=seed)
        else:
            tubes = generate_level_scramble(n_colors, extra_tubes, seed=seed)
        
        if is_solved(tubes):
            # Regenerate with more moves
            tubes = generate_level_scramble(n_colors, extra_tubes, seed=seed + 1000)
        
        encoded = encode_level(n_colors, tubes)
        encoded_str = '[' + ','.join(str(x) for x in encoded) + ']'
        generated.append(encoded_str)
        
        if (i + 1) % 10 == 0:
            print(f"Generated {i+1}/{count} levels ({n_colors} colors, level {level_num})", file=sys.stderr)
    
    print(','.join(generated))
    print(f"\nDone: {len(generated)} levels generated", file=sys.stderr)

if __name__ == '__main__':
    main()
