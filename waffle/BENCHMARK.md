# Waffle — Competitive Benchmark

## Competitors

### 1. WaffleGame.net (Original)
- 5×5 grid, 6 words (3 across + 3 down)
- 15 swaps allowed
- Color feedback: Green = correct position, Yellow = in word but wrong spot, Gray = not in that word
- Daily puzzle format (one per day)
- Share results feature
- Star rating based on swaps used

### 2. Waffle2 (DailyWaffleGame.com)
- Same 5×5 grid mechanic
- 10 tips/strategies published
- Additional features: undo, hints
- Practice mode (random puzzles)

### 3. Arkadium Waffle
- Drag and drop letter placement
- Color feedback system
- Multiple difficulty levels
- Statistics tracking

### 4. BrainPlay Waffle
- Random puzzles + puzzle builder
- Strategy guidance built in
- Practice mode

## Systems to Implement

### Core Mechanics
- 5×5 crossword grid with 6 interconnected words
- Letter swap mechanic (click two tiles to swap)
- 15 swaps maximum per puzzle
- Color-coded feedback (green/yellow/gray)

### Scoring
- Star rating: ⭐⭐⭐ (0-7 swaps), ⭐⭐ (8-12), ⭐ (13-15)
- Daily puzzle streak tracking
- Total puzzles solved counter

### Progression
- Daily puzzle (seeded by date)
- Practice/unlimited mode (random puzzles)
- Difficulty levels (could vary grid complexity)

### Social
- Share results (emoji grid format)
- Daily streaks

### Meta/Quality
- Tutorial for first-time players
- Settings (sound on/off, dark mode)
- Statistics (played, win%, streak, best streak)
- localStorage save with version

### Audio
- Tile swap sound
- Correct word completion sound
- Puzzle complete celebration
- Error feedback sound
- BGM (relacing lo-fi)

### Visual
- Dark neon theme (GameZipper style)
- Smooth tile swap animations
- Color transition animations
- Particle celebration on completion
- Responsive mobile layout

## Key Technical Details

### Grid Structure
- 5×5 grid = 25 letter cells
- 3 horizontal words intersect with 3 vertical words
- Letters at intersections belong to both words
- Some cells are "blank" (not part of any word) — NO, in classic Waffle, ALL 25 cells contain letters that are part of at least one word

### Word Placement Algorithm
- 3 across words (row 0, row 2, row 4) — standard placement
- 3 down words (col 0, col 2, col 4) — intersecting
- This creates a waffle-pattern grid

### Puzzle Generation
- For daily: use date as seed
- For practice: random word selection
- Need a word list of valid 5-letter words
- Generate puzzles with valid solutions
- Scramble letters to create the puzzle

### Color Feedback
- After each swap, check all 6 words
- Green: letter is in correct position for ALL words it belongs to
- Yellow: letter is in the correct word but wrong position (for at least one word)
- Gray: letter does not belong in that position for any word
