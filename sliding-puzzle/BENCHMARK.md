# Sliding Puzzle (15 Puzzle) — Competitive Benchmark

## Competitor Analysis (2026-05-17)

### Top Competitors

1. **15puzzleonline.org** — Classic 4x4 only, move counter + timer
2. **slidingtiles.com** — 3x3 to 10x10 grid sizes, image puzzles + numbered, custom photo upload
3. **timbrica.com** — 3x3/4x4/5x5, move counter, timer, best score tracking, smooth animations
4. **15puzzle.online** — 4x4 classic, strategy tips, clean UI
5. **Google Play "15 Puzzle"** — Multiple apps 50K-100K+ downloads, image modes, custom photos
6. **Microsoft Store "Sliding 15 Puzzle"** — Numbers mode + Image mode, global competition

### Core Systems to Implement

| System | Competitor Standard | Our Target |
|--------|-------------------|------------|
| Grid sizes | 3x3, 4x4, 5x5 | 3x3 (Easy), 4x4 (Medium), 5x5 (Hard) |
| Levels | None (endless) | 30 levels with specific shuffled configurations |
| Move counter | All competitors | Yes — displayed prominently |
| Timer | All competitors | Yes — with best time per level |
| Star rating | None | 3-star based on moves (par system) |
| Best scores | localStorage | Yes — per level best moves + time |
| Undo | Some apps | Yes — undo last move button |
| Shuffle | All | Seeded shuffle for reproducible puzzles |
| Hint | None | Show target state briefly |
| Tutorial | None | First-time overlay explaining controls |
| Sound effects | Varies | Web Audio API procedural |
| BGM | Varies | Web Audio API ambient |
| Progress save | Some apps | localStorage with version |
| Responsive | Most | Desktop + Mobile (Canvas) |
| Animations | Most | Smooth tile slide + celebration |

### Difficulty Progression (30 levels)

| Tier | Levels | Grid | Shuffle depth | Par moves |
|------|--------|------|--------------|-----------|
| Easy (1-10) | 1-10 | 3x3 | 20-40 | 15-30 |
| Medium (11-20) | 11-20 | 4x4 | 40-80 | 40-80 |
| Hard (21-30) | 21-30 | 5x5 | 80-150 | 80-150 |

### Art Style
- Dark gradient background (GameZipper style)
- Tiles: Rounded rectangles with gradient fills, subtle shadows
- Number text: Clean sans-serif, white on colored tiles
- Neon accent colors for active/selected tiles
- Smooth slide animations (CSS transition or Canvas)

### Music Style
- Ambient electronic, clean, minimal — puzzle-solving mood
- Soft synthesizer pads, gentle rhythm
- No distracting beats — focus music

### Key Mechanics
- Tap/click a tile adjacent to empty space to slide it
- Swipe support on mobile
- Win condition: All tiles in order (1,2,3,...,N with empty space at bottom-right)
- Invalid state prevention: Only allow solvable shuffles
- Solvability check: Count inversions, ensure even parity for odd-width grids

### SEO Keywords
"sliding puzzle", "15 puzzle", "slide puzzle", "number puzzle", "tile puzzle", "slide tiles", "puzzle 15", "gem puzzle", "boss puzzle", "mystic square"
