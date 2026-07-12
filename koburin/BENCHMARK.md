# Koburin — Competitive Benchmark

## Source
- **Name**: Koburin (コブリン)
- **Publisher**: Nikoli Co., Ltd. (Japan)
- **Rules reference**: janko.at — https://www.janko.at/Raetsel/Koburin/Regeln.htm (DE/EN/JA confirmed)
- **Type**: Hybrid shading + loop puzzle (Yajilin family variant)

## Rules (confirmed from janko.at, EN translation)
1. Blacken some cells of the grid (paper) / color the gray cells of the grid black or white (interactive).
2. Draw a single closed loop in the grid.
3. The sections of the loop run horizontally or vertically between the centers of orthogonally adjacent cells.
4. The number in a cell indicates how many black cells are orthogonally adjacent to this cell.
5. There may exist some black cells not adjacent to any numbered cell.
6. Numbered cells are never painted black.
7. Two black cells must not be orthogonally adjacent.
8. The loop must visit all empty white cells exactly once (it may not cross itself).

## Mechanic Summary
- **Shading aspect** (like Nurikabe/Kurotto): black cells obey adjacency rule (no orth-adjacent blacks).
- **Number aspect**: clue = count of orth-neighbor black cells (0-4).
- **Loop aspect** (like Slitherlink/Masyu/Yajilin): single Hamiltonian-style closed loop through all remaining white non-numbered cells.
- Combined constraint makes it a deductive hybrid — shade cells to satisfy clues, then the remaining whites must form a single non-branching loop.

## Differentiation from existing catalog
- **Yajilin** (#existing): arrow clues point in a direction, count blacks in that direction. No number-adjacency clues. Different shading rule (clue = directional count, not adjacency count).
- **Koburin**: clue = orthogonal-adjacency count (0-4), no arrows. Simpler clue semantics but adds the Hamiltonian-loop constraint that Yajilin lacks (Yajilin loop can branch around blacks; Koburin loop must visit every white cell exactly once forming a single cycle).
- **Slitherlink**: loop between dots, no shading. Koburin shades cells + loop through cell centers.
- **Masyu**: loop through circles with turn/straight rules, no shading/clues.
- **Hitori**: shading only, no loop.

## Conclusion
Koburin is a genuinely distinct mechanic: the ONLY puzzle in our catalog combining (a) cell-shading with adjacency-count clues AND (b) Hamiltonian single-loop through remaining whites. True zero-gap (0 occurrences in games-data.js, no `/koburin/` directory). Rules confirmed from authoritative source. Green-light for development.

## Generation Strategy (solution-first)
1. Place black cells randomly with no two orth-adjacent (independent-set constraint).
2. Ensure the remaining white cells (minus numbered clue cells) form a single Hamiltonian cycle on the grid graph (DFS Warnsdorff + closure check).
3. Derive clues: for selected white cells, count = number of orth-adjacent black cells. Choose enough clues to make the solution unique.
4. Uniqueness verification: backtracking solver confirms exactly one valid (black-set, loop) configuration.

## Grid Sizes (5 tiers, even cell count for Hamiltonian guarantee)
- Beginner: 5×5 (25 cells)
- Easy: 6×6 (36 cells)
- Medium: 7×7 (49 cells)
- Hard: 8×8 (64 cells)
- Expert: 9×9 (81 cells)
