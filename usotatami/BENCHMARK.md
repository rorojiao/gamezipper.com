# Usotatami — Competitive Benchmark & Rules

## Puzzle Identity
- **Name**: Usotatami (ウソタタミ, "Lying Tatami")
- **Publisher**: Nikoli (Japanese logic puzzle publisher)
- **Family**: Region-division / tatami-tiling puzzles
- **Related**: Tatamibari, Tatami (Patchwork), Shikaku

## Rules (confirmed via cross-plus-a.com, 2026-07-16)

A rectangular or square grid contains numbers in some cells. The goal is to **divide the grid into rectangular regions** ("tatami mats") subject to these constraints:

1. **One clue per region**: Each region (rectangle) contains exactly ONE numbered cell.
2. **One-cell wide**: Every region must be exactly ONE CELL WIDE (i.e., each rectangle is a 1xk or kx1 strip, never a proper rectangle with both dimensions > 1).
3. **LIE rule** (the "uso" = lie): The length of the long side of each region is **NOT EQUAL** to the number in its clue cell. (The clue lies about its length — hence "lying tatami".)
4. **No four-corner junction**: No grid point (dot) may be a corner shared by exactly FOUR regions. (Tatami tiling rule: at any lattice intersection, at most 3 regions may meet.)

## Solving Notes
- Because every region is 1-cell-wide, each region is either a horizontal strip (1xL) or a vertical strip (Lx1).
- The clue value N is forbidden as the strip length — the actual length must be any value in {2..maxLen} EXCEPT N.
- Typical clue values range 2-6.
- The "no four-corner" rule is the tatami-mat constraint (in real tatami laying, four corners meeting is unlucky).

## Catalog Gap (GameZipper, 2026-07-16)
- `usotatami`: 0 occurrences in js/games-data.js TRUE zero-gap
- `usotatami puzzle`: 0
- `nikoli usotatami`: 0
- `tatami puzzle`: 0
- **Folder**: `usotatami/` not present -> TRUE zero-gap, clean slate.

## Generation Strategy
**Solution-first generation**:
1. Tile the grid entirely with 1-cell-wide strips (horizontal or vertical) of varied lengths 2..maxLen.
2. Ensure no 4-corner junctions among the tiling.
3. For each strip, place one clue whose value != the strip length (the "lie").
4. Verify uniqueness via a constraint solver: given only the clue cells + their (wrong) numbers, the tiling must be uniquely reconstructible.

## Why Usotatami
- Nikoli-published, recognized name -> SEO authority.
- True zero-gap in catalog -> first-mover advantage.
- Clean region-division mechanic, distinct from Shikaku/Tatamibari/Scrin already shipped.
- Solvable with backtracking + tatami constraints.
