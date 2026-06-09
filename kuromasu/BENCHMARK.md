# Kuromasu (Kurodoko) — Competitive Benchmark

## Top Competitors
1. **puzzle-kurodoko.com** — Best web UI, 5x5-15x15, daily puzzles, video tutorial, ★★★★☆
2. **logic-puzzles-online.com/kuromasu** — 6x6/8x8/10x10, 3 difficulty, hint/check/solution buttons, ★★★★☆
3. **glorifiedcalculator.com/kuromasu** — 7x7/10x10/14x14, 3 difficulty per size, extensive tutorial, ★★★☆☆
4. **brennerd App (Android)** — ★4.88, 32K downloads, handcrafted puzzles, hints, dark mode, offline
5. **Kuros Classic (Android)** — 150+ levels, saga progression, achievements, leaderboards, Google Cloud save

## Must-Have Systems (from competitors)
- [x] Grid sizes: 5x5, 7x7, 8x8, 10x10, 12x12, 14x14
- [x] Difficulty: Easy → Medium → Hard → Expert
- [x] Tutorial with animated rule demonstrations
- [x] Hint system (limited per puzzle)
- [x] Solution check with error highlighting
- [x] Undo/redo support
- [x] Timer + personal bests
- [x] Progress save (localStorage with version)
- [x] Dark mode (GameZipper dark style)
- [x] Mark white cells (dot) + toggle black cells
- [x] Drag to mark multiple cells
- [x] Procedural puzzle generation (unique solutions)
- [x] Daily puzzle + streak tracking
- [x] Statistics (solve times, completion rates)
- [x] Sound effects (Web Audio API)
- [x] Mobile touch support

## Game Rules
1. Grid with numbers in some cells (clues)
2. Each clue = total black cells visible in 4 orthogonal directions (not counting the clue cell)
3. Clue cells are always white
4. All white cells must be orthogonally connected (one region)
5. No 2x2 block of black cells

## UI/UX Patterns
- Click/tap to toggle black, right-click/long-press to mark white (dot)
- Error highlighting in red
- Visibility count display per clue
- Smooth cell transitions
- Dark theme with neon accents (GameZipper style)

## Monetization
- Free + non-intrusive ads (standard GameZipper model)
- Premium differentiation: interactive tutorial, daily streaks, statistics
