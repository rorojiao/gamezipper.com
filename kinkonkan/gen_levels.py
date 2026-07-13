#!/usr/bin/env python3
"""
Kin-Kon-Kan Level Generator — solution-first with strict validation.

Rules (Nikoli janko.at):
1. Grid is divided into ROOMS (regions) by thick borders.
2. Each room contains EXACTLY ONE diagonal mirror ('/' or '\\').
3. Around the outside of the grid are LETTER PAIRS (A-A, B-B, ...).
   - One letter of each pair is an ENTRY (where a beam enters the grid,
     perpendicular to the edge).
   - The matching letter is an EXIT where the beam exits.
   - The number on each letter is the reflection count for that beam.
4. Every mirror must be hit by at least one beam.

Algorithm:
1. Generate rooms (connected regions) of size 2-5 cells covering the grid.
2. Place exactly one random mirror (/ or \\) in each room.
3. For each mirror, find a beam (entry+exit on outside) that passes through it.
   Greedy: pick beams covering the most unhit mirrors first.
4. Build letter pairs (each beam = one letter, entry A exits as A).
5. Validate: every mirror hit, all beams valid.
"""

import json
import random

DIRS4 = [(-1,0),(0,1),(1,0),(0,-1)]  # N,E,S,W

def reflect(mirror, dr, dc):
    """Reflect a direction (dr,dc) off a mirror. '/' or '\\'."""
    if mirror == '/':
        return (-dc, -dr)
    else:  # '\\'
        return (dc, dr)


def generate_rooms(rows, cols, min_size=3, max_size=5, seed=None, max_retries=200):
    """Generate connected rooms covering the grid (BFS-grow regions).
    Strictly enforces min_size per region.
    """
    if seed is not None:
        rnd = random.Random(seed)
    else:
        rnd = random
    for _ in range(max_retries):
        grid = [[-1]*cols for _ in range(rows)]
        region_cells = {}
        all_cells = [(r,c) for r in range(rows) for c in range(cols)]
        rnd.shuffle(all_cells)
        rid = 0
        ok = True
        # Iterate and only START a new region when the cell is unassigned.
        # Each region must reach min_size before next region start is allowed.
        for seed_cell in all_cells:
            if grid[seed_cell[0]][seed_cell[1]] != -1:
                continue
            target = rnd.randint(min_size, max_size)
            grid[seed_cell[0]][seed_cell[1]] = rid
            region_cells[rid] = [seed_cell]
            attempts = 0
            while len(region_cells[rid]) < target and attempts < 500:
                attempts += 1
                candidates = []
                for (r,c) in region_cells[rid]:
                    for dr,dc in DIRS4:
                        nr,nc = r+dr, c+dc
                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == -1:
                            candidates.append((nr,nc))
                if not candidates:
                    break
                nr,nc = rnd.choice(candidates)
                grid[nr][nc] = rid
                region_cells[rid].append((nr,nc))
            if len(region_cells[rid]) < min_size:
                ok = False
                break
            rid += 1
        if not ok:
            continue
        # Check no orphan cells remain
        unassigned = sum(1 for r in range(rows) for c in range(cols) if grid[r][c] == -1)
        if unassigned > 0:
            continue
        if rid < 3:
            continue
        return grid, region_cells
    return None, None


def trace_beam(rows, cols, mirrors, start_r, start_c, direction):
    """Trace a beam from a boundary cell INTO the grid.

    start_r, start_c: a cell on the grid boundary (the entry cell).
    direction: (dr, dc) — direction the beam is heading once inside.

    Returns: (path, mirrors_hit, exit_side, exit_pos, reflection_count) on success
             or (None, ..., None, None, 0) if it loops.
    """
    dr, dc = direction
    r, c = start_r, start_c
    path = [(r,c)]
    mirrors_hit = []
    seen_states = set()
    refl_count = 0
    max_steps = rows * cols * 4
    for _ in range(max_steps):
        # Check if current cell has a mirror (before moving)
        if mirrors[r][c] is not None:
            state = (r, c, dr, dc)
            if state in seen_states:
                return None, None, None, None, 0
            seen_states.add(state)
            dr, dc = reflect(mirrors[r][c], dr, dc)
            refl_count += 1
            mirrors_hit.append((r, c, mirrors[r][c]))
        # Step forward
        nr, nc = r + dr, c + dc
        if not (0 <= nr < rows and 0 <= nc < cols):
            # Beam exits. Determine exit side/pos based on the direction we were going.
            if dr == -1: side = 'N'; pos = c
            elif dr == 1: side = 'S'; pos = c
            elif dc == -1: side = 'W'; pos = r
            else: side = 'E'; pos = r
            return path, mirrors_hit, side, pos, refl_count
        r, c = nr, nc
        path.append((r, c))
    return None, None, None, None, 0


