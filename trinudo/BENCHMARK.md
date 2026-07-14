# Trinudo — Competitive Benchmark

## Puzzle: Trinudo (Number Region Filling)

### Rules (janko.at confirmed)
**Source:** https://www.janko.at/Raetsel/Trinudo/Regeln.htm

1. Fill every cell of the grid with a number 1, 2, or 3.
2. Connected cells (orthogonal adjacency) with the same number form regions. Each region must have exactly that many cells — a region of 1s has 1 cell, a region of 2s has 2 cells, a region of 3s has 3 cells.
3. Two distinct regions of the same size may NOT be orthogonally adjacent.
4. Some cells contain pre-revealed clue numbers. Regions may contain zero or more clues.

### Origin
- Published in Japanese puzzle magazine Puzzle Communication Nikoli
- Name: Trinudo (トリヌド) — from "tri" (three) + "nudo" (from Japanese)
- Related to Suguru and other region-size puzzles

### Competitor Analysis
| Source | Format | Online Play? | Mobile? | Free? |
|--------|--------|-------------|---------|-------|
| janko.at | Print + online solver | Yes (basic) | No | Yes |
| Cross+A (cross-plus-a.com) | Desktop software | No | No | Paid |
| **GameZipper** | **Full HTML5 game** | **Yes** | **Yes** | **Yes** |

### GameZipper Trinudo Features
- 30 levels across 5 tiers (4x4 Beginner → 8x8 Expert)
- All levels verified UNIQUE (3-method: Python structural + Node independent solver + in-engine isSolved)
- Canvas rendering with color-coded values (red=1, blue=2, green=3)
- Click-to-place with mode selection (1/2/3/erase)
- Hint system (3 per level, reveals correct cell)
- Check (Enter), Clear (R), Auto-check mode
- 3-star ratings based on time + hints used
- Level select grouped by tier
- Timer, keyboard support (1/2/3/E/H/R/Esc/Enter)
- Web Audio API: ambient BGM (Cmaj7→Dm7→Am7→G chord progression) + SFX
- localStorage save (progress + settings)
- Confetti win effect, touch support
- Monetag + Adsterra ads, gz-analytics, game-footer

### Competitive Advantage
GameZipper Trinudo is the first full-featured browser game for this puzzle type with:
- 30 unique levels verified by 3 independent methods
- Complete mobile support with touch interaction
- Procedural Web Audio music + SFX (no external audio files needed)
- Star ratings + progress tracking
