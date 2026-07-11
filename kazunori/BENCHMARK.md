# Kazunori — Competitive Benchmark

## Source
- **Rules**: janko.at/Raetsel/Kazunori/Regeln.htm (confirmed)
- **Origin**: Nikoli-style domino number puzzle (カズノリ)
- **Catalog gap**: `kazunori`, `kazunori puzzle`, `kazunori nikoli` all 0 occurrences in GameZipper catalog (grep verified 2026-07-11)

## Rules Summary
1. Grid is divided into regions. Each region has an even number N of cells.
2. Place numbers 1 to N/2 in the cells of each region — each number exactly twice.
3. The two cells sharing the same number in a region must be orthogonally adjacent (forming a domino pair).
4. Same numbers must NOT cover a 2×2 or larger area anywhere on the grid (ignoring region borders).
5. Black circle numbers on region borders indicate the sum of the numbers in the two adjacent cells (one from each region sharing that border edge).

## Core Mechanics
- **Domino pairing**: Each region is tiled by domino pairs, each pair sharing a number.
- **Number range**: Region of size N uses numbers 1..N/2, each appearing exactly twice.
- **No 2×2**: No four cells with the same number can form a 2×2 block.
- **Border sum clues**: Optional sum clues on region boundaries for deductive solving.

## Competitive Landscape
| Feature | janko.at | Nikoli books | This Game |
|---------|----------|-------------|-----------|
| Region sizes | Variable even | Variable even | 2,4,6,8 cells |
| Border clues | Sum circles | Sum circles | Sum circles |
| Grid sizes | 6×6–10×10 | 6×6–12×12 | 4×4–9×9 |
| Difficulty tiers | N/A | N/A | 5 tiers |
| Interactive | No | No | Yes (Canvas) |
| Hint system | No | No | Yes (3/level) |
| Audio | No | No | Web Audio BGM+SFX |
| Mobile | No | No | Yes (touch) |
| Save state | No | No | localStorage |

## Unique Selling Points
- Only Kazunori domino-number puzzle in browser HTML5 format
- Interactive Canvas rendering with region coloring
- 3-tier difficulty progression (Beginner → Expert)
- Full audio package (ambient BGM + SFX)
- Keyboard + touch + mouse support
