# KenKen / MathDoku — Competitive Benchmark

## Competitor Analysis

### 1. KenKen Puzzle (Official - kenkenpuzzle.com)
- **Core Mechanic**: Grid-based math puzzle where cages specify target numbers and operations
- **Grid Sizes**: 3x3 to 9x9
- **Levels**: Unlimited daily puzzles, archives
- **Systems**: Timer, hints, notes/pencil marks, undo, difficulty levels (Easy/Medium/Hard/Expert)
- **Monetization**: Ads, premium subscription
- **Style**: Clean, newspaper-style

### 2. MathDoku (Google Play)
- **Core Mechanic**: Same as KenKen, number logic puzzle
- **Grid Sizes**: 4x4 to 9x9
- **Levels**: Unlimited generation
- **Systems**: Notes, hints, undo, statistics, difficulty levels
- **Style**: Minimalist, clean

### 3. Calcudoku (calcudoku.org)
- **Core Mechanic**: Extended KenKen with more operations
- **Grid Sizes**: 4x4 to 12x12
- **Levels**: Daily + user-submitted puzzles
- **Systems**: Timer, leaderboards, achievements, solving techniques guide
- **Style**: Classic web puzzle

### 4. Sudoku.com KenKen Mode
- Features similar puzzle mechanics as a mode
- Progress tracking, streaks, daily challenges

## Must-Have Systems for S-Grade Implementation

1. **Puzzle Generation**: Algorithmic generation of valid KenKen puzzles with unique solutions
2. **Grid Sizes**: 4x4 (Easy), 5x5 (Medium), 6x6 (Hard), 7x7 (Expert)
3. **Operations**: +, -, ×, ÷ with proper cage constraints
4. **Notes/Pencil Marks**: Toggle pencil mode for candidate numbers
5. **Undo/Redo**: Full move history
6. **Hints**: Reveal cell, reveal cage
7. **Timer**: Optional timer with best times per difficulty
8. **Scoring**: Points based on speed + difficulty + no-hints bonus
9. **Progress Saving**: localStorage with version field
10. **Tutorial**: Interactive tutorial for first-time players
11. **Daily Puzzle**: Generated daily puzzle
12. **Statistics**: Games played, win rate, best times, streaks
13. **Star Rating**: 3 stars per puzzle (based on time)
14. **Error Detection**: Highlight conflicts
15. **Number Input**: Click number pad (mobile-friendly)

## Core Values (Numerical Design)

- 4x4 Grid: Numbers 1-4, Easy difficulty
- 5x5 Grid: Numbers 1-5, Medium difficulty  
- 6x6 Grid: Numbers 1-6, Hard difficulty
- 7x7 Grid: Numbers 1-7, Expert difficulty
- Score formula: base_score * difficulty_mult * time_bonus
- Time bonus: 3 stars < 2min, 2 stars < 5min, 1 star = complete
- Hint penalty: -50 points per hint used
