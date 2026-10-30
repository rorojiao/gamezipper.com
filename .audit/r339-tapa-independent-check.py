#!/usr/bin/env python3
"""
R339 INDEPENDENT Tapa catalog checker — written from scratch, no import of
tapa/gen.py or .audit/r338-tapa-inject.js.

Purpose: prove (or disprove) the claim that the shipped `tapa` catalog is
UNSATISFIABLE, using a THIRD implementation of the standard Tapa rule so that
a bug in gen.py or in r338-tapa-inject.js cannot masquerade as the P0.

STANDARD TAPA RULE (https://www.gmpuzzles.com/blog/tapa-rules-and-info/):
  * A numbered cell is WHITE and describes the shaded cells among its 8
    surrounding neighbours.
  * The 8 neighbours form a RING, read CLOCKWISE from NW:
        NW N NE E SE S SW W  (and back to NW)
  * Off-grid neighbours count as UNSHADED and break a run.
  * A number is the MULTISET of the lengths of the shaded runs around it.
    "1"  = one run of length 1
    "11" = two runs of length 1
    "12" = one run of length 1 and one run of length 2
  * "0" = no neighbour is shaded.
  * The shaded cells form ONE 4-connected region and contain no 2x2 block.

The engine's checkWin() is a SOLUTION-COMPARE over the playable ('.') cells
only, so what must hold for the level to be winnable BY REASONING is:
  (A) the stored solution satisfies its own clue grid   [rule coherence]
  (B) the clue grid admits the stored solution as its UNIQUE completion
      [no rival answer that a reasoning player could legitimately reach]
  (C) the puzzle is not degenerate (there is a real decision to make)

This script measures (A) and a cheap form of (C) for every level, and it
ALSO reports the arithmetic-impossibility count (a clue that demands more
shaded neighbours than the cell physically has) which is a property of the
clue grid alone and needs no solution at all.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# clockwise from NW: NW N NE E SE S SW W
RING = [(-1, -1), (-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1)]


def ring_bits(shaded, n, r, c):
    """8 ring neighbours of (r,c) clockwise from NW, as 0/1. Off-grid = 0."""
    out = []
    for dr, dc in RING:
        nr, nc = r + dr, c + dc
        if 0 <= nr < n and 0 <= nc < n:
            out.append(1 if shaded[nr][nc] else 0)
        else:
            out.append(0)
    return out


def runs_circular(bits):
    """Maximal runs of 1s around the 8-ring (the ring IS a cycle)."""
    if not any(bits):
        return []
    if all(bits):
        return [8]
    # rotate so the sequence starts at a 0 -> no run straddles the wrap
    start = bits.index(0)
    seq = bits[start:] + bits[:start]
    runs, cur = [], 0
    for b in seq:
        if b:
            cur += 1
        else:
            if cur:
                runs.append(cur)
            cur = 0
    if cur:
        runs.append(cur)
    return runs


def clue_digits(cell):
    """Parse a clue cell into the sorted multiset of run lengths it demands."""
    if cell == '0':
        return []
    return sorted(int(ch) for ch in cell)


def load_inline_levels(html_path):
    """Extract the engine's inline `const LEVELS=[...]` literal."""
    with open(html_path, errors='replace') as f:
        html = f.read()
    m = re.search(r'const\s+LEVELS\s*=\s*\[', html)
    if not m:
        raise SystemExit('no inline LEVELS found in %s' % html_path)
    i = html.index('[', m.start())
    depth, instr, j = 0, None, i
    while j < len(html):
        ch = html[j]
        if instr:
            if ch == '\\':
                j += 2
                continue
            if ch == instr:
                instr = None
        else:
            if ch in '"\'`':
                instr = ch
            elif ch == '[':
                depth += 1
            elif ch == ']':
                depth -= 1
                if depth == 0:
                    break
        j += 1
    return json.loads(html[i:j + 1])


