# Knotwords — Competitive Benchmark

## Game Overview
Knotwords is a crossword-like word logic puzzle created by Zach Gage and Jack Schlesinger.
It combines the structure of crosswords with the deduction logic of Sudoku/Kakuro.
Each cell belongs to both a row and column "bundle" that has a set of allowed letters.
Players must deduce which letters go where to form valid words in all directions.

## Top 3 Competitors

### 1. Knotwords (Original — Zach Gage)
- **Core Mechanic**: Crossword meets Sudoku — each row/column bundle gives letter hints
- **Levels**: Daily puzzles (free) + archive (premium). Classic mode + Twist mode
- **Systems**:
  - Daily challenge with streak tracking
  - Hint system (reveal letter, reveal word)
  - Progress save per puzzle
  - Streak counter
  - Statistics (win rate, average time)
  - Color-coded bundles (each group of cells shares a color)
- **Art Style**: Clean, minimalist, pastel colors, modern typography
- **Music**: Ambient, calming, lo-fi piano
- **Monetization**: Free daily + premium archive subscription
- **Score**: No traditional score — time-based + streak

### 2. Wordle / Quordle / Crosswordle
- **Core Mechanic**: Word guessing with letter feedback
- **Systems**: Daily puzzle, streak, shareable results, statistics
- **Art Style**: Grid-based, simple, colorful feedback tiles
- **Score**: Guess count + streak

### 3. Typeshift (Zach Gage)
- **Core Mechanic**: Shift columns of letters to form words
- **Systems**: Daily puzzle, hint system, word list completion
- **Art Style**: Clean, flat design, colorful letter tiles
- **Score**: Words found / total words

## Key Systems to Implement
1. **Crossword-Sudoku hybrid mechanic**: Bundles of cells share letter constraints
2. **Level system**: 30+ levels with progressive difficulty
3. **Bundle color coding**: Each letter group has a distinct color
4. **Hint system**: Reveal letter, reveal word, check errors
5. **Score system**: Time bonus + hint penalty + accuracy bonus
6. **Progress save**: localStorage with version field
7. **Tutorial**: Interactive first-puzzle guide
8. **Daily challenge**: Seeded puzzle based on date
9. **Statistics**: Games played, win rate, best time, current streak
10. **Sound effects**: Key press, correct word, puzzle complete, error

## Art Direction
- Dark gradient background (GameZipper style)
- Neon/gradient letter tiles
- Bundle colors: distinct pastel/neon for each group
- Smooth animations: tile placement, word completion, celebration
- Glass-morphism UI panels

## Music Direction
- Ambient electronic, calm, puzzle-solving mood
- Subtle background with no lyrics
- Procedural via Web Audio API
