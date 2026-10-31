#!/usr/bin/env python3
"""Kurodoku catalog generator (R338) — band-targeted, monotonic difficulty ramp.

TRACKED CANONICAL GENERATOR. The previous generators lived only as untracked
dev artifacts (repo .gitignore excludes *.py except scripts/ and magic-sort/),
so the missing edge rule could silently come back. This file is the tracked
source of truth for regenerating kurodoko/levels_final.json + the inline
LEVELS array in kurodoko/index.html.

REGENERATE:
    cd /home/junze/gamezipper.com
    for t in Beginner Easy Medium Hard Expert; do
      python3 scripts/kurodoko-gen.py $t > /tmp/g-$t.json
    done
    # then reassemble + re-verify with kurodoko/verify_independent.js


v3 sampled hint vectors uniformly, which produced a NON-MONOTONIC difficulty
ramp (Expert averaged fewer blacks than Hard). v4 constrains the TOTAL BLACK
COUNT per tier to a band, so the ramp is monotonic by construction.

Black count is fully determined by the hint vector:
    blacks = C*R - sum(row_hints)  ==  C*R - sum(col_hints)
so hitting a black band = hitting a hint-sum band. We sample row_hints from
the band, then sample col_hints conditioned on the SAME sum (so the puzzle is
consistent), then count solutions with a limit-2 counter under the FULL
advertised rule set:
    row/col white counts + no edge-adjacent blacks + no 2x2 black + white connected
Only a level with EXACTLY ONE solution is accepted. A search that exhausts its
budget is UNPROVEN and is skipped (never counted as unique or as zero).
"""
import json, random, sys, time

def masks_for(C, k):
    out = []
    def rec(pos, left, m):
        if left == 0: out.append(m); return
        for p in range(pos, C): rec(p + 2, left - 1, m | (1 << p))
    rec(0, k, 0)
    return out

def white_connected(g, R, C):
    whites = [(r, c) for r in range(R) for c in range(C) if not g[r][c]]
    if not whites: return False
    seen = {whites[0]}; st = [whites[0]]
    while st:
        r, c = st.pop()
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C and not g[nr][nc] and (nr, nc) not in seen:
                seen.add((nr, nc)); st.append((nr, nc))
    return len(seen) == len(whites)

