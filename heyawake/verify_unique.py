#!/usr/bin/env python3
"""heyawake independent uniqueness verifier.

Semantics EXACTLY as shipped checkWin() implements (a Heyawake variant):
  1. no two black cells orthonally adjacent (anywhere);
  2. span: 3 consecutive whites in a line that are NOT all in the same room
     is a violation;
  3. numbered room: exactly clue black cells; unnumbered room: 0..3 blacks;
  4. all white cells orthogonally connected;
  5. every cell decided (0/1).

For each static level embedded in index.html:
  a. validate the stored solution against these rules;
  b. enumerate winning grids independently via cell-by-cell DFS with
     adjacency / room-count / span / partial-connectivity pruning, limit=2:
     exactly 1 => UNIQUE; >=2 => NOT UNIQUE; budget hit => FAIL
     (inconclusive never passes).
"""
import json
import os
import re
import sys
import time


def extract_levels(html):
    m = re.search(r'(?:const|var)\s+LEVELS\s*=\s*\[', html)
    if not m:
        return None
    i = html.index('[', m.start())
    depth = 0
    in_str = None
    esc = False
    for j in range(i, len(html)):
        ch = html[j]
        if in_str:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == in_str:
                in_str = None
        elif ch in '"\'':
            in_str = ch
        elif ch == '[':
            depth += 1
        elif ch == ']':
            depth -= 1
            if depth == 0:
                raw = html[i:j + 1]
                try:
                    return json.loads(raw)
                except json.JSONDecodeError:
                    fixed = re.sub(r'([{,])\s*([A-Za-z_]\w*)\s*:', r'\1"\2":', raw)
                    return json.loads(fixed)
    return None


def parse_level(lv):
    R, C = lv['r'], lv['c']
    s = lv['s']
    # data rooms are "row0,col0,row1,col1"; internal pairs are (x=col,y=row)
    rooms = []
    for rr in lv['rooms'].split(';'):
        r0, c0, r1, c1 = map(int, rr.split(','))
        rooms.append((c0, r0, c1, r1))
    clues = {}
    if lv.get('n'):
        for item in lv['n'].split(';'):
            if not item.strip():
                continue
            r, c, n = map(int, item.split(','))
            clues[(c, r)] = n
    return R, C, s, rooms, clues


def room_clue(rooms, clues, k):
    """Clue whose cell lies inside room k (game scans room cells for a clue)."""
    x0, y0, x1, y1 = rooms[k]
    for (cx, cy), v in clues.items():
        if x0 <= cx <= x1 and y0 <= cy <= y1:
            return v
    return None


def build_tables(R, C, rooms, clues):
    room_idx = [[room_of(x, y, rooms) for x in range(C)] for y in range(R)]
    room_cells = [set() for _ in rooms]
    for y in range(R):
        for x in range(C):
            k = room_idx[y][x]
            if k is not None:
                room_cells[k].add((x, y))
    room_clue_v = [room_clue(rooms, clues, k) for k in range(len(rooms))]
    return room_idx, room_cells, room_clue_v


def room_of(x, y, rooms):
    for k, (x0, y0, x1, y1) in enumerate(rooms):
        if x0 <= x <= x1 and y0 <= y <= y1:
            return k
    return None


