#!/usr/bin/env python3
"""Rail Pool level generator - clean spiral-based approach."""
import json, random, sys

N,E,S,W = 'N','E','S','W'
OPPOSITE = {N:S, S:N, E:W, W:E}
DELTA = {N:(-1,0), S:(1,0), E:(0,1), W:(0,-1)}


def make_loop(R, C, rng):
    """Build a Hamiltonian cycle on R x C grid using DFS with Warnsdorff heuristic.
    Requires R*C even (at least one dimension even)."""
    if R * C % 2 != 0:
        raise ValueError(f"Grid {R}x{C}={R*C} has odd cell count")
    return _hamiltonian_dfs(R, C, rng)


def _hamiltonian_dfs(R, C, rng):
    """DFS with Warnsdorff heuristic to find Hamiltonian cycle.
    Start at (0,0), end by closing back to (0,0)."""
    grid = [[None]*C for _ in range(R)]
    visited = [[False]*C for _ in range(R)]
    directions = [('E', 0, 1), ('S', 1, 0), ('W', 0, -1), ('N', -1, 0)]
    directions = list(rng.sample(directions, len(directions)))  # randomize order

    def neighbors(r, c):
        result = []
        for d, dr, dc in directions:
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C and not visited[nr][nc]:
                result.append((d, nr, nc))
        return result

    def opposite(d):
        return {'N':'S','S':'N','E':'W','W':'E'}[d]

    deadline = [None]

    def dfs(r, c, entry, count):
        if deadline[0] is not None:
            return False
        if count == R * C:
            # Check if (r,c) is adjacent to (0,0)
            for d, dr, dc in directions:
                if r + dr == 0 and c + dc == 0:
                    grid[r][c] = (entry, d)
                    grid[0][0] = (opposite(d), grid[0][0][1])
                    return True
            return False
        candidates = neighbors(r, c)
        if not candidates:
            return False
        # Warnsdorff: prefer neighbors with fewest onward options
        scored = []
        for d, nr, nc in candidates:
            visited[nr][nc] = True
            onward = len(neighbors(nr, nc))
            scored.append((onward, d, nr, nc))
            visited[nr][nc] = False
        scored.sort()
        for _, d, nr, nc in scored:
            visited[nr][nc] = True
            prev_exit = grid[r][c][1] if grid[r][c] else None
            grid[r][c] = (entry, d)
            if dfs(nr, nc, opposite(d), count + 1):
                return True
            grid[r][c] = (entry, prev_exit) if prev_exit else (entry, None)
            visited[nr][nc] = False
        return False

    visited[0][0] = True
    grid[0][0] = ('N', None)
    if dfs(0, 0, 'N', 1):
        return grid
    raise RuntimeError(f"DFS failed on {R}x{C}")


def _spiral_path(R, C):
    """Generate a Hamiltonian cycle as a list of (r,c) in walk order.
    Uses clockwise spiral with inward termination. Returns None if no cycle exists."""
    if R < 2 or C < 2:
        return None
    path = []
    visited = [[False]*C for _ in range(R)]

    def spiral(r0, c0, r1, c1):
        if r0 > r1 or c0 > c1:
            return
        if r0 == r1:
            for c in range(c0, c1 + 1):
                if not visited[r0][c]:
                    path.append((r0, c))
                    visited[r0][c] = True
            return
        if c0 == c1:
            for r in range(r0, r1 + 1):
                if not visited[r][c0]:
                    path.append((r, c0))
                    visited[r][c0] = True
            return
        # Top row: left to right
        for c in range(c0, c1 + 1):
            if not visited[r0][c]:
                path.append((r0, c))
                visited[r0][c] = True
        # Right col: top+1 to bottom
        for r in range(r0 + 1, r1 + 1):
            if not visited[r][c1]:
                path.append((r, c1))
                visited[r][c1] = True
        # Bottom row: right-1 to left
        for c in range(c1 - 1, c0 - 1, -1):
            if not visited[r1][c]:
                path.append((r1, c))
                visited[r1][c] = True
        # Left col: bottom-1 to top+1
        for r in range(r1 - 1, r0, -1):
            if not visited[r][c0]:
                path.append((r, c0))
                visited[r][c0] = True
        spiral(r0 + 1, c0 + 1, r1 - 1, c1 - 1)

    spiral(0, 0, R - 1, C - 1)
    if len(path) != R * C:
        return None
    last = path[-1]
    first = path[0]
    if abs(last[0] - first[0]) + abs(last[1] - first[1]) != 1:
        return None
    return path