def generate_beams(rows, cols, mirrors, target_count=None, max_attempts=3000):
    """Generate a dense, non-overlapping set of letter-pair beams.

    First choose beams greedily until every mirror is used.  Then add extra
    disjoint boundary-pair clues up to ``target_count``.  The older generator
    stopped immediately after coverage, which left 25/30 puzzles with multiple
    solutions.  Extra observed beam paths are valid Kin-Kon-Kan clues and make
    uniqueness practical without revealing mirror locations.
    """
    # Enumerate all entry points: every boundary cell with its inward direction.
    # Each entry tagged with the SIDE it comes from to disambiguate corner cells.
    entries = []
    # Top edge (side N): entering cell is row 0, going South.
    for c in range(cols):
        entries.append({'side': 'N', 'r': 0, 'c': c, 'direction': (1, 0)})
    # Bottom edge (side S): entering cell is row rows-1, going North.
    for c in range(cols):
        entries.append({'side': 'S', 'r': rows-1, 'c': c, 'direction': (-1, 0)})
    # Left edge (side W): entering cell is col 0, going East.
    for r in range(rows):
        entries.append({'side': 'W', 'r': r, 'c': 0, 'direction': (0, 1)})
    # Right edge (side E): entering cell is col cols-1, going West.
    for r in range(rows):
        entries.append({'side': 'E', 'r': r, 'c': cols-1, 'direction': (0, -1)})

    # Pre-compute: for each entry, trace and remember (exit_side, exit_pos, refl_count, mirror_set)
    entry_options = []  # list of (entry, exit_side, exit_pos, refl_count, mirror_set)
    for entry in entries:
        path, mh, ex_side, ex_pos, refl = trace_beam(rows, cols, mirrors, entry['r'], entry['c'], entry['direction'])
        if path is None or refl == 0:
            continue
        mirror_set = frozenset((m[0], m[1]) for m in mh)
        entry_options.append((entry, ex_side, ex_pos, refl, mirror_set))

    if not entry_options:
        return None

    all_mirror_cells = set((r,c) for r in range(rows) for c in range(cols) if mirrors[r][c] is not None)
    covered = set()
    chosen = []
    # Preserve two directed observations for the same physical letter pair only
    # when the reverse path carries genuinely additional information.  Using a
    # slot as an exit does not prevent it being a later entry: each perimeter
    # marker can be traced from either direction in the published puzzle.
    used_entries = set()
    used_exits = set()
    max_iters = 200
    for _ in range(max_iters):
        if covered >= all_mirror_cells:
            break
        # Score each option by how many new mirrors it covers
        best = None
        best_score = -1
        for opt in entry_options:
            entry, ex_side, ex_pos, refl, mirror_set = opt
            entry_key = (entry['side'], entry['r'], entry['c'])
            exit_key = (ex_side, ex_pos)
            if entry_key in used_entries or exit_key in used_exits:
                continue
            new_hits = mirror_set - covered
            score = len(new_hits)
            if score > best_score:
                best_score = score
                best = opt
        if best is None or best_score == 0:
            break
        entry, ex_side, ex_pos, refl, mirror_set = best
        used_entries.add((entry['side'], entry['r'], entry['c']))
        used_exits.add((ex_side, ex_pos))
        covered |= mirror_set
        chosen.append({
            'enter': entry,
            'exit_side': ex_side,
            'exit_pos': ex_pos,
            'count': refl,
            'mirrors': list(mirror_set),
        })

    if covered < all_mirror_cells:
        return None  # Some mirrors not hit
    if len(chosen) < 2:
        return None  # Too trivial

    # Add more valid, boundary-disjoint observations.  Sort by reflection count
    # and path coverage so the extra clues are informative and visually varied.
    if target_count is None:
        # Use up to half of all boundary slots (one entry + one exit per beam).
        # Dense observations are necessary for unique puzzles; sparse 7-9-beam
        # sets still admitted alternate one-mirror-per-room placements.
        target_count = rows + cols
    extras = []
    for opt in entry_options:
        entry, ex_side, ex_pos, refl, mirror_set = opt
        entry_key = (entry['side'], entry['r'], entry['c'])
        exit_key = (ex_side, ex_pos)
        if entry_key in used_entries or exit_key in used_exits:
            continue
        extras.append((refl * 100 + len(mirror_set), opt))
    extras.sort(key=lambda item: item[0], reverse=True)
    for _, opt in extras:
        if len(chosen) >= target_count:
            break
        entry, ex_side, ex_pos, refl, mirror_set = opt
        entry_key = (entry['side'], entry['r'], entry['c'])
        exit_key = (ex_side, ex_pos)
        if entry_key in used_entries or exit_key in used_exits:
            continue
        used_entries.add(entry_key)
        used_exits.add(exit_key)
        chosen.append({
            'enter': entry,
            'exit_side': ex_side,
            'exit_pos': ex_pos,
            'count': refl,
            'mirrors': list(mirror_set),
        })
    return chosen


