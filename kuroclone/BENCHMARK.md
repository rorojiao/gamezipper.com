# Kuroclone — Competitive Benchmark

## Puzzle Overview

**Name:** Kuroclone (クロクローン)
**Publisher:** Nikoli
**Type:** Region shading puzzle
**Rules Source:** cross-plus-a.com (confirmed), puzz.link/p?kuroclone (live), pzpr.js bundle (validation messages)

## Rules (Verified from cross-plus-a.com)

1. A rectangular or square grid is divided into regions.
2. Blacken some cells in each region.
3. Each region must contain exactly TWO areas of black cells (connected black cell groups within the region).
4. This pair of black areas must be the SAME shape and size (areas may be rotated or mirrored).
5. Cells with numbers are always white.
6. The arrow points to an adjacent cell that belongs to a black area.
7. The number indicates the size of this area.
8. When two cells are orthogonally adjacent across a region boundary, at least one must be white.

## Validation Messages (from pzpr.js bundle)

- `anUnitNe.kuroclone`: "The size of the pointed unit is not correct." — Arrow clue size mismatch
- `bkDifferentShape.kuroclone`: "Two units in an area have different shapes." — Pair shapes don't match
- `bkUnitNe2.kuroclone`: "There is an area without exactly two units." — Region doesn't have exactly 2 black areas

## Catalog Gap

- `kuroclone` in games-data.js: 0 hits (true zero-gap)
- `kuroclone puzzle` in Google: no browser games found
- puzz.link route: live (HTTP 200, title "Kuroclone")
- No App Store / Play Store / Poki / CrazyGames presence

## Mechanic Complexity

- Primary constraint: Each region has exactly 2 black areas of matching shape (rotation/reflection invariant)
- Secondary constraints: Arrow clues point to black areas with specific sizes; cross-boundary adjacency rule
- Generation approach: Solution-first — place paired shapes in each region, derive clues, verify uniqueness

## H5 Feasibility

- Grid-based puzzle, Canvas rendering, click-to-shade interaction
- Estimated file size: 40-55KB (similar to other Nikoli puzzle games)
- 30 levels across 5 tiers: 5x5 Beginner → 8x8 Expert

## Differentiation

- No browser clone exists anywhere
- Nikoli published puzzle with verified rules
- Unique mechanic: paired matching shapes within regions (not just shading)
