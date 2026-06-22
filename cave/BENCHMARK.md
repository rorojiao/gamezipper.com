# Cave (Corral) — Competitive Benchmark

## Selection Rationale
- Fresh Nikoli TYPE on GZ (zero overlap)
- Rules 100% certain (Nikoli-published, well-documented)
- Demand: High (popular on Nikoli.com, Conceptis, brainbashers)
- Generator: Tractable (random blob + visibility computation)

## Competitors Benchmarked
1. **Nikoli Cave** — original publisher, classic 7x7 to 17x17 grids, single solution
2. **Conceptis Cave** — daily puzzles, hint system, multiple sizes
3. **Puzzle Baron Cave** — leaderboard, daily challenges

## Rules (canonical Nikoli Cave / Corral)
- Grid of cells, some with numbers
- Shade some cells; the UNSHADED cells form the "cave" (interior)
- Numbered cells must be unshaded
- A number = how many unshaded cells are visible from this cell in 4 cardinal directions (including itself), where visibility stops at the FIRST shaded cell in each direction
- All unshaded cells form a single connected region
- All shaded cells are connected to the grid edge (no fully enclosed shaded region)

## Required Systems (S-grade parity)
- ✓ 27 levels (4 Beginner + 4 Easy + 4 Medium + 5 Hard + 5 Expert + 5 Master)
- ✓ Grid sizes scaling: 5x5 (Beginner) → 15x15 (Master)
- ✓ Each level has a verified valid solution (stored)
- ✓ Player shades/unshades cells by clicking
- ✓ Mistake counter (limited hints of wrong cells)
- ✓ Hint system (reveals one correct cell)
- ✓ Undo/redo
- ✓ Timer + best-time (localStorage)
- ✓ Tier + level select
- ✓ Win celebration (particles + sound + confetti)
- ✓ Tutorial overlay (skippable)
- ✓ Procedural BGM + SFX
- ✓ Save progress
- ✓ Dark GameZipper theme, responsive, mobile-first

## Difficulty Curve
| Tier | Grid | Clue density | Solving time |
|------|------|--------------|--------------|
| Beginner | 5x5-6x6 | 50-60% | 1-2 min |
| Easy | 6x6-7x7 | 40-50% | 2-4 min |
| Medium | 8x8-9x9 | 35-40% | 4-8 min |
| Hard | 10x10 | 30% | 8-15 min |
| Expert | 12x12 | 25% | 15-25 min |
| Master | 14x14-15x15 | 20% | 25-45 min |

## Music
- Ambient puzzle: slow synth pad + soft piano, ~75 BPM
