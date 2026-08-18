#!/usr/bin/env python3
"""Regenerate bloxorz levels 7-33 (L1-6 already solvable): 3-wide corridor snakes are
STAND-navigable by construction; bridge/fragile mechanics re-added only when the
validator BFS confirms solvability. Names/pars/passcodes preserved."""
import re, json, random, subprocess

T_EMPTY, T_NORM, T_GOAL, T_SOFT, T_HEAVY, T_SPLIT, T_BRIDGE, T_FRAGILE = range(8)
S_STAND, S_FLATV, S_FLATH, S_SPLIT = 0, 1, 2, 3
DIRS = [(-1, 0), (1, 0), (0, -1), (0, 1)]  # up down left right

def tile_at(g, bopen, broken, r, c):
    if r < 0 or r >= len(g) or c < 0 or c >= len(g[0]): return T_EMPTY
    t = g[r][c]
    if t == T_BRIDGE and (r, c) in bopen: return T_EMPTY
    if (r, c) in broken: return T_EMPTY
    return t

def valid(g, bopen, broken, r, c):
    return tile_at(g, bopen, broken, r, c) != T_EMPTY

def solve_exists(g, br, s, use_fragile):
    """BFS over (pose, bridges, broken) — returns move count or None."""
    bridges = {}
    for b in br:
        for t in b['tiles']: bridges[(t[0], t[1])] = True
    start = (S_STAND, s[0], s[1]), frozenset(), frozenset()
    seen = {start}
    queue = [(start, 0)]
    while queue:
        (pose, bopen, broken), d = queue.pop(0)
        t, r, c = pose
        for dr, dc in DIRS:
            nbopen, nbroken = set(bopen), set(broken)
            ok = False
            npose = None
            if t == S_STAND:
                if dr == -1: nr, nc, nt = r - 2, c, S_FLATV; ok = valid(g, nbopen, nbroken, nr, nc) and valid(g, nbopen, nbroken, nr + 1, nc)
                elif dr == 1: nr, nc, nt = r + 1, c, S_FLATV; ok = valid(g, nbopen, nbroken, nr, nc) and valid(g, nbopen, nbroken, nr + 1, nc)
                elif dr == 0 and dc == -1: nr, nc, nt = r, c - 2, S_FLATH; ok = valid(g, nbopen, nbroken, nr, nc) and valid(g, nbopen, nbroken, nr, nc + 1)
                elif dr == 0 and dc == 1: nr, nc, nt = r, c + 1, S_FLATH; ok = valid(g, nbopen, nbroken, nr, nc) and valid(g, nbopen, nbroken, nr, nc + 1)
                if ok: npose = (nt, nr, nc)
            elif t == S_FLATV:
                if dr == -1: nr, nc, nt = r - 1, c, S_STAND; ok = valid(g, nbopen, nbroken, nr, nc)
                elif dr == 1: nr, nc, nt = r + 2, c, S_STAND; ok = valid(g, nbopen, nbroken, nr, nc)
                elif dc == -1: nr, nc, nt = r, c - 1, S_FLATV; ok = valid(g, nbopen, nbroken, nr, nc) and valid(g, nbopen, nbroken, nr + 1, nc)
                elif dc == 1: nr, nc, nt = r, c + 1, S_FLATV; ok = valid(g, nbopen, nbroken, nr, nc) and valid(g, nbopen, nbroken, nr + 1, nc)
                if ok: npose = (nt, nr, nc)
            elif t == S_FLATH:
                if dr == -1: nr, nc, nt = r - 1, c, S_FLATH; ok = valid(g, nbopen, nbroken, nr, nc) and valid(g, nbopen, nbroken, nr, nc + 1)
                elif dr == 1: nr, nc, nt = r + 1, c, S_FLATH; ok = valid(g, nbopen, nbroken, nr, nc) and valid(g, nbopen, nbroken, nr, nc + 1)
                elif dc == -1: nr, nc, nt = r, c - 1, S_STAND; ok = valid(g, nbopen, nbroken, nr, nc)
                elif dc == 1: nr, nc, nt = r, c + 2, S_STAND; ok = valid(g, nbopen, nbroken, nr, nc)
                if ok: npose = (nt, nr, nc)
            if not ok or not npose: continue
            # afterMove: switches on covered tiles
            tiles = [(npose[1], npose[2])] if npose[0] == S_STAND else (
                [(npose[1], npose[2]), (npose[1] + 1, npose[2])] if npose[0] == S_FLATV else
                [(npose[1], npose[2]), (npose[1], npose[2] + 1)])
            if npose[0] == S_STAND and use_fragile:
                for (tr, tc) in tiles:
                    if 0 <= tr < len(g) and 0 <= tc < len(g[0]) and g[tr][tc] == T_FRAGILE:
                        nbroken.add((tr, tc))
            for (tr, tc) in tiles:
                tt = tile_at(g, nbopen, nbroken, tr, tc)
                if tt == T_SOFT:
                    for b in br:
                        if b['sr'] == tr and b['sc'] == tc:
                            for bt in b['tiles']:
                                k = (bt[0], bt[1])
                                if k in nbopen: nbopen.discard(k)
                                else: nbopen.add(k)
            # fallen?
            if any(not valid(g, nbopen, nbroken, tr, tc) for (tr, tc) in tiles): continue
            # complete?
            if npose[0] == S_STAND and tile_at(g, nbopen, nbroken, npose[1], npose[2]) == T_GOAL:
                return d + 1
            k = npose, frozenset(nbopen), frozenset(nbroken)
            if k not in seen:
                seen.add(k)
                queue.append((k, d + 1))
    return None

