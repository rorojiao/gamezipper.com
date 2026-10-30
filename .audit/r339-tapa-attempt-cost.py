#!/usr/bin/env python3
"""R339 — measure the TRUE cost of a full gen_level attempt at n=10 / n=12.

This measures each stage separately, with NO thin_budget rejection, so we can
see exactly which stage is over budget and by how much. The fix then targets
that stage with evidence instead of a guess.

Usage: python3 .audit/r339-tapa-attempt-cost.py [10 12]
"""
import random
import sys
import time

sys.path.insert(0, '/home/junze/gamezipper.com/tapa')
import gen as G

DENS = {5: 0.34, 7: 0.38, 10: 0.40, 12: 0.42}


def main():
    sizes = [int(x) for x in sys.argv[1:]] or [10, 12]
    for n in sizes:
        d = DENS[n]
        rng = random.Random(G.SEED + n)
        print('=== n=%d density=%.2f ===' % (n, d), flush=True)
        for attempt in range(3):
            t_all = time.time()
            rows = G.snake(n, d, rng)
            rows = G.keep_largest_component(rows, n)
            rows = G.remove_2x2(rows, n, rng)
            if G.has_2x2(rows, n) or not G.is_connected(rows, n):
                print('  attempt %d: snake rejected (2x2/disconnected)' % attempt, flush=True)
                continue
            clue = G.build_clue_grid(rows, n)
            if any(c == '?' for row in clue for c in row):
                print('  attempt %d: clue has ?' % attempt, flush=True)
                continue
            if not G.clue_matches_solution(rows, clue, n):
                print('  attempt %d: full clue mismatch' % attempt, flush=True)
                continue

            t = time.time()
            thinned, removed = G.thin_clue_grid(rows, clue, n, random.Random(4242))
            t_thin = time.time() - t

            t = time.time()
            sols, exh = G.solve(thinned, n, limit=2, time_budget=300.0)
            t_final = time.time() - t

            wb, bb = G.decision_points(rows, thinned, n)
            print('  attempt %d: thin=%.1fs (removed %d) | final solve %.1fs '
                  'sols=%d exh=%s | decision white=%d shaded=%d | total %.1fs'
                  % (attempt, t_thin, removed, t_final, len(sols), exh, wb, bb,
                     time.time() - t_all), flush=True)


if __name__ == '__main__':
    main()
