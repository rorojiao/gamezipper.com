"""
Generate 550 new levels for Magic Sort expansion (2451-3000).
5 batches with increasing difficulty:
- 2451-2550: 16-color normal (2 extra tubes)
- 2551-2650: 15-color hard (1 extra tube)
- 2651-2750: 16-color hard (1 extra tube)
- 2751-2850: Mixed 15/16 extreme (1-2 extra tubes)
- 2851-3000: Mixed 15/16 insane (0-1 extra tubes, very high min_depth)
"""
import random
import sys
import time
import os

CAP = 4

def is_solved(bottles):
    for b in bottles:
        if len(b) == 0: continue
        if len(b) != CAP or len(set(b)) != 1: return False
    return True

def generate_random_state(num_colors, seed, extra_tubes=2):
    rng = random.Random(seed)
    pool = []
    for c in range(num_colors):
        pool.extend([c] * CAP)
    rng.shuffle(pool)
    tubes = [pool[i*CAP:(i+1)*CAP] for i in range(num_colors)]
    for _ in range(extra_tubes):
        tubes.append([])
    return tubes

def get_moves(bottles, cap=CAP):
    moves = []
    for i in range(len(bottles)):
        if not bottles[i]: continue
        top = bottles[i][-1]
        pc = sum(1 for j in range(len(bottles[i])-1, -1, -1) if bottles[i][j] == top)
        is_complete = (pc == len(bottles[i]) and len(set(bottles[i])) == 1)
        for j in range(len(bottles)):
            if i == j: continue
            if not bottles[j]:
                if is_complete: continue
                amt = min(pc, cap - len(bottles[j]))
                if amt > 0: moves.append((i, j, amt))
            elif bottles[j][-1] == top and len(bottles[j]) < cap:
                amt = min(pc, cap - len(bottles[j]))
                if amt > 0: moves.append((i, j, amt))
    return moves

def solve_dfs(bottles, cap=CAP, max_depth=400, time_limit=5.0):
    start_time = time.time()
    initial_key = tuple(tuple(b) for b in bottles)
    if is_solved(bottles): return True, 0
    visited = {initial_key: 0}
    stack = [(initial_key, 0, 0)]
    move_cache = {}
    while stack:
        if time.time() - start_time > time_limit:
            return None, len(visited)
        key, depth, mi = stack[-1]
        if key not in move_cache:
            bl = [list(b) for b in key]
            moves = get_moves(bl, cap)
            def priority(m):
                fr, to, cnt = m
                b = [list(x) for x in key]
                score = 0
                if len(b[to]) + cnt == cap: score += 100
                if len(set(b[fr])) > 1: score += 50
                score -= len(b[to])
                return -score
            moves.sort(key=priority)
            move_cache[key] = moves
        moves = move_cache[key]
        if mi >= len(moves):
            visited[key] = depth
            move_cache.pop(key, None)
            stack.pop()
            continue
        stack[-1] = (key, depth, mi + 1)
        fr, to, cnt = moves[mi]
        bl = [list(b) for b in key]
        c = bl[fr][-cnt:]
        del bl[fr][-cnt:]
        bl[to].extend(c)
        nk = tuple(tuple(b) for b in bl)
        if nk in visited:
            continue
        if is_solved(bl):
            return True, depth + 1
        if depth + 1 > max_depth:
            continue
        visited[nk] = depth + 1
        stack.append((nk, depth + 1, 0))
    return False, len(visited)

def generate_level(num_colors, seed, extra_tubes=2, time_limit=5.0, min_solution_depth=15):
    for attempt in range(30):
        s = seed * 1000 + attempt
        state = generate_random_state(num_colors, s, extra_tubes)
        if is_solved(state): continue
        solved_count = sum(1 for b in state if len(b) == CAP and len(set(b)) == 1)
        if solved_count >= num_colors * 0.6: continue
        result, info = solve_dfs(state, CAP, max_depth=500, time_limit=time_limit)
        if result is True:
            if info >= min_solution_depth:
                return state, solved_count, info
        elif result is None:
            continue
    return None, 0, 0

def generate_batch(start_id, count, num_colors, seed_base, extra_tubes=2, time_limit=5.0, min_depth=15):
    levels = []
    failures = 0
    t0 = time.time()
    for i in range(count):
        seed = seed_base + i
        level, sc, info = generate_level(num_colors, seed, extra_tubes, time_limit, min_depth)
        if level:
            levels.append((start_id + i, num_colors, level, info))
            if (i+1) % 25 == 0:
                elapsed = time.time() - t0
                eta = elapsed / (i+1) * (count - i - 1)
                print(f"  [{i+1}/{count}, {len(levels)} ok, {failures} fail, ETA={eta:.0f}s]", flush=True)
        else:
            failures += 1
    elapsed = time.time() - t0
    print(f"  Done: {len(levels)}/{count} ok, {failures} fail, {elapsed:.1f}s", flush=True)
    return levels