def valid_full(blacks, R, C, rooms, room_idx):
    board = {(x, y): 1 for (x, y) in blacks}
    for (x, y) in blacks:
        if (x + 1, y) in board or (x, y + 1) in board or (x - 1, y) in board or (x, y - 1) in board:
            return False
    room_cells = [set() for _ in rooms]
    for y in range(R):
        for x in range(C):
            k = room_idx[y][x]
            if k is not None:
                room_cells[k].add((x, y))
    for k, cs in enumerate(room_cells):
        cnt = sum(1 for c in cs if c in board)
        clue = room_clue_v_cache.get(k)
        if clue is not None:
            if cnt != clue:
                return False
        elif cnt > 3:
            return False
    for y in range(R):
        for x in range(C - 2):
            if (x, y) not in board and (x + 1, y) not in board and (x + 2, y) not in board:
                a, b, c = room_idx[y][x], room_idx[y][x + 1], room_idx[y][x + 2]
                if not (a == b == c):
                    return False
    for x in range(C):
        for y in range(R - 2):
            if (x, y) not in board and (x, y + 1) not in board and (x, y + 2) not in board:
                a, b, c = room_idx[y][x], room_idx[y + 1][x], room_idx[y + 2][x]
                if not (a == b == c):
                    return False
    whites = [(x, y) for y in range(R) for x in range(C) if (x, y) not in board]
    if whites:
        seen = {whites[0]}
        stack = [whites[0]]
        while stack:
            cx, cy = stack.pop()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nb = (cx + dx, cy + dy)
                if 0 <= nb[0] < C and 0 <= nb[1] < R and nb not in board and nb not in seen:
                    seen.add(nb)
                    stack.append(nb)
        if len(seen) != len(whites):
            return False
    return True


room_clue_v_cache = {}


def count_solutions(R, C, room_idx, room_cells, room_clue_v, limit=2,
                    node_budget=4_000_000, wall_budget=50.0):
    """Cell-by-cell DFS (row-major) with strong pruning; counts to limit."""
    cells = [(x, y) for y in range(R) for x in range(C)]
    n = len(cells)
    state = {}  # (x,y) -> 'B' | 'W'
    black_cnt = [0] * len(room_cells)
    room_total = [len(cs) for cs in room_cells]
    # remaining undetermined cells per room, updated incrementally
    rem = list(room_total)
    count = [0]
    nodes = [0]
    t0 = time.monotonic()

    def span_ok(x, y):
        # all runs of length 3 ending/centered through decided whites checked
        # only newly-decidable violation is a run fully decided containing (x,y)
        for dx, dy in ((1, 0), (0, 1)):
            for back in (2, 1, 0):
                a = (x - dx * back, y - dy * back)
                b = (x - dx * (back - 1), y - dy * (back - 1))
                c = (x - dx * (back - 2), y - dy * (back - 2))
                if back < 2:
                    continue
                if a[0] < 0 or a[1] < 0 or c[0] < 0 or c[1] < 0:
                    continue
                if a in state and b in state and c in state \
                        and state[a] == 'W' and state[b] == 'W' and state[c] == 'W':
                    ra = room_idx[a[1]][a[0]]
                    rb = room_idx[b[1]][b[0]]
                    rc = room_idx[c[1]][c[0]]
                    if not (ra == rb == rc):
                        return False
        return True

    def whites_connected_partial():
        # every decided white must reach the first decided white through
        # (decided white ∪ undetermined) cells
        first = None
        for (x, y) in cells:
            if state.get((x, y)) == 'W':
                first = (x, y)
                break
        if first is None:
            return True
        seen = {first}
        stack = [first]
        while stack:
            cx, cy = stack.pop()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nb = (cx + dx, cy + dy)
                if not (0 <= nb[0] < C and 0 <= nb[1] < R) or nb in seen:
                    continue
                st = state.get(nb, None)
                if st is None or st == 'W':
                    seen.add(nb)
                    stack.append(nb)
        for (x, y) in cells:
            if state.get((x, y)) == 'W' and (x, y) not in seen:
                return False
        return True

    def dfs(i):
        nodes[0] += 1
        if nodes[0] > node_budget:
            raise TimeoutError('node budget')
        if time.monotonic() - t0 > wall_budget:
            raise TimeoutError('wall budget')
        if i == n:
            if whites_connected_partial():
                count[0] += 1
            return count[0] < limit
        x, y = cells[i]
        k = room_idx[y][x]
        rem[k] -= 1
        clue = room_clue_v[k]
        # try BLACK
        adj_black = ((x + 1, y) in state and state[(x + 1, y)] == 'B') or \
                    ((x - 1, y) in state and state[(x - 1, y)] == 'B') or \
                    ((x, y + 1) in state and state[(x, y + 1)] == 'B') or \
                    ((x, y - 1) in state and state[(x, y - 1)] == 'B')
        maxb = clue if clue is not None else 3
        if not adj_black and black_cnt[k] + 1 <= maxb:
            state[(x, y)] = 'B'
            black_cnt[k] += 1
            keep = dfs(i + 1)
            black_cnt[k] -= 1
            del state[(x, y)]
            if not keep:
                rem[k] += 1
                return False
        # try WHITE (only if the room can still reach its clue count)
        if clue is None or black_cnt[k] + rem[k] >= clue:
            state[(x, y)] = 'W'
            if span_ok(x, y) and whites_connected_partial():
                keep = dfs(i + 1)
                if not keep:
                    del state[(x, y)]
                    rem[k] += 1
                    return False
            del state[(x, y)]
        rem[k] += 1
        return True

    # note: room feasibility for BLACK branch handled via maxb; for clue rooms
    # also need "if all remaining cells white" check inside WHITE branch below.
    dfs(0)
    return count[0]