def _direction_from_to(a, b):
    dr, dc = b[0] - a[0], b[1] - a[1]
    if dr == -1: return 'N'
    if dr == 1: return 'S'
    if dc == -1: return 'W'
    if dc == 1: return 'E'
    return None


def get_segments(grid, R, C):
    """Return list of MAXIMAL straight segments (split at each bend).
    A segment is a maximal run of consecutive cells going in the same direction (N/E/S/W).
    Walk follows the loop's exit direction; segments wrap around at the loop closure.
    This matches the JS verifier's behavior.
    """
    # First, build the path by walking the loop from (0,0)
    # Find any starting cell (use (0,0))
    if grid[0][0] is None or grid[0][0][1] is None:
        return []
    path = []
    cr, cc = 0, 0
    visited = set()
    for _ in range(R * C * 4):
        if (cr, cc) in visited:
            break
        visited.add((cr, cc))
        path.append((cr, cc))
        entry, exit_ = grid[cr][cc]
        if exit_ is None:
            break
        dr, dc = DELTA[exit_]
        cr, cc = cr + dr, cc + dc

    if len(path) != R * C:
        return []

    # Now split into straight segments
    segments = []
    current = [path[0]]
    prev_dir = None
    for i in range(1, len(path)):
        pr, pc = path[i-1]
        cr, cc = path[i]
        if cr == pr + 1: d = 'S'
        elif cr == pr - 1: d = 'N'
        elif cc == pc + 1: d = 'E'
        elif cc == pc - 1: d = 'W'
        else: d = None
        if prev_dir is None:
            prev_dir = d
        if d == prev_dir:
            current.append((cr, cc))
        else:
            if len(current) >= 2:
                segments.append(current)
            current = [(cr, cc)]
            prev_dir = d
    # Check wrap-around: last cell -> first cell
    if len(path) >= 2:
        last_r, last_c = path[-1]
        first_r, first_c = path[0]
        if first_r == last_r + 1: wrap_d = 'S'
        elif first_r == last_r - 1: wrap_d = 'N'
        elif first_c == last_c + 1: wrap_d = 'E'
        elif first_c == last_c - 1: wrap_d = 'W'
        else: wrap_d = None
        if wrap_d == prev_dir and len(current) >= 1:
            # First, push `current` (which doesn't include path[0])
            if len(current) >= 2:
                segments.append(current)
            # Then build wrap_seg starting from path[0]
            wrap_seg = [path[0]]
            d = wrap_d
            for i in range(1, len(path)):
                pr, pc = path[i-1]
                cr, cc = path[i]
                if cr == pr + 1: nd = 'S'
                elif cr == pr - 1: nd = 'N'
                elif cc == pc + 1: nd = 'E'
                elif cc == pc - 1: nd = 'W'
                else: nd = None
                if nd == d:
                    wrap_seg.append((cr, cc))
                else:
                    break
            if len(wrap_seg) >= 2:
                segments.append(wrap_seg)
        else:
            if len(current) >= 2:
                segments.append(current)
    else:
        if len(current) >= 2:
            segments.append(current)
    return segments


