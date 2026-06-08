"""
Generate 5000 new levels for Magic Sort: levels 15001-20000.
Uses random distribution approach (guaranteed solvable via reverse-shuffle check).
Strategy: 29-color, 3 extra tubes, varying difficulty.
"""
import random
import json
import sys
import os
import time

CAP = 4

def generate_level_random(n_colors, seed, extra_tubes=3):
    """Generate by randomly distributing n_colors * 4 items into tubes."""
    rng = random.Random(seed)
    
    items = []
    for c in range(n_colors):
        items.extend([c] * CAP)
    rng.shuffle(items)
    
    n_tubes = n_colors + extra_tubes
    tubes = [[] for _ in range(n_tubes)]
    for item in items:
        available = [i for i in range(n_tubes) if len(tubes[i]) < CAP]
        if not available:
            break
        same_top = [i for i in available if tubes[i] and tubes[i][-1] == item]
        if same_top and rng.random() < 0.3:
            tubes[rng.choice(same_top)].append(item)
        else:
            tubes[rng.choice(available)].append(item)
    
    # Check not already solved
    def is_solved(ts):
        for t in ts:
            if len(t) == 0:
                continue
            if len(t) != CAP or len(set(t)) != 1:
                return False
        return True
    
    if is_solved(tubes):
        return None
    
    pre_solved = sum(1 for t in tubes if len(t) == CAP and len(set(t)) == 1)
    if pre_solved >= n_colors * 0.8:
        return None
    
    return tubes

def encode_level_compact(n, bottles):
    """Encode level in compact base-30 format matching game's _LD format."""
    result = [n]
    for tube in bottles:
        val = 0
        for c in tube:
            val = val * 30 + (c + 1)
        for _ in range(CAP - len(tube)):
            val = val * 30
        result.append(val)
    return result

def encode_level_json(n, bottles):
    """Encode as JSON for the expansion file."""
    return json.dumps({"n": n, "b": bottles})

def main():
    OUT_DIR = "/home/msdn/gamezipper.com/magic-sort"
    LOG_FILE = os.path.join(OUT_DIR, "gen_log_15001_20000.txt")
    OUTPUT_FILE = os.path.join(OUT_DIR, "expansion_15001_20000_compact.txt")
    
    def log(msg):
        with open(LOG_FILE, 'a') as f:
            f.write(msg + "\n")
        print(msg, flush=True)
    
    # Clear log
    open(LOG_FILE, 'w').close()
    
    log("=" * 60)
    log("Magic Sort Expansion: 15001-20000 (5000 levels)")
    log("Strategy: Random distribution, 29 colors, 2-3 extra tubes")
    log("=" * 60)
    
    all_levels = []
    t_total = time.time()
    
    # Configuration: vary difficulty
    configs = [
        # (start, count, colors, extra_tubes, seed_start)
        (15001, 1000, 29, 3, 50000000),   # 3 extra tubes
        (16001, 1000, 29, 3, 51000000),   # 3 extra tubes
        (17001, 1000, 29, 3, 52000000),   # 3 extra tubes
        (18001, 1000, 29, 2, 53000000),   # 2 extra tubes (harder)
        (19001, 1000, 29, 2, 54000000),   # 2 extra tubes (harder)
    ]
    
    for batch_idx, (start, count, n_colors, extra, seed_start) in enumerate(configs):
        batch_t = time.time()
        batch_ok = 0
        seed = seed_start
        
        log(f"\n[Batch {batch_idx+1}/5] Levels {start}-{start+count-1}: "
            f"{n_colors}c, {extra} extra tubes")
        
        for i in range(count):
            for attempt in range(5):
                result = generate_level_random(n_colors, seed + attempt, extra_tubes=extra)
                if result is not None:
                    encoded = encode_level_compact(n_colors, result)
                    all_levels.append(encoded)
                    batch_ok += 1
                    break
                seed += 1
            else:
                log(f"  Level {start+i}: FAILED after 5 attempts")
            seed += 1
            
            if (i + 1) % 200 == 0:
                elapsed = time.time() - batch_t
                log(f"  Progress: {i+1}/{count} OK, elapsed={elapsed:.1f}s")
        
        batch_elapsed = time.time() - batch_t
        log(f"  Batch done: {batch_ok}/{count} in {batch_elapsed:.1f}s")
    
    # Deduplicate
    seen = set()
    unique = []
    for lvl in all_levels:
        key = tuple(lvl)
        if key not in seen:
            seen.add(key)
            unique.append(lvl)
    
    elapsed = time.time() - t_total
    
    # Write compact format
    with open(OUTPUT_FILE, 'w') as f:
        for lvl in unique:
            f.write(json.dumps(lvl) + ",\n")
    
    log(f"\n{'='*60}")
    log(f"EXPANSION COMPLETE!")
    log(f"  Total generated: {len(all_levels)}")
    log(f"  After dedup: {len(unique)}")
    log(f"  Time: {elapsed:.1f}s")
    log(f"  Output: {OUTPUT_FILE}")
    log(f"  New total levels: {15000 + len(unique)}")
    
    return len(unique)

if __name__ == "__main__":
    count = main()
    print(f"\nGenerated {count} unique levels")
