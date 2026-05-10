#!/usr/bin/env python3
"""Generate 60 new solvable Magic Sort levels (602-661)."""
import sys, random
import time
import json
from collections import deque

def is_solved(bottles, num_colors):
    for b in bottles:
        if not b:
            continue
        if len(set(b)) != 1:
            return False
    sorted_colors = set()
    for b in bottles:
        if b:
            sorted_colors.add(b[0])
    return len(sorted_colors) == num_colors

def get_valid_moves(bottles, capacity=4):
    n = len(bottles)
    moves = []
    for fr in range(n):
        if not bottles[fr]:
            continue
        top_fr = bottles[fr][-1]
        if len(bottles[fr]) == capacity and len(set(bottles[fr])) == 1:
            continue
        for to in range(n):
            if fr == to:
                continue
            if len(bottles[to]) >= capacity:
                continue
            if not bottles[to] or bottles[to][-1] == top_fr:
                moves.append((fr, to))
    return moves

def pour(bottles, fr, to, capacity=4):
    new_b = [list(b) for b in bottles]
    color = new_b[fr][-1]
    while new_b[fr] and new_b[fr][-1] == color and len(new_b[to]) < capacity:
        new_b[to].append(new_b[fr].pop())
    return new_b

def state_key(bottles):
    non_empty = tuple(sorted(tuple(b) for b in bottles if b))
    empty_count = sum(1 for b in bottles if not b)
    return (non_empty, empty_count)

def bfs_solve(bottles, num_colors, max_states=300000):
    if is_solved(bottles, num_colors):
        return True
    sk = state_key(bottles)
    visited = {sk}
    queue = deque([bottles])
    while queue:
        current = queue.popleft()
        for fr, to in get_valid_moves(current):
            new_b = pour(current, fr, to)
            nsk = state_key(new_b)
            if nsk in visited:
                continue
            if is_solved(new_b, num_colors):
                return True
            visited.add(nsk)
            if len(visited) > max_states:
                return False
            queue.append(new_b)
    return False

def generate_level(num_colors, extra_empty=2, seed=None):
    random.seed(seed)
    capacity = 4
    num_bottles = num_colors + extra_empty
    for attempt in range(100):
        flat = []
        for c in range(num_colors):
            flat.extend([c] * capacity)
        random.shuffle(flat)
        bottles = []
        idx = 0
        for i in range(num_colors):
            bottles.append(flat[idx:idx+capacity])
            idx += capacity
        for _ in range(extra_empty):
            bottles.append([])
        if bfs_solve(bottles, num_colors):
            return bottles, attempt + 1
    return None, 0

# Generate 60 levels: 30 x 14-color, 30 x 12-color
# Mix of difficulties for variety
LEVEL_CONFIG = (
    [(14, 2)] * 20 +  # 602-621: 14 colors, 2 empty
    [(12, 2)] * 10 +  # 622-631: 12 colors, 2 empty
    [(14, 2)] * 10 +  # 632-641: 14 colors, 2 empty
    [(13, 2)] * 10 +  # 642-651: 13 colors, 2 empty
    [(14, 1)] * 10    # 652-661: 14 colors, 1 empty (extra hard!)
)

results = []
total_start = time.time()

for i, (nc, ne) in enumerate(LEVEL_CONFIG):
    level_num = 602 + i
    seed = 80000 + i * 13
    t0 = time.time()
    level, attempts = generate_level(nc, ne, seed)
    elapsed = time.time() - t0
    
    if level:
        results.append({"level": level_num, "n": nc, "b": level, "time": elapsed, "attempts": attempts})
        print(f"L{level_num}: {nc}c/{ne}e solved in {elapsed:.1f}s (attempt {attempts})")
    else:
        print(f"L{level_num}: FAILED after 100 attempts")

total_time = time.time() - total_start
print(f"\n=== Generated {len(results)}/60 levels in {total_time:.0f}s ===")

# Output as JS
print("\n=== JS OUTPUT START ===")
for r in results:
    bottles_str = json.dumps(r["b"]).replace("[", "[").replace("]", "]")
    print(f'  {{ n:{r["n"]}, b:{bottles_str} }},')
print("=== JS OUTPUT END ===")
