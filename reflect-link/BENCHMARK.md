# Reflect Link — Competitive Benchmark

## Game Identity
- **Name**: Reflect Link
- **Japanese**: リフレクトリンク (Refurekuto Rinku)
- **Type**: Nikoli loop logic puzzle
- **Origin**: Nikoli volume 106 (2004)
- **Catalog gap**: `reflect-link`, `reflectlink`, `reflect link` all 0 (grep verified 2026-07-10)

## Rules (from WPC unofficial wiki + Free Shell)
1. Draw a closed loop through cell centers, moving horizontally or vertically
2. The loop may only intersect itself at cells marked with "+" (crossing cells)
3. Cells with triangles reflect the loop at right angles — the loop must enter and exit perpendicular to the triangle's hypotenuse
4. All triangle cells must be visited by the loop
5. Numbered triangles indicate the total number of cells (including the triangle's own cell) that the loop travels horizontally AND vertically before changing direction

### Simplified Rules for Implementation
Since implementing the full "+" crossing mechanic adds complexity and confusion for casual players, we adapt:
1. Draw a single closed loop through cell centers (H/V only)
2. Loop cannot cross itself (no "+" cells — simplified for browser play)
3. Triangle cells reflect the loop 90 degrees — all must be visited
4. Unnumbered triangles: just reflect (any direction)
5. Numbered triangles: the straight segment from this triangle to the next turn must cover exactly that many cells total (in both H and V directions combined, but since a triangle forces a turn, it's the segment length in the entry direction + exit direction)

### Adapted Mechanic (Browser-Friendly)
For a clean browser implementation:
1. Draw a single non-intersecting loop through cell centers
2. Triangle clues are mandatory turn points — the loop MUST turn at every triangle
3. Numbered triangles: the loop segment connecting two consecutive triangles must pass through exactly N cells (including both triangle endpoints)
4. Unnumbered triangles: just require a turn, no length constraint
5. The loop must visit ALL triangle cells

## Difficulty Progression
- Tier 1 (Beginner): 5x5 grids, 4-5 triangles
- Tier 2 (Easy): 6x6 grids, 6-7 triangles  
- Tier 3 (Medium): 7x7 grids, 8-9 triangles
- Tier 4 (Hard): 8x8 grids, 10-11 triangles
- Tier 5 (Expert): 9x9 grids, 12-14 triangles

## Competitor Analysis
- **Nikoli**: Original publisher, pencil-and-paper only
- **WPC**: Appeared in WPC 2017 Round 16 by Ashish Kumar
- **No browser-based clone exists** — true market gap

## Technical Spec
- 30 levels across 5 tiers (6 per tier)
- Canvas rendering with loop drawing
- Click-drag or edge-toggling to draw loop segments
- Web Audio ambient BGM + SFX
- 3 hints per level, restart, undo
- 3-star ratings based on time + hints used
- localStorage progress save
- Keyboard support
