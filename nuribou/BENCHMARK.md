# Nuribou — Benchmark & Rules Reference

## Source
- **janko.at** (official rules, DE/EN/JA): https://www.janko.at/Raetsel/Nuribou/Regeln.htm
- Japanese name: ヌリボー
- Genre: Nikoli shading/island puzzle (variant of Nurikabe family)

## Rules (from janko.at EN)
1. Blacken some cells of the grid (or color gray cells either black or white, interactively).
2. The black cells divide the grid into areas of **orthogonally-connected** white cells (islands). Islands must not touch each other orthogonally.
3. A cell with a number is always white; each island has exactly one number cell. The number indicates how many cells form the island.
4. The black cells must form **horizontal or vertical stripes, exactly one cell wide**.
5. If two black stripes are **diagonally adjacent**, they must be of **different length**.

## Core Mechanic Summary
- Shade cells to create 1-cell-wide wall strips.
- White regions (islands) separated by walls, each with one size clue.
- Diagonal wall-length constraint distinguishes Nuribou from Nurikabe.

## Generation Approach
- **Stripes-first**: randomly place 1-wide horizontal/vertical black stripes on the grid.
- Local constraint check during placement (no 2×2 black, no L-corners).
- Final full-verification: no 2×2, all black cells have ≤2 colinear black neighbors, diagonal-adjacent stripes differ in length, islands ≥3, island size ≤9.
- Derive clue = island size at the centroid cell of each island.

## Catalog Gap (verified 2026-07-12)
- `nuribou`, `nuribou puzzle`, `ヌリボー` → 0 occurrences in games-data.js (true zero-gap).

## Verification (3-method)
1. Python structural (`gen_levels.py`): 30/30 valid
2. Node.js independent BFS (`verify_independent.js`): 30/30 valid
3. In-engine checkWin (`verify_engine.js`, loads index.html LEVELS): 30/30 valid
