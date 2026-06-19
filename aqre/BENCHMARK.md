# Aqre — Competitive Benchmark (Phase 2)

> Source: gmpuzzles.com (Eric Fox, genre author), puzz.link, gridpuzzle.com, ruleword.com,
> puzzlekit (SmilingWayne/puzzlekit, 90 verified instances). All rules verified across 11 sources.

## 1. Authoritative Rules (4 hard constraints)

Shade some cells so that:

1. **Region-count** — every numbered region contains exactly the indicated number of shaded
   cells. (A region may carry at most one number; not all regions need a number. The clue cell
   itself MAY be shaded.)
2. **Shaded connectivity** — all shaded cells form ONE orthogonally connected area.
3. **Black no-four-in-a-row** — no run of 4+ shaded cells in any row or column.
4. **White no-four-in-a-row** — no run of 4+ unshaded cells in any row or column.

> ⚠️ Constraint #4 (white-side cap) is the signature Aqre twist and the one casual clones
> miss. Both colors are capped at run length 3.

## 2. Distinctive Mechanic vs Siblings

| Puzzle | Adjacency rule | Run-length rule |
|--------|----------------|-----------------|
| Yajisan-Kazusan | no two black adjacent | none |
| Nurikabe | black = connected sea | none |
| Heyawake | rooms w/ count | none (different island rule) |
| **Aqre** | **black connected** | **no 4-in-a-row EITHER color** |

## 3. Grid & Room Conventions

- Recommended sizes 10×10+; published range 5×5 (intro) → 17×17 (max in dataset).
- Rooms = irregular polyominoes, 2–8 cells typical, thick borders between rooms.
- Clue density: ~1 clue per 3–6 rooms; many rooms unnumbered.
- Rotational symmetry common but not required.

## 4. Competitor UX Patterns (to clone)

| Feature | puzz.link | ruleword | gridpuzzle |
|---------|-----------|----------|------------|
| Click cycle | Empty→Black→Dot→Empty | same | same |
| Live violation highlight | color-coded per constraint | basic | basic |
| Undo/Redo | yes | reset only | hints |
| Star/time ratings | 1–5 stars + time | linear levels | tiered |
| Region tinting | optional | yes | sometimes |

## 5. Clone Design (this build)

- **Grid sizes by tier**: 5×5 / 6×6 / 7×7 / 8×8 / 9×9 (25 levels, 5 per tier)
- **Click cycle**: Empty → Shaded → Dot(marker) → Empty (matches puzz.link convention)
- **Live constraint feedback**: red = 4-run violation, blue = white-4-run, yellow = room-count,
  green-flash = disconnected shaded
- **Systems**: 3 hints/level, undo, reset, check button, 3-star scoring (base 1000 + time bonus −
  hint penalty), level select w/ localStorage unlock, skippable tutorial, Web Audio BGM+SFX
- **Win condition**: all 4 constraints satisfied + every cell decided

## 6. Verification Standard

Every level MUST be uniquely solvable (Python backtracking solver, find ≤ 2 solutions).
Generation: valid solution → rooms → full clues → greedy clue removal preserving uniqueness.
