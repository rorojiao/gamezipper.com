"""
Generate 1000 new levels for Magic Sort expansion: 4001-5000
Uses progressive difficulty: 16c→17c→18c→19c→20c
DFS-verified solvability with deduplication.
"""
from generate_levels import generate_level, generate_batch, generate_mixed_batch, deduplicate_levels
import time
import os
import random

OUT_DIR = "/home/msdn/gamezipper.com/magic-sort"

print("=" * 60, flush=True)
print("Magic Sort Expansion: 4001-5000 (1000 levels)", flush=True)
print("=" * 60, flush=True)

all_levels = []

# ── Batch 1: 4001-4150 (150 levels) — 16-color hard (1 extra, depth>=25) ──
print("\n[1/7] 4001-4150: 16-color HARD (1 extra, depth>=25)", flush=True)
b1 = generate_batch(4001, 150, 16, 2000000, extra_tubes=1, time_limit=5.0, min_depth=25)
all_levels.extend(b1)
print(f"  Got: {len(b1)}/150", flush=True)

# ── Batch 2: 4151-4300 (150 levels) — 17-color standard (2 extra, depth>=22) ──
print("\n[2/7] 4151-4300: 17-color (2 extra, depth>=22)", flush=True)
b2 = generate_batch(4151, 150, 17, 2100000, extra_tubes=2, time_limit=5.0, min_depth=22)
all_levels.extend(b2)
print(f"  Got: {len(b2)}/150", flush=True)

# ── Batch 3: 4301-4450 (150 levels) — 18-color standard (2 extra, depth>=20) ──
print("\n[3/7] 4301-4450: 18-color (2 extra, depth>=20)", flush=True)
b3 = generate_batch(4301, 150, 18, 2200000, extra_tubes=2, time_limit=5.0, min_depth=20)
all_levels.extend(b3)
print(f"  Got: {len(b3)}/150", flush=True)

# ── Batch 4: 4451-4600 (150 levels) — 18-color hard (1 extra, depth>=28) ──
print("\n[4/7] 4451-4600: 18-color HARD (1 extra, depth>=28)", flush=True)
b4 = generate_batch(4451, 150, 18, 2300000, extra_tubes=1, time_limit=6.0, min_depth=28)
all_levels.extend(b4)
print(f"  Got: {len(b4)}/150", flush=True)

# ── Batch 5: 4601-4750 (150 levels) — 19-color NEW! (2 extra, depth>=25) ──
print("\n[5/7] 4601-4750: 19-color (2 extra, depth>=25) [NEW COLOR TIER!]", flush=True)
b5 = generate_batch(4601, 150, 19, 2400000, extra_tubes=2, time_limit=6.0, min_depth=25)
all_levels.extend(b5)
print(f"  Got: {len(b5)}/150", flush=True)

# ── Batch 6: 4751-4900 (150 levels) — 19-color hard (2 extra, depth>=30) ──
print("\n[6/7] 4751-4900: 19-color HARD (2 extra, depth>=30)", flush=True)
b6 = generate_batch(4751, 150, 19, 2500000, extra_tubes=2, time_limit=8.0, min_depth=30)
all_levels.extend(b6)
print(f"  Got: {len(b6)}/150", flush=True)

# ── Batch 7: 4901-5000 (100 levels) — 20-color ULTIMATE (3 extra, depth>=30) ──
print("\n[7/7] 4901-5000: 20-color ULTIMATE (3 extra, depth>=30) [FINAL BOSS!]", flush=True)
b7 = generate_batch(4901, 100, 20, 2600000, extra_tubes=3, time_limit=10.0, min_depth=30)
all_levels.extend(b7)
print(f"  Got: {len(b7)}/100", flush=True)

# ── Deduplicate ──
all_levels = deduplicate_levels(all_levels)
total_before = len(all_levels)

# Write output
outpath = os.path.join(OUT_DIR, "expansion_4001_5000.txt")
with open(outpath, 'w') as f:
    for l in all_levels:
        f.write(f"  {l},\n")

print(f"\n{'='*60}", flush=True)
print(f"EXPANSION COMPLETE!", flush=True)
print(f"  Batch 1 (16c hard): {len(b1)}", flush=True)
print(f"  Batch 2 (17c):      {len(b2)}", flush=True)
print(f"  Batch 3 (18c):      {len(b3)}", flush=True)
print(f"  Batch 4 (18c hard): {len(b4)}", flush=True)
print(f"  Batch 5 (19c):      {len(b5)}", flush=True)
print(f"  Batch 6 (19c hard): {len(b6)}", flush=True)
print(f"  Batch 7 (20c):      {len(b7)}", flush=True)
print(f"  After dedup:        {len(all_levels)}", flush=True)
print(f"  New total: 4000 + {len(all_levels)} = {4000 + len(all_levels)} levels", flush=True)
print(f"  Written to: {outpath}", flush=True)
