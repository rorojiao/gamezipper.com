# Ice Barn (Aisuban / Eisbahn / アイスバーン) — Competitive Benchmark

## Source
- **janko.at**: https://www.janko.at/Raetsel/Aisuban/index.htm — 150 puzzles, grid sizes 8×8 to 18×10.
- **Nikoli**: アイスバーン (Aisuban), published in Puzzle Communication Nikoli.
- **Alternative names**: Ice Barn, Eisbahn, Icebarn, Aisuban.

## Rules (confirmed from janko.at Regeln)

Draw a **single path** from the **ENTRY** cell to the **EXIT** cell in the grid.

1. **Path segments** run horizontally or vertically between the center points of orthogonally adjacent cells.
2. **White cells**: the path may turn by 90° but must **not cross itself**.
3. **Gray cells = ice cells**; several orthogonally adjacent ice cells form an **ice area** (ice barn).
   - On an ice cell the path **may cross itself** but **must not turn**.
4. The path **must pass through all arrows** and **all ice areas**, but **not necessarily through all white cells**.
5. The arrows indicate direction (the arrow on the formed path always points toward the EXIT/out direction between two specific cells).

### Simplified variant for generation (fixed-cell-set approach for uniqueness)
For our implementation we use the **core loop/path mechanics**:
- A single non-branching path from Entry to Exit.
- Path enters ice areas and slides straight through (cannot turn on ice).
- Arrows are direction clues: the path must pass through arrow cells in the indicated direction.
- Path visits every ice area at least once.

## Core Mechanic Summary
- **Ice sliding**: When on an ice cell, you must continue in the same direction (no turning).
- **White cells**: Free turning, no self-crossing.
- **Path constraint**: Single path, ENTRY → EXIT, passes through all arrows.
- **Coverage**: All ice areas must be visited.

## Difficulty Tiers (our 30 levels)
| Tier | Grid | Ice cells | Arrows | Levels |
|------|------|-----------|--------|--------|
| Beginner | 6×6 | 2-3 areas | 0-2 | 6 |
| Easy | 7×7 | 3-4 areas | 2-3 | 6 |
| Medium | 8×8 | 4-5 areas | 3-4 | 6 |
| Hard | 9×9 | 5-6 areas | 4-5 | 6 |
| Expert | 10×10 | 6-8 areas | 5-6 | 6 |

## Competitor Systems (must match)
- Entry/Exit markers (IN/OUT)
- Ice area rendering (gray cells)
- Arrow clues
- Path drawing (click-drag or cell-segment toggle)
- Hint system, check, restart, undo
- Level select, star ratings, timer
- Web Audio music + SFX
- Keyboard support
- localStorage save

## Catalog Gap
- `ice-barn`, `ice barn`, `icebarn`, `aisuban`, `eisbahn` — ALL 0 in games-data.js (grep verified).
