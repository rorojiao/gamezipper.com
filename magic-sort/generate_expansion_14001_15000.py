"""
Generate 1000 new levels for Magic Sort expansion: 14001-15000
Milestone: 15,000 levels total!
Strategy: 29-color, 3 extra tubes, min_depth=34 (proven parameters from 9K-14K).
Fresh seed range ensures unique levels.
"""
import sys
import os
sys.path.insert(0, "/home/msdn/gamezipper.com/magic-sort")
from generate_levels import generate_level, generate_batch, deduplicate_levels
import time

OUT_DIR = "/home/msdn/gamezipper.com/magic-sort"
LOG_FILE = os.path.join(OUT_DIR, "gen_log_14001_15000.txt")

def log(msg):
    with open(LOG_FILE, 'a') as f:
        f.write(msg + "\n")
    print(msg, flush=True)

# Clear log
open(LOG_FILE, 'w').close()

log("=" * 60)
log("Magic Sort Expansion: 14001-15000 (1000 levels) — MILESTONE 15K!")
log("Strategy: 29-color, 3 extra tubes, depth>=34")
log("=" * 60)

all_levels = []
t_total = time.time()

# ── Batch 1: 14001-14200 (200 levels) ──
log("\n[1/5] 14001-14200: 29c 3ext d>=34")
b1 = generate_batch(14001, 200, 29, 12000000, extra_tubes=3, time_limit=14.0, min_depth=34)
all_levels.extend(b1)
log(f"  Got: {len(b1)}/200")

# ── Batch 2: 14201-14400 (200 levels) ──
log("\n[2/5] 14201-14400: 29c 3ext d>=34")
b2 = generate_batch(14201, 200, 29, 12200000, extra_tubes=3, time_limit=14.0, min_depth=34)
all_levels.extend(b2)
log(f"  Got: {len(b2)}/200")

# ── Batch 3: 14401-14600 (200 levels) ──
log("\n[3/5] 14401-14600: 29c 3ext d>=34")
b3 = generate_batch(14401, 200, 29, 12400000, extra_tubes=3, time_limit=14.0, min_depth=34)
all_levels.extend(b3)
log(f"  Got: {len(b3)}/200")

# ── Batch 4: 14601-14800 (200 levels) ──
log("\n[4/5] 14601-14800: 29c 3ext d>=34")
b4 = generate_batch(14601, 200, 29, 12600000, extra_tubes=3, time_limit=14.0, min_depth=34)
all_levels.extend(b4)
log(f"  Got: {len(b4)}/200")

# ── Batch 5: 14801-15000 (200 levels) ──
log("\n[5/5] 14801-15000: 29c 3ext d>=34")
b5 = generate_batch(14801, 200, 29, 12800000, extra_tubes=3, time_limit=14.0, min_depth=34)
all_levels.extend(b5)
log(f"  Got: {len(b5)}/200")

# ── Deduplicate ──
all_levels = deduplicate_levels(all_levels)

elapsed = time.time() - t_total

# Write output
outpath = os.path.join(OUT_DIR, "expansion_14001_15000.txt")
with open(outpath, 'w') as f:
    for l in all_levels:
        f.write(f"  {l},\n")

log(f"\n{'='*60}")
log(f"EXPANSION COMPLETE!")
log(f"  Batch 1: {len(b1)}")
log(f"  Batch 2: {len(b2)}")
log(f"  Batch 3: {len(b3)}")
log(f"  Batch 4: {len(b4)}")
log(f"  Batch 5: {len(b5)}")
log(f"  TOTAL (deduped): {len(all_levels)}")
log(f"  Time: {elapsed:.1f}s")
log(f"  Output: {outpath}")
log(f"  MILESTONE: 15,000 total levels!")
