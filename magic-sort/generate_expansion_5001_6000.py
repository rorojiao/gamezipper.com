"""
Generate 1000 new levels for Magic Sort expansion: 5001-6000
Uses progressive difficulty: 20c hard -> 21c -> 22c
DFS-verified solvability with deduplication.
Optimized: generous extra_tubes for fast generation.
"""
import sys
import os
sys.path.insert(0, "/home/msdn/gamezipper.com/magic-sort")
from generate_levels import generate_level, generate_batch, deduplicate_levels
import time

OUT_DIR = "/home/msdn/gamezipper.com/magic-sort"

print("=" * 60, flush=True)
print("Magic Sort Expansion: 5001-6000 (1000 levels)", flush=True)
print("=" * 60, flush=True)

all_levels = []

# ── Batch 1: 5001-5150 (150 levels) — 20-color hard (3 extra, depth>=25) ──
print("\n[1/7] 5001-5150: 20-color HARD (3 extra, depth>=25)", flush=True)
b1 = generate_batch(5001, 150, 20, 2700000, extra_tubes=3, time_limit=4.0, min_depth=25)
all_levels.extend(b1)
print(f"  Got: {len(b1)}/150", flush=True)

# ── Batch 2: 5151-5300 (150 levels) — 21-color NEW! (4 extra, depth>=22) ──
print("\n[2/7] 5151-5300: 21-color (4 extra, depth>=22) [NEW COLOR TIER!]", flush=True)
b2 = generate_batch(5151, 150, 21, 2800000, extra_tubes=4, time_limit=4.0, min_depth=22)
all_levels.extend(b2)
print(f"  Got: {len(b2)}/150", flush=True)

# ── Batch 3: 5301-5450 (150 levels) — 21-color hard (3 extra, depth>=25) ──
print("\n[3/7] 5301-5450: 21-color HARD (3 extra, depth>=25)", flush=True)
b3 = generate_batch(5301, 150, 21, 2900000, extra_tubes=3, time_limit=4.0, min_depth=25)
all_levels.extend(b3)
print(f"  Got: {len(b3)}/150", flush=True)

# ── Batch 4: 5451-5600 (150 levels) — 21-color extreme (3 extra, depth>=28) ──
print("\n[4/7] 5451-5600: 21-color EXTREME (3 extra, depth>=28)", flush=True)
b4 = generate_batch(5451, 150, 21, 3000000, extra_tubes=3, time_limit=5.0, min_depth=28)
all_levels.extend(b4)
print(f"  Got: {len(b4)}/150", flush=True)

# ── Batch 5: 5601-5750 (150 levels) — 22-color NEW! (4 extra, depth>=22) ──
print("\n[5/7] 5601-5750: 22-color (4 extra, depth>=22) [NEW COLOR TIER!]", flush=True)
b5 = generate_batch(5601, 150, 22, 3100000, extra_tubes=4, time_limit=4.0, min_depth=22)
all_levels.extend(b5)
print(f"  Got: {len(b5)}/150", flush=True)

# ── Batch 6: 5751-5900 (150 levels) — 22-color hard (3 extra, depth>=25) ──
print("\n[6/7] 5751-5900: 22-color HARD (3 extra, depth>=25)", flush=True)
b6 = generate_batch(5751, 150, 22, 3200000, extra_tubes=3, time_limit=5.0, min_depth=25)
all_levels.extend(b6)
print(f"  Got: {len(b6)}/150", flush=True)

# ── Batch 7: 5901-6000 (100 levels) — 22-color ULTIMATE (3 extra, depth>=28) ──
print("\n[7/7] 5901-6000: 22-color ULTIMATE (3 extra, depth>=28) [FINAL BOSS!]", flush=True)
b7 = generate_batch(5901, 100, 22, 3300000, extra_tubes=3, time_limit=6.0, min_depth=28)
all_levels.extend(b7)
print(f"  Got: {len(b7)}/100", flush=True)

# ── Deduplicate ──
all_levels = deduplicate_levels(all_levels)

# Write output
outpath = os.path.join(OUT_DIR, "expansion_5001_6000.txt")
with open(outpath, 'w') as f:
    for l in all_levels:
        f.write(f"  {l},\n")

print(f"\n{'='*60}", flush=True)
print(f"EXPANSION COMPLETE!", flush=True)
print(f"  Batch 1 (20c hard):    {len(b1)}", flush=True)
print(f"  Batch 2 (21c):         {len(b2)}", flush=True)
print(f"  Batch 3 (21c hard):    {len(b3)}", flush=True)
print(f"  Batch 4 (21c extreme): {len(b4)}", flush=True)
print(f"  Batch 5 (22c):         {len(b5)}", flush=True)
print(f"  Batch 6 (22c hard):    {len(b6)}", flush=True)
print(f"  Batch 7 (22c ultimate):{len(b7)}", flush=True)
print(f"  After dedup:           {len(all_levels)}", flush=True)
print(f"  New total: 5000 + {len(all_levels)} = {5000 + len(all_levels)} levels", flush=True)
print(f"  Written to: {outpath}", flush=True)
