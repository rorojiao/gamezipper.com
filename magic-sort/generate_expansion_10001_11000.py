"""
Generate 1000 new levels for Magic Sort expansion: 10001-11000
Writes output to expansion_10001_11000.txt and progress to gen_log_10001_11000.txt
Milestone: 11,000 levels total!
Continuing difficulty: 29-color with fewer extra tubes and higher min_depth.
Estimated runtime: ~80-100 minutes (10K already at 29-color, dialing back depth for feasibility)
"""
import sys
import os
sys.path.insert(0, "/home/msdn/gamezipper.com/magic-sort")
from generate_levels import generate_level, generate_batch, deduplicate_levels
import time

OUT_DIR = "/home/msdn/gamezipper.com/magic-sort"
LOG_FILE = os.path.join(OUT_DIR, "gen_log_10001_11000.txt")

def log(msg):
    with open(LOG_FILE, 'a') as f:
        f.write(msg + "\n")
    print(msg, flush=True)

# Clear log
open(LOG_FILE, 'w').close()

log("=" * 60)
log("Magic Sort Expansion: 10001-11000 (1000 levels) — MILESTONE 11K!")
log("=" * 60)

all_levels = []
t_total = time.time()

# ── Batch 1: 10001-10200 (200 levels) — 29-color (3 extra, depth>=24) ──
log("\n[1/5] 10001-10200: 29-color (3 extra, depth>=24)")
b1 = generate_batch(10001, 200, 29, 7000000, extra_tubes=3, time_limit=8.0, min_depth=24)
all_levels.extend(b1)
log(f"  Got: {len(b1)}/200")

# ── Batch 2: 10201-10400 (200 levels) — 29-color (2 extra, depth>=24) ──
log("\n[2/5] 10201-10400: 29-color (2 extra, depth>=24)")
b2 = generate_batch(10201, 200, 29, 7200000, extra_tubes=2, time_limit=8.0, min_depth=24)
all_levels.extend(b2)
log(f"  Got: {len(b2)}/200")

# ── Batch 3: 10401-10600 (200 levels) — 29-color (2 extra, depth>=26) ──
log("\n[3/5] 10401-10600: 29-color (2 extra, depth>=26)")
b3 = generate_batch(10401, 200, 29, 7400000, extra_tubes=2, time_limit=10.0, min_depth=26)
all_levels.extend(b3)
log(f"  Got: {len(b3)}/200")

# ── Batch 4: 10601-10800 (200 levels) — 29-color (2 extra, depth>=28) ──
log("\n[4/5] 10601-10800: 29-color (2 extra, depth>=28)")
b4 = generate_batch(10601, 200, 29, 7600000, extra_tubes=2, time_limit=12.0, min_depth=28)
all_levels.extend(b4)
log(f"  Got: {len(b4)}/200")

# ── Batch 5: 10801-11000 (200 levels) — 29-color (2 extra, depth>=30) ──
log("\n[5/5] 10801-11000: 29-color (2 extra, depth>=30) ELITE")
b5 = generate_batch(10801, 200, 29, 7800000, extra_tubes=2, time_limit=14.0, min_depth=30)
all_levels.extend(b5)
log(f"  Got: {len(b5)}/200")

# ── Deduplicate ──
all_levels = deduplicate_levels(all_levels)

elapsed = time.time() - t_total

# Write output
outpath = os.path.join(OUT_DIR, "expansion_10001_11000.txt")
with open(outpath, 'w') as f:
    for l in all_levels:
        f.write(f"  {l},\n")

log(f"\n{'='*60}")
log(f"EXPANSION COMPLETE!")
log(f"  Batch 1 (29c, 3ext, d>=24):  {len(b1)}")
log(f"  Batch 2 (29c, 2ext, d>=24):  {len(b2)}")
log(f"  Batch 3 (29c, 2ext, d>=26):  {len(b3)}")
log(f"  Batch 4 (29c, 2ext, d>=28):  {len(b4)}")
log(f"  Batch 5 (29c, 2ext, d>=30):  {len(b5)}")
log(f"  TOTAL (deduped):              {len(all_levels)}")
log(f"  Time: {elapsed:.1f}s")
log(f"  Output: {outpath}")
log(f"  MILESTONE: {len(all_levels) + 10000} total levels!")
