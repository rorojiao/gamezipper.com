#!/usr/bin/env python3
"""
Five Cells — Independent Level Verifier
Verifies that each level's solution satisfies all clues AND regions are exactly 5 cells.
"""
import json, sys

with open('/home/msdn/gamezipper.com/five-cells/levels.json') as f:
    data = json.load(f)

# Handle both list and dict formats
if isinstance(data, dict) and 'levels' in data:
    levels = data['levels']
else:
    levels = data

all_pass = True
for i, lv in enumerate(levels):
    rows, cols = lv['rows'], lv['cols']
    sol = lv['solution']
    clues = lv['clues']
    
    issues = []
    
    # 1. Check all regions are exactly 5 cells
    region_cells = {}
    for r in range(rows):
        for c in range(cols):
            rid = sol[r][c]
            if rid not in region_cells:
                region_cells[rid] = 0
            region_cells[rid] += 1
    
    for rid, count in region_cells.items():
        if count != 5:
            issues.append(f'Region {rid} has {count} cells (expected 5)')
    
    # 2. Check regions are connected (BFS)
    visited = [[False]*cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            if visited[r][c]:
                continue
            # BFS from this cell
            rid = sol[r][c]
            queue = [(r, c)]
            visited[r][c] = True
            count = 1
            while queue:
                cr, cc = queue.pop(0)
                for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                    nr, nc = cr+dr, cc+dc
                    if 0 <= nr < rows and 0 <= nc < cols:
                        if not visited[nr][nc] and sol[nr][nc] == rid:
                            visited[nr][nc] = True
                            queue.append((nr, nc))
                            count += 1
            # count should equal region_cells[rid]
            if count != region_cells[rid]:
                issues.append(f'Region {rid} is not connected (BFS found {count} of {region_cells[rid]})')
    
    # 3. Verify clue numbers match the solution (clues is dict "r,c" -> n)
    for key, expected_bc in clues.items():
        r, c = map(int, key.split(','))
        # Count border lines around (r,c) in the solution
        bc = 0
        if r == 0 or sol[r-1][c] != sol[r][c]: bc += 1
        if r == rows-1 or sol[r+1][c] != sol[r][c]: bc += 1
        if c == 0 or sol[r][c-1] != sol[r][c]: bc += 1
        if c == cols-1 or sol[r][c+1] != sol[r][c]: bc += 1
        if bc != expected_bc:
            issues.append(f'Clue ({r},{c}) = {expected_bc} but solution border count = {bc}')
    
    # 4. Verify total cells divisible by 5
    if (rows * cols) % 5 != 0:
        issues.append(f'Grid {rows}x{cols} = {rows*cols} cells, not divisible by 5')
    
    status = 'PASS' if not issues else 'FAIL'
    if issues:
        all_pass = False
    print(f'L{i+1:2d} ({lv.get('tier', lv.get('difficulty', '?')):10s}) {rows}x{cols} = {rows*cols} cells, {len(region_cells)} regions: {status}')
    for iss in issues:
        print(f'    -> {iss}')

print(f'\n{"ALL PASS" if all_pass else "SOME FAILED"}')
sys.exit(0 if all_pass else 1)
