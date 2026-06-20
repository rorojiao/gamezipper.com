#!/usr/bin/env python3
"""
Jigsaw Sudoku level generator (optimized v3).
- Clean solver: naked-single propagation + incremental bitmask undo (no O(n²) snapshots)
- MRV branching
- Incremental file writing
- Per-level wall-clock timeout
"""
import json, random, sys, signal, time

# ---- Region tiling generation ----
def generate_regions(n, rng):
    grid = [[-1]*n for _ in range(n)]
    candidates = [(r,c) for r in range(n) for c in range(n)]
    rng.shuffle(candidates)
    seeds = []
    for cand in candidates:
        if len(seeds) >= n: break
        ok = all(abs(cand[0]-s[0]) + abs(cand[1]-s[1]) >= max(2, n//3) for s in seeds)
        if ok: seeds.append(cand)
    while len(seeds) < n:
        for cand in candidates:
            if cand not in seeds:
                seeds.append(cand)
                if len(seeds) >= n: break
    for rid, (sr, sc) in enumerate(seeds):
        grid[sr][sc] = rid
    regions = {rid: [(sr,sc)] for rid,(sr,sc) in enumerate(seeds)}
    sizes = {rid: 1 for rid in regions}
    claimed = n
    order = list(range(n))
    safety = 0
    while claimed < n*n and safety < n*n*6:
        safety += 1
        rng.shuffle(order)
        progressed = False
        for rid in order:
            if sizes[rid] >= n: continue
            frontier = set()
            for (r,c) in regions[rid]:
                for dr,dc in ((-1,0),(1,0),(0,-1),(0,1)):
                    nr,nc = r+dr, c+dc
                    if 0<=nr<n and 0<=nc<n and grid[nr][nc]==-1:
                        frontier.add((nr,nc))
            if not frontier: continue
            pick = rng.choice(list(frontier))
            grid[pick[0]][pick[1]] = rid
            regions[rid].append(pick)
            sizes[rid] += 1
            claimed += 1
            progressed = True
            if claimed >= n*n: break
        if not progressed:
            for r in range(n):
                for c in range(n):
                    if grid[r][c] == -1:
                        best = -1
                        for dr,dc in ((-1,0),(1,0),(0,-1),(0,1)):
                            nr,nc = r+dr,c+dc
                            if 0<=nr<n and 0<=nc<n and grid[nr][nc]!=-1:
                                rid2 = grid[nr][nc]
                                if sizes[rid2] < n: best = rid2; break
                        if best == -1:
                            for rid2 in range(n):
                                if sizes[rid2] < n: best = rid2; break
                        grid[r][c] = best
                        regions[best].append((r,c))
                        sizes[best] += 1
                        claimed += 1
            break
    if any(sizes[r] != n for r in range(n)):
        return None
    return grid

def build_region_cells(grid, n):
    regions = [[] for _ in range(n)]
    for r in range(n):
        for c in range(n):
            regions[grid[r][c]].append([r,c])
    return regions

# ---- Fast solver: propagation + incremental undo ----
def solve_count(cells_region, n, puzzle, limit=2, deadline=None):
    """Count solutions up to limit. Naked-single propagation + MRV DFS.
    Incremental bitmask undo — no full snapshots."""
    rows = [0]*n; cols = [0]*n; regs = [0]*n
    grid = [row[:] for row in puzzle]
    empty_set = set()
    for r in range(n):
        for c in range(n):
            v = grid[r][c]
            if v:
                bit = 1 << (v-1)
                rows[r] |= bit; cols[c] |= bit; regs[cells_region[r][c]] |= bit
            else:
                empty_set.add((r,c))
    count = [0]
    FULL = (1 << n) - 1
    def cand_of(r,c):
        return FULL & ~(rows[r] | cols[c] | regs[cells_region[r][c]])
    def fill(r,c,d):
        bit = 1<<(d-1)
        grid[r][c]=d; rows[r]|=bit; cols[c]|=bit; regs[cells_region[r][c]]|=bit
        empty_set.discard((r,c))
    def unfill(r,c,d):
        bit = 1<<(d-1)
        grid[r][c]=0; rows[r]&=~bit; cols[c]&=~bit; regs[cells_region[r][c]]&=~bit
        empty_set.add((r,c))
    def propagate():
        filled = []
        changed = True
        while changed:
            changed = False
            for (r,c) in list(empty_set):
                cand = cand_of(r,c)
                if cand == 0:
                    for (pr,pc,pd) in filled: unfill(pr,pc,pd)
                    return None
                if cand & (cand-1) == 0:
                    d = cand.bit_length()
                    fill(r,c,d); filled.append((r,c,d)); changed = True
        return filled
    def backtrack():
        if count[0] >= limit: return
        if deadline and time.time() > deadline: return
        prop = propagate()
        if prop is None: return
        if not empty_set:
            count[0] += 1
            for (pr,pc,pd) in reversed(prop): unfill(pr,pc,pd)
            return
        # MRV
        best_r=best_c=-1; best_cand=0; best_cnt=n+1
        for (r,c) in empty_set:
            cand = cand_of(r,c)
            cnt = bin(cand).count('1')
            if cnt < best_cnt:
                best_cnt=cnt; best_r=r; best_c=c; best_cand=cand
                if cnt <= 2: break
        r,c = best_r,best_c; cand = best_cand; d=1
        while cand:
            if cand & 1:
                fill(r,c,d)
                backtrack()
                unfill(r,c,d)
                if count[0] >= limit: break
            cand >>= 1; d += 1
        for (pr,pc,pd) in reversed(prop): unfill(pr,pc,pd)
    backtrack()
    return count[0]

def generate_solution(grid_regions, n, rng):
    solution = [[0]*n for _ in range(n)]
    rows = [0]*n; cols = [0]*n; regs = [0]*n
    cells_order = [(r,c) for r in range(n) for c in range(n)]
    ok = [False]
    def bt(idx):
        if ok[0]: return
        if idx == len(cells_order): ok[0]=True; return
        r,c = cells_order[idx]
        used = rows[r] | cols[c] | regs[grid_regions[r][c]]
        digits = list(range(1,n+1)); rng.shuffle(digits)
        for d in digits:
            bit = 1<<(d-1)
            if used & bit: continue
            solution[r][c]=d; rows[r]|=bit; cols[c]|=bit; regs[grid_regions[r][c]]|=bit
            bt(idx+1)
            if ok[0]: return
            rows[r]&=~bit; cols[c]&=~bit; regs[grid_regions[r][c]]&=~bit
            solution[r][c]=0
    bt(0)
    return solution if ok[0] else None

def make_puzzle(grid_regions, n, solution, target_givens, rng, deadline=None):
    puzzle = [row[:] for row in solution]
    cells = [(r,c) for r in range(n) for c in range(n)]
    rng.shuffle(cells)
    givens = n*n
    for (r,c) in cells:
        if givens <= target_givens: break
        if deadline and time.time() > deadline: break
        saved = puzzle[r][c]
        puzzle[r][c] = 0
        cnt = solve_count(grid_regions, n, puzzle, limit=2, deadline=deadline)
        if cnt == 1:
            givens -= 1
        else:
            puzzle[r][c] = saved
    return puzzle, givens

# ---- Pipeline ----
TIERS = [
    ("Beginner", 4, 6, (20, 24)),
    ("Easy",     4, 6, (14, 18)),
    ("Medium",   4, 6, (10, 13)),
    ("Hard",     6, 9, (30, 36)),
    ("Expert",   5, 9, (24, 29)),
    ("Master",   4, 9, (20, 24)),
]

def gen_level(tier_name, n, given_range, level_num, rng, level_timeout=20):
    deadline = time.time() + level_timeout
    for attempt in range(30):
        if time.time() > deadline: break
        regions_grid = None
        for _ in range(15):
            rg = generate_regions(n, rng)
            if rg is not None: regions_grid = rg; break
        if regions_grid is None: continue
        sol = generate_solution(regions_grid, n, rng)
        if sol is None: continue
        target = rng.randint(given_range[0], given_range[1])
        remain = max(3.0, deadline - time.time())
        puzzle, actual = make_puzzle(regions_grid, n, sol, target, rng, deadline=time.time()+remain*0.85)
        if actual > given_range[1] + 3: continue
        cnt = solve_count(regions_grid, n, puzzle, limit=2)
        if cnt != 1: continue
        return {
            "n": n, "regions": regions_grid,
            "regionCells": build_region_cells(regions_grid, n),
            "solution": sol, "puzzle": puzzle,
            "givens": actual, "tier": tier_name, "level": level_num,
        }
    return None

def main():
    seed = int(sys.argv[1]) if len(sys.argv) > 1 else 391
    rng = random.Random(seed)
    levels = []
    level_num = 0
    t0 = time.time()
    for tier_name, count, n, grange in TIERS:
        for i in range(count):
            level_num += 1
            lv = None
            for retry in range(4):
                lv = gen_level(tier_name, n, grange, level_num, rng, level_timeout=18)
                if lv: break
            if lv is None:
                print(f"FAILED level {level_num} ({tier_name})", file=sys.stderr)
                sys.exit(1)
            levels.append(lv)
            print(f"  L{level_num:2d} {tier_name:9s} {n}x{n}  givens={lv['givens']:2d}  [{time.time()-t0:.1f}s]", file=sys.stderr)
            with open("/home/msdn/gamezipper.com/jigsaw-sudoku/levels.json", "w") as f:
                json.dump(levels, f)
    print(f"\nGenerated {len(levels)} levels in {time.time()-t0:.1f}s", file=sys.stderr)

if __name__ == "__main__":
    main()
