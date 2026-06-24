# Inertia — Competitive Benchmark

**Slug:** inertia
**Type:** Grid slide / ice-slide navigation puzzle (NEW mechanic on GZ — zero overlap)
**Mechanic:** Pick a direction; the ball slides in a straight line until it hits a wall
or the grid edge, then stops. Collect every gem, dodge the mines, glide onto the exit.

## Rules (this game — clearly defined)

1. An N×N grid contains: floor, walls, gems (◆), mines (☠), one start (the ball) and one exit (★).
2. Each move you choose one of **8 directions**. The ball **slides** cell-by-cell in that
   direction until the next cell is a wall or off-grid, then **stops** on the last floor cell.
3. Sliding **over a gem collects it** (gem disappears). Sliding **over a mine destroys the
   ball** — level failed (or costs a life).
4. **Win:** stop on the exit cell **after** collecting every gem.
5. Passing over the exit before all gems are collected does nothing — you must return with all gems.

## Why this is a clean, safe build

- **Rules are unambiguous** and fully defined here (no external rule-lookup needed).
- **Solvability is verified by BFS** over `(row, col, gemBitmask)` states with 8 slide
  actions; mine-crossing actions are illegal. State space = N² × 2^G (tiny).
- **No uniqueness solver needed** — multiple solutions are fine for a navigation puzzle;
  we only require *solvable* and *non-trivial* (optimal solution ≥ a minimum move count).
- **Optimal move count is free** from BFS → drives star ratings and the "par" target.
- Generation is **constructive & guaranteed-solvable**: find a mine-free gem-collecting
  path first, then place mines only on cells NOT on that path.

## Competitors referenced

- **Simon Tatham's "Inertia"** (chiark.greenend.org.uk) — the canonical roll-until-wall puzzle.
- **Pokémon ice-slide puzzles** / **Chip's Challenge ice floors** — beloved slide mechanics.
- Various "Slide Maze" / "Ice Maze" web games. GZ has no slide-until-wall navigation puzzle
  (existing ball games — slope, marble-run, iq-ball — are physics/arcade, not grid-slide).

## Systems to implement (parity with GZ S-grade standard)

- Level select with lock + star ratings (Beginner→Master, 27 levels)
- Move counter + best-moves record + timer (localStorage versioned save)
- 8-direction control pad (D-pad) + keyboard arrows/WASD; large 44px tap targets
- Animated ball slide (smooth tween along the path), trail effect
- Undo (replay move history), Reset level
- Hint (highlight the optimal next slide direction via stored BFS solution)
- Step-by-step tutorial
- Procedural BGM + SFX via Web Audio API, mute toggle
- Win detection (exit reached + all gems), celebratory particles + screen shake
- Mine hit = fail overlay with retry
- Analytics + JSON-LD (VideoGame + FAQPage + HowTo + BreadcrumbList), og tags, canonical
- Mobile-first responsive (390×844 → 1280×720)

## Level plan (27 levels, 6 tiers)

| Tier | Count | Grid | Gems | Mines | Min par (moves) |
|------|-------|------|------|-------|-----------------|
| Beginner | 4 | 6×6 | 2 | 1 | 3 |
| Easy | 4 | 7×7 | 3 | 2 | 5 |
| Medium | 5 | 7×7 | 4 | 3 | 7 |
| Hard | 5 | 8×8 | 5 | 4 | 9 |
| Expert | 4 | 8×8 | 6 | 6 | 12 |
| Master | 5 | 9×9 | 7 | 8 | 15 |

All 27 verified solvable by independent Node.js BFS solver.