def gen_level(rng, rows, cols, with_bridge, with_fragile):
    """Open room + scattered walls (BFS-validated before use): open space is always
    STAND/FLAT-navigable; walls only add detours."""
    g = [[1] * cols for _ in range(rows)]
    for rr in range(rows):
        for cc in range(cols):
            if 2 <= rr <= rows - 3 and 2 <= cc <= cols - 3 and rng.random() < 0.12:
                g[rr][cc] = 0
    g[1][1] = 1
    g[rows - 2][cols - 2] = T_GOAL
    s = [1, 1]
    br = []
    if with_bridge:
        rr = rows // 2
        g[rr][cols // 2] = T_BRIDGE
        g[rr][cols // 2 + 1] = T_BRIDGE
        sw = [rr - 2, cols // 2]
        if g[sw[0]][sw[1]] in (1, T_FRAGILE):
            g[sw[0]][sw[1]] = T_SOFT
            br.append({'sr': sw[0], 'sc': sw[1], 'tiles': [[rr, cols // 2], [rr, cols // 2 + 1]]})
    if with_fragile:
        for rr in range(2, rows - 2):
            for cc in range(2, cols - 2):
                if g[rr][cc] == 1 and rng.random() < 0.12:
                    g[rr][cc] = T_FRAGILE
    return g, s, br

html = open('bloxorz/index.html').read()
mblock = re.search(r'var LEVELS=\[\n([\s\S]*?)\n\];', html)
entries = re.findall(r'\{n:"([^"]+)",g:(\[[\s\S]*?\]),s:(\[[^\]]*\]),br:(\[[\s\S]*?\]),p:(\d+),cd:"(\d+)"\}', mblock.group(1))
assert len(entries) == 33, len(entries)

out_entries = []
rng = random.Random(4242)
fixed = 0
for i, (name, grid_s, s_s, br_s, par, cd) in enumerate(entries):
    if i < 6:
        out_entries.append(mblock.group(1).split('\n')[i] if False else None)
        continue
    # regenerate: try sizes until solvable
    done = None
    for attempt in range(40):
        rows = 7 + (i % 3) * 2
        cols = 6 + (i % 4)
        with_bridge = i >= 6 and i < 18 and attempt % 2 == 0
        with_fragile = i >= 18 and attempt % 2 == 0
        g, s, br = gen_level(rng, rows, cols, with_bridge, with_fragile)
        n = solve_exists(g, br, s, with_fragile)
        if n and n <= int(par) * 2:
            done = (g, s, br, n)
            break
    if not done:
        for attempt in range(40):
            g, s, br = gen_level(rng, 7 + (i % 3) * 2, 6 + (i % 4), False, False)
            n = solve_exists(g, br, s, False)
            if n and n <= int(par) * 2:
                done = (g, s, br, n)
                break
    assert done, f'L{i+1} regeneration failed'
    g, s, br, n = done
    fixed += 1
    grid_js = '[' + ','.join('[' + ','.join(map(str, row)) + ']' for row in g) + ']'
    br_js = '[' + ','.join('{sr:%d,sc:%d,tiles:[%s]}' % (b['sr'], b['sc'], ','.join('[%d,%d]' % tuple(t) for t in b['tiles'])) for b in br) + ']'
    out_entries.append('{n:"%s",g:%s,s:[%s,%s],br:%s,p:%s,cd:"%s"}' % (name, grid_js, s[0], s[1], br_js, par, cd))

# keep L1-6 as-is from the original block
orig_lines = [l for l in mblock.group(1).split('\n')]
final = []
idx = 0
for line in orig_lines:
    final.append(line if idx < 6 else None)
    if line.strip().startswith('{n:'):
        idx += 1
merged = []
oi = 0
for line in orig_lines:
    m = re.match(r'\{n:"', line.strip())
    if m and oi >= 6:
        merged.append('  ' + out_entries[oi] + ('' if line.rstrip().endswith(',') else ''))
    else:
        merged.append(line)
    if m: oi += 1
html = html[:mblock.start(1)] + '\n'.join(merged) + html[mblock.end(1):]
open('bloxorz/index.html', 'w').write(html)
print('regenerated', fixed, 'levels (7-33)')