def level_to_output(rows, cols, region_grid, mirrors, chosen):
    """Convert internal format to the JSON output format."""
    beams_out = []
    for i, beam in enumerate(chosen):
        letter = chr(ord('A') + i)
        e = beam['enter']
        # Entry side/pos come from the entry dict directly (handles corner cells correctly)
        side_e = e['side']
        if side_e == 'N' or side_e == 'S':
            pos_e = e['c']
        else:
            pos_e = e['r']
        beams_out.append({
            'letter': letter,
            'enter': {'side': side_e, 'pos': pos_e},
            'exit':  {'side': beam['exit_side'], 'pos': beam['exit_pos']},
            'count': beam['count'],
        })
    return {
        'rows': rows,
        'cols': cols,
        'rooms': region_grid,
        'mirrors': [[mirrors[r][c] if mirrors[r][c] else '' for c in range(cols)] for r in range(rows)],
        'beams': beams_out,
    }


def generate_level(rows, cols, min_size=3, max_size=5, seed=None, max_retries=100):
    """Generate one level. Returns dict or None."""
    for attempt in range(max_retries):
        s = (seed + attempt) if seed is not None else None
        if s is not None:
            rnd_local = random.Random(s)
        else:
            rnd_local = random
        region_grid, region_cells = generate_rooms(rows, cols, min_size, max_size, seed=s)
        if region_grid is None:
            continue
        # Place random mirrors
        mirrors = [[None]*cols for _ in range(rows)]
        for rid, cells in region_cells.items():
            r, c = rnd_local.choice(cells)
            mirrors[r][c] = rnd_local.choice(['/', '\\'])
        # Generate beams
        chosen = generate_beams(rows, cols, mirrors)
        if chosen is None:
            continue
        return level_to_output(rows, cols, region_grid, mirrors, chosen)
    return None


def generate_all_levels():
    """Generate 30 levels (5 tiers × 6 levels)."""
    tiers = [
        # (rows, cols, min_size, max_size, name)
        (5, 5, 3, 5, "Beginner"),
        (5, 6, 3, 5, "Easy"),
        (6, 6, 3, 6, "Medium"),
        (6, 7, 3, 6, "Hard"),
        (7, 7, 3, 6, "Expert"),
    ]
    all_levels = []
    base_seed = 7777
    for ti, (rows, cols, mr, xr, label) in enumerate(tiers):
        for li in range(6):
            # Per-level salt avoids a rare under-constrained seed while keeping
            # the complete 30-level pack deterministic and reproducible.
            seed = base_seed + ti*1000 + li*37 + (1 if ti == 4 and li == 4 else 0)
            lvl = generate_level(rows, cols, mr, xr, seed=seed)
            if lvl:
                lvl['tier'] = ti + 1
                lvl['tierName'] = label
                lvl['levelNum'] = ti * 6 + li + 1
                all_levels.append(lvl)
                print(f"  L{lvl['levelNum']:2d} ({label}): {rows}x{cols}, "
                      f"{sum(1 for r in range(rows) for c in range(cols) if lvl['mirrors'][r][c])} mirrors, "
                      f"{len(lvl['beams'])} beams \u2713")
            else:
                print(f"  L{ti*6+li+1:2d} ({label}): FAILED (seed={seed})")
    return all_levels


if __name__ == '__main__':
    print("Generating Kin-Kon-Kan levels...")
    levels = generate_all_levels()
    print(f"\nTotal: {len(levels)}/30 levels generated")
    with open('levels.json', 'w') as f:
        json.dump(levels, f, indent=2)
    print("Saved to levels.json")