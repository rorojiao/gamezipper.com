#!/usr/bin/env python3
# Uniqueness gate (limit=2) for akichiwake variant:
# rules: all-white connected AND all-black connected; each clue cell (r,c,v):
# v = number of 4-neighbors with same color as clue cell.
# Color-complement symmetry => unique-up-to-symmetry == exactly 2 raw solutions.
import json, sys, time, os

levels = json.load(open(os.path.join(os.path.dirname(__file__), 'levels.json')))['levels']
fail = 0

def verify_level(lv):
    R, C = lv['rows'], lv['cols']
    N = R * C
    clue = {}
    for cl in lv['clues']:
        clue[cl['r'] * C + cl['c']] = cl['v']
    sol = [row[:] for row in lv['solution']]
    # brute-force backtracking cell-by-cell with pruning
    cnt = 0
    cap = 3  # stop after 3 to distinguish 2 vs ambiguous
    t0 = time.time()
    grid = [-1] * N
    nbrs = [[] for _ in range(N)]
    for r in range(R):
        for c in range(C):
            i = r * C + c
            for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < R and 0 <= nc < C:
                    nbrs[i].append(nr * C + nc)

    def connected(color):
        cells = [i for i in range(N) if grid[i] == color]
        if not cells:
            return False
        seen = {cells[0]}
        q = [cells[0]]
        while q:
            u = q.pop()
            for v in nbrs[u]:
                if grid[v] == color and v not in seen:
                    seen.add(v); q.append(v)
        return len(seen) == len(cells)

    def check_full(i):
        # all neighbors of i assigned AND i assigned -> verify clue at i
        g = grid[i]
        same = 0
        for v in nbrs[i]:
            if grid[v] == g:
                same += 1
            elif grid[v] == -1:
                return True
        return clue.get(i, same) == same

    def rec(i, remaining):
        nonlocal cnt
        if cnt >= cap or time.time() - t0 > 60:
            return
        if i == N:
            if connected(0) and connected(1):
                cnt += 1
            return
        for color in (0, 1):
            grid[i] = color
            ok = True
            # prune: clue at i and any neighbor-of-i whose assignment set just closed
            if i in clue:
                same = sum(1 for v in nbrs[i] if grid[v] == color)
                unk = sum(1 for v in nbrs[i] if grid[v] == -1)
                if same > clue[i] or same + unk < clue[i]:
                    ok = False
            if ok:
                for v in nbrs[i]:  # v<i neighbors now fully determined
                    if v < i and v in clue and not check_full(v):
                        ok = False; break
            # parity prune: both colors must remain possible-connected-lite (skip)
            if ok:
                rec(i + 1, remaining)
            grid[i] = -1
            if cnt >= cap:
                return

    rec(0, N)
    dt = time.time() - t0
    for i in range(N):
        grid[i] = sol[i // C][i % C]
    ok_stored = all(check_full(i) for i in range(N) if i in clue) and connected(0) and connected(1)
    return cnt, ok_stored, dt

fail = 0
for lv in levels:
    cnt, ok_stored, dt = verify_level(lv)
    verdict = 'PASS' if cnt == 2 and ok_stored else ('AMBIG' if cnt >= 2 else 'NONE')
    if cnt != 2 or not ok_stored:
        fail += 1
    print(f"L{lv['level']:>2} {lv['rows']}x{lv['cols']} clues={len(lv['clues'])} raw_solutions={'>=3' if cnt>=3 else cnt} stored_valid={ok_stored} ({dt:.1f}s) {verdict}")
print(f"\nunique-up-to-color-complement: {'YES' if fail==0 else 'NO'} ({len(levels)-fail}/{len(levels)})")
sys.exit(0 if fail == 0 else 1)
