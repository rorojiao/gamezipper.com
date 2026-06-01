"""
Generate 1000 new levels for Magic Sort expansion: 8001-9000
Writes output to expansion_8001_9000.txt and progress to gen_log_8001_9000.txt
Optimized: more extra tubes for feasible generation at 29 colors.
"""
import sys
import os
sys.path.insert(0, "/home/msdn/gamezipper.com/magic-sort")
from generate_levels import generate_level, generate_batch, deduplicate_levels
import time

OUT_DIR = "/home/msdn/gamezipper.com/magic-sort"
LOG_FILE = os.path.join(OUT_DIR, "gen_log_8001_9000.txt")

def log(msg):
    with open(LOG_FILE, 'a') as f:
        f.write(msg + "\n")
    print(msg, flush=True)

# Clear log
open(LOG_FILE, 'w').close()

log("=" * 60)
log("Magic Sort Expansion: 8001-9000 (1000 levels)")
log("=" * 60)

all_levels = []
t_total = time.time()

# ── Batch 1: 8001-8200 (200 levels) — 29-color (5 extra, depth>=20) ──
log("\n[1/5] 8001-8200: 29-color (5 extra, depth>=20)")
b1 = generate_batch(8001, 200, 29, 4800000, extra_tubes=5, time_limit=8.0, min_depth=20)
all_levels.extend(b1)
log(f"  Got: {len(b1)}/200")

# ── Batch 2: 8201-8400 (200 levels) — 29-color HARD (4 extra, depth>=22) ──
log("\n[2/5] 8201-8400: 29-color HARD (4 extra, depth>=22)")
b2 = generate_batch(8201, 200, 29, 5000000, extra_tubes=4, time_limit=8.0, min_depth=22)
all_levels.extend(b2)
log(f"  Got: {len(b2)}/200")

# ── Batch 3: 8401-8600 (200 levels) — 29-color EXTREME (4 extra, depth>=24) ──
log("\n[3/5] 8401-8600: 29-color EXTREME (4 extra, depth>=24)")
b3 = generate_batch(8401, 200, 29, 5200000, extra_tubes=4, time_limit=10.0, min_depth=24)
all_levels.extend(b3)
log(f"  Got: {len(b3)}/200")

# ── Batch 4: 8601-8800 (200 levels) — 29-color NIGHTMARE (4 extra, depth>=26) ──
log("\n[4/5] 8601-8800: 29-color NIGHTMARE (4 extra, depth>=26)")
b4 = generate_batch(8601, 200, 29, 5400000, extra_tubes=4, time_limit=10.0, min_depth=26)
all_levels.extend(b4)
log(f"  Got: {len(b4)}/200")

# ── Batch 5: 8801-9000 (200 levels) — 29-color GODLIKE (4 extra, depth>=28) ──
log("\n[5/5] 8801-9000: 29-color GODLIKE (4 extra, depth>=28)")
b5 = generate_batch(8801, 200, 29, 5600000, extra_tubes=4, time_limit=12.0, min_depth=28)
all_levels.extend(b5)
log(f"  Got: {len(b5)}/200")

# ── Deduplicate ──
all_levels = deduplicate_levels(all_levels)

elapsed = time.time() - t_total

# Write output
outpath = os.path.join(OUT_DIR, "expansion_8001_9000.txt")
with open(outpath, 'w') as f:
    for l in all_levels:
        f.write(f"  {l},\n")

log(f"\n{'='*60}")
log(f"EXPANSION COMPLETE!")
log(f"  Batch 1 (29c, 5ext):       {len(b1)}")
log(f"  Batch 2 (29c hard, 4ext):  {len(b2)}")
log(f"  Batch 3 (29c extreme):     {len(b3)}")
log(f"  Batch 4 (29c nightmare):   {len(b4)}")
log(f"  Batch 5 (29c godlike):     {len(b5)}")
log(f"  TOTAL (deduped):            {len(all_levels)}")
log(f"  Time: {elapsed:.1f}s")
log(f"  Output: {outpath}")
