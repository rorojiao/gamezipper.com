# Paper Fold Puzzle — Competitor Benchmark

> **Game**: Paper Fold Puzzle (origami folding puzzle) for GameZipper
> **Date**: 2026-05-31

## Target Score: 21/25
- Market: Paper folding / origami puzzle - trending casual genre
- Core: Fold a square piece of paper along crease lines to match a target pattern
- Zero overlap with existing GameZipper games

## Competitors:
- "Paper Fold" (mobile, 10M+ downloads)
- "Origami Puzzle" series
- "Fold the Paper" web games

## Must-Have Systems:
1. **Star System**: 1-3 stars (fewer folds = more stars)
2. **Level Progression**: Progressive difficulty, 30+ levels
3. **Fold Mechanics**: Tap/drag crease lines to fold paper in either direction
4. **Target Preview**: Show the goal pattern before folding
5. **Undo System**: Unlimited undo
6. **Hint System**: Highlight next fold
7. **Progress Save**: localStorage with version field
8. **Tutorial**: First 3 levels teach folding mechanics
9. **Sound Effects**: Web Audio API — paper fold sounds, success chime
10. **BGM**: Ambient/calm background music

## Art Style:
- Paper texture on dark GameZipper background
- Colored segments/patterns on paper
- Smooth fold animations (3D CSS transform or Canvas)
- Clean minimalist UI

## Level Design:
- Start: 1-2 folds on small grid (2×2)
- Mid: 3-4 folds with pattern matching
- Hard: 5+ folds, complex patterns, multiple fold directions
- Expert: Multi-layer folds requiring strategic ordering