def generate_mixed_batch(start_id, count, seed_base, configs, time_limit=6.0):
    """configs = list of (num_colors, extra_tubes, min_depth) tuples"""
    levels = []
    failures = 0
    t0 = time.time()
    rng = random.Random(seed_base)
    for i in range(count):
        nc, et, md = rng.choice(configs)
        seed = seed_base + i
        level, sc, info = generate_level(nc, seed, et, time_limit, md)
        if level:
            levels.append((start_id + i, nc, level, info))
            if (i+1) % 25 == 0:
                elapsed = time.time() - t0
                eta = elapsed / (i+1) * (count - i - 1)
                print(f"  [{i+1}/{count}, {len(levels)} ok, {failures} fail, ETA={eta:.0f}s]", flush=True)
        else:
            failures += 1
    elapsed = time.time() - t0
    print(f"  Done: {len(levels)}/{count} ok, {failures} fail, {elapsed:.1f}s", flush=True)
    return levels

def deduplicate(levels):
    seen = set()
    unique = []
    for lvl in levels:
        key = str(sorted([sorted(b) for b in lvl[2]]))
        if key not in seen:
            seen.add(key)
            unique.append(lvl)
    return unique

def format_level(nc, bottles):
    return f"{{n:{nc},b:{bottles}}}"

if __name__ == "__main__":
    outpath = "/home/msdn/gamezipper.com/magic-sort/expansion_2451_3000.txt"
    all_levels = []
    
    print("=" * 60)
    print("Magic Sort Level Expansion: 2451-3000 (550 levels)")
    print("=" * 60)
    
    # Batch 1: 2451-2550 - 16-color standard (2 extra tubes)
    print("\n[Batch 1] 2451-2550: 16-color standard (2 extra, depth>=20)")
    b1 = generate_batch(2451, 100, 16, 800000, extra_tubes=2, time_limit=6.0, min_depth=20)
    all_levels.extend(b1)
    
    # Batch 2: 2551-2650 - 15-color hard (1 extra tube)
    print("\n[Batch 2] 2551-2650: 15-color hard (1 extra, depth>=22)")
    b2 = generate_batch(2551, 100, 15, 900000, extra_tubes=1, time_limit=8.0, min_depth=22)
    all_levels.extend(b2)
    
    # Batch 3: 2651-2750 - 16-color hard (1 extra tube)
    print("\n[Batch 3] 2651-2750: 16-color hard (1 extra, depth>=25)")
    b3 = generate_batch(2651, 100, 16, 1000000, extra_tubes=1, time_limit=10.0, min_depth=25)
    all_levels.extend(b3)
    
    # Batch 4: 2751-2850 - Mixed extreme
    print("\n[Batch 4] 2751-2850: Mixed extreme (15-16c, 1-2 extra, depth>=25)")
    configs_extreme = [
        (15, 2, 28), (16, 2, 30), (15, 1, 30), (16, 1, 35)
    ]
    b4 = generate_mixed_batch(2751, 100, 1100000, configs_extreme, time_limit=10.0)
    all_levels.extend(b4)
    
    # Batch 5: 2851-3000 - Insane (150 levels)
    print("\n[Batch 5] 2851-3000: Insane (15-16c, 0-1 extra, depth>=35)")
    configs_insane = [
        (15, 2, 35), (16, 2, 40), (15, 1, 40), (16, 1, 45), (15, 1, 50)
    ]
    b5 = generate_mixed_batch(2851, 150, 1200000, configs_insane, time_limit=12.0)
    all_levels.extend(b5)
    
    # Deduplicate
    print(f"\nTotal generated: {len(all_levels)}, deduplicating...")
    all_levels = deduplicate(all_levels)
    print(f"After dedup: {len(all_levels)}")
    
    # Sort by level id
    all_levels.sort(key=lambda x: x[0])
    
    # Write output
    with open(outpath, 'w') as f:
        for lvl_id, nc, bottles, depth in all_levels:
            f.write(f"  {format_level(nc, bottles)},\n")
    
    print(f"\nWrote {len(all_levels)} levels to {outpath}")
    if len(all_levels) >= 500:
        print(f"Last level ID: {all_levels[-1][0]}")
        print(f"Total game levels: 2450 + {len(all_levels)} = {2450 + len(all_levels)}")
