#!/usr/bin/env python3
"""R339 — timing probe for the canonical tapa generator (gen.py), one level per size."""
import os
import sys
import time
import random

sys.path.insert(0, '/home/junze/gamezipper.com/tapa')
import gen as G


def main():
    sizes = [(5, 8, 0.34), (7, 8, 0.38), (10, 8, 0.40), (12, 6, 0.42)]
    for n, count, density in sizes:
        rng = random.Random(G.SEED + n)
        t0 = time.time()
        got = G.gen_level(n, density, rng)
        dt = time.time() - t0
        if got:
            rows, clue, removed = got
            wb, bb = G.decision_points(rows, clue, n)
            print('n=%-3d OK  %.1fs  removed=%d  blanks white=%d shaded=%d' % (n, dt, removed, wb, bb))
        else:
            print('n=%-3d FAILED after %.1fs' % (n, dt))
        sys.stdout.flush()


if __name__ == '__main__':
    main()
