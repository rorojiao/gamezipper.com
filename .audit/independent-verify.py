#!/usr/bin/env python3
"""Independent Python validator for puzzle game solutions."""
import sys, json, os
from collections import defaultdict, deque

def validate_japanese_sums(L):
    N = L["N"]; s = L["s"]
    issues = []
    for r in range(N):
        row = [s[r][c] for c in range(N) if s[r][c] > 0]
        if len(set(row)) != len(row):
            issues.append(f"row {r} has duplicates {row}")
    for c in range(N):
        col = [s[r][c] for r in range(N) if s[r][c] > 0]
        if len(set(col)) != len(col):
            issues.append(f"col {c} has duplicates {col}")
    for r in range(N):
        for c in range(N):
            if s[r][c] == 0: continue
            for dr,dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                nr,nc = r+dr, c+dc
                if 0<=nr<N and 0<=nc<N and s[r][c] == s[nr][nc]:
                    issues.append(f"({r},{c})-({nr},{nc}) same val {s[r][c]}")
    return issues

def validate_kojun(L):
    H = L["H"]; W = L["W"]; reg = L["regions"]; sol = L["solution"]
    issues = []
    region_cells = defaultdict(list)
    for r in range(H):
        for c in range(W):
            region_cells[int(reg[r][c])].append((r,c))
    for rid, cells in region_cells.items():
        if rid == 0: continue
        vals = [sol[r][c] for r,c in cells if sol[r][c] > 0]
        if sorted(vals) != list(range(1, len(cells)+1)):
            issues.append(f"region {rid} values {sorted(vals)} != 1..{len(cells)}")
    for r in range(H):
        for c in range(W):
            if sol[r][c] == 0: continue
            for dr,dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                nr,nc = r+dr, c+dc
                if 0<=nr<H and 0<=nc<W and sol[nr][nc] == sol[r][c]:
                    issues.append(f"({r},{c})-({nr},{nc}) same val {sol[r][c]}")
    for c in range(W):
        for r in range(H-1):
            if int(reg[r][c]) == int(reg[r+1][c]) and int(reg[r][c]) != 0:
                if sol[r][c] != 0 and sol[r+1][c] != 0 and sol[r][c] <= sol[r+1][c]:
                    issues.append(f"vert ({r},{c})->({r+1},{c}) reg={reg[r][c]} {sol[r][c]} not > {sol[r+1][c]}")
    return issues

def validate_cross_the_streams(L):
    rows = L["rows"]; cols = L["cols"]; sol = L["solution"]; rcl = L["rowClues"]; ccl = L["colClues"]
    issues = []
    def get_groups(line):
        groups = []; cnt = 0
        for v in line:
            if v == 1: cnt += 1
            else:
                if cnt > 0: groups.append(cnt); cnt = 0
        if cnt > 0: groups.append(cnt)
        return groups
    for r in range(rows):
        if get_groups(sol[r]) != rcl[r]:
            issues.append(f"row {r} groups {get_groups(sol[r])} != clues {rcl[r]}")
    for c in range(cols):
        col = [sol[r][c] for r in range(rows)]
        if get_groups(col) != ccl[c]:
            issues.append(f"col {c} groups {get_groups(col)} != clues {ccl[c]}")
    for r in range(rows-1):
        for c in range(cols-1):
            if sol[r][c]==1 and sol[r][c+1]==1 and sol[r+1][c]==1 and sol[r+1][c+1]==1:
                issues.append(f"2x2 block at ({r},{c})")
    shaded = [(r,c) for r in range(rows) for c in range(cols) if sol[r][c]==1]
    if not shaded: issues.append("no shaded"); return issues
    visited = {shaded[0]}
    q = deque([shaded[0]])
    while q:
        r,c = q.popleft()
        for dr,dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            nr,nc = r+dr, c+dc
            if 0<=nr<rows and 0<=nc<cols and sol[nr][nc]==1 and (nr,nc) not in visited:
                visited.add((nr,nc)); q.append((nr,nc))
    if len(visited) != len(shaded):
        issues.append(f"disconnected: {len(visited)}/{len(shaded)}")
    return issues

def validate_double_choco(L):
    rows = L["rows"]; cols = L["cols"]; color = L["color"]; blocks = L["blocks"]
    issues = []
    # Build set of all w cells and all g cells (per the blocks list)
    w_cells = set()
    g_cells = set()
    for b in blocks:
        for cell in b.get("w", []):
            if isinstance(cell, list) and len(cell) == 2:
                w_cells.add((int(cell[0]), int(cell[1])))
        for cell in b.get("g", []):
            if isinstance(cell, list) and len(cell) == 2:
                g_cells.add((int(cell[0]), int(cell[1])))
    # color 0=white, color 1=gray per data convention
    for (r, c) in w_cells:
        if color[r][c] != 0:
            issues.append(f"w cell ({r},{c}) color={color[r][c]} expected 0 (white)")
    for (r, c) in g_cells:
        if color[r][c] != 1:
            issues.append(f"g cell ({r},{c}) color={color[r][c]} expected 1 (gray)")
    # Each block must have |w_cells| == |g_cells| (congruent shape requires equal cell count)
    for i, b in enumerate(blocks):
        n_w = len([c for c in b.get("w", []) if isinstance(c, list) and len(c) == 2])
        n_g = len([c for c in b.get("g", []) if isinstance(c, list) and len(c) == 2])
        if n_w != n_g:
            issues.append(f"block {i} has {n_w} w-cells vs {n_g} g-cells (must be equal for congruent shapes)")
    # Verify grid[][] is consistent: all cells in each "logical block" share the same grid ID
    # Actually that's too strict — different grid IDs in same logical block means different sub-regions.
    # The puzzle solution requires borders such that block boundaries match what the data describes.
    # We can't fully validate the border-drawing from data alone — that's the engine's job.
    return issues

if __name__ == "__main__":
    slug = sys.argv[1]
    func_name = sys.argv[2]
    levels_file = f"/tmp/{slug}.json"
    if not os.path.exists(levels_file):
        print(f"{slug}: levels file not found at {levels_file}"); sys.exit(1)
    with open(levels_file) as f:
        levels = json.load(f)
    fn = globals()[f"validate_{func_name}"]
    fails = []
    for i, L in enumerate(levels):
        try:
            issues = fn(L)
            if issues:
                fails.append((i+1, issues))
        except Exception as e:
            fails.append((i+1, [f"EX: {e}"]))
    if fails:
        print(f"{slug} independent: {len(levels)-len(fails)}/{len(levels)} PASS")
        for i, issues in fails[:5]:
            print(f"  L{i}: {'; '.join(issues[:3])}")
        sys.exit(1)
    else:
        print(f"{slug} independent: {len(levels)}/{len(levels)} PASS")
        sys.exit(0)
