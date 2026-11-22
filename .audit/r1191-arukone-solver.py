#!/usr/bin/env python3
"""R1191 arukone sound solver v4: counts solutions (cap 2), exhaustive with deadline.
Returns (count, complete). count==1 & complete=True => proven unique. count==0 & complete=True => proven unsolvable."""
import sys, json, time

def neighbors(r, c, N):
    for dr, dc in ((-1,0),(1,0),(0,-1),(0,1)):
        nr, nc = r+dr, c+dc
        if 0 <= nr < N and 0 <= nc < N:
            yield nr, nc

def count_solutions(N, pairs, cap=2, deadline=None):
    K = len(pairs)
    E = {}
    for pid, ((r1,c1),(r2,c2)) in enumerate(pairs):
        E[(r1,c1)] = pid; E[(r2,c2)] = pid
    occupied = set()
    order = sorted(range(K), key=lambda p: abs(pairs[p][0][0]-pairs[p][1][0]) + abs(pairs[p][0][1]-pairs[p][1][1]))
    state = {'count': 0}

    def reachable(pid):
        (ar,ac),(br,bc) = pairs[pid]
        seen = {(ar,ac)}; q = [(ar,ac)]
        while q:
            r,c = q.pop()
            if (r,c) == (br,bc): return True
            for nr,nc in neighbors(r,c,N):
                if (nr,nc) in seen or (nr,nc) in occupied: continue
                if (nr,nc) in E and (nr,nc) != (br,bc): continue
                seen.add((nr,nc)); q.append((nr,nc))
        return False

    def dfs(idx, placed_interiors):
        if state['count'] >= cap: return True
        if deadline and time.time() > deadline: return False
        if idx == len(order):
            if 2*K + placed_interiors == N*N:
                state['count'] += 1
            return True
        pid = order[idx]
        (ar,ac),(br,bc) = pairs[pid]
        path = [(ar,ac)]
        pset = {(ar,ac)}
        def walk():
            if state['count'] >= cap: return True
            if deadline and time.time() > deadline: return False
            r,c = path[-1]
            if (r,c) == (br,bc):
                if len(path) >= 2:
                    for cell in path[1:-1]: occupied.add(cell)
                    ok = all(reachable(order[q]) for q in range(idx+1, len(order)))
                    res = dfs(idx+1, placed_interiors + len(path) - 2) if ok else True
                    for cell in path[1:-1]: occupied.discard(cell)
                    return res
                return True
            for nr,nc in neighbors(r,c,N):
                if (nr,nc) in pset or (nr,nc) in occupied: continue
                if (nr,nc) in E and (nr,nc) != (br,bc): continue
                path.append((nr,nc)); pset.add((nr,nc))
                res = walk()
                path.pop(); pset.discard((nr,nc))
                if not res: return False
            return True
        return walk()

    complete = dfs(0, 0)
    return state['count'], complete

def load():
    html = open('/home/junze/gamezipper.com/arukone/index.html').read()
    import re
    m = re.search(r'var LEVELS=(\[.*?\]);\n', html, re.S)
    return json.loads(m.group(1))

if __name__ == '__main__':
    L = load()
    seen = {}
    for lv in L:
        i, tier, W, H, pairs, sol = lv
        assert W == H
        pr = [((a,b),(c,d)) for a,b,c,d in pairs]
        t0 = time.time()
        cnt, complete = count_solutions(W, pr, 2, t0 + 25)
        seen.setdefault(json.dumps([W, pr]), []).append(i)
        print(f"L{i:2d} {tier} {W}x{W} pairs={len(pr)} solutions={cnt} complete={complete} t={time.time()-t0:.2f}s")
    print('distinct puzzles:', len(seen))
    for k, ids in seen.items():
        print(' slots', ids)
