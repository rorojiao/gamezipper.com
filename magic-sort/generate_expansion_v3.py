"""
Generate 550 new levels using the proven generate_levels.py module.
Uses correct parameter name: min_solution_depth (not min_depth).
"""
from generate_levels import generate_level, generate_batch, generate_mixed_batch, deduplicate_levels
import time
import sys

outpath = "/home/msdn/gamezipper.com/magic-sort/expansion_2451_3000.txt"
all_levels = []

print("=" * 60, flush=True)
print("Magic Sort Expansion: 2451-3000 (550 levels)", flush=True)
print("=" * 60, flush=True)

# Batch 1: 2451-2550 - 16-color standard
print("\n[Batch 1/5] 2451-2550: 16-color (2 extra, depth>=18)", flush=True)
b1 = generate_batch(2451, 100, 16, 800000, extra_tubes=2, time_limit=3.0, min_depth=18)
all_levels.extend(b1)

# Batch 2: 2551-2650 - 15-color hard (1 extra tube)
print("\n[Batch 2/5] 2551-2650: 15-color hard (1 extra, depth>=20)", flush=True)
b2 = generate_batch(2551, 100, 15, 900000, extra_tubes=1, time_limit=4.0, min_depth=20)
all_levels.extend(b2)

# Batch 3: 2651-2750 - 16-color harder
print("\n[Batch 3/5] 2651-2750: 16-color (2 extra, depth>=22)", flush=True)
b3 = generate_batch(2651, 100, 16, 1000000, extra_tubes=2, time_limit=4.0, min_depth=22)
all_levels.extend(b3)

# Batch 4: 2751-2850 - Mixed
print("\n[Batch 4/5] 2751-2850: Mixed 15/16", flush=True)
b4 = generate_mixed_batch(2751, 100, 1100000, time_limit=4.0, min_depth=20)
all_levels.extend(b4)

# Batch 5: 2851-3000 - Grand Finale
print("\n[Batch 5/5] 2851-3000: Grand Finale (150 levels)", flush=True)
b5 = generate_mixed_batch(2851, 150, 1200000, time_limit=5.0, min_depth=22)
all_levels.extend(b5)

# Deduplicate
all_levels_str = deduplicate_levels(all_levels)
print(f"\nTotal: {len(all_levels_str)} unique levels", flush=True)

# Write output
with open(outpath, 'w') as f:
    for l in all_levels_str:
        f.write(f"  {l},\n")

print(f"Wrote {len(all_levels_str)} levels to {outpath}", flush=True)
print(f"New total: 2450 + {len(all_levels_str)} = {2450 + len(all_levels_str)} levels", flush=True)
