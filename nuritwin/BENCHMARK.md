# Nuritwin — Benchmark

## Source
- **Nikoli official**: https://www.nikoli.co.jp/en/puzzles/nuritwin/
- Confirmed in Nikoli's English puzzle catalog (listed alongside Nurikabe, Nurimeizu, Nurimisaki).

## Rules (from Nikoli official, verbatim)
> Shade some cells in the grid. Each outlined region must contain exactly two blocks consisting of the same number of cells. Each block consists of one or more shaded cells connected vertically and horizontally. A number (if given) indicates the number of cells that form one block in that region. All shaded cells must be connected vertically and horizontally across regional boundaries. The two blocks in the same region must not touch each other vertically or horizontally. In addition, no 2×2 group of cells can be entirely shaded.

## Rule Decomposition
1. **Region constraint**: Each outlined region has EXACTLY TWO shaded blocks.
2. **Twin-size**: The two blocks in a region must have the SAME number of cells.
3. **Block = orth-connected**: A block is one or more orthogonally-connected shaded cells.
4. **Clue (optional)**: A number in a region = size of each block in that region.
5. **Global connectivity**: ALL shaded cells form ONE orthogonally-connected group (across regions).
6. **No intraregion touch**: The two blocks within one region must NOT touch orthogonally.
7. **No 2×2**: No 2×2 block of shaded cells anywhere.

## How Nuritwin differs from Nurikabe / Double Choco
- **Nurikabe**: numbered white islands + connected black sea, no 2×2. Nuritwin has NO islands — every region has exactly two equal black blocks.
- **Double Choco**: divide grid into paired congruent polyomino regions. Nuritwin regions are FIXED (given); you shade twin blocks inside them.
- **Chocona**: rectangles in regions. Nuritwin blocks are free-form polyominoes (any connected shape), just equal-sized twins.

## Game Design (GameZipper Nuritwin)
- **Mechanic**: Click cells to shade black. Each region (outlined) must end up with exactly 2 equal-size connected black blocks.
- **Modes**: Shade / Erase (right-click or long-press).
- **Generation**: Solution-first — randomly partition grid into regions, then for each region pick a block size K and place 2 non-touching K-cell polyomino blocks; ensure all blocks connect globally and no 2×2. Derive optional clue numbers.
- **Verification**: solution must satisfy all 7 rules.
- **Tiers**: 5×5 Beginner → 10×10 Expert (30 levels).

## Competitive Edge
- First browser-playable Nuritwin (Nikoli puzzle, true zero-gap).
- Full S-tier: 30 verified levels, hints, stars, Web Audio music, settings, JSON-LD SEO.
