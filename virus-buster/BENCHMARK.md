# Virus Buster — Competitive Benchmark

## Competitors Analyzed
- **Dr. Mario** (NES 1990, 10.4M copies) — genre-defining hit
- **Dr. Mario 64** (2001) — added Marathon, Flash, Score Attack modes
- **Dr. Mario Online Rx** (2008) — Virus Buster drag-drop mode (namesake)
- **Dr. Mario World** (2019 mobile) — character skills, F2P hooks (avoid)

## Core Mechanics
- 8×16 grid, bottle-shaped playfield
- 2-segment pills (3 colors: red/yellow/blue)
- 4+ same color in row/column = match → clear
- Viruses don't fall; only pill halves cascade after clears
- Rotation with wall kicks (4 rotation states)

## Level Progression (NES Canonical)
- Virus formula: `level × 4 + 4`, capped at 84
- 20 levels: L0=4 viruses → L20=84 viruses
- Speed increases per level + every 10 pills in-level

## Scoring (NES)
- `base × 2^(n-1)` per virus in a move
- base = 100/200/300 (Low/Med/Hi speed)
- 6th+ virus caps at base × 32

## Systems to Implement
1. Falling pill engine (spawn, move, rotate, soft/hard drop, lock)
2. Collision detection (walls, floor, other pills)
3. Match detection (H+V line scans, 4+ same color)
4. Cascade resolver (gravity for pills, repeat until stable)
5. Virus generator (level-based count + random placement)
6. Next-pill preview queue
7. Scoring + combo bonuses
8. 20 levels + Endless mode
9. localStorage progress (level reached, high score)
10. Pause, restart, settings
11. Web Audio SFX (drop, land, match, combo, speed-up, win, lose)
12. Procedural BGM (chill ambient, A-minor)
13. Mobile touch D-pad + keyboard controls
14. Canvas particles on match clear
15. Ghost piece (landing preview)

## Art Style
- Canvas-drawn viruses (cute blobs with eyes, idle animation)
- Capsule-shaped pills with rounded ends
- Glass bottle effect (semi-transparent border, highlights)
- Dark GameZipper gradient background
- Color-blind support (distinct shapes per color)

## What NOT to Copy (from Dr. Mario World)
- Hearts/lives system
- Gacha character unlocks
- Microtransactions
- Forced login
