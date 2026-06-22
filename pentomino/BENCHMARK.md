# Pentomino — Competitive Benchmark

**Date**: June 22, 2026  
**Game**: Pentomino  
**Slug**: pentomino  
**Type**: Tiling Puzzle (Nikoli-style logic)  
**Score**: 19/25

## Market Data
- **Pentomino puzzles**: 12 distinct tetromino-like shapes formed by 5 squares each. Popular in puzzle magazines, mobile apps (Pentominoes, Tetrads, X-Pentomino), and educational contexts (geometry, spatial reasoning). Moderate demand but highly engaging.
- **Tiling puzzles**: High engagement for players who enjoy spatial reasoning. Satisfying "fit everything" loop with clear feedback.
- **Cross-reference with existing GZ games**: No existing tiling puzzle with pentomino mechanics. Fill The Fridge is item-packing (different shapes per level), not polyomino-tiling.

## Why Selected (19/25)
- **D (Demand) 4**: Consistent moderate demand across puzzle apps + educational contexts. Long-standing genre (1950s origins, still active).
- **S (SEO) 4**: "pentomino", "pentominoes", "pentomino puzzle", "polyomino puzzle" — good search volume, zero GZ coverage.
- **R (Retention) 4**: Progressive difficulty (grid sizes, shape constraints), satisfaction from perfect fits, speed challenges. Players replay for better times/stars.
- **F (Feasibility) 5**: Backtracking solver for uniqueness verification; constructive generator (fill-grid → check if valid). Single-file Canvas achievable.
- **Z (Zero-overlap) 2**: Polyomino-tiling category fresh on GZ, but similar "fit shapes" mechanic exists in Fill The Fridge. Score 2 (minor overlap in spatial-reasoning feel, but different shape-set and rules).

## Gameplay Design
- **Rules**: 12 pentomino shapes (F, I, L, P, N, T, U, V, W, X, Y, Z), each made of 5 squares. Fit ALL shapes into a rectangular grid with NO overlaps and NO empty cells. Each shape used exactly once.
- **Grid sizes**: Variable based on level (6x10, 5x12, 4x15, 8x8 with some cells blocked, 10x10 with some cells blocked). Total cells = 60 (12×5) for all-shapes levels.
- **Player controls**: Drag-and-drop shapes onto grid. Rotate 90°, flip (mirror). Smart snapping to valid positions.
- **Win condition**: All shapes placed, grid fully filled, no overlaps.
- **Star ratings**: Time-based (how fast you complete), move count penalty, undo usage penalty.
- **Difficulty curve**: Start with simple rectangles (6x10) → irregular grids with blocked cells → larger grids → time limits.
- **Hints**: Show one correct placement, limited count per level.

## Technical Specs
- **Canvas**: 2D top-down rendering, drag-drop with pointer events, rotation/flipping animations.
- **Level count**: 27 levels (6 tiers: Beginner, Easy, Medium, Hard, Expert, Master) — 4/4/5/5/5/4.
- **Grid sizes per tier**:
  - Beginner: 6x10 (full rectangle, easy fits)
  - Easy: 5x12 (full rectangle, moderate fits)
  - Medium: 8x8 with 4 blocked cells (64 total, 4 blocked = 60 fillable)
  - Hard: 10x10 with 40 blocked cells (100 total, 40 blocked = 60 fillable)
  - Expert: 4x15 (full rectangle, tight fits, many narrow options)
  - Master: 6x10 with time limit + move optimization (stars require efficiency)
- **Shape rendering**: Procedural Canvas, neon colors per shape, smooth rotation/flipping.
- **Power-ups**: Hint (show one placement), Undo (up to 10 per level), Check (validate current partial placement).
- **SFX**: Place snap, rotation flip, error buzz, win fanfare, button clicks.
- **BGM**: Casual spatial-reasoning atmosphere (Web Audio procedural).
- **Save**: localStorage with version (progress, stars, best times, level unlock).

## Competitors Analyzed
1. **Pentominoes (mobile app)**
   - 50+ levels, 6x10/5x12 grids
   - Drag-drop, rotate, flip
   - Star ratings based on moves + time
   - Simple gradient backgrounds, shape-specific colors

2. **Tetrads (Poki web game)**
   - 30 levels, 8x8 grids with blocked cells
   - No flip (rotate only), harder puzzles
   - Minimalist UI, white grid, dark shapes
   - Level unlock system

3. **X-Pentomino (Google Play)**
   - 100+ levels, progressive grid sizes
   - Tutorial for first 3 levels
   - Undo button (limited uses), no hints
   - Ads between levels (interstitial)

## Systems to Implement
- **Level system**: 27 levels across 6 tiers, progressive difficulty
- **Placement system**: Drag-drop with snap-to-grid, collision detection
- **Rotation/flip**: 90° rotation, mirror flip (Z/S/W shapes have unique mirrored forms)
- **Undo/redo**: Track move history, allow up to 10 undos per level
- **Hint system**: Show one correct shape placement (limit 3 per game)
- **Mistake check**: Validate if current placement can lead to solution
- **Star ratings**: Time + moves + undo penalty → 1-3 stars
- **Progress save**: localStorage (unlocked levels, best stars, best times)
- **Tutorial**: First level shows text overlay explaining drag/rotate/flip
- **Sound**: Web Audio API for all SFX + BGM
- **Analytics**: GameZipper site pixel
- **SEO**: VideoGame + FAQPage + HowTo + BreadcrumbList JSON-LD

## Next Phase: Phase 3 (Game Development)
