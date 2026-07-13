# Stitches — Competitive Benchmark

## Source & Rules
**Source**: cross-plus-a.com (Cross+A), also published as a Nikoli-style puzzle.
**Rules URL**: http://www.cross-plus-a.com/puzzles.htm#Stitches

### Official Rules (verified 2026-07-14)
1. The grid is a rectangle/square divided into **regions**.
2. The goal is to connect each region with **all** neighbour regions with **exactly one line** ("stitch").
3. Each line has length of **one cell** — it connects two **orthogonally adjacent** cells from different regions.
4. A cell may be visited by **at most one** line (no two stitches share an endpoint cell).
5. A **number at the edge** of the grid indicates how many **line endpoints** must be placed in the corresponding row or column.

## Catalog Gap (verified 2026-07-14)
- `stitches`, `stitches puzzle`, `stitch puzzle`, `cross+a stitches` → **0 occurrences** in games-data.js, itemlist-schema.js, sitemap.xml, index.html (grep -ric = 0).
- True zero-gap ✅

## Core Mechanic Summary
Connect adjacent regions with single-cell "stitches" (edges between orthogonally-adjacent cells of different regions). Every pair of neighbouring regions gets exactly one stitch. Edge clues count stitch endpoints per row/column.

## Difficulty Tiers (30 levels)
| Tier | Grid | Regions | Notes |
|------|------|---------|-------|
| Beginner | 5×5 | 3-4 | Simple connectivity |
| Easy | 6×6 | 4-5 | More region adjacencies |
| Medium | 7×7 | 5-6 | Tighter cell budget |
| Hard | 8×8 | 6-7 | Dense stitching |
| Expert | 9×9 | 7-8 | Many adjacencies + tight clues |

## Solution-First Generation
1. Generate a region partition (BFS-grow seeds until full coverage).
2. Build the region-adjacency graph.
3. For each adjacent region pair, pick exactly ONE boundary edge (stitch) such that no cell is reused.
4. This edge assignment IS the solution; derive row/col endpoint counts as clues.
5. Verify uniqueness via a constraint solver (each adjacent pair must have exactly one valid stitch assignment given cell-exclusivity + clue constraints).

## Systems Plan
- Region rendering with distinct colors + thick borders
- Edge-click interaction (click between two cells to place/remove a stitch)
- Row/column clue display (top + left margins)
- Violation highlighting (over-stitched region pair, reused cell, unsatisfied row/col clue)
- Hint (3/level), Check (Enter), Restart (R)
- 3-star ratings (time-based), level select grouped by tier
- Keyboard: 1 place / 2 erase / H hint / R restart / Enter check / Esc menu
- Web Audio ambient BGM + SFX (place/erase/hint/win/error/click)
- localStorage save + settings (music/sfx/autocheck)
- Confetti win, touch support
