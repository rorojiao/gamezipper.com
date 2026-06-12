# BENCHMARK.md — "Block Out!" Competitive Analysis
> Date: June 12, 2026

## Key Competitors
1. **Blockout (Original 1989)** - 3D pit, polycubes, flat/basic/extended block sets, 10 levels
2. **Block Blast!** (14M DAU) - 8x8 grid, drag-drop, combos, power-ups
3. **Blockudoku** - 9x9 + 3x3 squares, daily challenges, seasonal events
4. **3D Tetris** (Virtual Boy) - 5-layer well, wireframe 3D
5. **Woodoku** - 9x9 wood theme, cozy aesthetic

## Required Systems (from competitors)
- Multi-factor scoring: piece complexity × drop height × level + layer bonuses + combos
- Power-ups: bomb, lightning, undo
- 20+ levels with difficulty progression
- Tutorial/practice mode
- Daily challenge system
- Progress save with localStorage
- Leaderboard (best scores)
- Celebration animations + particle effects
- Dark neon aesthetic (GameZipper style)

## Scoring Formula
Base Points = piece_cubes × block_set_factor × current_level
Drop Bonus = drop_height × height_multiplier  
Layer Clear = layer_area × level × (1 + 0.5 × (layers_cleared - 1))
Combo Bonus = consecutive_clears × combo_multiplier
Blockout Bonus = 2 × layer_clear (flush)
