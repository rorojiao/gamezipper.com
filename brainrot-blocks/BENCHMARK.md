# BENCHMARK.md — Brainrot Blocks

## Game: Brainrot Blocks (brainrot-blocks)
Category: Puzzle (Block Placement)
Inspired by: Wood Block Puzzle, Block Blast, Brainrot Blocks (CrazyGames)

## Competitor Analysis

### 1. Block Blast (GZ existing)
- Endless mode, drag-and-drop shapes onto grid
- Score-based, best score saved
- Clean modern UI

### 2. Wood Block Puzzle (GZ existing)
- 10x10 grid, 3 shapes at a time
- Row/column clearing with combo bonuses
- 47KB, feature-rich

### 3. Brainrot Blocks (CrazyGames Original)
- Same block mechanic but meme-themed
- Viral Gen-Z appeal
- Neon aesthetics, chaotic energy

## Differentiation Strategy
- **Theme**: Brainrot/meme aesthetic (neon, glitch, internet culture)
- **Level System**: 30 progressive levels with targets (not just endless)
- **Combo System**: Multi-line clears with exponential bonuses
- **Special Effects**: Screen shake, particle explosions, glitch animations
- **Character Integration**: Fun meme-style text popups on combos

## Core Systems to Implement
1. ✅ 10x10 grid with drag-and-drop block placement
2. ✅ 30 progressive levels (target score per level)
3. ✅ 3 block shapes shown at all times
4. ✅ Row + column clearing with animations
5. ✅ Combo multiplier system (multi-line clears)
6. ✅ Score + best score (localStorage)
7. ✅ Level progression with increasing difficulty
8. ✅ Progress save (localStorage with version)
9. ✅ Tutorial/first-time guide
10. ✅ Web Audio API sound effects (procedural)
11. ✅ Particle effects on clears
12. ✅ Screen shake on combos
13. ✅ Brainrot-themed text popups
14. ✅ Settings (sound toggle)
15. ✅ Pause/resume

## Scoring Formula
- Block placed: +1 per cell
- Single line clear: +10 per cell
- Double line clear: +25 per cell (1.5x bonus)
- Triple+ line clear: +50 per cell (2x bonus)
- Combo streak: additional +5 per consecutive clear turn

## Level Progression
- Levels 1-5: Target 100-300 points, shapes 1-4 cells
- Levels 6-10: Target 300-600 points, shapes 2-5 cells  
- Levels 11-20: Target 600-1200 points, shapes 3-5 cells
- Levels 21-30: Target 1200-3000 points, complex shapes

## Art Style
- Dark background (#0a0a12) with neon grid
- Block colors: neon cyan, magenta, yellow, green, orange, purple
- Glitch effect on text and UI elements
- Glow effects on placed blocks
- Particle effects in neon colors
