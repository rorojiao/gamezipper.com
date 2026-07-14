# Putteria — Competitive Benchmark

## Source
- **cross-plus-a.com**: http://www.cross-plus-a.com/puzzles.htm#Putteria
- **Nikoli**: Published puzzle (referenced as "Nikoli" by cross-plus-a.com)
- **Name origin**: Japanese "put into an area" (プッテリア)

## Rules (confirmed)
1. Grid is divided into outlined regions (irregular shapes)
2. Place exactly ONE number into each region
3. The number equals the SIZE of that region (number of cells in the region)
4. No number may appear twice in any row or column
5. Cells with numbers must NOT be orthogonally adjacent (up/down/left/right)
6. Cells with a cross (✕) cannot contain a number

## Game Design
- **Genre**: Number placement / region puzzle
- **Mechanic**: Deduce which cell in each region gets the number = region size
- **Constraints**: Row/col uniqueness + no orth adjacency + cross blocks
- **Difficulty drivers**: Grid size, region count, cross cells, region sizes

## Competitor Features (from cross-plus-a.com + Nikoli standard)
- Region display with thick borders
- Number input (click cell → type number)
- Cross cells as fixed clues
- Row/column constraint checking
- No-adjacency violation display

## Our Implementation Plan
- 30 levels across 5 tiers (5×5 Beginner → 9×9 Expert)
- Canvas-based rendering with region colors
- Click-to-place number, click again to remove
- Cross cells as pre-placed blocks
- Violation highlighting (duplicate row/col, adjacent numbers)
- Hint system (3 per level)
- 3-star ratings, timer, level select
- Web Audio ambient BGM + SFX
- Keyboard support, touch support, localStorage save