def make_regions(R, C, rng, segments, num_regions):
    if not segments:
        return None
    regions = [[0]*C for _ in range(R)]
    rng.shuffle(segments)
    anchors = []
    used = set()
    for seg in segments:
        cells = set(seg)
        if not (cells & used):
            anchors.append(seg)
            used |= cells
        if len(anchors) >= num_regions:
            break
    if len(anchors) < num_regions:
        for seg in segments:
            if len(anchors) >= num_regions:
                break
            if seg not in anchors:
                anchors.append(seg)
    for i, seg in enumerate(anchors):
        rid = i + 1
        for (r, c) in seg:
            regions[r][c] = rid
    queue = []
    for r in range(R):
        for c in range(C):
            if regions[r][c] > 0:
                for d in DELTA.values():
                    nr, nc = r+d[0], c+d[1]
                    if 0 <= nr < R and 0 <= nc < C and regions[nr][nc] == 0:
                        queue.append((nr, nc, regions[r][c]))
    unassigned_count = sum(1 for r in range(R) for c in range(C) if regions[r][c] == 0)
    idx = 0
    while unassigned_count > 0 and queue:
        if idx >= len(queue):
            break
        r, c, rid = queue[idx]
        idx += 1
        if regions[r][c] != 0:
            continue
        regions[r][c] = rid
        unassigned_count -= 1
        for d in DELTA.values():
            nr, nc = r+d[0], c+d[1]
            if 0 <= nr < R and 0 <= nc < C and regions[nr][nc] == 0:
                if not any(q[0]==nr and q[1]==nc and q[2]==rid for q in queue[idx:]):
                    queue.append((nr, nc, rid))
    for r in range(R):
        for c in range(C):
            if regions[r][c] == 0:
                for d in DELTA.values():
                    nr, nc = r+d[0], c+d[1]
                    if 0 <= nr < R and 0 <= nc < C and regions[nr][nc] > 0:
                        regions[r][c] = regions[nr][nc]
                        break
                if regions[r][c] == 0:
                    regions[r][c] = 1
    return regions


def get_region_segments(segments, regions, R, C):
    result = {}
    for seg in segments:
        rids = set()
        for (r, c) in seg:
            rids.add(regions[r][c])
        if len(rids) == 1:
            rid = next(iter(rids))
            if rid > 0:
                result.setdefault(rid, []).append(len(seg))
    return result


def generate_level(R, C, rng, tier, number):
    for attempt in range(5):
        try:
            grid = make_loop(R, C, rng)
        except (ValueError, RuntimeError):
            continue
        if any(grid[r][c] is None for r in range(R) for c in range(C)):
            continue
        segments = get_segments(grid, R, C)
        if not segments:
            continue
        target = max(3, min(8, R*C // 4))
        regions = make_regions(R, C, rng, segments, target)
        if regions is None:
            continue
        region_segs = get_region_segments(segments, regions, R, C)
        clues = []
        for rid, lens in region_segs.items():
            unique_lens = sorted(set(lens))
            if not unique_lens:
                continue
            cells = [(r, c) for r in range(R) for c in range(C) if regions[r][c] == rid]
            rng.shuffle(cells)
            num_clues = min(rng.randint(1, 2), len(unique_lens), len(cells))
            for i in range(num_clues):
                val = unique_lens[i] if i < len(unique_lens) else unique_lens[0]
                clues.append({'r': cells[i][0], 'c': cells[i][1], 'vals': [val]})
        if not clues:
            continue
        return {
            'size': [R, C],
            'regions': regions,
            'clues': clues,
            'solution_entry': [[grid[r][c][0] for c in range(C)] for r in range(R)],
            'solution_exit':  [[grid[r][c][1] for c in range(C)] for r in range(R)],
            'tier': tier,
            'number': number,
        }
    return None


def main():
    rng = random.Random(20260709)
    tiers = [
        ('Beginner', 5, 6, 6),   # 30 cells
        ('Easy',     6, 6, 6),   # 36 cells
        ('Medium',   6, 7, 6),   # 42 cells
        ('Hard',     7, 8, 6),   # 56 cells
        ('Expert',   8, 8, 6),   # 64 cells
    ]
    levels = []
    number = 1
    for tier, R, C, count in tiers:
        for _ in range(count):
            lvl = generate_level(R, C, rng, tier, number)
            if lvl is None:
                print(f"WARN: failed {tier} #{number}", file=sys.stderr)
                continue
            levels.append(lvl)
            n_regions = max(max(row) for row in lvl['regions'])
            print(f"  {tier} #{number}: {R}x{C} regions={n_regions} clues={len(lvl['clues'])}", file=sys.stderr)
            number += 1
    out = {'levels': levels}
    with open('levels.json', 'w') as f:
        json.dump(out, f, separators=(',', ':'))
    print(f"Wrote {len(levels)} levels", file=sys.stderr)


if __name__ == '__main__':
    main()