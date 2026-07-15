# Mochikoro — Competitive Benchmark

## Mochikoro Puzzle Rules (Nikoli #100, September 2002)

**Japanese name:** モチコロ (Mochikoro), originally published as Mochinuri
**Inventor:** Nikoli (first published in *Puzzle Communication Nikoli* #100, Sep 2002)
**Also known as:** Mochinuri (old name), Achipelago (Zotmeister & Grant Fikes variant)

**Source for verified rules:** <https://www.janko.at/Raetsel/Mochikoro/Regeln.htm> (DE/EN/JA), cross-plus-a.com/puzzles.htm#Mochikoro.

### Objective

Blacken some cells of the grid so that the following five rules hold simultaneously:

1. **No 2×2 black block.** No 2×2 area of the grid may be entirely black.
2. **White regions are rectangular.** Black cells divide the grid into rectangular regions of orthogonally-connected white cells.
3. **At most one clue per white region; clue = region size.** Each numbered (clue) cell belongs to a white region. Each white region contains at most one numbered cell. A region's number equals the size (cell count) of that region. White regions without a number can be any size.
4. **White regions don't touch orthogonally.** Different white regions must be separated by at least one black cell on each shared orthogonal edge.
5. **Single diagonally-connected white component.** All white regions form exactly one diagonally-connected group (every white cell is reachable from any other via a path that uses at most one orthogonal step at the corners — i.e. diagonal adjacency through corners counts).

### Mechanics summary

- Player clicks cells to toggle BLACK/WHITE.
- BLACK cells (rendered dark) must not form 2×2 blocks.
- WHITE cells must form rectangular regions separated by black walls.
- Numbered cells show the size of their containing white rectangle.
- Solver clicks "Check" to see if all five rules hold; if so, win.

### Difficulty & tiers

30 levels across 5 difficulty tiers:
| Tier      | Grid | Clues | Difficulty |
|-----------|------|-------|-----------|
| Beginner  | 5×5  | 4-5   | Easy       |
| Easy      | 6×6  | 5-6   | Easy       |
| Medium    | 7×7  | 6-8   | Medium     |
| Hard      | 8×8  | 7-9   | Hard       |
| Expert    | 9×9  | 8-11  | Expert     |

### Similar puzzles (we already have these — confirm no overlap)

- **Nurikabe** (much more complex: shape-constraints on black cells)
- **Nuribou** (stripe-island shading) — `/nuribou/`
- **Sashikabe / Yajikabe / Heyawake** (variants on shading rule families)
- **Chiyotsui** (region-pair shading) — `/chiyotsui/`
- **Turf** (region shading with size clues — black AND white regions must each form one component) — `/turf/`
- **Kuroshuto** (number-distance shading) — `/kuroshuto/`

Mochikoro is uniquely characterized by: **(a)** rectangles (not arbitrary shapes), **(b)** 2×2-black prohibition, **(c)** **single diagonally-connected white component** (this is the strongest constraint and the trickiest to generate for).

### Catalog status (Phase 0 — 2026-07-15)

- Search `js/games-data.js` for `mochikoro`: **0 occurrences** ✓ TRUE ZERO-GAP
- `mochikoro puzzle`: 0 ✓
- `mochinuri`: 0 ✓
- `archipelago puzzle`: 0 ✓

No competing game exists in the catalog. Safe to ship.
