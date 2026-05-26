# Threes! — Competitive Benchmark

## Game Overview
Threes! (by Asher Vollmer, 2014) is the original number-sliding puzzle that inspired 2048. It features deeper strategy through constrained merging rules (1+2=3 only, then same-value doubling).

## Competitors Analyzed
1. **Threes! (Original iOS)** — Asher Vollmer, 500K+ downloads, paid ($1.99) then freemium
2. **Threes! Freeplay** — Free version, 500K+ downloads on Google Play
3. **2048 Galaxy** (GameZipper) — Our existing game, different merge mechanic (free merge any same numbers)

## Core Mechanics to Implement
- **4x4 grid** with swipe/arrow key controls
- **Merge rules**: 1+2=3 (base merge), then N+N=2N (3+3=6, 6+6=12, etc.)
- **New tile spawn**: After each swipe, a new tile slides in from the edge (1, 2, or 3)
- **Spawn preview**: Show NEXT tile before swiping
- **Game over**: No valid moves possible

## Systems to Implement
| System | Description | Priority |
|--------|-------------|----------|
| Core merge | 1+2=3, N+N=2N | CRITICAL |
| Swipe controls | Arrow keys + touch swipe | CRITICAL |
| Spawn system | New tiles from edge with preview | CRITICAL |
| Scoring | Sum of all tiles on board | CRITICAL |
| Best score | localStorage persistence | HIGH |
| Tutorial | How to play overlay | HIGH |
| Undo | One-step undo | MEDIUM |
| Sound effects | Web Audio API procedural | HIGH |
| Animations | Slide, merge, spawn | HIGH |
| Stats | Games played, highest tile, total score | MEDIUM |
| Settings | Sound toggle, reset | MEDIUM |

## Scoring System
- Score = sum of all tile values on the board at game over
- Higher tiles worth exponentially more (3=3, 6=6, 12=12, 24=24, etc.)
- Track: current score, best score, highest tile achieved

## Visual Style
- Clean, modern dark neon theme (GameZipper style)
- Each tile value has distinct color gradient
- Personality: tiles get faces/expressions at higher values (like original Threes!)
- Smooth slide and merge animations
- Glass-morphism score panels

## Key Differentiator from 2048 Galaxy
- 2048: merge any same numbers freely → simpler, more chaotic
- Threes: 1+2=3 base merge constraint → deeper strategy, more planning required
- This makes Threes! appeal to strategy puzzle fans who find 2048 too random
