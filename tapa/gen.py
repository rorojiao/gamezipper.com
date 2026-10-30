#!/usr/bin/env python3
"""
Tapa level generator — R336 P0 rewrite (2026-10-25). CANONICAL SOURCE OF TRUTH.

WHY THIS FILE WAS REWRITTEN
---------------------------
The shipped level data was corrupt in THREE independent, separately-measured ways
(see the R336 sweep report; evidence scripts under
/mnt/data/home-junze-data/.hermes/cache/scratch/gz336/):

  1. The inline `const LEVELS=[...]` in tapa/index.html and tapa/levels.json
     were TWO DIFFERENT DATASETS. 0 of 30 solution grids were identical
     between them, and the inline clue grids did not describe their own
     solutions under ANY neighbour convention (0/30 under the standard
     clockwise ring, 0/30 under row-major).
  2. 120 of the 717 inline clue cells were ARITHMETICALLY IMPOSSIBLE — they
     demand more shaded neighbours than the cell physically has, e.g. "41"
     in a 3-neighbour corner, "4211111" (digit sum 11) in an 8-neighbour cell,
     "9" as a single digit (max possible is 8), "95" (digit sum 14).
     24 of 30 levels contain at least one such cell, so the shipped grid is
     UNSATISFIABLE as a Tapa puzzle.
  3. The old generator (tapa/build_levels.py) read the 8 neighbours in
     ROW-MAJOR order: (r-1,c-1) (r-1,c) (r-1,c+1) (r,c-1) (r,c+1) (r+1,c-1)
     (r+1,c) (r+1,c+1). That is not a ring — (r-1,c+1) and (r,c-1) are
     consecutive in that scan but are NOT adjacent around the cell, so a run
     can be counted across a gap that does not exist. The rule disagreed with
     the standard clockwise-ring rule on 353 of 714 clue cells (49%) across
     29 of 30 levels.

Because the engine's checkWin() is a SOLUTION-COMPARE (it compares the
player's grid against the stored `sol` for every playable cell), a player who
reasons correctly against a corrupt clue grid is permanently marked WRONG.
The levels were unwinnable by reasoning. That is the P0 this file fixes.

THE RULE (standard Tapa, per https://www.gmpuzzles.com/blog/tapa-rules-and-info/)
------------------------------------------------------------------------------------
  * A NUMBERED cell is white and describes the shaded cells among its 8
    surrounding neighbours.
  * The 8 neighbours form a RING, read CLOCKWISE from NW:
        NW N NE E SE S SW W  (and back to NW)
  * Off-grid neighbours count as UNSHADED and break a run.
  * A number is the MULTISET of the lengths of the shaded runs around it:
    "1" = one run of 1; "11" = two runs of 1; "12" = one run of 1 and one
    run of 2. The in-game tutorial says exactly this: "Multiple numbers like
    '1,2' mean separate runs".
  * "0" = no neighbour is shaded.
  * The shaded cells form ONE connected region and contain no 2x2 block.

THE PICTURE (what the player sees)
-----------------------------------
  '.'   undetermined cell — the player decides whether to shade it. The set
        of '.' cells contains BOTH the shaded cells and some white cells, so
        the player really has to work out which is which. (If every white
        cell were a numbered cell, the picture would be degenerate: "shade
        every blank" would win with zero reasoning — the Pitfall #84 shape.
        The generator therefore THINS the clue set, removing numbers while
        the level stays provably unique.)
  '0'   numbered cell, no shaded neighbour.
  digits numbered cell, the multiset of shaded run lengths around it.

THE 'sol' KEY
--------------
The engine reads `lv.sol` (tapa/index.html startLevel/checkWin/doHint) and
`lv.clue`. The old levels.json used the key `solution` instead, so the JSON
never matched what the game actually loads. This generator writes `sol`,
which is the key the engine uses, and the inline copy is injected from this
same file so the two can never drift.

VERIFICATION (every level, before it is written)
------------------------------------------------
  1. the stored solution satisfies its own clue grid (ring rule);
  2. no 2x2 shaded block; all shaded cells 4-connected;
  3. the level has EXACTLY ONE solution under its own rules, proven by an
     independent limit=2 solver. A budget hit is reported as UNPROVEN and
     the level is REJECTED, never shipped. Uniqueness is load-bearing
     because checkWin() is a solution-compare.
  4. degeneracy guard: at least 2 blank cells must be white in the solution
     and at least 2 must be shaded, so the level has real decision points.

Output: tapa/levels.json  (single source of truth)
"""
import json
import os
import random
import sys
import time
from collections import deque

SEED = 20260608
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'levels.json')

# clockwise from NW
RING = [(-1, -1), (-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1)]


