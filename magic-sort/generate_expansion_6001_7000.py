"""
Generate 1000 new levels for Magic Sort expansion: 6001-7000
Progressive difficulty: 22c → 23c → 24c → 25c NEW TIER
DFS-verified solvability with deduplication.
"""
import sys
import os
sys.path.insert(0, "/home/msdn/gamezipper.com/magic-sort")
from generate_levels import generate_level, generate_batch, deduplicate_levels
import time

OUT_DIR = "/home/msdn/gamezipper.com/magic-sort"

print("=" * 60, flush=True)
print("Magic Sort Expansion: 6001-7000 (1000 levels)", flush=True)
print("=" * 60, flush=True)

all_levels = []

# ── Batch 1: 6001-6150 (150 levels) — 22-color MASTER+ (3 extra, depth>=30) ──
print("\n[1/7] 6001-6150: 22-color MASTER+ (3 extra, depth>=30)", flush=True)
b1 = generate_batch(6001, 150, 22, 3400000, extra_tubes=3, time_limit=5.0, min_depth=30)
all_levels.extend(b1)
print(f"  Got: {len(b1)}/150", flush=True)

# ── Batch 2: 6151-6300 (150 levels) — 23-color NEW! (4 extra, depth>=22) ──
print("\n[2/7] 6151-6300: 23-color (4 extra, depth>=22) [NEW COLOR TIER!]", flush=True)
b2 = generate_batch(6151, 150, 23, 3500000, extra_tubes=4, time_limit=5.0, min_depth=22)
all_levels.extend(b2)
print(f"  Got: {len(b2)}/150", flush=True)

# ── Batch 3: 6301-6450 (150 levels) — 23-color hard (3 extra, depth>=25) ──
print("\n[3/7] 6301-6450: 23-color HARD (3 extra, depth>=25)", flush=True)
b3 = generate_batch(6301, 150, 23, 3600000, extra_tubes=3, time_limit=5.0, min_depth=25)
all_levels.extend(b3)
print(f"  Got: {len(b3)}/150", flush=True)

# ── Batch 4: 6451-6600 (150 levels) — 23-color extreme (3 extra, depth>=28) ──
print("\n[4/7] 6451-6600: 23-color EXTREME (3 extra, depth>=28)", flush=True)
b4 = generate_batch(6451, 150, 23, 3700000, extra_tubes=3, time_limit=6.0, min_depth=28)
all_levels.extend(b4)
print(f"  Got: {len(b4)}/150", flush=True)

# ── Batch 5: 6601-6750 (150 levels) — 24-color NEW! (4 extra, depth>=22) ──
print("\n[5/7] 6601-6750: 24-color (4 extra, depth>=22) [NEW COLOR TIER!]", flush=True)
b5 = generate_batch(6601, 150, 24, 3800000, extra_tubes=4, time_limit=5.0, min_depth=22)
all_levels.extend(b5)
print(f"  Got: {len(b5)}/150", flush=True)

# ── Batch 6: 6751-6900 (150 levels) — 24-color hard (3 extra, depth>=25) ──
print("\n[6/7] 6751-6900: 24-color HARD (3 extra, depth>=25)", flush=True)
b6 = generate_batch(6751, 150, 24, 3900000, extra_tubes=3, time_limit=6.0, min_depth=25)
all_levels.extend(b6)
print(f"  Got: {len(b6)}/150", flush=True)

# ── Batch 7: 6901-7000 (100 levels) — 25-color FINAL BOSS (4 extra, depth>=25) ──
print("\n[7/7] 6901-7000: 25-color APEX ULTIMATE (4 extra, depth>=25) [FINAL BOSS!]", flush=True)
b7 = generate_batch(6901, 100, 25, 4000000, extra_tubes=4, time_limit=6.0, min_depth=25)
all_levels.extend(b7)
print(f"  Got: {len(b7)}/100", flush=True)

# ── Deduplicate ──
all_levels = deduplicate_levels(all_levels)

# Write output
outpath = os.path.join(OUT_DIR, "expansion_6001_7000.txt")
with open(outpath, 'w') as f:
    for l in all_levels:
        f.write(f"  {l},\n")

print(f"\n{'='*60}", flush=True)
print(f"EXPANSION COMPLETE!", flush=True)
print(f"  Batch 1 (22c master+):  {len(b1)}", flush=True)
print(f"  Batch 2 (23c):          {len(b2)}", flush=True)
print(f"  Batch 3 (23c hard):     {len(b3)}", flush=True)
print(f"  Batch 4 (23c extreme):  {len(b4)}", flush=True)
print(f"  Batch 5 (24c):          {len(b5)}", flush=True)
print(f"  Batch 6 (24c hard):     {len(b6)}", flush=True)
print(f"  Batch 7 (25c apex):     {len(b7)}", flush=True)
print(f"  TOTAL (deduped):        {len(all_levels)}", flush=True)
print(f"  Output: {outpath}", flush=True)
