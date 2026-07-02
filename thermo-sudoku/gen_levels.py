#!/usr/bin/env python3
"""
Thermo Sudoku level generator (construction-guaranteed uniqueness).
- Base grid: canonical cyclic Latin-square pattern (box_c multiplier, per skill pitfall) + 5 permutations.
- Thermometers: orthogonally-connected cell paths with strictly-increasing solution values, built greedily
  from the base grid so they are consistent by construction.
- Cell removal with thermo-aware uniqueness solver (MRV backtracking + thermo increasing constraint).
Output: thermo-sudoku/levels.json
"""
import random, json, sys

def base_grid(n, box_r, box_c):
    G=[[0]*n for _ in range(n)]
    for r in range(n):
        for c in range(n):
            G[r][c]=((r % box_r)*box_c + (r//box_r) + c)%n + 1
    return G

def valid_grid(G,n,box_r,box_c):
    for r in range(n):
        if len(set(G[r]))!=n: return False
    for c in range(n):
        col=[G[r][c] for r in range(n)]
        if len(set(col))!=n: return False
    for br in range(0,n,box_r):
        for bc in range(0,n,box_c):
            vals=[G[br+i][bc+j] for i in range(box_r) for j in range(box_c)]
            if len(set(vals))!=n: return False
    return True

def permute(G,n,box_r,box_c,rng):
    # symbol perm
    syms=list(range(1,n+1)); rng.shuffle(syms)
    symmap={i+1:syms[i] for i in range(n)}
    G=[[symmap[v] for v in row] for row in G]
    # block-row swap
    nblk_r=n//box_r
    brow=list(range(nblk_r)); rng.shuffle(brow)
    newG=[None]*n
    for bidx,br in enumerate(brow):
        for i in range(box_r):
            newG[bidx*box_r+i]=G[br*box_r+i][:]
    G=newG
    # block-col swap
    nblk_c=n//box_c
    bcol=list(range(nblk_c)); rng.shuffle(bcol)
    newG=[[0]*n for _ in range(n)]
    for bidx,bc in enumerate(bcol):
        for i in range(n):
            for j in range(box_c):
                newG[i][bidx*box_c+j]=G[i][bc*box_c+j]
    G=newG
    # within-block row swap
    for bidx in range(nblk_r):
        rows=list(range(box_r)); rng.shuffle(rows)
        tmp=[G[bidx*box_r+i][:] for i in range(box_r)]
        for i in range(box_r):
            G[bidx*box_r+i]=tmp[rows[i]]
    # within-block col swap
    for bidx in range(nblk_c):
        cols=list(range(box_c)); rng.shuffle(cols)
        for r in range(n):
            tmp=[G[r][bidx*box_c+j] for j in range(box_c)]
            for j in range(box_c):
                G[r][bidx*box_c+j]=tmp[cols[j]]
    return G

def neighbors(r,c,n):
    for dr,dc in ((-1,0),(1,0),(0,-1),(0,1)):
        nr,nc=r+dr,c+dc
        if 0<=nr<n and 0<=nc<n: yield nr,nc

def design_thermos(sol,n,rng,count_range,maxlen_range):
    """Build thermo paths consistent with solution (strictly increasing)."""
    thermos=[]
    used=set()
    attempts=0
    target_count=rng.randint(*count_range)
    while len(thermos)<target_count and attempts<400:
        attempts+=1
        # pick a bulb (low value preferred) not used
        bulb=None
        candidates=[(r,c) for r in range(n) for c in range(n) if (r,c) not in used]
        if not candidates: break
        # prefer lower-value bulbs for longer paths
        candidates.sort(key=lambda rc: sol[rc[0]][rc[1]]+rng.random()*1.5)
        bulb=candidates[0]
        path=[bulb]
        used.add(bulb)
        cur=bulb; curval=sol[cur[0]][cur[1]]
        maxlen=rng.randint(*maxlen_range)
        while len(path)<maxlen:
            # find adjacent unused cell with higher value
            opts=[]
            for nr,nc in neighbors(cur[0],cur[1],n):
                if (nr,nc) in used: continue
                v=sol[nr][nc]
                if v>curval:
                    opts.append((v,nr,nc))
            if not opts: break
            opts.sort()
            # pick smallest higher value to keep path extendable, with randomness
            pick=opts[rng.randint(0,min(2,len(opts)-1))]
            path.append((pick[1],pick[2])); used.add((pick[1],pick[2]))
            cur=(pick[1],pick[2]); curval=pick[0]
        if len(path)>=3:  # min meaningful thermo length
            thermos.append(path)
        else:
            # too short, free cells? keep used to avoid re-picking same area sometimes
            pass
    return thermos

def thermo_pos(thermos):
    """Map (r,c)->(thermo_index, position_in_thermo)."""
    pos={}
    for ti,t in enumerate(thermos):
        for pi,cell in enumerate(t):
            pos[cell]=(ti,pi)
    return pos

def count_solutions(puzzle,n,box_r,box_c,thermos,limit=2,node_cap=800000):
    """MRV backtracking Sudoku solver with thermo increasing constraint. Returns 0..limit (or -1 if capped)."""
    cells=[(r,c) for r in range(n) for c in range(n)]
    pos=thermo_pos(thermos)
    # candidate sets
    rowcand=[set(range(1,n+1)) for _ in range(n)]
    colcand=[set(range(1,n+1)) for _ in range(n)]
    boxcand=[[set(range(1,n+1)) for _ in range(n//box_c)] for _ in range(n//box_r)]
    grid=[[0]*n for _ in range(n)]
    empties=[]
    for (r,c) in cells:
        v=puzzle[r][c]
        if v:
            grid[r][c]=v
            rowcand[r].discard(v); colcand[c].discard(v)
            boxcand[r//box_r][c//box_c].discard(v)
        else:
            empties.append((r,c))
    sols=[0]; nodes=[0]; capped=[False]
    def thermo_ok(r,c,v):
        info=pos.get((r,c))
        if not info: return True
        ti,pi=info
        t=thermos[ti]
        if pi>0:
            pr,pc=t[pi-1]
            if grid[pr][pc] and grid[pr][pc]>=v: return False
        if pi<len(t)-1:
            nr,nc=t[pi+1]
            if grid[nr][nc] and grid[nr][nc]<=v: return False
        return True
    def solve():
        if capped[0] or sols[0]>=limit: return
        nodes[0]+=1
        if nodes[0]>node_cap: capped[0]=True; return
        # MRV: find empty cell with fewest candidates
        best=None; bestc=None; bestlen=999
        for (r,c) in empties:
            if grid[r][c]: continue
            cand=rowcand[r]&colcand[c]&boxcand[r//box_r][c//box_c]
            # filter thermo
            cand2=set(x for x in cand if thermo_ok(r,c,x))
            if len(cand2)<bestlen:
                bestlen=len(cand2); best=(r,c); bestc=cand2
                if bestlen==0: break
                if bestlen==1: break
        if best is None:
            # all filled
            sols[0]+=1; return
        if bestlen==0:
            return
        r,c=best
        bi,bj=r//box_r,c//box_c
        for v in bestc:
            grid[r][c]=v
            rowcand[r].discard(v); colcand[c].discard(v); boxcand[bi][bj].discard(v)
            solve()
            grid[r][c]=0
            rowcand[r].add(v); colcand[c].add(v); boxcand[bi][bj].add(v)
            if sols[0]>=limit or capped[0]: return
    solve()
    if capped[0]: return -1
    return sols[0]

def make_level(n,box_r,box_c,rng,target_clues,thermo_count,thermo_maxlen,max_remove_tries=300):
    """Generate one Thermo Sudoku level. Returns dict or None."""
    G=base_grid(n,box_r,box_c)
    assert valid_grid(G,n,box_r,box_c), "base invalid"
    G=permute(G,n,box_r,box_c,rng)
    assert valid_grid(G,n,box_r,box_c), "permuted invalid"
    # design thermos
    thermos=design_thermos(G,n,rng,thermo_count,thermo_maxlen)
    if len(thermos)<2:
        return None
    # remove cells for givens
    puzzle=[row[:] for row in G]
    cells=[(r,c) for r in range(n) for c in range(n)]
    rng.shuffle(cells)
    n2=n*n
    current_givens=n2
    for (r,c) in cells:
        if current_givens<=target_clues: break
        old=puzzle[r][c]
        puzzle[r][c]=0
        cnt=count_solutions(puzzle,n,box_r,box_c,thermos,limit=2)
        if cnt==1:
            current_givens-=1
        else:
            puzzle[r][c]=old  # restore
    if current_givens>target_clues+4:
        return None  # couldn't reduce enough
    # final uniqueness check
    cnt=count_solutions(puzzle,n,box_r,box_c,thermos,limit=2)
    if cnt!=1:
        return None
    return {
        'n':n,'boxR':box_r,'boxC':box_c,
        'givens':[[puzzle[r][c] for c in range(n)] for r in range(n)],
        'solution':[[G[r][c] for c in range(n)] for r in range(n)],
        'thermos':[[[r,c] for (r,c) in t] for t in thermos],
        'clueCount':current_givens,
    }

def main():
    rng=random.Random(20260702)
    # (n,boxR,boxC,target_clues,thermo_count_range,thermo_maxlen_range,count)
    # R22 iterative upgrade: 23 -> 30 levels (5 per tier, parity with kurodoko standard)
    spec=[
        (4,2,2, 6,(2,3),(3,4), 5),     # Beginner: 4x4, ~6 givens
        (6,2,3, 12,(3,4),(3,5), 5),    # Easy: 6x6, ~12 givens
        (6,2,3, 9,(3,5),(4,6), 5),     # Medium: 6x6, ~9 givens (thermo-heavy)
        (9,3,3, 30,(4,6),(4,7), 5),    # Hard: 9x9, ~30 givens
        (9,3,3, 24,(5,7),(5,9), 5),    # Expert: 9x9, ~24 givens (thermo-driven)
        (9,3,3, 22,(6,8),(6,9), 5),    # Master: 9x9, ~22 givens
    ]
    tiers=['Beginner','Easy','Medium','Hard','Expert','Master']
    levels=[]
    total_target=sum(s[6] for s in spec)
    print(f"Target: {total_target}",file=sys.stderr)
    for ti,(n,br,bc,tc,tcr,tmr,cnt) in enumerate(spec):
        tier=tiers[ti]
        made=0; att=0
        while made<cnt and att<60:
            att+=1
            tcount=rng.randint(*tcr)
            tmax=rng.randint(*tmr)
            lvl=make_level(n,br,bc,rng,tc,(tcount,tcount),(tmax,tmax))
            if lvl:
                lvl['tier']=tier; lvl['id']=len(levels)+1
                levels.append(lvl); made+=1
                print(f"  {tier} L{lvl['id']}: {n}x{n} clues={lvl['clueCount']} thermos={len(lvl['thermos'])} (att {att})",file=sys.stderr)
        if made<cnt:
            print(f"  WARN {tier}: {made}/{cnt}",file=sys.stderr)
    out={'levels':levels}
    with open('levels.json','w') as f:
        json.dump(out,f)
    print(f"WROTE {len(levels)} levels")
    # reverify all
    bad=0
    for lvl in levels:
        n=lvl['n']
        puzzle=[[lvl['givens'][r][c] for c in range(n)] for r in range(n)]
        thermos=[[tuple(x) for x in t] for t in lvl['thermos']]
        cnt=count_solutions(puzzle,n,lvl['boxR'],lvl['boxC'],thermos,limit=2)
        if cnt!=1:
            print(f"  REVERIFY FAIL id={lvl['id']}: sols={cnt}",file=sys.stderr); bad+=1
    print(f"reverify {len(levels)-bad}/{len(levels)} unique",file=sys.stderr)

if __name__=='__main__':
    main()
