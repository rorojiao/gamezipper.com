# Hexa Away — Benchmark & Design Spec (Round 47)

## Game Concept
Hexa Away: tap-away puzzle on a hexagonal grid. Each hex block has one of 6 directional arrows. Tap to slide it off the hex board. Blocks must be removed in the correct order.

## Key Innovation vs tap-away (R46)
- **Hex grid topology**: 6 exit directions (N, NE, SE, S, SW, NW) vs 4
- **Flat-top hexagons**: visually distinct, more intuitive directional arrows
- **Hexagonal board shape**: radius-based board (7/19/37 cells) vs rectangular
- **Diagonal path checking**: ray-trace along hex axes, not straight lines
- **6-color direction system**: each direction has a unique color

## Reference: tap-away/index.html (1202 lines)
- Structure: menu → level select → game → win overlay
- Canvas-based rendering with requestAnimationFrame
- Audio: Web Audio API (tones + procedural BGM)
- Progress: localStorage with stars/moves tracking
- Features: undo, hint, tutorial, settings, particles

## Hex Math (flat-top axial coordinates)
- Directions: N(0,-1), NE(1,-1), SE(1,0), S(0,1), SW(-1,1), NW(-1,0)
- Pixel: x = size * 1.5 * q, y = size * (sqrt(3)/2 * q + sqrt(3) * r)
- Board: all (q,r) where |q|<=N, |r|<=N, |q+r|<=N
- Arrow angle: -PI/2 + d * PI/3

## Level Design
- Procedural generation with seeded PRNG (deterministic)
- Solver validates solvability via backtracking
- 30 levels across 5 tiers: radius 1→2→3, blocks 3→25

## SEO Keywords
hexa away, hex away, hex block puzzle, hex tap away, hexagonal puzzle, hex block slide, hex direction puzzle, hex blast, hexa block
