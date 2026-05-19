# Number Slide (15 Puzzle) - Competitive Benchmark

## Competitors Analyzed

| Game | Platform | Grid Sizes | Key Features | Rating |
|------|----------|------------|--------------|--------|
| 15 Puzzle Classic (Balance Apps) | iOS | 4x4 | Basic tap, timer, moves | 4+ age |
| Roll the Ball | Android | 4x4 | 160+ levels, themes, no time limit | 4.4★ |
| NumberPuz | Web/Android | 3x3-10x10 | Hints, offline, multiple sizes | Popular |
| 15 Puzzle abathur8bit | Android | 3x3-8x8 | Classic/Snake/Spiral, speedcubing stats | Open Source |
| SlidingPuzzle.net | Web | 3x3-6x6 | Multiple grids, image puzzles | Web |

## Systems to Implement

1. **Multiple Grid Sizes**: 3x3 (Easy), 4x4 (Medium), 5x5 (Hard), 6x6 (Expert)
2. **Puzzle Patterns**: Classic (row order), Snake (zigzag), Spiral
3. **Scoring**: Move counter + timer + star rating (3 stars = optimal, 2 = good, 1 = completed)
4. **Hint System**: 3 hints per puzzle, highlights next optimal move
5. **Undo**: Unlimited undo, tracks move history
6. **Daily Challenge**: Seeded puzzle based on date
7. **Statistics**: Best times, best moves, total puzzles solved, streak
8. **Tutorial**: First-time interactive guide
9. **Themes**: 4 color themes (Dark Neon, Ocean, Forest, Sunset)
10. **Controls**: Both tap and swipe

## Star Rating Thresholds

| Grid | 3 Stars | 2 Stars | 1 Star |
|------|---------|---------|--------|
| 3x3 | ≤15 moves | ≤30 moves | Any |
| 4x4 | ≤80 moves | ≤150 moves | Any |
| 5x5 | ≤200 moves | ≤400 moves | Any |
| 6x6 | ≤400 moves | ≤800 moves | Any |

## Visual Style
- Dark gradient background with neon accents (GameZipper style)
- Tiles with subtle gradients, rounded corners, depth shadows
- Smooth 200ms ease-out slide animations
- Victory: particle burst + tile cascade animation
- Empty space: subtle dark inset

## Audio
- Tile slide: soft click (Web Audio)
- Invalid move: low buzz
- Hint reveal: chime
- Victory: ascending arpeggio celebration
- BGM: Lo-fi ambient, relaxing (Web Audio procedural)
