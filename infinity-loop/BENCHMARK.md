# Infinity Loop — Benchmark Document

## Competitors Analyzed
1. **Infinity Loop (Balysv)** — Google Play 50M+ downloads, 4.7/5 rating, #1 relaxing puzzle
2. **Loop Puzzle (Poki)** — Millions of plays, featured on Poki puzzle section
3. **Pipe Puzzle (Voodoo)** — 10M+ downloads, rotate-to-connect mechanic
4. **Happy Glass / Connect Flow** — Similar pipe/connection genre

## Core Mechanic
- Grid of pipe/path tiles with different connection shapes
- Player rotates tiles to connect all paths into complete loops
- When all connections are made, the level is complete
- No timer — pure zen/relaxing experience
- Click/tap to rotate tiles 90° clockwise

## Tile Types (Minimum)
- **Dead End** — 1 connection (line segment, one end)
- **Straight** — 2 connections (opposite sides, ═)
- **Curve/Bend** — 2 connections (adjacent sides, ╗)
- **T-Junction** — 3 connections (╦)
- **Cross** — 4 connections (╬)
- **Dot** — 0 connections (empty/disconnected)

## Systems Required
- **Infinite Procedural Generation**: Algorithm generates solvable puzzles
- **Level Difficulty Scaling**: Start 3x3 → progress to 4x4 → 5x5 → 6x6 → 7x7 → 8x8
- **Connection Validation**: Check if all paths form complete loops
- **Satisfaction Animation**: Connected paths glow/pulse, completion celebration
- **Move Counter**: Track number of rotations per level
- **Best Score Tracking**: Fewest moves per level size
- **Progress Saving**: localStorage with level reached, total moves
- **Sound Effects**: Web Audio API — ambient zen sounds, soft click on rotate, satisfying completion chime
- **Zen Aesthetic**: Dark background, neon/glowing path lines, minimal UI
- **Hint System**: Optional hint button that solves one tile

## Visual Style
- Dark theme (#0a0a1a background)
- Neon glowing paths (cyan/teal primary, purple accent)
- Smooth rotation animations (CSS or Canvas)
- Particle effects on level completion
- Minimal, clean UI with GameZipper chrome

## Difficulty Progression
- Level 1-5: 3x3 grid (tutorial)
- Level 6-15: 4x4 grid
- Level 16-30: 5x5 grid
- Level 31-50: 6x6 grid
- Level 51-75: 7x7 grid
- Level 76+: 8x8 grid (and beyond)

## Key Features
- No time pressure (zen game)
- Smooth 90° rotation animations
- Visual feedback for connected vs unconnected paths
- Level counter and grid size indicator
- Responsive design (mobile + desktop)
- Touch and mouse support
