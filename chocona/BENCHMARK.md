# Chocona — Competitive Benchmark

## Source
- **Nikoli official**: Chocona (チョコナ) — region-based shading puzzle
- **Rules source**: janko.at/Raetsel/Chocona/Regeln.htm (confirmed German/English/Japanese)
- **Catalog gap**: `chocona`, `chocona puzzle`, `choco banana` — all 0 occurrences in games-data.js

## Rules (confirmed)
1. Grid is divided into regions (irregular shapes, shown by thick borders).
2. A number in a region = how many cells in that region must be shaded black.
3. A region without a number → unknown count (could be 0).
4. All black cells must form **rectangular blocks** (rectangles/squares), regardless of region borders.
5. No two rectangular blocks may touch orthogonally (diagonal touching is OK).

## Mechanic Analysis
- Similar to: Shikaku (rectangle division), Nurikabe (shading), but unique in:
  - Rectangles span across region borders
  - Region numbers constrain count, not shape
  - No-adjacent-rectangles rule prevents merging

## Game Design
- **Interaction**: Click to shade/unshade cells. Black cells auto-group into rectangles visually.
- **Validation**: Check that all black cells form rectangles + no orthogonal adjacency + region numbers satisfied.
- **Difficulty tiers**: 5×5 Beginner → 9×9 Expert, increasing region complexity.

## Competitor Features to Match
- Region rendering with thick borders
- Number clues centered in regions
- Violation highlighting (invalid rectangles, adjacent blocks)
- Hint system (3 per level)
- Star ratings, level select, keyboard support
- Web Audio ambient BGM + SFX
