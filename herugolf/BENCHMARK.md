# Herugolf — Competitive Benchmark

## Game Type
Nikoli logic puzzle — golf ball path-finding with decreasing-length shots.

## Rules (confirmed from janko.at authoritative archive)
1. Grid contains **balls** (●), **holes** (○), **walls** (■), **ponds** (≈), and empty cells.
2. Guide each ball into a hole using orthogonal shots.
3. **Decreasing-length rule**: First shot travels L cells. Each subsequent shot travels
   exactly **L−1** cells, then L−2, etc. (strictly decreasing by 1).
4. Consecutive shots must be **perpendicular** (90° turn — same/opposite direction would
   merge or backtrack, which is impossible).
5. **No cell reuse**: each cell can be crossed by at most ONE ball across all paths.
6. **Ponds**: balls can travel through pond cells but cannot stop/bounce there (a shot
   endpoint / segment boundary cannot be on a pond).
7. **One ball per hole**: each hole receives exactly one ball.
8. A ball falls into the first hole it encounters (mid-segment or at endpoint).

## Competitors Analyzed
| Source | Format | Key Features |
|--------|--------|-------------|
| Nikoli.com | Print + online | Original Herugolf, hand-crafted, timer, hint |
| janko.at | Print archive | Rules reference, sample puzzles |
| Puzzle-Magazine (UK) | Print | Variant with water hazards |
| LogicMasters (DE) | Online | Competition puzzles, difficulty ratings |

## Systems to Implement (competitive parity)
1. **Grid rendering** — Canvas, ball/hole/wall/pond icons, neon dark theme
2. **Path drawing** — Drag-to-draw interaction, segment highlighting, length display
3. **Decreasing-length enforcement** — Real-time validation of segment lengths
4. **Undo / Reset** — Per-ball undo, full reset
5. **Hint system** — Reveal next segment of solution
6. **Check / Auto-validate** — Verify all paths correct
7. **Timer + best time** — localStorage persistence
8. **Level selector** — Grid of levels, progress tracking, star ratings
9. **Tutorial overlay** — First-time onboarding, skippable
10. **Procedural BGM + SFX** — Web Audio API (click, bounce, hole-in, win, error)
11. **Star rating** — Based on time / hints used
12. **Progress save** — localStorage with version field

## Level Design
- **Beginner** (5×5): 1 ball, 1-2 segments, ~60% walls
- **Easy** (5×5–6×6): 1-2 balls, 2 segments, ~50% walls
- **Medium** (6×6–7×7): 2 balls, 2-3 segments, ~45% walls
- **Hard** (7×7–8×8): 2-3 balls, 3 segments, ~40% walls
- **Expert** (8×8): 3 balls, 3 segments, ~35% walls
- **Master** (9×9): 3-4 balls, 3-4 segments, ~30% walls

## Visual Style
- Dark gradient background (deep teal → black)
- Neon cyan balls, amber holes, dark grey walls, blue ponds
- Path drawn in ball's color with glow effect
- Segment length badges at each turn point
- Glass-morphism panels, rounded corners
- Particle effects on hole-in, confetti on level complete

## SEO Keywords
herugolf, golf puzzle, nikoli puzzle, ball path puzzle, decreasing shots puzzle,
logic puzzle online free, herugolf solver, ヘルゴルフ
