# Numbrix — Competitive Benchmark

## Selected Game
**Numbrix** (slug: `numbrix`) — fresh puzzle TYPE, zero overlap with all 410 existing GZ games.

## Rules (100% canonical, Parade magazine / BrainBashers)
1. Fill every cell of an R×C grid with a unique number from 1 to R×C.
2. Consecutive numbers must be **orthogonally adjacent** (share an edge).
3. Some numbers are given as clues; fill the rest so 1→N forms a single
   self-avoiding orthogonal path.

## Distinction from Hidato (already on GZ)
| Feature | Numbrix | Hidato |
|---------|---------|--------|
| Adjacency | Orthogonal only (4-neighbour) | Orthogonal + diagonal (8-neighbour) |
| Fill      | Every cell numbered (full)   | May leave gaps (unfilled cells) |
| Origin    | Parade magazine (Marilyn vos Savant) | Inventor Dr. Gyora Benedek |

Different core mechanic → legitimate distinct title. BrainBashers, Conceptis,
and numbrix.com all carry Numbrix as its own product.

## Competitive benchmark (3+ titles)
1. **Numbrix (Parade / numbrix.com)** — daily puzzle, 7×7–10×10, 100k+ daily
   solvers. Clue-light, requires pure logic.
2. **BrainBashers Numbrix** — archive of 100s of puzzles, multiple sizes,
   difficulty tiers, timer + best-time.
3. **Conceptis Number Path / Hashi-style apps** — level select, progress save,
   hint + check, star ratings.

## Systems to implement (parity)
- Level select with tiers (Beginner→Master), locked/unlocked progression.
- Timer + best-time per level (localStorage).
- Hint (reveal one cell), Check (flag errors), Reset, full grid input.
- Mistake counter, completion celebration, star/speed rating.
- Progress save with version field; auto-save on each input.
- Procedural BGM + SFX (Web Audio API).
- Tutorial overlay (first level).
- SEO: 4 JSON-LD schemas, full meta tags, canonical URL.

## Level plan (27 levels, 6 tiers)
| Tier | Count | Grid | Clue density |
|------|-------|------|--------------|
| Beginner | 4 | 5×5 | ~55% |
| Easy | 4 | 6×6 | ~48% |
| Medium | 5 | 7×7 | ~42% |
| Hard | 5 | 8×8 | ~36% |
| Expert | 5 | 9×9 | ~32% |
| Master | 4 | 9×9 | ~26% |

All 27 levels unique-verified by an independent Node.js solver.
