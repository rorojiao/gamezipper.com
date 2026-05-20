# Lights Out - Competitive Benchmark

## Competitors Analyzed

### 1. Tiger Electronics Lights Out (1995 Original)
- **Grid**: 5x5
- **Mechanic**: Click toggles clicked cell + 4 orthogonal neighbors
- **Features**: Single puzzle mode, basic reset
- **Art**: Physical handheld, red/green LED grid
- **Music**: Simple beep sounds

### 2. Jaap's Lights Out Puzzle (mathpuzzle.com/Jaap/lightsout/)
- **Grid**: Multiple sizes (3x3 to 10x10)
- **Features**: Solvability analysis, optimal solution finder, move counter
- **Systems**: Manual puzzle entry, algorithmic solving (Gaussian elimination mod 2)
- **Difficulty**: Based on grid size and solvability

### 3. CrazyGames / Coolmath Lights Out variants
- **Grid**: 5x5 classic
- **Features**: Move counter, best score, reset, undo
- **Levels**: Pre-set puzzles with increasing difficulty
- **Scoring**: Based on moves used vs par

### 4. Mobile App versions (Android/iOS)
- **Grid**: 5x5 + variants
- **Features**: Level progression, hints, undo, themes, daily puzzle, achievements
- **Monetization**: Ads between levels, hints as IAP

## Systems to Implement

| System | Priority | Description |
|--------|----------|-------------|
| Grid Toggle Core | P0 | Click cell toggles self + orthogonal neighbors |
| Level System | P0 | 50+ levels across 3 grid sizes (5x5, 6x6, 7x7) |
| Move Counter | P0 | Track moves per level, show par |
| Star Rating | P0 | 3 stars based on moves vs optimal |
| Undo | P0 | Undo last move(s) |
| Progress Save | P0 | localStorage with version |
| Tutorial | P0 | Interactive how-to-play on first launch |
| Hint System | P1 | Highlight a cell to click |
| Daily Puzzle | P1 | Seeded random puzzle per day |
| Statistics | P1 | Total moves, best per level, streak |
| Sound FX | P0 | Toggle on/off sound effects |
| Animations | P0 | Cell toggle animation, completion celebration |
| Theme Options | P2 | Dark/light/color themes |

## Level Design Philosophy
- Start with 5x5 grid, simple 3-4 move solutions
- Progress to 6x6, then 7x7
- Every level must be mathematically solvable (generate from solution)
- Par score = optimal number of moves
- Star ratings: 3★ = par, 2★ = par+2, 1★ = completed

## Visual Style
- Dark neon theme (GameZipper standard)
- Glowing light cells vs dark off cells
- Smooth toggle animations
- Grid glow effects on hover
- Celebration particles on level complete
