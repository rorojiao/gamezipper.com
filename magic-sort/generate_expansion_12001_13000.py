"""
Generate 1000 new levels for Magic Sort expansion: 12001-13000
Milestone: 13,000 levels total!
Strategy: 29-color, 3 extra tubes, min_depth=34 (proven parameters from 9K-12K).
Fresh seed range ensures unique levels.
"""
import sys
import os
sys.path.insert(0, "/home/msdn/gamezipper.com/magic-sort")
from generate_levels import generate_level, generate_batch, deduplicate_levels
import time

OUT_DIR = "/home/msdn/gamezipper.com/magic-sort"
LOG_FILE = os.path.join(OUT_DIR, "gen_log_12001_13000.txt")

def log(msg):
    with open(LOG_FILE, 'a') as f:
        f.write(msg + "\n")
    print(msg, flush=True)

# Clear log
open(LOG_FILE, 'w').close()

log("=" * 60)
log("Magic Sort Expansion: 12001-13000 (1000 levels) — MILESTONE 13K!")
log("Strategy: 29-color, 3 extra tubes, depth>=34")
log("=" * 60)

all_levels = []
t_total = time.time()

# ── Batch 1: 12001-12200 (200 levels) ──
log("\n[1/5] 12001-12200: 29c 3ext d>=34")
b1 = generate_batch(12001, 200, 29, 10000000, extra_tubes=3, time_limit=14.0, min_depth=34)
all_levels.extend(b1)
log(f"  Got: {len(b1)}/200")

# ── Batch 2: 12201-12400 (200 levels) ──
log("\n[2/5] 12201-12400: 29c 3ext d>=34")
b2 = generate_batch(12201, 200, 29, 10200000, extra_tubes=3, time_limit=14.0, min_depth=34)
all_levels.extend(b2)
log(f"  Got: {len(b2)}/200")

# ── Batch 3: 12401-12600 (200 levels) ──
log("\n[3/5] 12401-12600: 29c 3ext d>=34")
b3 = generate_batch(12401, 200, 29, 10400000, extra_tubes=3, time_limit=14.0, min_depth=34)
all_levels.extend(b3)
log(f"  Got: {len(b3)}/200")

# ── Batch 4: 12601-12800 (200 levels) ──
log("\n[4/5] 12601-12800: 29c 3ext d>=34")
b4 = generate_batch(12601, 200, 29, 10600000, extra_tubes=3, time_limit=14.0, min_depth=34)
all_levels.extend(b4)
log(f"  Got: {len(b4)}/200")

# ── Batch 5: 12801-13000 (200 levels) ──
log("\n[5/5] 12801-13000: 29c 3ext d>=34")
b5 = generate_batch(12801, 200, 29, 10800000, extra_tubes=3, time_limit=14.0, min_depth=34)
all_levels.extend(b5)
log(f"  Got: {len(b5)}/200")

# ── Deduplicate ──
all_levels = deduplicate_levels(all_levels)

elapsed = time.time() - t_total

# Write output
outpath = os.path.join(OUT_DIR, "expansion_12001_13000.txt")
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
log(f"  MILESTONE: 13,000 total levels!")
