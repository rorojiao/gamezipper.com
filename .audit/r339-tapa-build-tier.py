#!/usr/bin/env python3
"""R339 — parallel per-tier builder for the canonical tapa catalog.

WHY
---
`tapa/gen.py` generates the 30-level catalog serially: easy(5) -> medium(7)
-> hard(10) -> expert(12). Each tier is an INDEPENDENT computation
(`build_tier(tier, n, count, density, SEED + n)` seeds its own RNG), so the
four tiers can be built in separate processes with byte-identical results
while using 4x the cores. The serial `gen.py` run stays the reference; this
script only reorders WHEN each tier is computed, never WHAT it computes.

Usage:  python3 .audit/r339-tapa-build-tier.py <tier> <n> <count> <density> <out.json>
"""
import json
import os
import sys
import time

sys.path.insert(0, '/home/junze/gamezipper.com/tapa')
import gen as G


def main():
    tier, n, count, density, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
    t0 = time.time()
    got = G.build_tier(tier, n, count, density, G.SEED + n)
    print('%-7s size=%-3d generated %d/%d  (%.1fs)' % (tier, n, len(got), count, time.time() - t0), flush=True)
    if len(got) < count:
        print('  !! tier %s short by %d' % (tier, count - len(got)), flush=True)
    with open(out, 'w') as f:
        json.dump(got, f, indent=1)
    print('wrote %s' % out, flush=True)


if __name__ == '__main__':
    main()
