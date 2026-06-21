# Triple Doku — Competitor Benchmark

## Game Definition
**Triple Doku** = three overlapping 9×9 Sudoku grids in a horizontal row.
Adjacent grids share one 3-column stack (27 cells each):
- Grid A (cols 0-8) and Grid B (cols 6-14) share stack AB (cols 6-8)
- Grid B and Grid C (cols 12-20) share stack BC (cols 12-14)
Combined board: **9 rows × 21 columns = 189 unique cells** (243 cell-slots across 3 grids).

## Competitor Analysis

### 1. Conceptis Puzzles (conceptispuzzles.com)
- Publisher of "Triple Doku" / "Triple Sudoku" variants
- Features: multiple difficulty levels, timer, auto-check, pencil marks, unlimited puzzles
- Premium subscription model for archive access
- Our advantage: free, no signup, instant play, browser-based

### 2. SudokuWiki.org
- Offers various Sudoku variants including multi-grid types
- Features: solver tools, strategy guides, puzzle archives
- Our advantage: polished UI, game progression, achievements, mobile-optimized

### 3. Cracking the Cryptic (YouTube + apps)
- Popularizes variant Sudoku including overlapping/multi-grid types
- Their apps (Sudoku (Classic/Killer)): hints, mistake tracking, note-taking
- Our advantage: free tier with full features

### 4. Daily Sudoku apps (general multi-grid category)
- Standard features across all: timer, pencil marks, hint, undo, check, mistake counter
- Progress saving, level tiers, difficulty curve

## Feature Parity Checklist (must match ALL)

| Feature | Competitors | Triple Doku GZ |
|---------|------------|----------------|
| Multiple difficulty tiers | ✓ (4-6 tiers) | ✓ 6 tiers (Beg→Master) |
| Timer | ✓ | ✓ per-level timer |
| Pencil/Notes mode | ✓ | ✓ toggle, corner digits |
| Hint system | ✓ | ✓ reveal one cell |
| Undo | ✓ | ✓ move stack |
| Check/Validate | ✓ | ✓ highlight errors |
| Reset | ✓ | ✓ clear entries |
| Mistake counter | ✓ | ✓ tracked count |
| Progress saving | ✓ | ✓ localStorage v1 |
| Level unlock progression | ✓ | ✓ sequential unlock |
| Win celebration | ✓ | ✓ particles + stars |
| Sound effects | ✓ | ✓ Web Audio procedural |
| Mobile responsive | ✓ | ✓ touch + number pad |
| Shared region indication | ✓ | ✓ amber tint on shared stacks |

## Level Design
- 27 levels: 4 Beginner + 4 Easy + 5 Medium + 5 Hard + 5 Expert + 4 Master
- All 27 verified UNIQUE by independent bitmask DFS solver (10ms)
- Givens range: A/C grids 29-45, B grid 55-66 (B has 54 shared cells, more givens by design)

## Art Direction
- Theme: **deep teal/cyan/emerald** (differentiates from Twodoku purple, Butterfly magenta)
- Shared stacks: amber/gold tint to indicate shared cells
- Dark gradient background, neon accents, glassmorphism

## SEO Target Keywords
- Primary: "Triple Doku", "triple sudoku"
- Secondary: "overlapping sudoku", "multi grid sudoku", "three sudoku puzzle"
- Long tail: "play triple doku online free"
