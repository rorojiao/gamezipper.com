#!/usr/bin/env python3
"""
R339: is the SHIPPED tapa clue grid even SATISFIABLE?

The engine's checkWin() compares the player's grid against the stored `sol`.
If the shipped clue grid admits NO grid at all (or admits one that differs
from `sol`), the level is unwinnable / unwinnable-by-reasoning.

This uses the solver from tapa/gen.py (the canonical rule implementation)
against the SHIPPED inline clue grids — a different question from the
coherence check, which only asked whether `sol` satisfies its own clues.

Usage: python3 .audit/r339-tapa-solvability.py [path-to-tapa-dir]
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAPA = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tapa')

sys.path.insert(0, TAPA)
import gen as G  # noqa: E402  (canonical solver + rule, from the game dir)


def load_inline_levels(html_path):
    with open(html_path, errors='replace') as f:
        html = f.read()
    m = re.search(r'const\s+LEVELS\s*=\s*\[', html)
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


def main():
    html = os.path.join(TAPA, 'index.html')
    levels = load_inline_levels(html)
    print('SHIPPED-INLINE solvability of %s' % html)
    print('levels: %d' % len(levels))
    print()
    unsat = []
    multi = []
    unknown = []
    ok = 0
    for lv in levels:
        n = lv['size']
        sols, exhausted = G.solve(lv['clue'], n, limit=2, time_budget=25.0)
        if not exhausted:
            unknown.append(lv['id'])
            verdict = 'UNPROVEN'
        elif len(sols) == 0:
            unsat.append(lv['id'])
            verdict = 'NO SOLUTION (unwinnable)'
        elif len(sols) == 1:
            rows = G.rows_from_sol(lv['sol'], n)
            if sols[0] == rows:
                ok += 1
                verdict = 'OK (unique == stored sol)'
            else:
                multi.append(lv['id'])
                verdict = 'unique solution DIFFERS from stored sol'
        else:
            multi.append(lv['id'])
            verdict = 'MULTIPLE solutions'
        print('  %-10s n=%-3d %s' % (lv['id'], n, verdict))
    print()
    print('unique-and-equal-to-stored-sol : %d/%d' % (ok, len(levels)))
    print('NO SOLUTION (unwinnable)        : %d  %s' % (len(unsat), unsat))
    print('rival / mismatched solution     : %d  %s' % (len(multi), multi))
    print('UNPROVEN (budget hit)           : %d  %s' % (len(unknown), unknown))
    return 0


if __name__ == '__main__':
    sys.exit(main())
