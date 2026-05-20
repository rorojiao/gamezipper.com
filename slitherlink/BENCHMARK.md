# Slitherlink - Competitive Benchmark

## Competitors Analyzed

### 1. Slitherlinks.com
- 3,000+ puzzles, daily challenge, multiple grid sizes
- Clean UI, tutorial, hints system
- Grid sizes: 5x5 to 15x15
- Difficulty: Easy to Expert

### 2. BrainBashers Daily Slitherlink
- Daily puzzle, 3 difficulty levels (Easy/Medium/Hard)
- Grid sizes: 6x6, 8x8
- Timer, hints

### 3. Conceptis Puzzles (Nikoli)
- 7 size configs: 6x6, 7x7, 8x8, 10x10, 10x12, 12x12, 12x16
- 6 difficulty levels
- High-quality puzzles

### 4. Eqsy Slitherlink
- Clean modern UI, browser-based
- Free, no sign-up
- Touch-friendly

### 5. Nintendo Switch (Puzzle by Nikoli S: Slitherlink)
- Touch/stylus support
- High-quality Nikoli puzzles

## Core Game Rules
- Draw a single continuous loop along the grid edges
- Numbers indicate how many of the 4 edges around that cell are part of the loop
- The loop cannot cross itself
- The loop has no branches (each vertex has exactly 0 or 2 edges)
- Cells without numbers can have any number of edges (0-4)

## Systems to Implement
1. **Grid rendering**: Clickable edges between dots, clear visual feedback
2. **Input modes**: Draw edge (toggle) / Mark X (edge NOT part of loop)
3. **Validation**: Real-time error checking for loops crossing/branching
4. **Scoring**: Time-based, star ratings per puzzle
5. **Hints**: Reveal one correct edge
6. **Undo/Redo**: Full move history
7. **Tutorial**: Step-by-step introduction
8. **Progress saving**: localStorage with level completion
9. **Sound**: Web Audio API - click, success, error sounds
10. **Daily puzzle**: One puzzle per day, streak tracking

## Target Specs
- 40+ hand-crafted levels
- Grid sizes: 5x5 (Easy) to 9x9 (Hard)
- 3 difficulty tiers with 10+ levels each
- Pencil mark mode (X marks)
- Error highlighting
- Timer + best times
- Star rating (based on time + hints used)
