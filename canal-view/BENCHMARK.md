# Canal View — Competitive Benchmark

## Game: Canal View
**Genre**: Nikoli-style shading/number-logic puzzle
**Origin**: Popularized by Grandmaster Puzzles (gmpuzzles.com), attributed to Prasanna Seshadri (2016)

## Rules (Canonical)
1. Grid with some cells containing numbers (0–4)
2. Fill empty cells with "canal" (shaded) or "land" (empty)
3. Each number = exact count of canal cells among its 4 orthogonal neighbours
4. All canal cells must form a single connected region
5. No 2×2 block of canal cells allowed

## Competitors

### 1. Grandmaster Puzzles (gmpuzzles.com)
- **Format**: PDF + Penpa-Edit online solver
- **Features**: Themed puzzles, competition-grade difficulty
- **Monetization**: Free blog + paid e-book store
- **Gap**: No standalone playable game; requires Penpa-Edit knowledge

### 2. Nikoli Pencil Puzzles
- **Format**: Print books + Nikoli.com subscription
- **Features**: Author-curated quality puzzles
- **Gap**: Canal View not in their main catalog (it's a gmpuzzles variant)

### 3. Simon Tatham's Portable Puzzle Collection
- **Format**: Desktop/mobile app
- **Gap**: Does not include Canal View (has similar "Filling" but different rules)

### 4. Logic Masters India / Puzzle Grand Prix
- **Format**: Competition puzzles
- **Gap**: Not casual-playable, no progressive difficulty

## GameZipper Differentiation
| Feature | Competitors | GameZipper Canal View |
|---------|------------|----------------------|
| Progressive difficulty | ✗ (flat) | ✅ 5 tiers 5×5→9×9 |
| Mobile touch | Limited | ✅ Full touch + long-press |
| Hint system | ✗ | ✅ 3 hints/level |
| Star ratings | ✗ | ✅ Time-based 3-star |
| Level select | ✗ | ✅ 30-level grid |
| Music & SFX | ✗ | ✅ Web Audio ambient |
| Progress save | ✗ | ✅ localStorage |
| Free no-download | Partial | ✅ 100% browser |
| Unique verified | Manual | ✅ Solver-verified |

## Key Systems to Implement
1. **Shading engine**: click=canal, right-click/long-press=land-mark
2. **Clue validation**: real-time clue satisfaction indicator
3. **Connectivity check**: visual feedback for disconnected canal
4. **2×2 detection**: highlight violations
5. **Hint system**: reveal one correct cell
6. **Win condition**: all clues satisfied + connected + no 2×2
7. **Canvas rendering**: water/land visual theme (blue canals, green land)
