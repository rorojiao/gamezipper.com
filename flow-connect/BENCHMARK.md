# BENCHMARK.md — Flow Connect Competitive Analysis

## Target Game
**Flow Connect** — Connect matching colored dots by drawing paths on a grid. Fill the entire board to complete each level.

## Competitors

### 1. Flow Free (Big Duck Games)
- **Downloads**: 100M+ (all-time top puzzle)
- **Grid Sizes**: 5×5 (3 colors) → 15×15 (up to 16 colors)
- **Packs**: Regular packs + Daily Puzzles + Time Trial mode
- **Scoring**: Star system (★ = completed, ★★★ = perfect/fewest moves)
- **Features**: Hints, level select, progress save, check marks for completed, stars for perfect
- **Expansions**: Bridges (pipe crossing), Hexes (hex grid), Warps (edge teleport), Shapes
- **Art Style**: Clean flat design, colorful pipes on white/light grid
- **Music**: Minimal ambient, satisfying connection sounds
- **Key Mechanic**: Numberlink puzzle — connect all same-color dots, fill entire grid, no crossings

### 2. Flow Free: Bridges
- Same as Flow Free but adds bridge tiles allowing pipe crossings
- Adds strategic depth

### 3. Pipe Puzzle: Connect & Flow
- Web-based competitor
- 100+ levels, hint system, relaxing music
- Different mechanic (rotate pipes vs draw paths)

## Systems to Implement (Our Version)

| System | Flow Free | Our Implementation |
|--------|-----------|-------------------|
| Grid Sizes | 5×5 → 15×15 | 5×5 → 9×9 (5 packs) |
| Colors | 3 → 16 | 4 → 8 |
| Levels per pack | 15-150 | 20 per pack (100 total) |
| Star Rating | ★/★★/★★★ | ★/★★/★★★ (based on hints used) |
| Hints | Yes | Yes (3 per level, earn more with stars) |
| Tutorial | First-time overlay | Yes (3-step tutorial) |
| Progress Save | Yes | localStorage with version |
| Time Trial | Yes | No (scope) |
| Daily Puzzle | Yes | Yes (seeded by date) |
| Sound Effects | Yes | Web Audio procedural |
| BGM | Minimal | Web Audio procedural |
| Mobile Support | Yes | Touch + responsive |

## Difficulty Progression
| Pack | Grid | Colors | Difficulty |
|------|------|--------|-----------|
| Beginner | 5×5 | 4 | Easy (25 cells, 4 paths) |
| Easy | 6×6 | 5 | Moderate (36 cells, 5 paths) |
| Medium | 7×7 | 6 | Hard (49 cells, 6 paths) |
| Hard | 8×8 | 7 | Very Hard (64 cells, 7 paths) |
| Expert | 9×9 | 8 | Expert (81 cells, 8 paths) |

## Art Direction
- Dark gradient background (GameZipper style)
- Neon accent colors for pipes
- Glass-morphism UI panels
- Smooth path-drawing animations
- Celebration particles on level complete

## Music Direction
- Ambient electronic, ethereal pads
- Soft synthesizer melodies
- Low-tempo, relaxing puzzle atmosphere
