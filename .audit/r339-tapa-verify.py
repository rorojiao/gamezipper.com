#!/usr/bin/env python3
"""R339 — post-merge verification of the new tapa catalog.

Runs FOUR INDEPENDENT checks against the merged catalog, in addition to the
R338 injector's own gate:

  1. clue/solution coherence  — every clue cell's multiset of ring runs must
     equal the multiset of digits in the clue (standard Tapa, clockwise ring
     from NW). Written from the RULE, not from the level's key names.
  2. arithmetic feasibility    — no clue cell may demand more shaded
     neighbours than the cell physically has.
  3. solvability               — the canonical solver (tapa/gen.py `solve`)
     must find AT LEAST ONE solution for every level's clue grid.
  4. uniqueness                — the same solver, run with limit=2, must
     report EXHAUSTIVE and exactly 1 solution.

Check 4 is the important one: a Tapa level with two solutions means a
correctly-reasoning player can be permanently marked WRONG by the engine's
solution-compare win predicate.

Usage: python3 .audit/r339-tapa-verify.py [levels.json]
"""
import json
import os
import sys

sys.path.insert(0, '/home/junze/gamezipper.com/tapa')
import gen as G

ROOT = '/home/junze/gamezipper.com'
RING = [(-1, -1), (-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1)]


def ring_runs(rows, n, r, c):
    """Runs of shaded cells around (r,c), read clockwise from NW."""
    ring = []
    for dr, dc in RING:
        rr, cc = r + dr, c + dc
        ring.append(1 if (0 <= rr < n and 0 <= cc < n and rows[rr][cc] == 1) else 0)
    if not any(ring):
        return []
    if all(ring):
        return [8]
    start = ring.index(0)
    seq = [ring[(start + k) % 8] for k in range(8)]
    runs, cur = [], 0
    for v in seq:
        if v:
            cur += 1
        else:
            if cur:
                runs.append(cur)
            cur = 0
    if cur:
        runs.append(cur)
    return sorted(runs)


def clue_digits(cell):
    s = str(cell).strip()
    if s == '0':
        return []
    return sorted(int(c) for c in s if c.isdigit())


def check_coherence(lv):
    n = lv['size']
    # lv['sol'] is the shipped 2D grid (rows of 0/1) — use it directly.
    # (G.rows_from_sol returns BITMASKS, not a 2D grid.)
    rows = lv['sol']
    clue = lv['clue']
    mismatch, impossible = [], []
    for r in range(n):
        for c in range(n):
            cl = clue[r][c]
            if cl in ('.', '#'):
                continue
            want = clue_digits(cl)
            got = ring_runs(rows, n, r, c)
            if got != want:
                mismatch.append((r, c, cl, want, got))
            phys = sum(1 for dr, dc in RING
                       if 0 <= r + dr < n and 0 <= c + dc < n)
            if sum(want) > phys:
                impossible.append((r, c, cl))
    return mismatch, impossible


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tapa/levels.json')
    levels = json.load(open(path))
    print('catalog: %s  levels=%d' % (path, len(levels)))

    n_coh = n_solv = n_uniq = 0
    bad = []
    for lv in levels:
        mism, imp = check_coherence(lv)
        n = lv['size']
        clue = lv['clue']
        sols, exh = G.solve(clue, n, limit=2, time_budget=60.0)
        ok_coh = not mism and not imp
        ok_solv = len(sols) >= 1
        ok_uniq = exh and len(sols) == 1
        n_coh += ok_coh
        n_solv += ok_solv
        n_uniq += ok_uniq
        if not (ok_coh and ok_solv and ok_uniq):
            bad.append((lv['id'], len(mism), len(imp), len(sols), exh))
        print('  %-9s n=%-3d coherent=%-5s solvable=%-5s unique=%-5s sols=%d exh=%s' %
              (lv['id'], n, ok_coh, ok_solv, ok_uniq, len(sols), exh))

    print()
    print('coherent  %d/%d' % (n_coh, len(levels)))
    print('solvable  %d/%d' % (n_solv, len(levels)))
    print('unique    %d/%d' % (n_uniq, len(levels)))
    if bad:
        print('BAD LEVELS:')
        for b in bad:
            print('   id=%s mism=%d impossible=%d sols=%d exh=%s' % b)
        sys.exit(1)
    print('VERDICT: PASS — every level coherent, solvable and provably unique')
    sys.exit(0)


if __name__ == '__main__':
    main()