def solve_count(R, C, rh, ch, limit=2, budget=500000):
    bpr = [C - rh[r] for r in range(R)]
    bpc = [R - ch[c] for c in range(C)]
    if any(b < 0 or b > (C + 1)//2 for b in bpr): return 0, True, None
    if any(b < 0 or b > (R + 1)//2 for b in bpc): return 0, True, None
    if sum(bpr) != sum(bpc): return 0, True, None
    rowopts = [masks_for(C, bpr[r]) for r in range(R)]
    if any(not o for o in rowopts): return 0, True, None
    cnt = 0; bud = [budget]; first = [None]
    def rec(r, chosen, colb):
        nonlocal cnt
        if cnt >= limit or bud[0] <= 0: return
        bud[0] -= 1
        if r == R:
            for c in range(C):
                if colb[c] != bpc[c]: return
            g = [[1 if (chosen[rr] >> cc) & 1 else 0 for cc in range(C)] for rr in range(R)]
            if white_connected(g, R, C):
                cnt += 1
                if first[0] is None: first[0] = g
            return
        prev = chosen[-1] if chosen else 0
        rem = R - 1 - r
        for m in rowopts[r]:
            if r > 0:
                if m & prev: continue
                if any((prev >> c) & 1 and (prev >> (c+1)) & 1 and (m >> c) & 1 and (m >> (c+1)) & 1
                       for c in range(C - 1)): continue
            nb = colb[:]; ok = True
            for c in range(C):
                if (m >> c) & 1:
                    nb[c] += 1
                    if nb[c] > bpc[c]: ok = False; break
            if not ok: continue
            good = True
            for c in range(C):
                need = bpc[c] - nb[c]
                if need > (rem + 1)//2: good = False; break
                if need > 0:
                    cap = (rem//2 + 1) if not ((m >> c) & 1) else ((rem - 1)//2 + 1)
                    if need > cap: good = False; break
            if not good: continue
            rec(r + 1, chosen + [m], nb)
            if cnt >= limit or bud[0] <= 0: return
    rec(0, [], [0]*C)
    return cnt, bud[0] > 0, first[0]

def sample_hints_band(R, C, rng, blk_lo, blk_hi):
    """Sample row_hints/col_hints whose TOTAL BLACK COUNT lands in [blk_lo, blk_hi]."""
    total_cells = R * C
    lo_sum = total_cells - blk_hi   # min whites
    hi_sum = total_cells - blk_lo   # max whites
    for _ in range(4000):
        b = rng.randint(blk_lo, blk_hi)
        s = total_cells - b
        # per-line white counts: at least floor((C+1)/2)... actually max blacks per line
        maxblk_line = (C + 1) // 2
        minw_line = C - maxblk_line
        rh = []
        left = s
        ok = True
        for i in range(R):
            rem_lines = R - i
            lo = max(minw_line, left - (rem_lines - 1) * C)
            hi = min(C, left - (rem_lines - 1) * minw_line)
            if lo > hi: ok = False; break
            v = rng.randint(lo, hi)
            rh.append(v); left -= v
        if not ok or left != 0: continue
        ch = []
        left = s
        for i in range(C):
            rem_lines = C - i
            lo = max(R - (R + 1)//2, left - (rem_lines - 1) * R)
            hi = min(R, left - (rem_lines - 1) * (R - (R + 1)//2))
            if lo > hi: ok = False; break
            v = rng.randint(lo, hi)
            ch.append(v); left -= v
        if not ok or left != 0: continue
        return rh, ch
    return None, None

# tier, idx, R, C, count, black band, stars
TIERS = [
    ("Beginner", 0, 5, 5, 6, (3, 4),    [100, 200, 300]),
    ("Easy",     1, 6, 6, 6, (5, 7),    [144, 288, 432]),
    ("Medium",   2, 7, 7, 6, (8, 10),   [196, 392, 588]),
    ("Hard",     3, 8, 8, 6, (12, 14),  [256, 512, 768]),
    ("Expert",   4, 8, 8, 6, (15, 17),  [256, 512, 768]),
]

def gen(tier, ti, R, C, count, band, stars, seed):
    rng = random.Random(seed)
    t0 = time.time(); tries = 0; uniq = 0; unproven = 0; out = []
    seen = set()
    while uniq < count and time.time() - t0 < 240:
        tries += 1
        rh, ch = sample_hints_band(R, C, rng, band[0], band[1])
        if rh is None: continue
        cnt, proven, sol = solve_count(R, C, rh, ch, 2)
        if not proven: unproven += 1; continue
        if cnt != 1 or sol is None: continue
        key = (tuple(rh), tuple(ch))
        if key in seen: continue
        seen.add(key); uniq += 1
        blk = sum(1 for row in sol for v in row if v == 1)
        out.append({"rows": R, "cols": C, "row_hints": rh, "col_hints": ch,
                    "solution_grid": sol, "solve_ms": 0, "tier": tier, "tier_idx": ti,
                    "id": f"{tier.lower()}_{uniq}", "stars": list(stars)})
        print(f"  OK {tier}_{uniq} blk={blk} rh={rh} ch={ch}", flush=True)
    print(f"[{tier}] {uniq}/{count} band={band} tries={tries} unproven={unproven} elapsed={time.time()-t0:.0f}s", flush=True)
    return out

if __name__ == "__main__":
    tier = sys.argv[1]; seed = int(sys.argv[2]) if len(sys.argv) > 2 else 20261029
    t = [x for x in TIERS if x[0].lower() == tier.lower()][0]
    out = gen(t[0], t[1], t[2], t[3], t[4], t[5], t[6], seed + t[1] * 7919)
    print("JSON " + json.dumps(out), flush=True)
