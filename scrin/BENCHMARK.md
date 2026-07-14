# Scrin — Competitive Benchmark

## Source
- **cross-plus-a.com**: http://www.cross-plus-a.com/puzzles.htm#Scrin
- **Nikoli**: Nikoli-style region-division puzzle family
- **Name**: "Scrin" (a custom short name used by cross-plus-a.com for this puzzle type)

## Rules (confirmed)
1. The grid is initially divided into small "seed" cells (each seed has a number, or is blank)
2. You merge cells into larger rectangular regions by drawing borders between adjacent cells
3. Each numbered cell must end up in a region whose cell count EQUALS the number on that cell
4. Each region contains AT MOST one number (or zero numbers — the number "covers" its region)
5. All cells must be covered by some region (the grid is fully tiled)
6. Two same-numbered cells in different regions would be valid; one numbered cell per region is the rule

This is a "numbered region" puzzle where the number tells you the size of its region.

## Game Design
- **Genre**: Region-division / border-drawing logic puzzle
- **Mechanic**: Draw/erase borders between adjacent cells. Each numbered cell's region must match its count.
- **Constraints**: 
  - Grid must be fully tiled by rectangular regions
  - Each region contains exactly one number whose value equals the region size
  - Regions must be rectangles (axis-aligned)
- **Difficulty drivers**: Grid size, number of clues, region size variance

## Competitor Features (from cross-plus-a.com + Nikoli standard)
- Numbered clue display
- Border-drawing interaction (click edge between two cells)
- Region highlighting on hover
- Win detection (all constraints satisfied)
- Hint / Undo

## Our Implementation Plan
- 30 levels across 5 tiers: 5×5 Beginner (8-10 numbered) → 9×9 Expert (16-20 numbered)
- Canvas-based rendering with numbered cells + drawable borders
- Click between two cells to toggle border, click again to remove
- Region rectangles visualized with light fills
- Violation highlighting (region too small / too large) in red
- Hint system (3 per level) — reveals one correct border
- 3-star ratings, timer, level select grouped by tier
- Web Audio ambient BGM + SFX (place/erase/hint/win/error/click)
- Keyboard support, touch support, localStorage save
- confetti win, settings panel