# --------------------------------------------------------------------- rules
def ring_vals(rows, n, r, c):
    """The 8 ring neighbours of (r,c) in clockwise order, as 0/1."""
    out = []
    for dr, dc in RING:
        nr, nc = r + dr, c + dc
        out.append(1 if (0 <= nr < n and 0 <= nc < n and (rows[nr] >> nc) & 1) else 0)
    return out


def runs_from_vals(vals):
    """Maximal runs of 1s in the CYCLIC ring sequence."""
    if not any(vals):
        return []
    if all(vals):
        return [8]
    start = next(i for i in range(8) if vals[i] == 0)
    seq = [vals[(start + k) % 8] for k in range(8)]
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
    return runs


def clue_multiset(rows, n, r, c):
    return sorted(runs_from_vals(ring_vals(rows, n, r, c)))


def parse_clue(cell):
    if cell == '0':
        return []
    return sorted(int(x) for x in cell)


# ------------------------------------------------------------------ geometry
def rows_from_sol(sol, n):
    rows = []
    for r in range(n):
        m = 0
        for c in range(n):
            if sol[r][c]:
                m |= (1 << c)
        rows.append(m)
    return rows


def sol_from_rows(rows, n):
    return [[1 if (rows[r] >> c) & 1 else 0 for c in range(n)] for r in range(n)]


def has_2x2(rows, n):
    for r in range(n - 1):
        common = rows[r] & rows[r + 1]
        if common & (common >> 1):
            return True
    return False


def is_connected(rows, n):
    blacks = [(r, c) for r in range(n) for c in range(n) if (rows[r] >> c) & 1]
    if not blacks:
        return False
    seen = {blacks[0]}
    q = deque([blacks[0]])
    while q:
        r, c = q.popleft()
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and (rows[nr] >> nc) & 1 and (nr, nc) not in seen:
                seen.add((nr, nc))
                q.append((nr, nc))
    return len(seen) == len(blacks)


def build_clue_grid(rows, n):
    """FULL standard Tapa clue grid.

    '.' = undetermined cell (the player decides).
    '0' = white cell with no shaded neighbour.
    digits = white cell whose 8 RING neighbours contain runs of those
             lengths (sorted -> the clue is the MULTISET of run lengths,
             exactly what the in-game tutorial describes).

    This is the FULL grid: every white cell carries its clue. The puzzle is
    then made interesting by REMOVING some of those clues (thin_clue_grid)
    while keeping the level provably unique — the way published Tapa
    puzzles are made.
    """
    grid = []
    for r in range(n):
        row = []
        for c in range(n):
            if (rows[r] >> c) & 1:
                row.append('.')              # shaded cell, undetermined
            else:
                runs = runs_from_vals(ring_vals(rows, n, r, c))
                if not runs:
                    row.append('0')
                elif any(x > 9 for x in runs):
                    row.append('?')          # cannot be encoded -> reject level
                else:
                    row.append(''.join(str(x) for x in sorted(runs)))
        grid.append(row)
    return grid


def clue_matches_solution(rows, clue, n):
    """The solution must satisfy every clue in its own grid.

    '.' = undetermined: the solution may shade it or leave it white, so it
    imposes no constraint. A numbered cell must be white and its ring runs
    must match the clue.
    """
    for r in range(n):
        for c in range(n):
            cell = clue[r][c]
            if cell == '.':
                continue
            if (rows[r] >> c) & 1:
                return False
            if clue_multiset(rows, n, r, c) != parse_clue(cell):
                return False
    return True


def decision_points(rows, clue, n):
    """Degeneracy guard (Pitfall #84).

    Returns (blank_white_in_solution, blank_shaded_in_solution).
    A level where EVERY blank cell is shaded in the solution is degenerate:
    "shade every blank" would win it with no reasoning at all.
    """
    wb = bb = 0
    for r in range(n):
        for c in range(n):
            if clue[r][c] != '.':
                continue
            if (rows[r] >> c) & 1:
                bb += 1
            else:
                wb += 1
    return wb, bb


