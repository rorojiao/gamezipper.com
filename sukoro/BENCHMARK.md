# Sukoro — Competitive Benchmark

## Game Identity

**Sukoro** is a Nikoli-original number-placement puzzle (Japanese: スコロ, Sukoro). It first
appeared in Puzzle Communication Nikoli Vol. 131 (2014). The name means "count" — every
number on the board counts its neighbors.

## Canonical Rules (Nikoli)

1. **Grid**: rectangular grid of empty cells. Some cells are pre-filled with numbers 1–4
   (these are *clues* and may NOT be changed).
2. **Fill**: place a number 1–4 into every remaining empty cell.
3. **Neighbor-count constraint**: a cell containing number N must have **exactly N
   orthogonally-adjacent (up/down/left/right) cells** that contain numbers.
4. **Same-neighbor constraint**: **no two orthogonally adjacent cells may contain the
   same number**.

Because every filled cell counts its four neighbors, edge/corner cells are naturally
limited (a corner cell has at most 2 neighbors, so can only hold 1 or 2).

## Constraint Profile

- **Local**: every constraint is between a cell and its ≤4 neighbors → BFS/backtracking
  solver is fast and reliable. Reverse-construction generation (fill a board, derive
  clues, strip clues) is trivially correct.
- **Global**: no connected-component or path constraint → no NP-hard global check.
- **Uniqueness**: stripping too many clues risks multiple solutions; we keep ≥55% of
  cells as clues and verify uniqueness with the BFS solver (limit=2 solutions).

## Competitor Analysis

| Platform | Mechanic | Levels | Art | Music | Our Edge |
|----------|----------|--------|-----|-------|----------|
| Nikoli.com | print/PDF puzzles | — | B/W | none | interactive, animated, audio |
| pzv.jp (Japanese solver) | auto-solver demo | — | text | none | full game w/ hints |
| Simon Tatham's Puzzles | "Unequal" (different rules) | ∞ | vector | none | Nikoli-authentic rules |
| Penpa-Edit | editor only | user-made | line art | none | curated 30 levels + progression |

**Gap**: No English-language browser game implements **authentic Nikoli Sukoro** with
curated levels, progression, hints, and polish. We fill it.

## Mechanic Summary for Implementation

- Grid W×H, cells either empty or hold value 1–4.
- Clue cells (pre-filled) rendered distinct from player-placed cells.
- Click empty cell → cycle through 1→2→3→4→empty.
- Right-click or Erase → clear.
- Live validation: highlight violated cells (same-number neighbor or wrong count).
- Win when every cell is filled and all constraints satisfied.

## Tier Plan (30 levels)

| Tier | Grid | Clue density | Notes |
|------|------|-------------|-------|
| Beginner (1-6) | 4×4 | ~70% | gentle intro, few decisions |
| Easy (7-12) | 5×5 | ~60% | more blanks |
| Medium (13-18) | 6×6 | ~55% | requires lookahead |
| Hard (19-24) | 7×6 | ~50% | tight constraints |
| Expert (25-30) | 7×7 | ~45% | minimal clues, unique |

## Conclusion

Sukoro is an ideal Tier-1 candidate: Nikoli-canonical, grep=0 (verified), purely-local
constraints (fast generation + verification), and no existing polished browser
implementation. Proceed to Phase 3.
