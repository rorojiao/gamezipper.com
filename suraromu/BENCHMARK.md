# Suraromu — Benchmark & Rules

## Source
- **Nikoli official**: https://www.nikoli.co.jp/en/puzzles/suraromu/
- **janko.at rules**: https://www.janko.at/Raetsel/Suraromu/Regeln.htm
- **Name**: Suraromu (スラローム) = "Slalom" — a Nikoli loop puzzle.

## Catalog Gap (grep verified 2026-07-12)
- `suraromu` : 0
- `suraromu puzzle` : 0
- `slalom puzzle` : 0

## Rules (from Nikoli official)
1. Draw a single loop through cell centers, moving horizontally/vertically. The loop may not cross itself, branch, or visit a cell twice.
2. **Gates** are the dashed lines between two black cells or between a black cell and the outer frame. Every Gate must be crossed by the loop, but each Gate only once.
3. The loop starts and ends at the **open numbered circle** cell. The number = total Gates the loop crosses.
4. Numbers in the black cells at Gate ends indicate the **order** the loop crosses that Gate (counting from the start circle). Unnumbered Gates can be crossed in any position.

## Implementation Model
- **Grid**: R×C cells. Some cells are BLACK (gate posts / obstacles). One cell is the START circle (number).
- **Gate (Vertical)**: a column segment between two black cells (or black cell + top/bottom edge), exclusive. The loop "crosses" it by using exactly one vertical edge within the segment.
- **Gate (Horizontal)**: a row segment between two black cells (or black cell + left/right edge). The loop "crosses" it by using exactly one horizontal edge within the segment.
- **Solution-first generation**: build a random simple loop → place black cells to define gates → verify each gate crossed exactly once → assign start number + subset order clues → solver confirms uniqueness.

## Difficulty Tiers
| Tier | Grid | Gates |
|------|------|-------|
| Beginner | 4×4 | 2-3 |
| Easy | 5×5 | 3-4 |
| Medium | 6×6 | 4-5 |
| Hard | 7×7 | 5-6 |
| Expert | 7×7 / 8×8 | 6-8 |

## Competitor Analysis
- Nikoli.com (paid) — the canonical source.
- Logic Masters Germany / puzzle-chess.com — generic loop puzzles.
- **Gap**: no free, browser-playable, mobile-friendly Suraromu exists. GameZipper fills this.

## Systems to Implement
- Canvas rendering: grid, black cells, gates (dashed lines), start circle, loop
- Click-drag to draw loop edges; click to erase edge
- Gate highlighting when crossed
- Order clue display on black cells
- Hint (3/level), check, restart, clear
- 3-star ratings, level select by tier
- Keyboard support
- Web Audio ambient BGM + SFX
- localStorage save
