# Pentominous (#605) — Competitive Benchmark

## Puzzle Type: Pentominous (Nikoli, 2013)
- **Author**: Grant Fikes
- **Type**: Region division / Polyomino puzzle
- **Also known as**: Pentominous Regions

## Rules
1. Grid cells must be divided into regions of exactly 5 connected cells (pentominoes).
2. No two identical pentomino shapes may share an edge (orthogonally adjacent).
3. Some cells contain letters (F, I, L, N, P, T, U, V, W, X, Y, Z) indicating the pentomino type that cell belongs to.
4. All cells must be covered; regions are fully connected (4-connected).

## The 12 Pentominoes
- F, I, L, N, P, T, U, V, W, X, Y, Z — standard one-sided pentomino naming
- Each has fixed orientations (F=8, I=2, L=8, N=8, P=8, T=4, U=4, V=4, W=4, X=1, Y=8, Z=4)

## Competitive Analysis
- **gmpuzzles.com**: Has Pentominous puzzles by Grant Fikes — free, web-based
- **Simon Tatham's Portable Puzzle Collection**: Has "Signpost" but NOT Pentominous
- **Puzzle Baron**: No Pentominous clone
- **App stores**: No browser-based free Pentominous clone with multi-level progression
- **Gap**: Zero GameZipper catalog entries for "pentominous" (grep verified)

## Differentiation
- 30 levels across 5 tiers (6×6 Beginner → 12×12 Expert)
- Procedural generation with uniqueness solver
- Canvas rendering with drag-to-paint interaction
- Web Audio BGM + SFX
- Daily challenge mode with deterministic seed
- Hint system, star ratings, localStorage progress save

## Difficulty Progression
- Tier 1 (Beginner): 6×6 grids, heavy letter clues (50%+ cells lettered)
- Tier 2 (Easy): 7×7 grids, moderate letter clues (~30%)
- Tier 3 (Medium): 8×8 grids, fewer letter clues (~20%)
- Tier 4 (Hard): 10×10 grids, minimal letter clues (~10%)
- Tier 5 (Expert): 12×12 grids, sparse letter clues (~5%)
