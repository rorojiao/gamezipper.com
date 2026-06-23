# Yosenabe — Competitive Benchmark

## Game Type
Nikoli logic puzzle: "pot" (鍋/nabe) placement. Move numbered circles in straight
lines into gray regions; region sums must match target numbers.

## Rules (100% confirmed via janko.at, puzzle #001)
1. **Move all circles** horizontally or vertically (WITHOUT turning) into a gray region.
2. **Trajectories must not cross** each other or pass through another circle's cell
   (but MAY pass through gray regions).
3. **Sum constraint**: the sum of circled numbers ending in a numbered gray region
   must equal that region's number. Unnumbered regions: sum unknown.
4. **Each gray region must contain at least one circle** at the end.

## Data Format (janko.at `[problem]` / `[areas]`)
- `[problem]`: grid of numbers (circle values) or `-` (empty).
- `[areas]`: grid of region IDs (or `-` for no region). Same ID = same gray region.

## Competitive Landscape
- **Nikoli official** — curated hand-crafted puzzles, gold standard.
- **janko.at** — 30+ free interactive puzzles, multiple sizes (10x10).
- **Puzzle-Prime, Simon Tatham** — similar logic-puzzle distribution.
- **Mobile puzzle apps** (Sudoku/Slitherlink style) — Yosenabe appears in Nikoli
  puzzle collections on 3DS/Switch/Xbox.

## Systems to Implement (S-grade parity)
1. **Level system**: 27 levels, 6 tiers, progressive difficulty.
2. **Interactive solving**: drag/click circle to set direction; arrow trajectory rendered.
3. **Sum validation**: live sum display per region; auto-check on completion.
4. **Score + timer + stars**: time-based star ratings, best-time localStorage.
5. **Tutorial**: step-by-step first-level walkthrough.
6. **Undo/Reset/Clear**: full move history.
7. **Hint system**: reveal next correct move.
8. **Audio**: procedural BGM + SFX (Web Audio API).
9. **Save**: localStorage with version field.
10. **Mobile**: touch drag, large hit areas, responsive canvas.

## Difficulty Curve
| Tier       | Grid    | Regions | Circles | Notes                     |
|------------|---------|---------|---------|---------------------------|
| Beginner   | 6x6     | 3-4     | 4-5     | One circle per region     |
| Easy       | 7x7     | 4-5     | 5-7     | Some multi-circle regions |
| Medium     | 8x8     | 5-6     | 6-8     | Sum constraints tighter   |
| Hard       | 8x8     | 6-7     | 8-10    | Ambiguous starts          |
| Expert     | 9x9     | 7-8     | 9-11    | Complex trajectories      |
| Master     | 10x10   | 8-10    | 10-13   | Tight sums, long paths    |

## Art Direction
- Theme: Japanese hot-pot (yosenabe = "gathering pot"). Warm earthy palette:
  dark charcoal background, warm amber/red region fills, ivory circles.
- Icon: a stylized pot with rising steam and numbered circles.
- Style: clean vector, rounded shapes, subtle gradients.
