"""
Generate 1000 new levels for Magic Sort expansion: 7001-8000
Writes output to expansion_7001_8000.txt and progress to gen_log.txt
"""
import sys
import os
sys.path.insert(0, "/home/msdn/gamezipper.com/magic-sort")
from generate_levels import generate_level, generate_batch, deduplicate_levels
import time

OUT_DIR = "/home/msdn/gamezipper.com/magic-sort"
LOG_FILE = os.path.join(OUT_DIR, "gen_log_7001_8000.txt")

def log(msg):
    with open(LOG_FILE, 'a') as f:
        f.write(msg + "\n")
    print(msg, flush=True)

# Clear log
open(LOG_FILE, 'w').close()

log("=" * 60)
log("Magic Sort Expansion: 7001-8000 (1000 levels)")
log("=" * 60)

all_levels = []

# ── Batch 1: 7001-7150 (150 levels) — 25-color APEX ETERNAL+ (3 extra, depth>=30) ──
log("\n[1/7] 7001-7150: 25-color APEX ETERNAL+ (3 extra, depth>=30)")
b1 = generate_batch(7001, 150, 25, 4100000, extra_tubes=3, time_limit=6.0, min_depth=30)
all_levels.extend(b1)
log(f"  Got: {len(b1)}/150")

# ── Batch 2: 7151-7300 (150 levels) — 26-color NEW! (4 extra, depth>=22) ──
log("\n[2/7] 7151-7300: 26-color (4 extra, depth>=22) [NEW COLOR TIER!]")
b2 = generate_batch(7151, 150, 26, 4200000, extra_tubes=4, time_limit=6.0, min_depth=22)
all_levels.extend(b2)
log(f"  Got: {len(b2)}/150")

# ── Batch 3: 7301-7450 (150 levels) — 26-color hard (3 extra, depth>=25) ──
log("\n[3/7] 7301-7450: 26-color HARD (3 extra, depth>=25)")
b3 = generate_batch(7301, 150, 26, 4300000, extra_tubes=3, time_limit=7.0, min_depth=25)
all_levels.extend(b3)
log(f"  Got: {len(b3)}/150")

# ── Batch 4: 7451-7600 (150 levels) — 26-color extreme (3 extra, depth>=28) ──
log("\n[4/7] 7451-7600: 26-color EXTREME (3 extra, depth>=28)")
b4 = generate_batch(7451, 150, 26, 4400000, extra_tubes=3, time_limit=7.0, min_depth=28)
all_levels.extend(b4)
log(f"  Got: {len(b4)}/150")

# ── Batch 5: 7601-7750 (150 levels) — 27-color NEW! (4 extra, depth>=22) ──
log("\n[5/7] 7601-7750: 27-color (4 extra, depth>=22) [NEW COLOR TIER!]")
b5 = generate_batch(7601, 150, 27, 4500000, extra_tubes=4, time_limit=7.0, min_depth=22)
all_levels.extend(b5)
log(f"  Got: {len(b5)}/150")

# ── Batch 6: 7751-7900 (150 levels) — 28-color NEW! (5 extra, depth>=20) ──
log("\n[6/7] 7751-7900: 28-color (5 extra, depth>=20) [NEW COLOR TIER!]")
b6 = generate_batch(7751, 150, 28, 4600000, extra_tubes=5, time_limit=8.0, min_depth=20)
all_levels.extend(b6)
log(f"  Got: {len(b6)}/150")

# ── Batch 7: 7901-8000 (100 levels) — 29-color FINAL BOSS (5 extra, depth>=22) ──
log("\n[7/7] 7901-8000: 29-color COSMIC APEX (5 extra, depth>=22) [MAX COLOR!]")
b7 = generate_batch(7901, 100, 29, 4700000, extra_tubes=5, time_limit=10.0, min_depth=22)
all_levels.extend(b7)
log(f"  Got: {len(b7)}/100")

# ── Deduplicate ──
all_levels = deduplicate_levels(all_levels)

# Write output
outpath = os.path.join(OUT_DIR, "expansion_7001_8000.txt")
with open(outpath, 'w') as f:
    for l in all_levels:
        f.write(f"  {l},\n")

log(f"\n{'='*60}")
log(f"EXPANSION COMPLETE!")
log(f"  Batch 1 (25c apex+):   {len(b1)}")
log(f"  Batch 2 (26c):          {len(b2)}")
log(f"  Batch 3 (26c hard):     {len(b3)}")
log(f"  Batch 4 (26c extreme):  {len(b4)}")
log(f"  Batch 5 (27c):          {len(b5)}")
log(f"  Batch 6 (28c):          {len(b6)}")
log(f"  Batch 7 (29c cosmic):   {len(b7)}")
log(f"  TOTAL (deduped):        {len(all_levels)}")
log(f"  Output: {outpath}")
