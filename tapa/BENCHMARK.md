# Tapa — Competitor Benchmark

## Game: Tapa (タパ)
- **Origin**: Serkan Yürekli (Turkish designer), popularized by Grandmaster Puzzles
- **Variant of**: Nikoli-style Japanese logic puzzles
- **Concept**: "Cells & Numbers" — shade cells around numbered cells based on clue
- **Switch release**: "Tapa" included in Nikoli puzzle compendium Switch apps (2024-2025)

## Rules (canonical)
1. Shade some cells black, leave others white
2. **All black cells must form one orthogonally-connected polyomino**
3. **No2x2 block of all black cells**
4. Numbered cells stay white
5. **Number clues**: each number indicates the length of a consecutive run of black cells in the8 adjacent cells (orthogonal+diagonal)
 - Single number N → exactly one black run of length N
 - Multiple numbers "123" → multiple black runs in the surrounding8 cells, in any order, each separated by at least one white cell
 - Standard Tapa: numbers sorted ascending in clue list
6. White cells may be unshaded adjacent to numbers; numbers don't need to be surrounded by shaded cells if no run exists

## Top3 Competitors (analyzed)
| Game | URL | Levels | Systems | Style |
|------|-----|--------|---------|-------|
| Puzzle-Tapa | puzzle-tapa.com |100+ daily | Click-shade, right-click dot, drag select, undo, reset, daily | Clean grid, blue+white |
| GridPuzzle Tapa | gridpuzzle.com/tapa |50+ | Stats tracker, difficulty tiers, hints via reveal | Modern gradient |
| Grandmaster Tapa | gmpuzzles.com/blog/tapa-rules-and-info | Weekly PDF | PDF-style solver showcase, weekly new | Print-puzzle aesthetic |

## Reference Features (must implement)
- [x] Click-shade / right-click-mark dot
- [x] Click-and-drag multi-select
- [x] Undo (history stack)
- [x] Reset puzzle
- [x] Show errors (auto-check invalid2x2, disconnected regions)
- [x] Hint system (reveal one cell)
- [x] Solution validator (rules compliance)
- [x] Level select grid with tiers
- [x] Timer + best time per level
- [x] Daily challenge (deterministic seed)
- [x] Star ratings (1-3 based on hints+time)
- [x] localStorage save with version field
- [x] Settings (sound, music, auto-check, error highlight)
- [x] Tutorial modal (5 steps)
- [x] Mobile responsive (touch)
- [x] Audio feedback (click/shade/conflict/win)
- [x] Procedural BGM

## Level Plan (30 puzzles)
- Easy (5x5):8 puzzles — single clue per cell, simple
- Medium (7x7):8 puzzles — multiple clues, no2x2 traps
- Hard (10x10):8 puzzles — full Tapa with multiple-number clues
- Expert (12x12):6 puzzles — Grandmaster-grade with multi-clue+diagonals

## Visual Style
- Dark navy background (#0a1224), gradient
- Black cells: deep purple/charcoal with neon glow (#1a1030 + cyan accent)
- White cells: cream/warm white (#f5f1e8)
- Number cells: amber-gold (#ffc857)
- Touch responsive, large tap targets on mobile

## Difficulty Curve
- Easy:5-15% shaded cells, ≤3 single-number clues per puzzle
- Medium:25-35% shaded cells, mix of single/multi clues
- Hard:35-45% shaded cells, multi-number clues prevalent
- Expert:45-55% shaded cells, complex multi-clue with diagonal interaction
