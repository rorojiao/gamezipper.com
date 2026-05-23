"""
Optimized level generator for Magic Sort puzzle.
Uses DFS with smart heuristics and state memoization.
Supports 2-16 color levels, with difficulty control via extra_tubes.
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
    """DFS solver with time limit."""
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
            bottles = [list(b) for b in key]
            moves = get_moves(bottles, cap)
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
        bottles = [list(b) for b in key]
        c = bottles[fr][-cnt:]
        del bottles[fr][-cnt:]
        bottles[to].extend(c)
        nk = tuple(tuple(b) for b in bottles)
        
        if nk in visited:
            continue
        
        if is_solved(bottles):
            return True, depth + 1
        
        if depth + 1 > max_depth:
            continue
        
        visited[nk] = depth + 1
        stack.append((nk, depth + 1, 0))
    
    return False, len(visited)

def generate_level(num_colors, seed, extra_tubes=2, time_limit=5.0, min_solution_depth=15):
    for attempt in range(20):
        s = seed * 1000 + attempt
        state = generate_random_state(num_colors, s, extra_tubes)
        if is_solved(state): continue
        
        solved_count = sum(1 for b in state if len(b) == CAP and len(set(b)) == 1)
        if solved_count >= num_colors * 0.7: continue
        
        result, info = solve_dfs(state, CAP, max_depth=400, time_limit=time_limit)
        if result is True:
            if info >= min_solution_depth:
                return state, solved_count, info
            else:
                continue
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
            levels.append(f"{{n:{num_colors},b:{level}}}")
            print(f"  Level {start_id+i}: OK (pre_solved={sc}/{num_colors}, depth={info})", flush=True)
        else:
            failures += 1
            print(f"  Level {start_id+i}: FAILED", flush=True)
        
        elapsed = time.time() - t0
        avg = elapsed / (i + 1)
        remaining = avg * (count - i - 1)
        if i % 10 == 9:
            print(f"  [Progress: {i+1}/{count}, elapsed={elapsed:.1f}s, ETA={remaining:.1f}s]", flush=True)
    
    print(f"\nGenerated {len(levels)}/{count}, {failures} failures")
    return levels

def deduplicate_levels(levels):
    seen = set()
    unique = []
    for lvl in levels:
        key = lvl.strip()
        if key not in seen:
            seen.add(key)
            unique.append(lvl)
    return unique

def generate_mixed_batch(start_id, count, seed_base, time_limit=5.0, min_depth=15):
    """Generate a mix of 15 and 16 color levels."""
    levels = []
    failures = 0
    t0 = time.time()
    rng = random.Random(seed_base)
    for i in range(count):
        num_colors = rng.choice([15, 15, 16, 16, 16])  # slightly more 16-color
        seed = seed_base + i
        level, sc, info = generate_level(num_colors, seed, 2, time_limit, min_depth)
        if level:
            levels.append(f"{{n:{num_colors},b:{level}}}")
            print(f"  Level {start_id+i}: OK ({num_colors}c, pre_solved={sc}/{num_colors}, depth={info})", flush=True)
        else:
            failures += 1
            print(f"  Level {start_id+i}: FAILED ({num_colors}c)", flush=True)
        
        elapsed = time.time() - t0
        avg = elapsed / (i + 1)
        remaining = avg * (count - i - 1)
        if i % 10 == 9:
            print(f"  [Progress: {i+1}/{count}, elapsed={elapsed:.1f}s, ETA={remaining:.1f}s]", flush=True)
    
    print(f"\nGenerated {len(levels)}/{count}, {failures} failures")
    return levels

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "generate"
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "/home/msdn/gamezipper.com/magic-sort"
    
    if mode == "test":
        print("=== Test: 5 colors ===")
        lvl, sc, depth = generate_level(5, 42, time_limit=2.0)
        if lvl:
            print(f"Level: {lvl}")
            print(f"Pre-solved: {sc}/5, solution depth: {depth}")
        else:
            print("Test FAILED")
    
    elif mode == "expansion":
        """Generate 400 new levels for expansion to ~2400+ levels."""
        all_levels = []
        
        # Batch 1: 15-color levels (levels 2048-2147) - "Transcendent+" section
        print("=== Batch 1: 15-color levels (2048-2147) ===")
        levels_15a = generate_batch(2048, 100, 15, 400000, extra_tubes=2, time_limit=5.0, min_depth=15)
        all_levels.extend(levels_15a)
        
        # Batch 2: 16-color levels (levels 2148-2247) - "Cosmic Ultra" section  
        print("\n=== Batch 2: 16-color levels (2148-2247) ===")
        levels_16a = generate_batch(2148, 100, 16, 500000, extra_tubes=2, time_limit=8.0, min_depth=20)
        all_levels.extend(levels_16a)
        
        # Batch 3: Mixed 15/16-color (levels 2248-2347) - "Dimensional" section
        print("\n=== Batch 3: Mixed 15/16-color (2248-2347) ===")
        levels_mix = generate_mixed_batch(2248, 100, 600000, time_limit=6.0, min_depth=18)
        all_levels.extend(levels_mix)
        
        # Batch 4: 16-color hard (levels 2348-2447) - "Eternal" section with 1 extra tube
        print("\n=== Batch 4: 16-color hard, 1 extra tube (2348-2447) ===")
        levels_16h = generate_batch(2348, 100, 16, 700000, extra_tubes=1, time_limit=10.0, min_depth=25)
        all_levels.extend(levels_16h)
        
        all_levels = deduplicate_levels(all_levels)
        
        outpath = os.path.join(output_dir, 'expansion_levels.txt')
        if all_levels:
            with open(outpath, 'w') as f:
                for l in all_levels:
                    f.write(f"  {l},\n")
            print(f"\n=== FINAL: Wrote {len(all_levels)} unique levels to {outpath} ===")
            print(f"  15-color batch: {len(levels_15a)}")
            print(f"  16-color batch: {len(levels_16a)}")
            print(f"  Mixed batch: {len(levels_mix)}")
            print(f"  16-color hard batch: {len(levels_16h)}")
            print(f"  After dedup: {len(all_levels)}")
        else:
            print("No levels generated!")
    
    elif mode == "15":
        count = int(sys.argv[3]) if len(sys.argv) > 3 else 100
        seed = int(sys.argv[4]) if len(sys.argv) > 4 else 400000
        print(f"=== Generating {count} 15-color levels from seed {seed} ===")
        levels = generate_batch(2048, count, 15, seed, extra_tubes=2, time_limit=5.0, min_depth=15)
        if levels:
            outpath = os.path.join(output_dir, 'expansion_15.txt')
            with open(outpath, 'w') as f:
                for l in levels:
                    f.write(f"  {l},\n")
            print(f"Wrote {len(levels)} levels to {outpath}")
    
    elif mode == "16":
        count = int(sys.argv[3]) if len(sys.argv) > 3 else 100
        seed = int(sys.argv[4]) if len(sys.argv) > 4 else 500000
        print(f"=== Generating {count} 16-color levels from seed {seed} ===")
        levels = generate_batch(2148, count, 16, seed, extra_tubes=2, time_limit=8.0, min_depth=20)
        if levels:
            outpath = os.path.join(output_dir, 'expansion_16.txt')
            with open(outpath, 'w') as f:
                for l in levels:
                    f.write(f"  {l},\n")
            print(f"Wrote {len(levels)} levels to {outpath}")
    
    elif mode == "16hard":
        count = int(sys.argv[3]) if len(sys.argv) > 3 else 100
        seed = int(sys.argv[4]) if len(sys.argv) > 4 else 700000
        print(f"=== Generating {count} 16-color hard levels (1 extra tube) from seed {seed} ===")
        levels = generate_batch(2348, count, 16, seed, extra_tubes=1, time_limit=10.0, min_depth=25)
        if levels:
            outpath = os.path.join(output_dir, 'expansion_16hard.txt')
            with open(outpath, 'w') as f:
                for l in levels:
                    f.write(f"  {l},\n")
            print(f"Wrote {len(levels)} levels to {outpath}")
    
    elif mode == "mixed":
        count = int(sys.argv[3]) if len(sys.argv) > 3 else 100
        seed = int(sys.argv[4]) if len(sys.argv) > 4 else 600000
        print(f"=== Generating {count} mixed 15/16-color levels from seed {seed} ===")
        levels = generate_mixed_batch(2248, count, seed, time_limit=6.0, min_depth=18)
        if levels:
            outpath = os.path.join(output_dir, 'expansion_mixed.txt')
            with open(outpath, 'w') as f:
                for l in levels:
                    f.write(f"  {l},\n")
            print(f"Wrote {len(levels)} levels to {outpath}")
