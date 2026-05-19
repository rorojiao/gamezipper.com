# Path Finder (Numberlink) — Competitive Benchmark

## Game Concept
Draw continuous paths connecting pairs of matching numbers/colors on a grid. Paths cannot cross or overlap. Every cell must be filled.

## Key Competitors

### 1. Flow Free (Big Duck Games)
- **Downloads**: 100M+ (original + variants)
- **Levels**: 2,000+ free levels across multiple board sizes (5x5 to 9x9)
- **Modes**: Classic, Time Trial, Daily Puzzle, Bridges (lines can cross at bridges)
- **Systems**: Star rating (perfect = no backtracking), hints, level packs, achievements
- **Mechanics**: Color-coded pairs, free-form path drawing, must fill entire board
- **Difficulty**: Progressive within each pack (starts easy, gets very hard)
- **IAP**: Hint packs, ad removal

### 2. Zip Game (LinkedIn Puzzle)
- **Format**: Connect numbered cells in ascending order (1→2→3→...) with single continuous path
- **Mechanics**: Must fill EVERY cell, not just connect pairs
- **Features**: Daily puzzle, unlimited mode, archive, timer
- **Grid**: Various sizes
- **Note**: Different from Numberlink — single path through all numbers vs. multiple pairs

### 3. Numberlink (MeTool/BrainPlay)
- **Grid**: 5x5 to 9x9
- **Levels**: 100+ levels
- **Mechanics**: Connect matching number pairs, paths can't cross, must fill all cells
- **Features**: Hints, undo, auto-check completion

### 4. Arukone (menneske.no)
- **Database**: 8,578+ puzzles
- **Grid**: 4x4 to 14x14
- **Rules**: Connect matching numbers with single continuous lines, fill all empty cells
- **Features**: Daily puzzle, archive, difficulty levels

### 5. Color Connect (plays.org)
- **Levels**: 32 stages
- **Mechanics**: Draw path between identical colored circles, no intersections
- **Style**: Casual, mobile-friendly

## Systems to Implement (Mandatory)

| System | Details |
|--------|---------|
| **Core Mechanic** | Connect matching pairs on grid, paths can't cross, fill all cells |
| **Grid Sizes** | 5x5 (Easy), 6x6 (Medium), 7x7 (Hard), 8x8 (Expert) |
| **Level Count** | 40+ hand-crafted levels (10 per grid size) |
| **Scoring** | Stars (1-3) based on: completion time, hints used, backtracks |
| **Progress Save** | localStorage with version field, per-level completion |
| **Hints** | Highlight next correct move (limited: 3 per level, earn more) |
| **Undo** | Unlimited undo steps |
| **Tutorial** | Interactive 3-step tutorial for first level |
| **Timer** | Optional timer with best time per level |
| **Sound** | Web Audio API: draw, connect, complete, error, button SFX + ambient BGM |
| **Visual Style** | Dark gradient BG, neon-colored paths, glow effects, smooth animations |
| **Daily Puzzle** | Seeded random puzzle based on date |
| **Achievements** | First Complete, Speed Demon, Perfect (no hints), Streak |

## Visual Style Reference
- Dark gradient background (#0a0a1a → #1a1a3a)
- Neon path colors (cyan, magenta, lime, orange, purple, yellow)
- Glow effect on active paths
- Smooth path drawing animation
- Particle burst on level completion
- Grid with subtle lines, rounded cell corners

## Music Style
- Ambient electronic, calm and focused
- Soft synthesizer pads, gentle piano notes
- Minimal percussion
- Loop-friendly, 2-3 minute duration

## Level Design Principles
1. Start with obvious pairs adjacent or near each other
2. Progressively introduce constraints (longer paths, more pairs)
3. Each level has exactly one valid solution
4. Difficulty increases via: grid size, number of pairs, path complexity
5. Larger grids = more pairs and longer paths required
