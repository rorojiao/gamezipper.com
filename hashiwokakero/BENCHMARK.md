# Hashiwokakero (Bridges) — Competitive Benchmark

## Competitor Analysis

### 1. Puzzle-Baron Bridges
- **Grid Sizes**: 7x7, 10x10, 13x13, 15x15
- **Difficulty**: 3 levels (Easy/Medium/Hard)
- **Systems**: 1000s of puzzles, free account for progress, timer, hints
- **Visual**: Clean, minimal design with numbered circles and horizontal/vertical bridges

### 2. Simon Tatham's Puzzles (Bridges)
- **Grid**: Configurable 4x4 to 12x12
- **Features**: Undo/redo, hints, auto-solver validation
- **Minimalist**: Pure puzzle, no frills

### 3. Hashi.info
- **Grid**: Multiple sizes with difficulty settings
- **Features**: Daily puzzle, statistics
- **Mobile**: Responsive design

### 4. GridPuzz (Bridges)
- **Features**: Tutorial, strategies guide, clean UI
- **Systems**: Hints, undo, auto-check

### 5. PuzzleGenius (Hashiwokakero)
- **Features**: Free puzzle downloads, books, video tutorial
- **Grid**: Various sizes

## Core Rules (Universal)
1. Grid with numbered circles (islands). Number = required bridge count
2. Bridges connect horizontally or vertically (no diagonal)
3. Max 2 bridges between any pair of islands
4. Bridges cannot cross each other
5. All islands must be connected into a single network (no isolated groups)

## Required Systems
1. **Grid sizes**: 5x5 (Easy), 7x7 (Medium), 9x9 (Hard), 11x11 (Expert)
2. **Procedural generation**: Algorithmic puzzle generation with guaranteed unique solution
3. **Bridge interaction**: Click to add 1st bridge, click again for 2nd bridge, click again to remove
4. **Validation**: Real-time island count display (current/required), connectivity check
5. **Hints**: Highlight an island that can be deduced
6. **Undo/Redo**: Full history stack
7. **Timer**: With best time per difficulty
8. **Daily Puzzle**: Seeded random daily challenge
9. **Statistics**: Games won, streak, best times
10. **Tutorial**: Step-by-step interactive tutorial
11. **Scoring**: Based on time + hints used, 3-star rating
12. **Visual feedback**: Animate bridge placement, celebration on completion
13. **Sound**: Web Audio API for all interactions

## Visual Style Reference
- Dark gradient background with neon accent (GameZipper style)
- Islands as glowing circles with numbers
- Bridges as clean horizontal/vertical lines (1=thin, 2=parallel)
- Smooth animations for bridge placement/removal
- Victory: particle celebration
- Color-coded island status (green=correct, orange=under, red=over)

## Numerical Design
- Easy (5x5): 4-6 islands, simple layouts
- Medium (7x7): 6-10 islands, moderate complexity
- Hard (9x9): 10-15 islands, complex deduction required
- Expert (11x11): 15-20 islands, multi-step logical chains
