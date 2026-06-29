# Tetra Fit — Competitive Benchmark

## Game Concept
Polyomino packing puzzle. Drag tetromino/pentomino pieces onto a grid to perfectly fill it with no gaps and no overlaps. 30 handcrafted levels across 6 difficulty tiers.

## Competitors Analyzed

### 1. Katamino (board game / digital)
- **Downloads**: Classic puzzle game, widely adapted
- **Mechanics**: Pentomino pieces packed into a rectangular board of varying width
- **Monetization**: Paid app / physical
- **Key Systems**: 12 pentomino pieces, progressive width (3→12), solitaire + 2-player

### 2. Woodoku (mobile, 10M+ downloads)
- **Mechanics**: Place polyomino pieces on a 9×9 grid, clear rows/columns/3×3 boxes
- **Monetization**: Ads + in-app purchases
- **Key Systems**: Three pieces at a time, combo scoring, daily challenges

### 3. Block Blast / Blockudoku (mobile, 50M+ downloads)
- **Mechanics**: Tetromino placement on grid, line clears
- **Monetization**: Interstitial + banner ads
- **Key Systems**: Score combos, endless mode

### 4. Blokus (board game / digital)
- **Mechanics**: Polyomino placement with corner-touching rule
- **Monetization**: Paid
- **Key Systems**: 4 colors, territory control, edge rules

## Tetra Fit Differentiation
- **NOT endless/score-based** — it's a **solved puzzle** (fill the exact shape, finite pieces)
- **Shape targets**: Not just rectangles — L-shapes, T-shapes, cross, hollow shapes (like tangram but with polyominoes)
- **Piece pool**: Mix of monominoes through pentominoes, not just tetrominoes
- **No line-clear**: The goal is perfect packing, not score maximization
- **Rotation + flip**: Full manipulation of pieces
- **30 handcrafted levels**: Designed with unique solutions, verified solvable

## Core Systems
1. Grid: variable size (4×4 → 8×8) with target shape mask
2. Pieces: polyominoes (1-5 cells), draggable, rotatable (90° steps), flippable
3. Validation: no overlap, no out-of-bounds, complete coverage to win
4. Hints: show valid placement for one piece
5. Star rating: 3 stars (no hints), 2 stars (1 hint), 1 star (2+ hints)
6. Progress: localStorage per-level stars + total
7. Audio: Web Audio API ambient + placement/clear/win SFX

## Visual Design
- Dark neon theme (#0a0a1a background)
- Each piece type has distinct neon color
- Glow effects on hover/valid placement
- Particle burst on level complete
- Smooth drag animation with ghost preview

## Monetization
- Monetag MultiTag (banner 110120, native 110121, interstitial 110122)
- Interstitial between levels (every 3 levels)
- No in-game purchases needed
