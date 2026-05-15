# Nonogram (Picross) — Competitive Benchmark

## Selected Game: Nonogram Puzzle
**Slug**: `nonogram`
**Score**: 25/25 (perfect gap match)

## Competitor Analysis

### 1. Poki Nonogram (poki.com/en/g/nonogram)
- **Grid sizes**: 5x5 to 15x15
- **Features**: Color mode (multi-color nonograms), daily puzzles
- **Systems**: Timer, hints, undo, zoom for large grids
- **Art**: Clean flat design, colorful pixel art reveals
- **Music**: Subtle ambient background

### 2. Nonograms.org
- **Grid sizes**: 5x5 to 50x50 (massive)
- **Features**: Black & white + color nonograms, 50,000+ puzzles
- **Systems**: Save progress, timer, hints, error checking
- **Art**: Classic web design, focus on puzzle clarity
- **Difficulty**: From trivial to extremely complex

### 3. Nonogram Katana (Mobile)
- **Grid sizes**: 5x5 to 25x25
- **Features**: Daily challenges, themed puzzle packs, achievements
- **Systems**: Hint system (limited), auto-check, trophies, collection
- **Art**: Japanese-themed, katana aesthetic, pixel art reveals
- **Monetization**: Premium puzzles, ad-supported

### 4. puzzle-nonograms.com
- **Grid sizes**: 10x10, 15x15, 20x20, 25x25
- **Features**: Left-click fill, right-click mark X, drag support
- **Systems**: Timer, best times, save progress, error highlighting
- **Art**: Clean minimalist, high contrast for clues

## Core Systems to Implement

### 1. Puzzle Grid System
- Click/drag to fill cells (left click)
- Click/drag to mark X (right click or toggle mode)
- Drag fill: click and drag across cells
- Touch: tap to fill, long-press or double-tap to mark X
- Auto-check row/column completion (highlight when row/col is solved)

### 2. Level System (Minimum 30 levels)
- **Tutorial** (3 levels): 5x5 grids, simple shapes
- **Easy** (8 levels): 5x5 to 7x7 grids
- **Medium** (10 levels): 10x10 grids
- **Hard** (6 levels): 10x10 to 15x15 grids
- **Expert** (3 levels): 15x15 grids
- Each level reveals a pixel art image on completion

### 3. Scoring System
- Base score: grid size × 100
- Time bonus: (par_time - actual_time) × 10
- No-hint bonus: ×1.5 multiplier
- No-error bonus: ×1.3 multiplier
- Star rating: 1-3 stars based on time

### 4. Progression System
- Level select with locked/unlocked states
- Complete level to unlock next
- Progress saved to localStorage (with version field)
- Overall completion percentage

### 5. Tools/Assistance
- **Hint**: Reveals one random unsolved cell (limited per level)
- **Undo**: Undo last N actions
- **Check**: Highlight errors (toggle, optional difficulty setting)
- **Reset**: Clear all filled cells for current puzzle

### 6. Tutorial System
- Interactive tutorial for first 3 levels
- Tooltips explaining how to read clues
- Visual indicators showing which rows/columns are complete
- Skip option for experienced players

### 7. UI/UX
- Dark gradient background (GameZipper style)
- Neon accent colors for filled cells
- Smooth animations on cell fill/unfill
- Row/column auto-highlight when clue is satisfied
- Victory animation with pixel art reveal
- Timer display
- Hint counter display

## Difficulty Curve
| Tier | Grid | Levels | Par Time | Theme |
|------|------|--------|----------|-------|
| Tutorial | 5×5 | 3 | 60s | Simple shapes (heart, star, arrow) |
| Easy | 5×5–7×7 | 8 | 90-180s | Animals, objects |
| Medium | 10×10 | 10 | 180-300s | Animals, nature, food |
| Hard | 10×10–15×15 | 6 | 300-600s | Complex scenes, characters |
| Expert | 15×15 | 3 | 600-900s | Detailed pixel art |

## Key Technical Notes
- Level data: solution grid (2D array) stored in-game
- Clues generated from solution grid at runtime
- Drag-fill with pointer events (touch + mouse)
- No external images needed — pixel art rendered from solution data
- Responsive: clue area auto-sizes based on grid dimensions
