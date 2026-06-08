"""
Generate 5000 new levels for Magic Sort expansion: 15001-20000
Milestone: 20,000 levels total!
Strategy: 29-color, 3 extra tubes, min_depth=34 (proven parameters).
Fresh seed range ensures unique levels.
"""
import sys
import os
sys.path.insert(0, "/home/msdn/gamezipper.com/magic-sort")
from generate_levels import generate_level, generate_batch, deduplicate_levels
import time

OUT_DIR = "/home/msdn/gamezipper.com/magic-sort"
LOG_FILE = os.path.join(OUT_DIR, "gen_log_15001_20000.txt")

def log(msg):
    with open(LOG_FILE, 'a') as f:
        f.write(msg + "\n")
    print(msg, flush=True)

# Clear log
open(LOG_FILE, 'w').close()

log("=" * 60)
log("Magic Sort Expansion: 15001-20000 (5000 levels) - MILESTONE 20K!")
log("Strategy: 29-color, 3 extra tubes, depth>=34")
log("=" * 60)

all_levels = []
t_total = time.time()

BATCH_SIZE = 200
TOTAL = 5000
SEED_START = 20000000

for batch_idx in range(TOTAL // BATCH_SIZE):
    start_id = 15001 + batch_idx * BATCH_SIZE
    seed = SEED_START + batch_idx * 100000
    batch_num = batch_idx + 1
    total_batches = TOTAL // BATCH_SIZE
    
    log(f"\n[{batch_num}/{total_batches}] {start_id}-{start_id+BATCH_SIZE-1}: 29c 3ext d>=34, seed={seed}")
    batch = generate_batch(start_id, BATCH_SIZE, 29, seed, extra_tubes=3, time_limit=14.0, min_depth=34)
    all_levels.extend(batch)
    log(f"  Got: {len(batch)}/{BATCH_SIZE}, running total: {len(all_levels)}")

# Deduplicate
all_levels = deduplicate_levels(all_levels)

elapsed = time.time() - t_total

# Write output
outpath = os.path.join(OUT_DIR, "expansion_15001_20000.txt")
with open(outpath, 'w') as f:
    for l in all_levels:
        f.write(f"  {l},\n")

log(f"\n{'='*60}")
log(f"EXPANSION COMPLETE!")
log(f"  Total generated (deduped): {len(all_levels)}")
log(f"  Time: {elapsed:.1f}s")
log(f"  Output: {outpath}")
log(f"  MILESTONE: 20,000 total levels!")