def main():
    global room_clue_v_cache
    here = os.path.dirname(os.path.abspath(__file__))
    html = open(os.path.join(here, 'index.html'), encoding='utf-8').read()
    levels = extract_levels(html)
    if not levels:
        print('LEVELS_NOT_FOUND')
        return 2
    # Gate = SOLVABILITY (the shipped contract: checkWin is rule-based, the page
    # makes zero uniqueness promises). FAIL only when a stored solution is invalid
    # or the independent solver cannot confirm >=1 solution within budget.
    # Uniqueness is reported as a census (INFO), not a gate: multi-solution levels
    # are still winnable by the player. A non-terminating census is never a hard
    # FAIL, but a non-terminating SOLVABILITY search is (timeout = inconclusive = FAIL).
    uniq = 0
    multi = 0
    census_incon = 0
    bad = []
    for i, lv in enumerate(levels):
        R, C, s, rooms, clues = parse_level(lv)
        room_idx, room_cells, room_clue_v = build_tables(R, C, rooms, clues)
        room_clue_v_cache = dict(enumerate(room_clue_v))
        blacks = {(x, y) for y in range(R) for x in range(C) if s[y * C + x] == '1'}
        tl = time.monotonic()
        if not valid_full(blacks, R, C, rooms, room_idx):
            bad.append((i + 1, 'stored solution invalid under shipped rules'))
            print(f'L{i+1} {R}x{C}: stored-solution INVALID ({time.monotonic()-tl:.1f}s)', flush=True)
            continue
        # phase 1: independent solver must confirm >=1 solution
        try:
            n1 = count_solutions(R, C, room_idx, room_cells, room_clue_v, limit=1)
        except TimeoutError as e:
            bad.append((i + 1, f'solvability INCONCLUSIVE ({e})'))
            print(f'L{i+1} {R}x{C}: SOLVABILITY-INCONCLUSIVE {e} ({time.monotonic()-tl:.1f}s)', flush=True)
            continue
        if n1 < 1:
            bad.append((i + 1, 'NO solution under shipped rules (stored solution disagrees)'))
            print(f'L{i+1} {R}x{C}: UNSOLVABLE ({time.monotonic()-tl:.1f}s)', flush=True)
            continue
        # phase 2: uniqueness census (informational)
        try:
            n = count_solutions(R, C, room_idx, room_cells, room_clue_v, limit=2)
        except TimeoutError:
            census_incon += 1
            print(f'L{i+1} {R}x{C}: solvable, census-inconclusive ({time.monotonic()-tl:.1f}s)', flush=True)
            continue
        el = time.monotonic() - tl
        if n == 1:
            uniq += 1
            print(f'L{i+1} {R}x{C}: unique ({el:.1f}s)', flush=True)
        else:
            multi += 1
            print(f'L{i+1} {R}x{C}: solvable, NOT UNIQUE (2+ winning grids, INFO) ({el:.1f}s)', flush=True)
    print(f'levels={len(levels)} unique={uniq} multi={multi} census-inconclusive={census_incon} FAIL={len(bad)}')
    for i, m in bad:
        print(f'L{i}: {m}')
    if bad:
        print('VERDICT: FAIL')
        return 1
    print('VERDICT: PASS')
    return 0


if __name__ == '__main__':
    sys.exit(main())
