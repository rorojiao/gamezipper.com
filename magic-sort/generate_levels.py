"""
Optimized level generator for Magic Sort puzzle.
Uses DFS with smart heuristics and state memoization.
Supports 2-16 color levels.
"""
import random
import sys
import time

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
    stack = [(initial_key, 0, 0)]  # (state, depth, next_move_idx)
    move_cache = {}
    
    while stack:
        if time.time() - start_time > time_limit:
            return None, len(visited)  # Timeout
        
        key, depth, mi = stack[-1]
        
        # Get or compute moves for this state
        if key not in move_cache:
            bottles = [list(b) for b in key]
            moves = get_moves(bottles, cap)
            # Sort by priority: completing tubes first, then using mixed sources
            def priority(m):
                fr, to, cnt = m
                b = [list(x) for x in key]
                score = 0
                if len(b[to]) + cnt == cap: score += 100  # Completes a tube
                if len(set(b[fr])) > 1: score += 50  # From mixed tube
                score -= len(b[to])  # Prefer less full targets
                return -score
            moves.sort(key=priority)
            move_cache[key] = moves
        
        moves = move_cache[key]
        
        if mi >= len(moves):
            # All moves tried, backtrack
            visited[key] = depth
            move_cache.pop(key, None)
            stack.pop()
            continue
        
        # Increment move index for next time
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

def generate_level(num_colors, seed, extra_tubes=2, time_limit=5.0):
    for attempt in range(20):
        s = seed * 1000 + attempt
        state = generate_random_state(num_colors, s, extra_tubes)
        if is_solved(state): continue
        
        solved_count = sum(1 for b in state if len(b) == CAP and len(set(b)) == 1)
        if solved_count >= num_colors * 0.7: continue
        
        result, info = solve_dfs(state, CAP, max_depth=400, time_limit=time_limit)
        if result is True:
            return state, solved_count, info
        elif result is None:
            # Timeout - try next attempt with different seed
            continue
    return None, 0, 0

def generate_batch(start_id, count, num_colors, seed_base, time_limit=5.0):
    levels = []
    failures = 0
    t0 = time.time()
    for i in range(count):
        seed = seed_base + i
        level, sc, info = generate_level(num_colors, seed, time_limit=time_limit)
        if level:
            levels.append(f"{{n:{num_colors},b:{level}}}")
            print(f"  Level {start_id+i}: OK (pre_solved={sc}/{num_colors}, depth={info})", flush=True)
        else:
            failures += 1
            print(f"  Level {start_id+i}: FAILED", flush=True)
        
        # Check time
        elapsed = time.time() - t0
        avg = elapsed / (i + 1)
        remaining = avg * (count - i - 1)
        if i % 10 == 9:
            print(f"  [Progress: {i+1}/{count}, elapsed={elapsed:.1f}s, ETA={remaining:.1f}s]", flush=True)
    
    print(f"\nGenerated {len(levels)}/{count}, {failures} failures")
    return levels

def deduplicate_levels(levels):
    """Remove duplicate level states."""
    seen = set()
    unique = []
    for lvl in levels:
        key = lvl.strip()
        if key not in seen:
            seen.add(key)
            unique.append(lvl)
    return unique

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "generate"
    
    if mode == "test":
        print("=== Test: 5 colors ===")
        lvl, sc, depth = generate_level(5, 42, time_limit=2.0)
        if lvl:
            print(f"Level: {lvl}")
            print(f"Pre-solved: {sc}/5, solution depth: {depth}")
        else:
            print("Test FAILED")
    
    elif mode == "generate":
        # Generate 15-color levels (MYTHIC difficulty)
        print("=== Generating 15-color levels (1210-1310) ===")
        levels_15 = generate_batch(1210, 100, 15, 200000, time_limit=5.0)
        
        # Generate 16-color levels (COSMIC difficulty)
        print("\n=== Generating 16-color levels (1310-1410) ===")
        levels_16 = generate_batch(1310, 100, 16, 300000, time_limit=8.0)
        
        all_levels = levels_15 + levels_16
        all_levels = deduplicate_levels(all_levels)
        
        if all_levels:
            with open('new_levels_expansion.txt', 'w') as f:
                for l in all_levels:
                    f.write(f"  {l},\n")
            print(f"\nWrote {len(all_levels)} levels to new_levels_expansion.txt")
            print(f"  15-color: {len(levels_15)}, 16-color: {len(levels_16)}")
        else:
            print("No levels generated!")
    
    elif mode == "15":
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 100
        seed = int(sys.argv[3]) if len(sys.argv) > 3 else 200000
        print(f"=== Generating {count} 15-color levels from seed {seed} ===")
        levels = generate_batch(1210, count, 15, seed, time_limit=5.0)
        if levels:
            with open('levels_15color.txt', 'w') as f:
                for l in levels:
                    f.write(f"  {l},\n")
            print(f"Wrote {len(levels)} levels to levels_15color.txt")
    
    elif mode == "16":
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 100
        seed = int(sys.argv[3]) if len(sys.argv) > 3 else 300000
        print(f"=== Generating {count} 16-color levels from seed {seed} ===")
        levels = generate_batch(1310, count, 16, seed, time_limit=8.0)
        if levels:
            with open('levels_16color.txt', 'w') as f:
                for l in levels:
                    f.write(f"  {l},\n")
            print(f"Wrote {len(levels)} levels to levels_16color.txt")
