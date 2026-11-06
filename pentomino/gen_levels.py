#!/usr/bin/env python3
"""Generate both shipped catalogs deterministically (default seed: 42).

Usage: python3 pentomino/gen_levels.py [--seed SEED]
Geometry comes directly from index.html's allOrientationsLocal via Node.js.
No generated catalog is an input; deleting either output is safe.
"""
import argparse
import json
import random
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
TIERS = ('Beginner', 'Easy', 'Medium', 'Hard', 'Expert')
# Guard the corrected definition, while sourcing every orientation from the engine.
N = [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1]]


def engine_geometry():
    geometry = json.loads(subprocess.check_output(
        ['node', str(HERE / 'verify_catalog.js'), '--geometry'], text=True))
    assert geometry['shapes']['N'] == N
    return geometry


def normalize(cells):
    """Translation only, matching normalizePiece in the engine."""
    min_r = min(r for r, c in cells)
    min_c = min(c for r, c in cells)
    return tuple(sorted((r - min_r, c - min_c) for r, c in cells))


def count_solutions(level, orientations, cap=2, outline_anchors_only=False):
    cells = [(r, c) for r, row in enumerate(level['outline'])
             for c, ch in enumerate(row) if ch == '#']
    index = {cell: i for i, cell in enumerate(cells)}
    columns = [[] for _ in range(len(cells) + len(level['pieces']))]
    for piece_i, name in enumerate(level['pieces']):
        for orient in orientations[name]:
            for r in range(level['rows']):
                for c in range(level['cols']):
                    if outline_anchors_only and (r, c) not in index:
                        continue
                    placed = [(r + dr, c + dc) for dr, dc in orient]
                    if not all(cell in index for cell in placed):
                        continue
                    indices = [index[cell] for cell in placed] + [len(cells) + piece_i]
                    mask = sum(1 << i for i in indices)
                    for i in indices:
                        columns[i].append(mask)
    full = (1 << len(columns)) - 1

    def search(used):
        if used == full:
            return 1
        best = None
        for i, options in enumerate(columns):
            if used & (1 << i):
                continue
            available = [mask for mask in options if not mask & used]
            if not available:
                return 0
            if best is None or len(available) < len(best):
                best = available
            if len(best) == 1:
                break
        count = 0
        for mask in best:
            count += search(used | mask)
            if count >= cap:
                return cap
        return count

    return search(0)


def grow_level(pieces, tier, orientations, rng):
    """Grow a connected region from legal, non-overlapping engine placements."""
    board = {}
    for name in pieces:
        candidates = []
        if not board:
            orient = rng.choice(orientations[name])
            board.update({tuple(cell): name for cell in orient})
            continue
        border = sorted({(r + dr, c + dc) for r, c in board
                         for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1))
                         if (r + dr, c + dc) not in board})
        for orient in orientations[name]:
            anchors = sorted({(r - dr, c - dc) for r, c in border for dr, dc in orient})
            for ar, ac in anchors:
                placed = [(ar + dr, ac + dc) for dr, dc in orient]
                if any(cell in board for cell in placed):
                    continue
                all_cells = list(board) + placed
                height = max(r for r, c in all_cells) - min(r for r, c in all_cells) + 1
                width = max(c for r, c in all_cells) - min(c for r, c in all_cells) + 1
                if height <= 7 and width <= 9:
                    candidates.append((height * width, placed))
        if not candidates:
            return None
        # Prefer compact boards, retaining variety between equally compact fits.
        area = min(area for area, _ in candidates)
        placed = rng.choice([p for a, p in candidates if a <= area + 2])
        board.update({cell: name for cell in placed})
    min_r = min(r for r, c in board)
    min_c = min(c for r, c in board)
    board = {(r - min_r, c - min_c): name for (r, c), name in board.items()}
    rows = max(r for r, c in board) + 1
    cols = max(c for r, c in board) + 1
    return dict(rows=rows, cols=cols,
                outline=[''.join('#' if (r, c) in board else '.' for c in range(cols)) for r in range(rows)],
                pieces=pieces,
                solution=[''.join(board.get((r, c), '.') for c in range(cols)) for r in range(rows)],
                tier=tier)


