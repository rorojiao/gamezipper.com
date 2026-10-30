#!/usr/bin/env python3
"""
R339 — lineage diagnosis for the tapa catalog.

There are up to FOUR distinct "catalogs" in play:
  A) HEAD:tapa/levels.json          (committed)
  B) worktree tapa/levels.json      (uncommitted)
  C) inline const LEVELS in index.html  (WHAT PLAYERS ACTUALLY PLAY)
  D) production https://gamezipper.com/tapa/

For each, report: key name (sol vs solution), level count, ring-coherence of
`clue` vs `sol`, arithmetic feasibility, connectivity / no-2x2 validity of `sol`,
and whether the CLUE GRID is solvable at all.

Then test the TRANSFORMATION hypothesis: is the shipped `clue` grid consistent
with the shipped `sol` grid under some spatial transform (transpose / flip /
rot90) and under the ROW-MAJOR rule (what tapa/build_levels.py computes) instead
of the standard CLOCKWISE-RING rule (what the engine enforces)?
"""
import json
import os
import re
import subprocess
import sys

ROOT = '/home/junze/gamezipper.com'
RING = [(-1, -1), (-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1)]
ROWMAJOR = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def ring_runs(board, n, r, c, order):
    seq = []
    for dr, dc in order:
        rr, cc = r + dr, c + dc
        seq.append(1 if (0 <= rr < n and 0 <= cc < n and board[rr][cc] == 1) else 0)
    if not any(seq):
        return []
    if all(seq):
        return [8]
    start = seq.index(0)
    runs, cur = [], 0
    for k in range(8):
        v = seq[(start + k) % 8]
        if v:
            cur += 1
        elif cur:
            runs.append(cur)
            cur = 0
    if cur:
        runs.append(cur)
    return runs


def clue_to_runs(clue):
    """'111' -> [1,1,1]; '2' -> [2]; '.' -> None (undetermined)."""
    if clue in ('.', '#', '', None):
        return None
    return [int(ch) for ch in str(clue)]


def parse_clue_cell(raw):
    """The engine stores a clue cell as a string of digits, one per run."""
    if raw in ('.', '#', '', None):
        return None
    return [int(ch) for ch in str(raw)]


def board_from_sol(lv, n):
    sol = lv.get('sol') or lv.get('solution')
    return sol


def connected(board, n):
    blacks = [(r, c) for r in range(n) for c in range(n) if board[r][c] == 1]
    if not blacks:
        return False
    seen = {blacks[0]}
    stack = [blacks[0]]
    while stack:
        r, c = stack.pop()
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and board[nr][nc] == 1 and (nr, nc) not in seen:
                seen.add((nr, nc))
                stack.append((nr, nc))
    return len(seen) == len(blacks)


def has_2x2(board, n):
    for r in range(n - 1):
        for c in range(n - 1):
            if board[r][c] == 1 and board[r + 1][c] == 1 and board[r][c + 1] == 1 and board[r + 1][c + 1] == 1:
                return True
    return False


def analyse(name, levels):
    print('=' * 72)
    print('CATALOG %s   levels=%d' % (name, len(levels)))
    if not levels:
        print('  (empty)')
        return {}
    keys = set()
    for lv in levels:
        keys |= set(lv.keys())
    print('  keys seen: %s' % sorted(keys))

    ring_ok = row_ok = 0
    impossible = 0
    sol_connected = sol_no2x2 = 0
    for lv in levels:
        n = lv.get('size') or len(lv['sol'])
        sol = board_from_sol(lv, n)
        clue = lv['clue']
        for r in range(n):
            for c in range(n):
                want = parse_clue_cell(clue[r][c])
                if want is None:
                    continue
                if sum(want) > 8:
                    impossible += 1
                    continue
                if ring_runs(sol, n, r, c, RING) == want:
                    ring_ok += 1
                if ring_runs(sol, n, r, c, ROWMAJOR) == want:
                    row_ok += 1
        if connected(sol, n):
            sol_connected += 1
        if not has_2x2(sol, n):
            sol_no2x2 += 1
    n_lv = len(levels)
    print('  clue cells matching RING rule   : %d' % ring_ok)
    print('  clue cells matching ROW-MAJOR rule: %d' % row_ok)
    print('  arithmetically impossible clues  : %d' % impossible)
    print('  sol connected  : %d/%d' % (sol_connected, n_lv))
    print('  sol no-2x2     : %d/%d' % (sol_no2x2, n_lv))
    return {'ring_ok': ring_ok, 'row_ok': row_ok, 'impossible': impossible}


def extract_inline(html_path):
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


def load_json_levels(obj):
    if isinstance(obj, dict):
        for k in ('levels', 'puzzles', 'LEVELS'):
            if k in obj:
                return obj[k]
    return obj


def main():
    variants = {}

    head = subprocess.run(['git', '-C', ROOT, 'show', 'HEAD:tapa/levels.json'],
                          capture_output=True, text=True)
    if head.returncode == 0:
        variants['A) HEAD:tapa/levels.json'] = load_json_levels(json.loads(head.stdout))

    wpath = os.path.join(ROOT, 'tapa/levels.json')
    if os.path.exists(wpath):
        variants['B) worktree tapa/levels.json'] = load_json_levels(json.load(open(wpath)))

    variants['C) inline in tapa/index.html'] = extract_inline(os.path.join(ROOT, 'tapa/index.html'))

    prod = '/tmp/tapa-live-levels.json'
    if os.path.exists(prod):
        variants['D) production inline'] = load_json_levels(json.load(open(prod)))

    for name, lv in variants.items():
        analyse(name, lv)

    # --- transformation hypothesis on the SHIPPED inline ---
    ship = variants.get('C) inline in tapa/index.html') or []
    if ship:
        print()
        print('=' * 72)
        print('TRANSFORMATION HYPOTHESIS (shipped inline)')
        transforms = {
            'identity': lambda b, n: b,
            'transpose': lambda b, n: [[b[c][r] for c in range(n)] for r in range(n)],
            'flipH': lambda b, n: [row[::-1] for row in b],
            'flipV': lambda b, n: b[::-1],
            'rot180': lambda b, n: [row[::-1] for row in b[::-1]],
            'rot90': lambda b, n: [[b[n - 1 - c][r] for c in range(n)] for r in range(n)],
            'rot270': lambda b, n: [[b[c][n - 1 - r] for c in range(n)] for r in range(n)],
        }
        for tname, fn in transforms.items():
            for oname, order in (('RING', RING), ('ROWMAJOR', ROWMAJOR)):
                hits = 0
                total = 0
                for lv in ship:
                    n = lv.get('size') or len(lv['sol'])
                    sol = fn(board_from_sol(lv, n), n)
                    clue = lv['clue']
                    for r in range(n):
                        for c in range(n):
                            want = parse_clue_cell(clue[r][c])
                            if want is None:
                                continue
                            total += 1
                            if ring_runs(sol, n, r, c, order) == want:
                                hits += 1
                pct = (100.0 * hits / total) if total else 0
                flag = '  <== MATCH' if pct > 99.0 else ''
                print('  %-10s + %-9s : %d/%d (%.1f%%)%s' % (tname, oname, hits, total, pct, flag))


if __name__ == '__main__':
    main()
