# Spiral Galaxy (Tentaisho) — Competitor Benchmark

## Game Identity
- **Name**: Spiral Galaxy
- **Slug**: spiral-galaxy
- **Genre**: Nikoli-style logic puzzle (Tentaisho / Spiral Galaxy)
- **Tagline**: Draw symmetric galaxies across the cosmos

## Rules (canonical Tentaisho)
1. Grid of cells. Some cells contain a circle (galaxy center).
2. Partition ALL cells into regions ("galaxies").
3. Every galaxy contains EXACTLY ONE circle, located at the galaxy's center.
4. Every galaxy has **180° rotational symmetry** about its circle.
   - For every cell at offset (dx, dy) from the circle, the cell at offset (-dx, -dy) must also be in the same galaxy.
   - If the circle is at a cell corner / edge midpoint / cell center, symmetry is about that point.
5. Every cell belongs to exactly one galaxy (complete tiling, no gaps, no overlaps).
6. Galaxies may NOT touch themselves edge-to-edge (no self-adjacency across the partition boundary) — actually the canonical rule: a galaxy's cells must be connected, and the region must not "fold back" on itself. We enforce connectivity + symmetry.

## Reference Implementations
- **Simon Tatham's Portable Puzzle Collection** ("Galaxies" / "Tentai Show"): gold-standard web implementation. Features: edge/corner/center dots, drag to extend region, auto-check, hint, recursion solver. ~UB.
- **Puzzle Baron's Spiral Galaxies**: magazine + online portal, ranked puzzles.
- **Nikoli Tentaisho**: original published puzzles, hand-crafted elegant symmetry.
- **Mobile apps**: "Galaxies Puzzle" variants on Google Play, 1M+ cumulative downloads.

## Systems to Implement (parity with Simon Tatham + Puzzle Baron)
1. **Grid with dots** at cell-centers, edge-midpoints, and corners (so 180°-symmetric regions can have centers anywhere — use cell-center dots only for v1 simplicity, with edge/corner dots for harder levels).
2. **Region assignment by dragging**: click-drag from a dot to grow its region; toggle cells.
3. **Symmetry auto-fill**: when a player adds a cell to a galaxy at offset (dx,dy), the mirror cell (-dx,-dy) is auto-added (since the galaxy must be symmetric). This is the satisfying core interaction.
4. **Live validity feedback**:
   - Highlight regions that touch themselves (invalid).
   - Highlight overlapping regions.
   - Highlight uncovered cells (count remaining).
5. **Win detection**: all cells covered, no overlaps, all galaxies symmetric & connected & contain exactly one dot.
6. **Level system**: minimum 20 levels, progressive difficulty (small → large grids, more dots, edge/corner dots).
7. **Scoring**: stars based on time + hints used. 3★ = no hints, fast.
8. **Hint system**: reveal one correct cell (limited hints per level, e.g. 3).
9. **Progress save**: localStorage with version field, level select grid, stars per level.
10. **Tutorial**: first-level overlay explaining the symmetry mechanic (skippable).
11. **Undo** button.
12. **Reset** button.
13. **Audio**: Web Audio API procedural BGM (ambient cosmic pad loop) + SFX (cell add, cell remove, hint, error, level complete, star earned).
14. **Visuals**: dark cosmic gradient background, glowing galaxy regions (each region a distinct nebula color), particle effects on completion, smooth animations.

## Scoring Formula
- Base points per level: 1000
- Time bonus: max(0, 500 - secondsElapsed * 2)
- Hint penalty: -100 per hint used
- Stars: 3★ if hints==0 && time < par; 2★ if hints<=1; 1★ otherwise.

## Difficulty Curve (minimum 20 levels)
| Tier | Grid | Dots | Dot types | Levels |
|------|------|------|-----------|--------|
| 1 (Beginner) | 5×5 | 2-3 | center only | 5 |
| 2 (Easy) | 6×6 | 3-4 | center only | 5 |
| 3 (Medium) | 7×7 | 4-6 | center + edge | 5 |
| 4 (Hard) | 8×8 | 6-8 | center + edge + corner | 5 |
| 5+ (Expert) | 9×9+ | 8+ | all types | bonus |

## Visual Style
- Background: deep space gradient (indigo → black) with subtle starfield (procedural dots).
- Each galaxy: distinct hue from a curated palette (nebula colors: magenta, cyan, gold, violet, teal, rose).
- Dots: glowing white/gold circles with soft halo.
- Grid lines: faint translucent white.
- Completion: particle burst + screen pulse + chord SFX.

## Zero-Overlap Verification
`grep -iE "spiral.galaxy|tentaisho|tentai.show" js/games-data.js` = 0 matches ✓ (confirmed June 19 2026)