# --------------------------------------------------------------- the solver
def solve(clue, n, limit=2, node_budget=400000, time_budget=4.0):
    """Independent limit=2 solver: row-based bitmask DFS.

    Returns (solutions, exhausted). `solutions` is a list of row-mask lists.
    `exhausted` False means a budget was hit, so the solution count is only
    a LOWER BOUND and uniqueness is UNPROVEN -> the caller must reject the
    level, never ship it.
    """
    # forced white cells per row: numbered cells, plus the neighbours of '0'
    forced_white = [0] * n
    digit_clues = [[] for _ in range(n)]      # (c, want_multiset)
    for r in range(n):
        for c in range(n):
            cell = clue[r][c]
            if cell == '.':
                continue
            forced_white[r] |= (1 << c)
            if cell == '0':
                for dr, dc in RING:
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < n and 0 <= nc < n:
                        forced_white[nr] |= (1 << nc)
            else:
                digit_clues[r].append((c, parse_clue(cell)))

    # candidate row masks: any subset of the not-forced-white cells
    cand = []
    for r in range(n):
        allowed = ((1 << n) - 1) & ~forced_white[r]
        lst = []
        m = allowed
        while True:
            lst.append(m)
            if m == 0:
                break
            m = (m - 1) & allowed
        cand.append(lst)

    sols = []
    rows = [0] * n
    deadline = time.time() + time_budget
    nodes = [0]
    exhausted = [True]

    def blocks_ok(r):
        """no 2x2 all-shaded block spanning rows r-1 and r"""
        if r == 0:
            return True
        common = rows[r - 1] & rows[r]
        return not (common & (common >> 1))

    def rec(r):
        if len(sols) >= limit or not exhausted[0]:
            return
        nodes[0] += 1
        if nodes[0] > node_budget or time.time() > deadline:
            exhausted[0] = False
            return
        if r == n:
            # last row's numbered cells need rows n-2, n-1
            for (c, want) in digit_clues[n - 1]:
                if clue_multiset(rows, n, n - 1, c) != want:
                    return
            if is_connected(rows, n):
                sols.append(list(rows))
            return
        for m in cand[r]:
            rows[r] = m
            if blocks_ok(r):
                # the numbered cells of row r-1 become decidable once row r is set
                ok = True
                if r >= 1:
                    for (c, want) in digit_clues[r - 1]:
                        if clue_multiset(rows, n, r - 1, c) != want:
                            ok = False
                            break
                if ok:
                    rec(r + 1)
            if len(sols) >= limit or not exhausted[0]:
                break
        rows[r] = 0

    rec(0)
    return sols, exhausted[0]


# ----------------------------------------------------------------- thinning
def thin_clue_grid(rows, clue, n, rng, max_removed=None, per_try_budget=1.5):
    """Remove numbers from white cells to turn the full grid into a puzzle.

    A removed number becomes '.' (undetermined). We only keep a removal if
    the level STILL has exactly one solution under its own rules — so the
    player can always deduce the answer, and the answer is always the stored
    solution. Candidates are tried in random order; a removal whose
    uniqueness proof hits the budget is reverted (never guessed).
    """
    grid = [list(x) for x in clue]
    cands = [(r, c) for r in range(n) for c in range(n)
             if grid[r][c] not in ('.', '?')]
    rng.shuffle(cands)
    removed = 0
    for (r, c) in cands:
        if max_removed is not None and removed >= max_removed:
            break
        keep = grid[r][c]
        grid[r][c] = '.'
        if not clue_matches_solution(rows, grid, n):
            grid[r][c] = keep
            continue
        sols, exh = solve(grid, n, limit=2, time_budget=per_try_budget)
        if exh and len(sols) == 1 and sols[0] == rows:
            removed += 1
        else:
            grid[r][c] = keep
    return grid, removed


# ----------------------------------------------------------------- generation
def snake(n, density, rng):
    rows = [0] * n
    r, c = rng.randrange(n), rng.randrange(n)
    rows[r] |= (1 << c)
    target = max(3, int(n * n * density))
    d = rng.choice([(0, 1), (1, 0), (0, -1), (-1, 0)])
    for _ in range(target * 14):
        if rng.random() < 0.25:
            d = rng.choice([(0, 1), (1, 0), (0, -1), (-1, 0)])
        nr, nc = r + d[0], c + d[1]
        if 0 <= nr < n and 0 <= nc < n and not ((rows[nr] >> nc) & 1):
            rows[nr] |= (1 << nc)
            r, c = nr, nc
        elif rng.random() < 0.5:
            d = (-d[0], -d[1])
    return rows


def keep_largest_component(rows, n):
    seen = [[False] * n for _ in range(n)]
    comps = []
    for r in range(n):
        for c in range(n):
            if (rows[r] >> c) & 1 and not seen[r][c]:
                comp = []
                q = deque([(r, c)])
                seen[r][c] = True
                while q:
                    cr, cc = q.popleft()
                    comp.append((cr, cc))
                    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                        nr, nc = cr + dr, cc + dc
                        if 0 <= nr < n and 0 <= nc < n and (rows[nr] >> nc) & 1 and not seen[nr][nc]:
                            seen[nr][nc] = True
                            q.append((nr, nc))
                comps.append(comp)
    if not comps:
        return rows
    comps.sort(key=len, reverse=True)
    keep = set(comps[0])
    out = [0] * n
    for (r, c) in keep:
        out[r] |= (1 << c)
    return out


