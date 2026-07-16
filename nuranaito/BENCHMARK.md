# Nuranaito — Competitive Benchmark

## Reference Puzzle
**Nuranaito** (Japanese: ぬらナイト) — Nikoli puzzle, literally "paint with the knight's move". Invented by Nikoli.

## Rule Source
- **cross-plus-a.com/puzzles.htm#Nuranaito** — authoritative English rule reference

## Core Rules
1. **Cells with numbers and question marks are ALWAYS white**.
2. **All black cells form ONE orthogonally connected area**.
3. **No 2×2 cell area within the grid can have all black cells** (no black squares).
4. **A cell with a number indicates how many black squares can be reached by a knight move from that cell**.
   - Knight's move: (±2, ±1) or (±1, ±2) — 8 possible directions
   - Each move lands on a cell; count = total black cells reachable via knight move
5. **A cell with a question mark may have any number of black cells reachable by knight move** (including zero).
6. **Question mark cells are still WHITE**.

## Differences vs Other Shading Puzzles
- **Yajisan-Kazusan**: arrow-based row/column counts. Nuranaito uses knight-move distances — much more constrained.
- **Nurikabe**: white cells are islands with NO number constraints. Nuranaito adds knight-move number clues.
- **Yajikabe (Naoki Inaba)**: arrows + 2x2 rule + black connectivity. Nuranaito uses knight moves instead of arrows.
- **Starry Night / Nurimisaki**: similar shading but different clue types.

## Catalog Gap (verified 2026-07-17)
- `nuranaito`, `nuranight`, `nura-naito`, `nura-knight`, `paint knight`, `knight move puzzle` — all 0 (grep verified on games-data.js, itemlist-schema.js, index.html).
- GameZipper has 684 games. Closest existing puzzles:
  - **Nurikabe** (island+wall shading, no knight moves)
  - **Starry Night** (sun/moon/star placement, knight-distance based — different mechanic)
  - **Nurimisaki** (cape shading with circles)
  - **Yajikabe** (arrow + black-connectivity)
- **Nuranaito is genuinely un-covered.**

## Reference Game Analysis
Nuranaito on cross-plus-a.com features:
- Square grids typically 6×6 to 10×10
- Sparse numbered clues (4-7 per puzzle)
- Question marks act as "free" white cells that don't constrain
- Each numbered clue can see 2-8 cells via knight move

## Mechanic Strengths
- ✅ Strong uniqueness constraints (knight moves are precise)
- ✅ Clean shading mechanic (tap-to-shade)
- ✅ Logical deduction with multiple clue types
- ✅ Mobile-friendly
- ✅ S-tier polish: numbered clues + question marks + 2x2 warning overlay

## Difficulty Curve
- **Tier 1 Beginner (6×6)**: 3-4 numbered clues + 2-3 question marks
- **Tier 2 Easy (7×7)**: 4-5 numbered clues + 2-3 question marks
- **Tier 3 Medium (8×8)**: 5-6 numbered clues + 3-4 question marks
- **Tier 4 Hard (9×9)**: 6-7 numbered clues + 3-4 question marks
- **Tier 5 Expert (10×10)**: 7-8 numbered clues + 4-5 question marks

## Generation Strategy
1. **Solution-first**: Generate a valid black pattern first (independent set + connectivity + 2x2 rule + size constraints)
2. **Place numbered clues**: pick cells (must be white) where the knight-move count matches a meaningful number; place question marks at other white cells
3. **Verify uniqueness**: independent solver confirms exactly 1 solution
4. **Verify question marks are valid**: each ?-cell has at least one possible count value (which is automatic since ? allows any count)
