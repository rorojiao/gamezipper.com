"""
Generate 1000 new levels for Magic Sort expansion: 8001-9000
Writes output to expansion_8001_9000.txt and progress to gen_log_8001_9000.txt
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

# ── Batch 1: 8001-8150 (150 levels) — 29-color VOID MASTER+ (4 extra, depth>=25) ──
log("\n[1/7] 8001-8150: 29-color VOID MASTER+ (4 extra, depth>=25)")
b1 = generate_batch(8001, 150, 29, 4800000, extra_tubes=4, time_limit=8.0, min_depth=25)
all_levels.extend(b1)
log(f"  Got: {len(b1)}/150")

# ── Batch 2: 8151-8300 (150 levels) — 29-color extreme (3 extra, depth>=28) ──
log("\n[2/7] 8151-8300: 29-color EXTREME (3 extra, depth>=28)")
b2 = generate_batch(8151, 150, 29, 4900000, extra_tubes=3, time_limit=10.0, min_depth=28)
all_levels.extend(b2)
log(f"  Got: {len(b2)}/150")

# ── Batch 3: 8301-8450 (150 levels) — 29-color NIGHTMARE (3 extra, depth>=30) ──
log("\n[3/7] 8301-8450: 29-color NIGHTMARE (3 extra, depth>=30)")
b3 = generate_batch(8301, 150, 29, 5000000, extra_tubes=3, time_limit=10.0, min_depth=30)
all_levels.extend(b3)
log(f"  Got: {len(b3)}/150")

# ── Batch 4: 8451-8600 (150 levels) — 29-color ABYSS (3 extra, depth>=30) ──
log("\n[4/7] 8451-8600: 29-color ABYSS (3 extra, depth>=30)")
b4 = generate_batch(8451, 150, 29, 5100000, extra_tubes=3, time_limit=10.0, min_depth=30)
all_levels.extend(b4)
log(f"  Got: {len(b4)}/150")

# ── Batch 5: 8601-8750 (150 levels) — 29-color GODLIKE (3 extra, depth>=30) ──
log("\n[5/7] 8601-8750: 29-color GODLIKE (3 extra, depth>=30)")
b5 = generate_batch(8601, 150, 29, 5200000, extra_tubes=3, time_limit=10.0, min_depth=30)
all_levels.extend(b5)
log(f"  Got: {len(b5)}/150")

# ── Batch 6: 8751-8900 (150 levels) — 29-color COSMIC END (3 extra, depth>=32) ──
log("\n[6/7] 8751-8900: 29-color COSMIC END (3 extra, depth>=32)")
b6 = generate_batch(8751, 150, 29, 5300000, extra_tubes=3, time_limit=12.0, min_depth=32)
all_levels.extend(b6)
log(f"  Got: {len(b6)}/150")

# ── Batch 7: 8901-9000 (100 levels) — 29-color FINAL FRONTIER (3 extra, depth>=35) ──
log("\n[7/7] 8901-9000: 29-color FINAL FRONTIER (3 extra, depth>=35) [BOSS TIER]")
b7 = generate_batch(8901, 100, 29, 5400000, extra_tubes=3, time_limit=15.0, min_depth=35)
all_levels.extend(b7)
log(f"  Got: {len(b7)}/100")

# ── Deduplicate ──
all_levels = deduplicate_levels(all_levels)

# Write output
outpath = os.path.join(OUT_DIR, "expansion_8001_9000.txt")
with open(outpath, 'w') as f:
    for l in all_levels:
        f.write(f"  {l},\n")

log(f"\n{'='*60}")
log(f"EXPANSION COMPLETE!")
log(f"  Batch 1 (29c void+):       {len(b1)}")
log(f"  Batch 2 (29c extreme):     {len(b2)}")
log(f"  Batch 3 (29c nightmare):    {len(b3)}")
log(f"  Batch 4 (29c abyss):        {len(b4)}")
log(f"  Batch 5 (29c godlike):      {len(b5)}")
log(f"  Batch 6 (29c cosmic end):   {len(b6)}")
log(f"  Batch 7 (29c final):        {len(b7)}")
log(f"  TOTAL (deduped):            {len(all_levels)}")
log(f"  Output: {outpath}")
