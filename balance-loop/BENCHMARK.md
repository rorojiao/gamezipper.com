# Balance Loop — Competitive Benchmark

## Source
- **Origin**: Grandmaster Puzzles (gmpuzzles.com), created by **Prasanna Seshadri** (2015).
- **Category**: Loop / Line Drawing puzzle
- **Catalog gap**: `balance-loop`, `balance loop`, `balanceloop` — all 0 (grep verified in games-data.js)

## Rules (confirmed)
1. Draw a single continuous, non-intersecting loop along the grid lines.
2. The loop must pass through **every clue cell** (clue cells have a number + a circle/square shape).
3. At each clue cell exactly two loop segments pass through:
   - **White circle**: the loop goes **straight** through (180° — enters one side, exits opposite side).
   - **Black square**: the loop **turns** (90° — enters one side, exits an adjacent side).
4. The **number** at each clue = total count of loop cells visible from that cell in all 4 orthogonal directions (including itself), where visibility stops at the first non-loop cell in each direction.

## Key constraints
- Loop is a simple cycle (no self-crossing, no branching).
- Non-clue cells may or may not have the loop pass through them.
- Every clue must be satisfied: straight/turn shape + visibility count.

## Difficulty scaling
| Tier | Grid Size | # Clues | Notes |
|------|-----------|---------|-------|
| Beginner | 6×6 | 4-5 | Small grid, many clues |
| Easy | 7×7 | 5-6 | Moderate density |
| Medium | 8×8 | 6-7 | Standard puzzle |
| Hard | 9×9 | 7-8 | Fewer clues |
| Expert | 10×10 | 8-10 | Large grid, sparse clues |

## Competitor Analysis
- GMPuzzles blog featured ~30+ Balance Loop puzzles (2015-2016).
- No dedicated Balance Loop app exists — market opportunity.
- Similar genre: Simple Loop, Slalom, Haisu (all already covered in catalog).

## Unique Selling Points
- Combines loop drawing with numeric visibility clues
- Shape constraint (straight vs turn) adds deduction depth
- Balanced clue distribution creates elegant puzzles
