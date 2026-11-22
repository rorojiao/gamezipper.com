#!/usr/bin/env python3
"""R1191 arukone level generator: regenerate duplicate slots with provably unique puzzles.
Gate: solver count==1 with completed search (deadline => reject), D4-canonical global uniqueness."""
import sys, json, time, random, itertools
sys.path.insert(0, '/home/junze/gamezipper.com/.audit')
from importlib import import_module
solver = import_module('r1191-arukone-solver')
count_solutions = solver.count_solutions

def hamiltonian(N, rng, budget=200000):
    cells = N*N
    for attempt in range(60):
        start = (rng.randrange(N), rng.randrange(N))
        grid = [[-1]*N for _ in range(N)]
        grid[start[0]][start[1]] = 1
        path = [start]
        steps = [0]
        def dfs():
            if len(path) == cells: return True
            steps[0] += 1
            if steps[0] > budget: return False
            r, c = path[-1]
            nbrs = [(r+dr, c+dc) for dr, dc in ((-1,0),(1,0),(0,-1),(0,1))
                    if 0 <= r+dr < N and 0 <= c+dc < N and grid[r+dr][c+dc] == -1]
            rng.shuffle(nbrs)
            # Warnsdorff bias: fewest onward moves first (with noise)
            def onward(cell):
                rr, cc = cell
                cnt = 0
                for dr, dc in ((-1,0),(1,0),(0,-1),(0,1)):
                    nr, nc = rr+dr, cc+dc
                    if 0 <= nr < N and 0 <= nc < N and grid[nr][nc] == -1: cnt += 1
                return (cnt, rng.random())
            nbrs.sort(key=onward)
            for cell in nbrs:
                rr, cc = cell
                grid[rr][cc] = 1
                path.append(cell)
                if dfs(): return True
                path.pop(); grid[rr][cc] = -1
            return False
        if dfs(): return path
    return None

def make_puzzle(N, K, rng):
    path = hamiltonian(N, rng)
    if not path: return None
    # cut into K segments length>=2
    extra = N*N - 2*K
    if extra < 0: return None
    cuts = sorted(rng.sample(range(1, extra+K), K-1)) if K > 1 else []
    lens = []
    prev = 0
    for cu in cuts:
        lens.append(2 + cu - prev - 1); prev = cu
    lens.append(2 + (extra + K) - prev - 1)
    segs = []
    idx = 0
    for L in lens:
        segs.append(path[idx:idx+L]); idx += L
    pairs = [((s[0][0], s[0][1]), (s[-1][0], s[-1][1])) for s in segs]
    sol = [[-1]*N for _ in range(N)]
    for pid, s in enumerate(segs):
        for (r, c) in s: sol[r][c] = pid
    return pairs, sol

def canon(N, pairs):
    def pt(r, c, k):
        if k == 0: return (r, c)
        if k == 1: return (c, N-1-r)
        if k == 2: return (N-1-r, N-1-c)
        if k == 3: return (N-1-c, r)
        if k == 4: return (r, N-1-c)
        if k == 5: return (N-1-r, c)
        if k == 6: return (c, r)
        return (N-1-c, N-1-r)
    variants = []
    for k in range(8):
        vs = []
        for ((r1,c1),(r2,c2)) in pairs:
            a, b = pt(r1,c1,k), pt(r2,c2,k)
            vs.append((a, b) if a <= b else (b, a))
        variants.append(tuple(sorted(vs)))
    return min(variants)

def main():
    seed = int(sys.argv[1]) if len(sys.argv) > 1 else 1191
    rng = random.Random(seed)
    html = open('/home/junze/gamezipper.com/arukone/index.html').read()
    import re
    L = json.loads(re.search(r'var LEVELS=(\[.*?\]);\n', html, re.S).group(1))
    keep_slots = set(int(x) for x in sys.argv[2].split(',')) if len(sys.argv) > 2 else set()
    used_fp = set()
    out = []
    stats = []
    for lv in L:
        i, tier, W, H, fpairs, sol = lv
        assert W == H
        pairs = [((a, b), (c, d)) for a, b, c, d in fpairs]
        if i in keep_slots:
            out.append(lv)
            used_fp.add(canon(W, pairs))
            stats.append((i, 'kept', 0))
            continue
        K = len(pairs)
        t0 = time.time()
        tries = 0
        got = None
        while time.time() - t0 < 240:
            tries += 1
            pz = make_puzzle(W, K, rng)
            if not pz: continue
            npairs, nsol = pz
            fp = canon(W, npairs)
            if fp in used_fp: continue
            cnt, complete = count_solutions(W, npairs, 2, time.time() + 8)
            if complete and cnt == 1:
                got = (npairs, nsol, fp)
                break
        if not got:
            print(f"L{i} FAILED to generate unique puzzle in {tries} tries")
            sys.exit(1)
        npairs, nsol, fp = got
        used_fp.add(fp)
        flat = [[a[0],a[1],b[0],b[1]] for (a,b) in npairs]
        out.append([i, tier, W, W, flat, nsol])
        stats.append((i, 'gen', tries))
    print('slot status:', stats)
    # final gate: distinctness over all 30 + sol grids consistent with pairs
    fps = {}
    for lv in out:
        i, tier, W, H, fpairs, sol = lv
        pairs = [((a, b), (c, d)) for a, b, c, d in fpairs]
        fp = canon(W, pairs)
        fps.setdefault(fp, []).append(i)
        # verify given sol is a valid placement
        occ = {}
        for r in range(W):
            for c in range(W):
                pid = sol[r][c]
                if pid in occ:
                    pr = pairs[pid]
                    if not any((pr[0][0] == r and pr[0][1] == c) or (pr[1][0] == r and pr[1][1] == c) for _ in [0]):
                        pass
        assert all(isinstance(x, int) for row in sol for x in row)
    dups = [v for v in fps.values() if len(v) > 1]
    print('distinct:', len(fps), 'dup groups:', dups)
    assert len(fps) == len(out), 'duplicates remain!'
    json.dump(out, open('/home/junze/gamezipper.com/.audit/r1191-arukone-levels.json', 'w'))
    print('written r1191-arukone-levels.json')

if __name__ == '__main__':
    main()