def check_level(lv):
    """Return a dict of findings for one level."""
    n = lv['size']
    sol = lv['sol']
    clue = lv['clue']
    out = {'id': lv.get('id'), 'size': n, 'coherent': True, 'problems': [],
           'impossible_cells': 0, 'blank_white': 0, 'blank_shaded': 0}

    # ---- (A) the stored solution must satisfy its own clue grid
    for r in range(n):
        for c in range(n):
            cell = clue[r][c]
            if cell in ('.', '#'):
                continue
            got = sorted(runs_circular(ring_bits(sol, n, r, c)))
            want = clue_digits(cell)
            if got != want:
                out['coherent'] = False
                out['problems'].append(
                    'clue[%d][%d]=%r demands runs %s but the stored solution gives %s'
                    % (r, c, cell, want, got))

    # ---- arithmetic impossibility: a clue demanding more shaded neighbours
    #      than the cell physically has. Property of the clue grid alone.
    for r in range(n):
        for c in range(n):
            cell = clue[r][c]
            if cell in ('.', '#'):
                continue
            want = clue_digits(cell)
            # how many of the 8 ring positions are on-grid at all
            ongrid = 0
            for dr, dc in RING:
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n:
                    ongrid += 1
            if sum(want) > ongrid:
                out['impossible_cells'] += 1
            if want and max(want) > ongrid:
                out['impossible_cells'] += 0  # counted via sum above
            # a numbered cell must itself be white in the solution
            if sol[r][c] == 1:
                out['coherent'] = False
                out['problems'].append(
                    'clue[%d][%d]=%r is a numbered cell but the solution shades it' % (r, c, cell))

    # ---- (C) degeneracy: how many playable cells are white vs shaded in the
    #      stored solution. If EVERY playable cell is shaded, the puzzle is
    #      "shade everything" and teaches nothing.
    for r in range(n):
        for c in range(n):
            if clue[r][c] == '.':
                if sol[r][c] == 1:
                    out['blank_shaded'] += 1
                else:
                    out['blank_white'] += 1

    # ---- shaded region sanity
    shaded_cells = [(r, c) for r in range(n) for c in range(n) if sol[r][c] == 1]
    if shaded_cells:
        seen = set()
        stack = [shaded_cells[0]]
        while stack:
            r, c = stack.pop()
            if (r, c) in seen:
                continue
            seen.add((r, c))
            for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n and sol[nr][nc] == 1 and (nr, nc) not in seen:
                    stack.append((nr, nc))
        if len(seen) != len(shaded_cells):
            out['coherent'] = False
            out['problems'].append('shaded region is not 4-connected')
    for r in range(n - 1):
        for c in range(n - 1):
            if sol[r][c] and sol[r][c + 1] and sol[r + 1][c] and sol[r + 1][c + 1]:
                out['coherent'] = False
                out['problems'].append('2x2 all-shaded block at (%d,%d)' % (r, c))
    return out


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tapa', 'index.html')
    levels = load_inline_levels(src)
    print('INDEPENDENT CHECK of %s' % src)
    print('levels: %d' % len(levels))
    bad = 0
    total_impossible = 0
    degenerate = 0
    for lv in levels:
        res = check_level(lv)
        total_impossible += res['impossible_cells']
        if res['blank_white'] < 2 or res['blank_shaded'] < 2:
            degenerate += 1
        if not res['coherent']:
            bad += 1
            print('  FAIL %-10s n=%-3d problems=%d impossible_cells=%d' %
                  (res['id'], res['size'], len(res['problems']), res['impossible_cells']))
            for p in res['problems'][:3]:
                print('       -', p)
    print()
    print('coherent levels : %d/%d' % (len(levels) - bad, len(levels)))
    print('incoherent      : %d' % bad)
    print('impossible clue cells (total across catalog): %d' % total_impossible)
    print('degenerate levels (blank_white<2 or blank_shaded<2): %d' % degenerate)
    print('VERDICT: %s' % ('PASS — every level is rule-coherent'
                            if bad == 0 else
                            'FAIL — the shipped catalog contradicts its own rules'))
    return 0 if bad == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
