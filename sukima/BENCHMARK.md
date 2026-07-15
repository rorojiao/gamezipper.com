# Sukima — Competitive Benchmark

## Puzzle Identity
- **Name**: Sukima (スキマ / Sukima)
- **Type**: Region-division / triomino placement puzzle
- **Publisher**: Nikoli Co., Ltd. (Japan)
- **First appeared**: Puzzle Communication Nikoli

## Rules (confirmed from janko.at — DE/EN/JA)
Source: https://www.janko.at/Raetsel/Sukima/Regeln.htm

1. Draw along the grid lines some **non-overlapping triominoes** (3-cell L-shaped or I-shaped blocks) in the grid.
2. Each triomino must contain **exactly one cell with a circle**.
3. No **2×2 area** may be completely covered by triominoes.
4. **Black cells** do not belong to any triomino.

### Clarifications
- A triomino is a polyomino of exactly 3 connected cells.
- Triomino shapes: I (straight 1×3 or 3×1) and L (2×2 minus one cell).
- Circles are pre-placed clues; each must be covered by exactly one triomino.
- Some white cells may remain uncovered (not every white cell must be in a triomino).
- The 2×2 rule prevents dense block packing.

## Catalog Gap Verification (2026-07-15)
- `sukima`: **0** files (grep -rl across all .html/.js/.xml)
- `sukima puzzle`: **0** files
- `triomino puzzle`: checked — our catalog has no triomino-division game
- **True zero-gap confirmed.**

## GameZipper Differentiation
- First Sukima implementation in our catalog
- 30 unique-solution levels across 5 difficulty tiers
- Solution-first generation with MRV backtracking + uniqueness verification
- Web Audio API ambient music + SFX
- Canvas rendering with circle clues, triomino coloring, 2×2 violation highlighting
- Full keyboard + touch support, hints, star ratings, level select

## Generation Strategy
**Solution-first**: 
1. Place circles on random white cells (count = number of triominoes desired)
2. For each circle, grow a random triomino (I or L shape) covering that circle
3. Check no overlaps, no 2×2 fully covered, all circles covered
4. Derive clues = just the circle positions (circles are the only clues)
5. Verify uniqueness via constraint solver (backtracking with MRV + node budget)
