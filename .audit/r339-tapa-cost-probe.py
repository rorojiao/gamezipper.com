#!/usr/bin/env python3
"""R339 — cost probe for the tapa generator's thinning step at n=10 / n=12.

WHY
---
`tapa/gen.py::gen_level` rejects any attempt whose THINNING step took longer
than `thin_budget=10.0` seconds:

    t0 = time.time()
    thinned, removed = thin_clue_grid(rows, clue, n, rng)
    if time.time() - t0 > thin_budget:
        continue                      # <- attempt discarded

`thin_clue_grid` runs a uniqueness proof PER removable cell, each with a
`per_try_budget=1.5` second cap. For an n x n grid there are up to n*n
removable cells, so the worst-case thinning cost is O(n^2 * 1.5) seconds:
   n=10  -> 150 s   (vs a 10 s acceptance budget)
   n=12  -> 216 s   (vs a 10 s acceptance budget)

If a single solve at that size costs more than ~0.1 s, the budget can NEVER
be met and the tier silently yields an empty catalog. This probe measures the
real cost so the fix is evidence-based rather than a guess.

Usage: python3 .audit/r339-tapa-cost-probe.py [10 12]
"""
import random
import sys
import time

sys.path.insert(0, '/home/junze/gamezipper.com/tapa')
import gen as G


def probe(n, density):
    rng = random.Random(G.SEED + n)
    print('--- n=%d density=%.2f ---' % (n, density), flush=True)

    rows = G.snake(n, density, rng)
    rows = G.keep_largest_component(rows, n)
    rows = G.remove_2x2(rows, n, rng)
    if G.has_2x2(rows, n) or not G.is_connected(rows, n):
        print('  snake unusable (2x2 / disconnected) — resampling', flush=True)
        return

    t = time.time()
    clue = G.build_clue_grid(rows, n)
    t_clue = time.time() - t
    print('  build_clue_grid      %.3fs' % t_clue, flush=True)

    t = time.time()
    ok = G.clue_matches_solution(rows, clue, n)
    t_match = time.time() - t
    print('  clue_matches (full)  %.3fs -> %s' % (t_match, ok), flush=True)

    # single full-grid solve cost (the uniqueness proof the thinner repeats)
    t = time.time()
    sols, exh = G.solve(clue, n, limit=2, time_budget=60.0)
    t_solve = time.time() - t
    print('  solve(full grid)     %.3fs -> sols=%d exh=%s' % (t_solve, len(sols), exh), flush=True)

    # how many removable cells does the full grid have?
    cands = sum(1 for r in range(n) for c in range(n) if clue[r][c] not in ('.', '?'))
    print('  removable cells      %d  (worst-case thin = %d * per_try_budget)'
          % (cands, cands), flush=True)
    print('  thin_budget=%.1fs acceptance vs worst-case %.0fs'
          % (10.0, cands * 1.5), flush=True)

    # measured thinning cost on a throwaway rng (this is the real number)
    t = time.time()
    thinned, removed = G.thin_clue_grid(rows, clue, n, random.Random(1234))
    t_thin = time.time() - t
    print('  thin_clue_grid       %.3fs  removed=%d  -> %s'
          % (t_thin, removed, 'WITHIN budget' if t_thin <= 10.0 else 'EXCEEDS budget'), flush=True)


if __name__ == '__main__':
    sizes = [int(x) for x in sys.argv[1:]] or [10, 12]
    dens = {10: 0.40, 12: 0.42}
    for n in sizes:
        probe(n, dens.get(n, 0.40))
