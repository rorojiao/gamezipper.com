# Killer Sudoku — BENCHMARK.md

## Overview
Killer Sudoku (also known as Sumdoku, Addoku, Samunamupure) combines Sudoku row/column/block constraints with Kakuro-style cage sum constraints. Numbers 1-9 fill a 9x9 grid, with dotted-line cages where cells must sum to the cage's target number, with no repeats within a cage.

## Competitor Analysis

### 1. sudoku.com Killer Sudoku
- **Levels**: Easy, Medium, Hard, Expert + Daily
- **Systems**: Hints, Notes/Pencil marks, Undo, Auto-check, Timer, Stats
- **Monetization**: Premium (remove ads), hint packs
- **Notes**: #1 Killer Sudoku platform globally, clean UI, strong daily retention
- **Key Feature**: "45 Rule" helper that teaches the advanced technique

### 2. BrainBashers Killer Sudoku
- **Levels**: Easy, Medium, Hard, Tough
- **Systems**: Daily puzzle, Possible combinations helper, Pencil marks
- **Notes**: Long-running (20+ years), educational focus
- **Key Feature**: Shows all possible number combinations for each cage

### 3. NY Times Killer Sudoku
- **Levels**: Easy, Medium, Hard
- **Systems**: Notes, Hints, Error checking, Streak tracking
- **Notes**: Premium NYT brand, clean design, strong daily format
- **Key Feature**: Share results (like Wordle), streak system

### 4. Conceptis Puzzles Killer Sudoku
- **Levels**: Multiple difficulties, sizes (6x6, 9x9)
- **Systems**: Symmetrical puzzle generation, Tutorial, Undo
- **Notes**: Professional puzzle publisher, highest quality generation algorithms

## Required Systems (from BENCHMARK)

1. **Core Gameplay**:
   - 9x9 grid with standard Sudoku constraints (row/col/block 1-9)
   - Cage system: dotted-line groups with sum target in corner
   - No-repeat rule within cages
   - 45 Rule display (visual helper for advanced players)

2. **Difficulty Levels**: Easy, Medium, Hard, Expert (4 levels)
3. **Level Count**: 30+ generated puzzles across all difficulties
4. **Daily Puzzle**: Seeded random for consistent daily challenge
5. **Hints**: Cage combinations helper + cell reveal
6. **Notes/Pencil Marks**: Toggle, auto-clear on solve
7. **Undo/Redo**: Full history
8. **Timer**: Optional, with best times per difficulty
9. **Stats**: Puzzles completed, best times, streak, win rate
10. **Tutorial**: Interactive step-by-step "How to Play" for newcomers
11. **Error Checking**: Highlight conflicts (optional mode)
12. **Settings**: Notes toggle, highlight errors, highlight cages, timer, theme
13. **Score System**: Time-based + hints-penalty scoring
14. **Star Ratings**: Based on completion time and hints used
15. **Progressive Difficulty**: Puzzles get harder within each difficulty tier

## Key Gameplay Differences vs Our Existing Games

- **Sudoku**: No cages, no sum constraints — Killer Sudoku adds a math layer
- **Kakuro**: No block constraints, no 9x9 grid — Killer Sudoku has 3x3 blocks
- **KenKen**: Operations vary (+, -, ×, ÷), any grid size — Killer is always 9x9 sum-only

## Visual Style Reference
- Dark neon theme matching GameZipper style
- Colored cage borders (different colors per cage for visual clarity)
- Clean number input (tap to cycle 1-9 or number pad)
- Satisfying completion animation (particles, glow effect)
