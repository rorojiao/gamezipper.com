# Binairo — Competitive Benchmark

## Game Identity
- **Display Name**: Binairo (also known as Binary Puzzle, Binary Sudoku, Takuzu, Tohu-Wa-Vohu)
- **Slug**: `/binairo/`
- **Category**: puzzle
- **Tags**: binairo, binary puzzle, binary sudoku, logic, takuzu, 01 puzzle

## Rules (4 constraints)
1. Fill every cell with **0** or **1**
2. **No 3+ consecutive** same digits in a row or column (no "000" or "111")
3. Each row and column has **equal 0s and 1s** (grid size must be even)
4. **No two rows are identical; no two columns are identical**

## Competitors
| Site | URL | Grid Sizes | Difficulty Levels |
|------|-----|-----------|-------------------|
| Binairo.com | binairo.com | 6×6, 8×8, 10×10, 12×12 | Easy, Medium, Hard |
| BinaryPuzzle.com | binarypuzzle.com | 6×6, 8×8, 10×10, 12×14, 14×14 | Easy, Medium, Hard, Very Hard |
| BrainBashers | brainbashers.com/binary | 6×6, 8×8, 10×10, 12×12, 14×14 | Easy, Medium, Hard, Very Hard |
| Puzzle Team | puzzle-team.com/binairo | Various | Various |

## Systems to Implement (Competitive Parity)
1. **Board rendering**: Canvas-based NxN grid with 0/1 cells
2. **Input**: Click/tap to cycle empty→1→0→empty; or two-button palette (0, 1) + erase
3. **Hint system**: Reveal one correct cell (limited hints per level)
4. **Undo/Redo**: Move history stack
5. **Mistake highlighting**: Show conflicting cells in red
6. **Timer**: Per-level solve timer
7. **Score**: Based on time + mistakes; star rating (3/2/1 stars)
8. **Progress save**: localStorage with version field
9. **Tutorial**: First-time onboarding (skippable)
10. **Level select**: Grid showing completed levels + stars earned
11. **Difficulty tiers**: 6 tiers (Beginner → Master)

## Level Distribution (27 levels)
| Tier | Grid | Levels | Given % | Givens Range |
|------|------|--------|---------|-------------|
| Beginner | 6×6 | 4 | ~50% | 16-20 / 36 |
| Easy | 6×6 | 4 | ~38% | 12-14 / 36 |
| Medium | 8×8 | 5 | ~42% | 24-28 / 64 |
| Hard | 8×8 | 5 | ~33% | 20-22 / 64 |
| Expert | 10×10 | 5 | ~38% | 36-40 / 100 |
| Master | 12×12 | 4 | ~40% | 56-60 / 144 |

## Visual Style
- **Theme**: Electric blue (#00d4ff) + neon green (#39ff14) on dark (#0a0e27) gradient
- **0 cells**: Blue gradient with subtle glow
- **1 cells**: Green gradient with subtle glow
- **Givens (pre-filled)**: Bold white text, non-editable
- **User-filled**: Colored text matching the digit
- **Conflicts**: Red glow/pulse animation
- **Celebration**: Particle burst + confetti on level complete

## Art Assets (PIL Procedural)
- `icon.png` (512×512): Blue "0" and green "1" on dark gradient, neon glow
- `og-image.png` (1200×630): Game title + sample grid + "Play Free Online"

## Audio (Web Audio API)
- **BGM**: Ambient electronic, mysterious, binary/tech feel (procedural oscillator)
- **SFX**: tap (short blip), place-0 (low tone), place-1 (high tone), error (buzz), complete (arpeggio), level-win (fanfare)

## SEO
- Title: "Play Binairo Online Free - Binary Puzzle Game | GameZipper"
- Description: "Play Binairo (Binary Puzzle) free online! Fill the grid with 0s and 1s..."
- Keywords: binairo, binary puzzle, binary sudoku, takuzu, logic puzzle
- JSON-LD: VideoGame + FAQPage + HowTo + BreadcrumbList
