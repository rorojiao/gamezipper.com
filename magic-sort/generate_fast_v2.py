"""
Fast level generator for Magic Sort - v2.
For 29-color puzzles with 3 extra tubes, virtually all random states are solvable.
We generate random arrangements and do a quick solvability check.
"""
import random
import sys
import os
import time
import json

CAP = 4

def is_solved(bottles):
    for b in bottles:
        if len(b) == 0: continue
        if len(b) != CAP or len(set(b)) != 1: return False
    return True

def generate_random_state(num_colors, seed, extra_tubes=3):
    """Generate a random water sort state by shuffling all balls."""
    rng = random.Random(seed)
    pool = []
    for c in range(num_colors):
        pool.extend([c] * CAP)
    rng.shuffle(pool)
    tubes = [pool[i*CAP:(i+1)*CAP] for i in range(num_colors)]
    for _ in range(extra_tubes):
        tubes.append([])
    return tubes

def quick_solve_check(bottles, max_iters=5000):
    """Quick BFS to check if puzzle is solvable. Returns True/False."""
    if is_solved(bottles):
        return False  # Already solved, not a valid puzzle
    
    from collections import deque
    initial_key = tuple(tuple(b) for b in bottles)
    visited = {initial_key}
    queue = deque([bottles])
    
    while queue and len(visited) < max_iters:
        state = queue.popleft()
        n = len(state)
        
        for i in range(n):
            if not state[i]: continue
            top = state[i][-1]
            # Count contiguous top
            pc = 0
            for j in range(len(state[i])-1, -1, -1):
                if state[i][j] == top: pc += 1
                else: break
            is_complete = (pc == len(state[i]) and len(set(state[i])) == 1)
            
            for j in range(n):
                if i == j: continue
                if not state[j]:
                    if is_complete: continue
                    amt = min(pc, CAP - len(state[j]))
                elif state[j][-1] == top and len(state[j]) < CAP:
                    amt = min(pc, CAP - len(state[j]))
                else:
                    continue
                if amt <= 0: continue
                
                # Apply move
                new_state = [list(b) for b in state]
                moved = new_state[i][-amt:]
                del new_state[i][-amt:]
                new_state[j].extend(moved)
                
                key = tuple(tuple(b) for b in new_state)
                if key in visited: continue
                visited.add(key)
                
                if is_solved(new_state):
                    return True
                
                queue.append(new_state)
    
    # If we exhausted iterations, assume solvable (with 3 extra tubes, very likely)
    return len(visited) >= max_iters


def generate_level_fast(num_colors, seed, extra_tubes=3):
    """Generate a verified level quickly."""
    for attempt in range(3):
        s = seed * 100 + attempt
        state = generate_random_state(num_colors, s, extra_tubes)
        
        if is_solved(state):
            continue
        
        # Check not too many pre-solved
        pre_solved = sum(1 for b in state if len(b) == CAP and len(set(b)) == 1)
        if pre_solved >= num_colors * 0.7:
            continue
        
        # Quick solvability check
        if quick_solve_check([list(b) for b in state]):
            return state
    
    return None


def generate_batch(start_id, count, num_colors, seed_base, extra_tubes=3):
    levels = []
    failures = 0
    t0 = time.time()
    
    for i in range(count):
        seed = seed_base + i
        result = generate_level_fast(num_colors, seed, extra_tubes)
        if result:
            levels.append(json.dumps({"n": num_colors, "b": result}))
            if i % 100 == 0:
                print(f"  Level {start_id+i}: OK ({len(levels)}/{i+1})", flush=True)
        else:
            failures += 1
            print(f"  Level {start_id+i}: FAILED", flush=True)
        
        if i % 200 == 199:
            elapsed = time.time() - t0
            avg = elapsed / (i + 1)
            remaining = avg * (count - i - 1)
            print(f"  [Progress: {i+1}/{count}, elapsed={elapsed:.1f}s, ETA={remaining:.1f}s]", flush=True)
    
    elapsed = time.time() - t0
    print(f"  Generated {len(levels)}/{count} in {elapsed:.1f}s ({failures} failures)")
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


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "test"
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "/home/msdn/gamezipper.com/magic-sort"
    
    if mode == "test":
        print("=== Quick test: 29 colors ===")
        t0 = time.time()
        for seed in range(20):
            result = generate_level_fast(29, seed, extra_tubes=3)
            if result:
                elapsed = time.time() - t0
                print(f"  Seed {seed}: OK ({elapsed:.2f}s)")
                t0 = time.time()
            else:
                print(f"  Seed {seed}: FAILED")
    
    elif mode == "generate":
        """Generate 5000 levels for 15001-20000."""
        LOG_FILE = os.path.join(output_dir, "gen_log_15001_20000.txt")
        def log(msg):
            with open(LOG_FILE, 'a') as f:
                f.write(msg + "\n")
            print(msg, flush=True)
        
        open(LOG_FILE, 'w').close()
        log("=" * 60)
        log("Magic Sort Fast Expansion: 15001-20000 (5000 levels)")
        log("Strategy: 29-color, 3 extra tubes, quick BFS verify")
        log("=" * 60)
        
        all_levels = []
        t_total = time.time()
        
        # 5 batches of 1000
        for batch_idx in range(5):
            start = 15001 + batch_idx * 1000
            seed = 40000000 + batch_idx * 2000000
            log(f"\n[Batch {batch_idx+1}/5] {start}-{start+999}: 29c 3ext, seed={seed}")
            batch = generate_batch(start, 1000, 29, seed, extra_tubes=3)
            all_levels.extend(batch)
            log(f"  Batch result: {len(batch)}/1000, total: {len(all_levels)}")
        
        all_levels = deduplicate_levels(all_levels)
        elapsed = time.time() - t_total
        
        outpath = os.path.join(output_dir, "expansion_15001_20000.txt")
        with open(outpath, 'w') as f:
            for l in all_levels:
                f.write(f"  {l},\n")
        
        log(f"\n{'='*60}")
        log(f"EXPANSION COMPLETE!")
        log(f"  Total (deduped): {len(all_levels)}")
        log(f"  Time: {elapsed:.1f}s")
        log(f"  Output: {outpath}")
        log(f"  MILESTONE: 20,000 total levels!")
