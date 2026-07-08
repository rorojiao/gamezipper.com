# BENCHMARK — Tile Paint

## Game: Tile Paint (Nikoli)

### Origin
- Nikoli puzzle anthology, Japanese logic puzzle
- Also known as "Tairupeinto" (タイルペイント)

### Rules
1. Grid of cells (typically rectangular)
2. Each row has a clue number (outside the grid, left side)
3. Each column has a clue number (outside the grid, top)
4. The row clue indicates how many cells in that row should be painted BLACK
5. The column clue indicates how many cells in that column should be painted BLACK
6. Player must paint cells black or leave them white so all row and column clues are satisfied simultaneously
7. No other constraint — any cell arrangement matching all row/col counts is valid

### Mechanic Difficulty
- Simple rules (one of the simplest Nikoli puzzles)
- Difficulty arises from deduction logic (not brute force)
- Clean binary state per cell (black/white) — perfect for H5 toggle

### Competitor Analysis
- Available on Nikoli.com (subscription)
- Puzzle video game compilations (Simon Tatham, etc.)
- Not commonly found as standalone browser games
- Gap: No dedicated browser-based Tile Paint with progression, hints, polish

### Monetization
- Standard casual puzzle: ad-supported, free-to-play
- No IAP needed for this genre

### H5 Implementation Plan
- Canvas-based grid rendering
- Click/tap to toggle cell (white → black → white)
- Row/column clue display
- Visual feedback on completion
- 30 levels across 5 difficulty tiers
- Level generator with unique-solution verification (backtracking solver)

### Difficulty Progression
| Tier | Levels | Grid Size | Clue Complexity |
|------|--------|-----------|-----------------|
| Beginner | 1-6 | 5x5 | Simple |
| Easy | 7-12 | 6x6 | Moderate |
| Medium | 13-18 | 7x7 | Moderate |
| Hard | 19-24 | 8x8 | Complex |
| Expert | 25-30 | 10x8 | Complex |

### Unique Solution Verification
- Generate random solutions → compute clues → verify uniqueness via backtracking solver
- Only keep puzzles where exactly ONE arrangement satisfies all clues
