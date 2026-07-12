# Dotchi-Loop — Competitive Benchmark

## Puzzle Identity

| Field | Value |
|-------|-------|
| Name | Dotchi-Loop (ドッチループ) |
| Origin | Nikoli |
| Rule Source | cross-plus-a.com (http://www.cross-plus-a.com/html/cros7dtlp.htm) — rules confirmed |
| Catalog Gap | `dotchi-loop`, `dotchiloop`, `dotchi loop` all 0 (grep verified, true zero-gap) |
| Grid Size | 3×3 to 30×30 (solver-supported range) |
| Mechanic Family | Loop + region consistency |

## Rules (confirmed from cross-plus-a.com)

1. A rectangular or square grid is divided into **regions**.
2. Some cells contain **white circles** or **black circles**.
3. Draw a **single non-intersecting loop** through cell centers (orthogonal edges between adjacent cells).
4. The loop **must visit all cells with white circles**.
5. The loop **cannot pass through a black circle**.
6. **Region consistency rule (key)**: For each region, the loop's behavior at the white circles is uniform —
   either the loop travels **straight through ALL white circles** in that region, OR it makes a **90° turn at ALL white circles** in that region.
7. The loop may pass through non-circled cells freely (straight or turn).

## Interpretation for generation

- **Region**: connected polyomino (BFS-grown partition of the grid).
- **White circle cell**: loop MUST enter+exit this cell (so it has exactly 2 loop-edges).
- **Black circle cell**: loop must NOT enter (0 loop-edges at this cell).
- **Region behavior tag** (derived from solution): `straight` = all white circles in region have straight loop passage (in/out opposite directions); `turn` = all white circles in region have perpendicular in/out directions.
- **No-clue regions** (0 white circles): no constraint (but often still have loop passing through).

## Generation Strategy: Solution-First

1. **Region partition**: Random BFS growth into regions of size 3-7 cells. Ensure connectivity.
2. **Generate a valid non-intersecting loop** that covers a subset of cells (not necessarily all cells). Use DFS Warnsdorff cycle-grow (as in Nagareru/Rail Pool) on a Hamiltonian cycle, OR a simpler approach: generate a single random simple loop (not necessarily covering all cells) via random walk with closure.
3. **Place white circles** on a subset of loop cells: pick ~40-60% of loop cells as white circles. For each region containing ≥1 white circle, record whether the loop is straight or turning at those cells. Enforce consistency: only keep white-circle placements where ALL white circles in the same region share the same behavior (straight/turn). If a region has mixed behavior, remove the offending white circles until consistent.
4. **Place black circles** on a subset of NON-loop cells (~20-30%) — these are forbidden cells.
5. **Derive clues**: white circles (○), black circles (●), region borders.
6. **Win-check**: (a) single closed non-self-intersecting loop, (b) loop visits all white circles, (c) loop avoids all black circles, (d) each region's white circles are uniformly straight or turn.

## Simpler valid generation approach (chosen)

Rather than generating an arbitrary loop then enforcing region consistency (which requires a uniqueness solver that is expensive), we use a **structured loop generation**:

- Generate a **Hamiltonian cycle** on the grid graph (requires R×C even, like Rail Pool/Nagareru) via DFS Warnsdorff + boustrophedon fallback. This guarantees a single non-intersecting loop visiting ALL cells.
- All cells are on the loop. Black circles are therefore impossible (loop must visit all cells), so we use a **variant**: the loop does NOT need to cover all cells. Instead:
  - Generate a Hamiltonian cycle, then **delete some edges** to create non-loop cells (cells with 0 or 1 loop-edges get pruned). Actually simpler: just mark some cells as black-circle (off-loop) and ensure the remaining loop is still a single closed cycle.
- **Practical approach**: Generate the Hamiltonian cycle (all cells visited). Choose a subset of cells as white circles. The region consistency is then enforced by selecting white circles whose region-behavior is uniform. Black circles: pick from cells that we "remove" from the loop — but removing a cell from a Hamiltonian cycle breaks it into a path. So instead, we keep the Hamiltonian cycle as the solution and do NOT use black circles (all black circles are off-loop, but in a Hamiltonian cycle there are no off-loop cells).

### Final chosen approach (no black circles, Hamiltonian cycle solution)

Given the complexity, we use a **simplified variant** that is faithful to the core Dotchi-Loop mechanic:

- Grid divided into regions.
- A single non-intersecting loop is drawn (the solution = Hamiltonian cycle on the grid, so every cell is on the loop).
- White circles are placed on a subset of cells. Each region's white circles are uniformly straight or turn.
- **No black circles** in our variant (since Hamiltonian cycle covers all cells). This is a valid simplification — the original puzzle allows grids with no black circles.
- Win-check: loop is a single closed non-intersecting cycle that visits all white-circle cells, and each region's white circles are uniformly straight/turn.

This produces solvable, unique-feeling puzzles with the core Dotchi-Loop region-consistency constraint, which is the puzzle's defining feature.

## Verification (3-method)

1. **Python structural** (gen_levels.py): verify solution is a valid single closed cycle, visits all white circles, region consistency holds.
2. **Node.js independent** (verify_independent.js): re-implement cycle+region checks in JS.
3. **In-engine** (verify_engine.js): load index.html LEVELS via vm.runInContext, set solution, call checkWin → must return true.

## Systems (S-tier commercial quality)

- Canvas rendering: grid, region borders (thick), white circles, loop edges
- Interaction: click-to-toggle edges (Slitherlink-style), or click cell to cycle direction
- Region behavior indicator (straight/turn shown via subtle region tint)
- Hint (3/level), check (Enter), clear (R), restart
- 3-star ratings (time-based), level select grouped by tier
- Keyboard (H hint, R restart, Esc menu, Enter check)
- Web Audio: ambient BGM (chord progression) + SFX (draw/erase/hint/win/error)
- localStorage save (progress + settings), settings (music/sfx/autocheck)
- Win overlay with confetti, touch support
- SEO: VideoGame, FAQPage, BreadcrumbList JSON-LD

## Tiers (30 levels)

| Tier | Grid | Levels |
|------|------|--------|
| Beginner | 4×4 (even, Hamiltonian) | 6 |
| Easy | 5×5 → use 5×6 (even cells) | 6 |
| Medium | 6×6 | 6 |
| Hard | 6×7 / 7×6 | 6 |
| Expert | 7×7 → use 7×8 / 8×8 | 6 |

Note: R×C must be EVEN for a Hamiltonian cycle to exist on a grid graph. Odd×odd grids (5×5, 7×7) have no Hamiltonian cycle, so we use even-cell grids (5×6, 7×8).
