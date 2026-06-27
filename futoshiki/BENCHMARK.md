# Futoshiki — Competitive Benchmark

## Candidate
- **Game**: Futoshiki (Inequality / "Not Equal" Latin-Square Puzzle)
- **Genre**: Nikoli-style logic puzzle, constraint satisfaction
- **Slug**: `futoshiki`
- **Score**: 20/25 (Tier 1)
- **Catalog gap**: Confirmed — no `futoshiki` slug exists. `greater-than-sudoku` (#394) is a different mechanic (Sudoku variant WITH 3×3 box constraints + inequalities). Futoshiki is a pure Latin square (rows/columns) + inequality signs only — no box regions. Distinct from kakuro (sums), kenken (arithmetic cages), and skyscrapers (visibility).

## How Futoshiki works
- Fill an N×N grid with digits 1..N.
- Each **row** must contain every digit exactly once (Latin-square row rule).
- Each **column** must contain every digit exactly once (Latin-square column rule).
- Some adjacent cell pairs are joined by an **inequality sign** (`>` or `<`) that the digits must satisfy.
- Solve by logical deduction from the inequalities.

## Top competitors analyzed

| Source | Format | Features | Monetization | Avg. session |
|--------|--------|----------|--------------|--------------|
| **Simon Tatham's Puzzle Collection** (Unequal) | Desktop + mobile web, free | Click-edge to toggle < >, auto-conflict highlight, unlimited procedural levels, difficulty by grid size (4×4 → 7×7), undo/redo, solver-based hint, fill-in-pencil | Open source, no ads | 4–12 min |
| **Puzzle Team / BrainBashers Futoshiki** | Web | Daily puzzle, weekly archive, multiple sizes, print-friendly, timer | Display ads | 5–15 min |
| **Conceptis Futoshiki** (paid app) | iOS/Android | Hand-crafted levels, 5 difficulty tiers, star ratings, hints, packs | Paid + IAP | 8–20 min |
| **Futoshiki mobile apps** (Google Play) | App | Daily challenge, achievements, 30+ levels per pack, no-ip reminder | Rewarded video + IAP | 5–10 min |
| **The Guardian / Nikoli Futoshiki** | Web/print | Curated hand-made grids, varying sizes | Subscription/ads | 6–15 min |

## Required systems (must match)
1. ✅ **Multi-tier difficulty** (5 tiers, 6 levels each = 30 levels)
2. ✅ **Size progression**: 4×4 → 5×5 → 6×6 → 7×7 across tiers
3. ✅ **Inequality constraint rendering**: `<` / `>` signs between adjacent cells (horizontal + vertical), with visual flipping
4. ✅ **Conflict detection**: highlight duplicate row/column digits in real time + violated inequalities
5. ✅ **Unique-solution generator**: backtracking solver verifies uniqueness before shipping a level
6. ✅ **Hint system** (solver-driven, costs a star)
7. ✅ **Undo / reset / notes mode**
8. ✅ **Star ratings** stored in localStorage
9. ✅ **Daily challenge** (date-seeded)
10. ✅ **Achievements** (8)
11. ✅ **Procedural audio** (Web Audio API)
12. ✅ **OG image + icon** (RunningHub)
13. ✅ **Mobile-first responsive** (touch + mouse)

## Differentiation vs. competitors
- **No download, no ads in the puzzle area** (GameZipper universal banner only)
- **Daily challenge** — most free web competitors only offer static weekly puzzles
- **S-tier polish**: dark neon theme consistent with catalog (Dominosa/Kropki/Aqre family), animated number placement, particle effects on completion
- **Verified unique solutions** — many free generators ship ambiguous puzzles; ours guarantees uniqueness via solver check