def remove_2x2(rows, n, rng):
    changed = True
    while changed:
        changed = False
        for r in range(n - 1):
            common = rows[r] & rows[r + 1]
            both = common & (common >> 1)
            if both:
                c = (both & -both).bit_length() - 1
                cr, cc = rng.choice([(r, c), (r + 1, c), (r, c + 1), (r + 1, c + 1)])
                rows[cr] &= ~(1 << cc)
                changed = True
                break
    return rows


def gen_level(n, density, rng, attempts=300, thin_budget=None):
    # The thinning step runs one uniqueness proof per removable cell, each
    # capped at `per_try_budget` (1.5 s) inside thin_clue_grid, so its cost
    # grows with the grid AREA: worst case n*n*1.5 s.
    #
    # The old flat 10.0 s guard was calibrated on the 5x5 tier and silently
    # rejected EVERY attempt at n=10 and n=12 (measured: 34-106 s per
    # attempt at n=12), so the `hard` and `expert` tiers could never produce
    # a single level -- the generator looped 300 times and returned an empty
    # catalog. Scale the guard with the area instead.
    #
    # This is a WALL-CLOCK guard only: correctness is enforced separately and
    # unconditionally by the independent re-proof of the shipped grid below
    # (unique solution + clue/solution coherence + no 2x2 + connected +
    # non-degenerate), so widening it cannot admit an under-verified level.
    if thin_budget is None:
        thin_budget = max(10.0, n * n * 1.5)
    for _ in range(attempts):
        rows = snake(n, density, rng)
        rows = keep_largest_component(rows, n)
        rows = remove_2x2(rows, n, rng)
        if has_2x2(rows, n) or not is_connected(rows, n):
            continue
        clue = build_clue_grid(rows, n)
        if any(cell == '?' for row in clue for cell in row):
            continue
        if not clue_matches_solution(rows, clue, n):
            continue

        # Turn the full clue grid into a puzzle: remove numbers, keeping
        # only removals that leave the level provably unique.
        t0 = time.time()
        thinned, removed = thin_clue_grid(rows, clue, n, rng)
        if time.time() - t0 > thin_budget:
            continue

        # final independent re-proof of the SHIPPED grid
        sols2, exh2 = solve(thinned, n, limit=2, time_budget=20.0)
        if not exh2 or len(sols2) != 1:
            continue
        if sols2[0] != rows:
            continue                      # the unique solution must be ours
        if not clue_matches_solution(rows, thinned, n):
            continue
        if has_2x2(rows, n) or not is_connected(rows, n):
            continue
        wb, bb = decision_points(rows, thinned, n)
        if wb < 2 or bb < 2:
            continue                      # degenerate
        return rows, thinned, removed
    return None


def build_tier(tier, n, count, density, seed):
    rng = random.Random(seed)
    out = []
    i = 0
    guard = 0
    while i < count and guard < count * 200:
        guard += 1
        got = gen_level(n, density, rng)
        if not got:
            continue
        rows, clue, removed = got
        i += 1
        out.append({
            'id': '%s-%02d' % (tier[:3].lower(), i),
            'tier': tier,
            'size': n,
            'sol': sol_from_rows(rows, n),
            'clue': clue,
        })
    return out


def main():
    tiers = [
        ('easy', 5, 8, 0.34),
        ('medium', 7, 8, 0.38),
        ('hard', 10, 8, 0.40),
        ('expert', 12, 6, 0.42),
    ]
    puzzles = []
    for tier, n, count, density in tiers:
        t0 = time.time()
        got = build_tier(tier, n, count, density, SEED + n)
        print('%-7s size=%-3d generated %d/%d  (%.1fs)' % (tier, n, len(got), count, time.time() - t0))
        if len(got) < count:
            print('  !! tier %s short by %d' % (tier, count - len(got)))
        puzzles += got
    print('Generated %d puzzles' % len(puzzles))

    ok = 0
    for p in puzzles:
        n = p['size']
        rows = rows_from_sol(p['sol'], n)
        assert clue_matches_solution(rows, p['clue'], n), p['id']
        assert not has_2x2(rows, n), p['id']
        assert is_connected(rows, n), p['id']
        sols, exh = solve(p['clue'], n, limit=2, time_budget=30.0)
        assert exh and len(sols) == 1 and sols[0] == rows, (p['id'], len(sols), exh)
        ok += 1
    print('Self-audit: %d/%d levels valid + provably unique' % (ok, len(puzzles)))

    with open(OUT, 'w') as f:
        json.dump(puzzles, f, indent=1)
    print('Saved %d to %s' % (len(puzzles), OUT))


if __name__ == '__main__':
    main()
