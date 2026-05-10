#!/usr/bin/env python3
"""Generate 60 solvable levels quickly by using a mix of strategies."""
import random, time, json, sys
from collections import deque

def is_solved(bottles, num_colors):
    for b in bottles:
        if not b: continue
        if len(set(b)) != 1: return False
    return sum(1 for b in bottles if b) == num_colors

def get_valid_moves(bottles, cap=4):
    n = len(bottles)
    moves = []
    for fr in range(n):
        if not bottles[fr]: continue
        if len(bottles[fr]) == cap and len(set(bottles[fr])) == 1: continue
        top_fr = bottles[fr][-1]
        for to in range(n):
            if fr == to: continue
            if len(bottles[to]) >= cap: continue
            if not bottles[to] or bottles[to][-1] == top_fr:
                moves.append((fr, to))
    return moves

def pour(bottles, fr, to, cap=4):
    new_b = [list(b) for b in bottles]
    color = new_b[fr][-1]
    while new_b[fr] and new_b[fr][-1] == color and len(new_b[to]) < cap:
        new_b[to].append(new_b[fr].pop())
    return new_b

def state_key(bottles):
    non_empty = tuple(sorted(tuple(b) for b in bottles if b))
    empty_count = sum(1 for b in bottles if not b)
    return (non_empty, empty_count)

def bfs_solve(bottles, num_colors, max_states=150000):
    if is_solved(bottles, num_colors): return True
    sk = state_key(bottles)
    visited = {sk}
    queue = deque([bottles])
    while queue:
        current = queue.popleft()
        for fr, to in get_valid_moves(current):
            new_b = pour(current, fr, to)
            nsk = state_key(new_b)
            if nsk in visited: continue
            if is_solved(new_b, num_colors): return True
            visited.add(nsk)
            if len(visited) > max_states: return False
            queue.append(new_b)
    return False

def generate_level_fast(num_colors, extra_empty, max_tries=20):
    cap = 4
    num_bottles = num_colors + extra_empty
    for attempt in range(max_tries):
        random.seed()
        flat = []
        for c in range(num_colors):
            flat.extend([c] * cap)
        random.shuffle(flat)
        bottles = []
        idx = 0
        for i in range(num_colors):
            bottles.append(flat[idx:idx+cap])
            idx += cap
        for _ in range(extra_empty):
            bottles.append([])
        if bfs_solve(bottles, num_colors):
            return bottles
    return None

# Strategy: generate with various difficulty levels
configs = (
    [(12, 2)] * 15 +   # 602-616: 12 colors
    [(13, 2)] * 15 +   # 617-631: 13 colors  
    [(14, 2)] * 15 +   # 632-646: 14 colors
    [(14, 2)] * 9 +    # 647-655: 14 colors
    [(13, 1)] * 5 +    # 656-660: 13 colors, 1 empty (harder!)
    [(14, 1)] * 1      # 661: 14 colors, 1 empty
)

results = []
start = time.time()

for i, (nc, ne) in enumerate(configs):
    lvl = 602 + i
    t0 = time.time()
    level = generate_level_fast(nc, ne)
    dt = time.time() - t0
    if level:
        results.append({"n": nc, "b": level})
        print(f"L{lvl}: {nc}c/{ne}e OK ({dt:.1f}s)", flush=True)
    else:
        print(f"L{lvl}: SKIP ({dt:.1f}s)", flush=True)

total = time.time() - start
print(f"\nDone: {len(results)}/{len(configs)} levels in {total:.0f}s", flush=True)

# Write JS to file
with open("/home/msdn/gamezipper.com/new_levels.txt", "w") as f:
    for r in results:
        bstr = json.dumps(r["b"]).replace(" ", "")
        f.write(f'  {{ n:{r["n"]}, b:{bstr} }},\n')

print(f"Written to new_levels.txt", flush=True)
