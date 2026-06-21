# Twodoku — Competitive Benchmark

## Game Summary
Twodoku (a.k.a. Double Doku / Twin Sudoku) is the simplest overlapping
Sudoku variant: **two standard 9×9 Sudoku grids sharing one 3×3 box**
in a side-by-side layout (9 rows × 15 columns total). Standard Sudoku
rules apply to each grid; the shared 3×3 region must be consistent.

## Rules (100% confident)
1. Two 9×9 grids laid out side-by-side, sharing the rightmost 3×3 box of
   the left grid = leftmost 3×3 box of the right grid.
2. Each grid: every row, column, 3×3 box contains digits 1-9 exactly once.
3. The shared 3×3 box has the same values in both grids.
4. Layout: total playfield = 9 rows × 15 columns.

## Competitors Researched
- samuraisudoku.org — publishes Twodoku / Triple / Butterfly / Samurai daily
- samurai-sudoku.com — multi-grid variants, no Twodoku specifically
- sudoku.4thewww.com — Samurai + Killer Samurai
- sudoku.com — does NOT host overlapping variants (only standard + variants)

## Systems to Implement (S-grade spec)
- 27 levels, 6 tiers (4 Beg + 4 Easy + 4 Med + 5 Hard + 5 Expert + 5 Master)
- Constructive generator: canonical Latin square + shuffles → dig holes
  with cross-grid uniqueness check (bitmask DFS solver, MRV heuristic)
- Two grids rendered side-by-side on desktop, scroll/zoom on mobile
- Cell selection sync between grids where shared box lies (single shared cell set)
- Notes (pencil marks), hints, undo, mistake tracking, check, reset
- Conflict highlighting within each grid (red), shared cells highlighted gold
- localStorage progress with version field, level select screen
- Procedural BGM (Web Audio API) + click / select / success / error / complete SFX
- Dark gradient theme, neon accent (sunset orange / electric blue to differentiate
  from existing samurai-sudoku purple/cyan)
- Analytics: AdSense (no 1ktower zombie analytics — production pattern)
- SEO: JSON-LD (VideoGame + FAQPage + HowTo + BreadcrumbList), og tags, canonical
- Mobile responsive (1280×720 desktop, 390×844 mobile)
- Single-file: twodoku/index.html (no external deps except CDN fonts)

## Generator Strategy
1. Build canonical 9×9 Latin square (i+j)%9+1, then shuffle:
   - Random band/row permutation within bands
   - Random stack/col permutation within stacks
   - Random digit relabel
2. For the shared 3×3 box: pick the rightmost box of grid A (cols 7-9, rows 1-9).
   For grid B, force its leftmost box (cols 1-3, rows 1-9) to equal A's cols 7-9.
3. Generate grid B independently but constrained: column-by-column backtracking
   with the fixed leftmost box as starting constraint.
4. Dig holes: remove cells symmetrically from both grids, with a uniqueness
   solver that checks BOTH grids simultaneously. Stop when target givens reached
   or uniqueness breaks (then restore that cell).
5. Difficulty tiers via given count:
   - Beg 36-40, Easy 32-35, Med 28-31, Hard 24-27, Expert 20-23, Master 16-19

## Verification
- Independent Node.js solver (different implementation): DFS + bitmask + MRV
- Must confirm 27/27 levels have unique solution AND shared box consistent
- Acceptance: solver returns exactly 1 solution per level, ≤1.0s per level
