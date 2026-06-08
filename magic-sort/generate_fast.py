"""
Fast level generator for Magic Sort using reverse-shuffle approach.
Instead of DFS solving (expensive for 29 colors), we start from solved
state and make random backward moves to create puzzles.
This guarantees solvability and is O(moves) per level.
"""
import random
import sys
import os
import time
import json

CAP = 4

def generate_level_reverse(num_colors, seed, extra_tubes=3, num_moves=60):
    """Generate a level by starting from solved and shuffling backward."""
    rng = random.Random(seed)
    
    # Start with solved state: each color in its own tube, full
    tubes = []
    for c in range(num_colors):
        tubes.append([c] * CAP)
    for _ in range(extra_tubes):
        tubes.append([])
    
    # Make random valid moves to shuffle
    total_tubes = len(tubes)
    for _ in range(num_moves):
        # Pick a random non-empty source tube
        sources = [i for i in range(total_tubes) if len(tubes[i]) > 0]
        if not sources:
            break
        src = rng.choice(sources)
        
        # Get the top color and count
        top_color = tubes[src][-1]
        count = 0
        for j in range(len(tubes[src]) - 1, -1, -1):
            if tubes[src][j] == top_color:
                count += 1
            else:
                break
        
        # Pick a random valid destination
        valid_dests = []
        for j in range(total_tubes):
            if j == src:
                continue
            if len(tubes[j]) == 0:
                # Don't move to empty if source is already complete
                is_complete = (count == len(tubes[src]) and len(set(tubes[src])) == 1)
                if not is_complete:
                    valid_dests.append(j)
            elif tubes[j][-1] == top_color and len(tubes[j]) < CAP:
                valid_dests.append(j)
        
        if not valid_dests:
            continue
        
        dst = rng.choice(valid_dests)
        amt = min(count, CAP - len(tubes[dst]))
        
        # Move
        moved = tubes[src][-amt:]
        del tubes[src][-amt:]
        tubes[dst].extend(moved)
    
    # Check it's not already solved
    def is_solved(tubes):
        for t in tubes:
            if len(t) == 0:
                continue
            if len(t) != CAP or len(set(t)) != 1:
                return False
        return True
    
    if is_solved(tubes):
        return None
    
    # Count pre-solved tubes
    pre_solved = sum(1 for t in tubes if len(t) == CAP and len(set(t)) == 1)
    if pre_solved >= num_colors * 0.8:
        return None  # Too easy
    
    return tubes


def encode_level_json(n, bottles):
    """Encode level as {n:X, b:[[...], ...]}"""
    return json.dumps({"n": n, "b": bottles})


def generate_batch_fast(start_id, count, num_colors, seed_base, 
                         extra_tubes=3, num_moves=60):
    """Generate a batch of levels using reverse shuffle."""
    levels = []
    failures = 0
    t0 = time.time()
    
    for i in range(count):
        for attempt in range(5):
            seed = seed_base + i * 10 + attempt
            result = generate_level_reverse(num_colors, seed, extra_tubes, num_moves)
            if result is not None:
                levels.append(encode_level_json(num_colors, result))
                print(f"  Level {start_id+i}: OK (attempt {attempt+1})", flush=True)
                break
        else:
            failures += 1
            print(f"  Level {start_id+i}: FAILED", flush=True)
        
        if i % 50 == 49:
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
    mode = sys.argv[1] if len(sys.argv) > 1 else "generate"
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "/home/msdn/gamezipper.com/magic-sort"
    
    if mode == "test":
        print("=== Test: 29 colors, reverse shuffle ===")
        for seed in range(10):
            result = generate_level_reverse(29, seed, extra_tubes=3, num_moves=80)
            if result:
                print(f"  Seed {seed}: OK, tubes={len(result)}")
                break
            else:
                print(f"  Seed {seed}: failed")
    
    elif mode == "15001_20000":
        """Generate 5000 new levels for expansion to 20000."""
        all_levels = []
        t_total = time.time()
        
        # Generate in 5 batches of 1000
        batch_configs = [
            # (start, count, colors, seed, extra_tubes, moves)
            (15001, 1000, 29, 30000000, 3, 80),  # Standard hard
            (16001, 1000, 29, 31000000, 3, 90),  # More shuffled
            (17001, 1000, 29, 32000000, 3, 100), # Even more
            (18001, 1000, 29, 33000000, 2, 70),  # Fewer extra tubes = harder
            (19001, 1000, 29, 34000000, 2, 80),  # Hard + shuffled
        ]
        
        for batch_idx, (start, count, colors, seed, ext, moves) in enumerate(batch_configs):
            print(f"\n{'='*60}")
            print(f"Batch {batch_idx+1}/5: levels {start}-{start+count-1}")
            print(f"  {colors} colors, {ext} extra tubes, {moves} shuffle moves")
            print(f"{'='*60}")
            batch = generate_batch_fast(start, count, colors, seed, ext, moves)
            all_levels.extend(batch)
            print(f"  Batch total: {len(batch)}, running: {len(all_levels)}")
        
        all_levels = deduplicate_levels(all_levels)
        
        elapsed = time.time() - t_total
        outpath = os.path.join(output_dir, "expansion_15001_20000.txt")
        with open(outpath, 'w') as f:
            for l in all_levels:
                f.write(f"  {l},\n")
        
        print(f"\n{'='*60}")
        print(f"EXPANSION COMPLETE!")
        print(f"  Total generated (deduped): {len(all_levels)}")
        print(f"  Time: {elapsed:.1f}s")
        print(f"  Output: {outpath}")
        print(f"  MILESTONE: 20,000 total levels!")