def identity(level):
    return (level['rows'], level['cols'], tuple(level['outline']), tuple(sorted(level['pieces'])))


def generate(geometry, seed):
    rng = random.Random(seed)
    levels, seen = [], set()
    for count, tier in enumerate(TIERS, 1):
        for slot in range(6):
            for _ in range(10000):
                # Six distinct introductory shapes, including the corrected N.
                pieces = [['I', 'L', 'N', 'P', 'T', 'Y'][slot]] if count == 1 else rng.sample(geometry['order'], count)
                level = grow_level(pieces, tier, geometry['orientations'], rng)
                if (level and identity(level) not in seen
                        and count_solutions(level, geometry['orientations']) == 1
                        # Existing verifiers only try anchors inside the region.
                        # Retain puzzles whose valid cover they can also discover.
                        and count_solutions(level, geometry['orientations'], outline_anchors_only=True) == 1):
                    seen.add(identity(level))
                    levels.append(level)
                    break
            else:
                raise RuntimeError(f'Unable to generate {tier} level {slot + 1}')
    return levels


def encode(levels, order):
    # The actual engine expects piece NAMES in p; s contains PIECE_ORDER indices.
    return [dict(n=i + 1, t=lv['tier'], c=lv['cols'], r=lv['rows'],
                 o=[int(ch == '#') for row in lv['outline'] for ch in row],
                 p=lv['pieces'],
                 s=[order.index(ch) if ch != '.' else -1 for row in lv['solution'] for ch in row])
            for i, lv in enumerate(levels)]


def self_check(geometry):
    """Read back BOTH written encodings, validate covers, and solve every level."""
    levels = json.loads((HERE / 'levels.json').read_text())['levels']
    runtime = (HERE / 'levels-data.js').read_text()
    compact = json.loads(runtime.removeprefix('const LEVELS=').strip().removesuffix(';'))
    assert len(levels) == len(compact) == 30
    assert len({identity(lv) for lv in levels}) == 30
    order = geometry['order']
    for i, (lv, data) in enumerate(zip(levels, compact)):
        assert data == encode([lv], order)[0] | {'n': i + 1}, f'Encoding mismatch at {i}'
        assert lv['tier'] == TIERS[i // 6] and len(lv['pieces']) == i // 6 + 1
        assert len(set(lv['pieces'])) == len(lv['pieces'])
        assert len(lv['outline']) == len(lv['solution']) == lv['rows']
        for outline, solution in zip(lv['outline'], lv['solution']):
            assert len(outline) == len(solution) == lv['cols']
            assert all((a == '#') == (b != '.') for a, b in zip(outline, solution))
            assert all(ch == '.' or ch in lv['pieces'] for ch in solution)
        for name in lv['pieces']:
            cells = [(r, c) for r, row in enumerate(lv['solution']) for c, ch in enumerate(row) if ch == name]
            assert len(cells) == 5
            assert normalize(cells) in [normalize(o) for o in geometry['orientations'][name]]
        assert count_solutions(lv, geometry['orientations']) == 1, f'Not uniquely solvable: {i}'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--seed', type=int, default=42)
    args = parser.parse_args()
    geometry = engine_geometry()
    levels = generate(geometry, args.seed)
    (HERE / 'levels.json').write_text(json.dumps({'levels': levels}, indent=2) + '\n')
    (HERE / 'levels-data.js').write_text('const LEVELS=' + json.dumps(encode(levels, geometry['order']), separators=(',', ':')) + ';\n')
    self_check(geometry)
    print(f'PASS: generated 30 levels (seed {args.seed}); both encodings agree; 0 duplicates; all stored covers valid; 30 uniquely solvable')
    print('Tiers: Beginner=6 (1 piece), Easy=6 (2), Medium=6 (3), Hard=6 (4), Expert=6 (5)')


if __name__ == '__main__':
    main()
