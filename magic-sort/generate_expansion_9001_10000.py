"""
Generate 1000 new levels for Magic Sort expansion: 9001-10000
Writes output to expansion_9001_10000.txt and progress to gen_log_9001_10000.txt
Milestone: 10,000 levels total!
Further difficulty increase: fewer extra tubes, higher min_depth.
"""
import sys
import os
sys.path.insert(0, "/home/msdn/gamezipper.com/magic-sort")
from generate_levels import generate_level, generate_batch, deduplicate_levels
import time

OUT_DIR = "/home/msdn/gamezipper.com/magic-sort"
LOG_FILE = os.path.join(OUT_DIR, "gen_log_9001_10000.txt")

def log(msg):
    with open(LOG_FILE, 'a') as f:
        f.write(msg + "\n")
    print(msg, flush=True)

# Clear log
open(LOG_FILE, 'w').close()

log("=" * 60)
log("Magic Sort Expansion: 9001-10000 (1000 levels) — MILESTONE 10K!")
log("=" * 60)

all_levels = []
t_total = time.time()

# ── Batch 1: 9001-9200 (200 levels) — 29-color (4 extra, depth>=28) ──
log("\n[1/5] 9001-9200: 29-color (4 extra, depth>=28)")
b1 = generate_batch(9001, 200, 29, 5800000, extra_tubes=4, time_limit=10.0, min_depth=28)
all_levels.extend(b1)
log(f"  Got: {len(b1)}/200")

# ── Batch 2: 9201-9400 (200 levels) — 29-color (3 extra, depth>=28) ──
log("\n[2/5] 9201-9400: 29-color (3 extra, depth>=28)")
b2 = generate_batch(9201, 200, 29, 6000000, extra_tubes=3, time_limit=10.0, min_depth=28)
all_levels.extend(b2)
log(f"  Got: {len(b2)}/200")

# ── Batch 3: 9401-9600 (200 levels) — 29-color (3 extra, depth>=30) ──
log("\n[3/5] 9401-9600: 29-color (3 extra, depth>=30)")
b3 = generate_batch(9401, 200, 29, 6200000, extra_tubes=3, time_limit=12.0, min_depth=30)
all_levels.extend(b3)
log(f"  Got: {len(b3)}/200")

# ── Batch 4: 9601-9800 (200 levels) — 29-color (3 extra, depth>=32) ──
log("\n[4/5] 9601-9800: 29-color (3 extra, depth>=32)")
b4 = generate_batch(9601, 200, 29, 6400000, extra_tubes=3, time_limit=12.0, min_depth=32)
all_levels.extend(b4)
log(f"  Got: {len(b4)}/200")

# ── Batch 5: 9801-10000 (200 levels) — 29-color (3 extra, depth>=34) ──
log("\n[5/5] 9801-10000: 29-color (3 extra, depth>=34) GODLIKE FINAL")
b5 = generate_batch(9801, 200, 29, 6600000, extra_tubes=3, time_limit=14.0, min_depth=34)
all_levels.extend(b5)
log(f"  Got: {len(b5)}/200")

# ── Deduplicate ──
all_levels = deduplicate_levels(all_levels)

elapsed = time.time() - t_total

# Write output
outpath = os.path.join(OUT_DIR, "expansion_9001_10000.txt")
with open(outpath, 'w') as f:
    for l in all_levels:
        f.write(f"  {l},\n")

log(f"\n{'='*60}")
log(f"EXPANSION COMPLETE!")
log(f"  Batch 1 (29c, 4ext, d>=28):  {len(b1)}")
log(f"  Batch 2 (29c, 3ext, d>=28):  {len(b2)}")
log(f"  Batch 3 (29c, 3ext, d>=30):  {len(b3)}")
log(f"  Batch 4 (29c, 3ext, d>=32):  {len(b4)}")
log(f"  Batch 5 (29c, 3ext, d>=34):  {len(b5)}")
log(f"  TOTAL (deduped):              {len(all_levels)}")
log(f"  Time: {elapsed:.1f}s")
log(f"  Output: {outpath}")
log(f"  MILESTONE: {len(all_levels) + 9000} total levels!")
