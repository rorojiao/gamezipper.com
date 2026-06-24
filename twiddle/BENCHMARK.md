# Twiddle — Competitive Benchmark

**Slug:** twiddle
**Type:** Simon Tatham permutation-sorting puzzle (NEW TYPE on GZ — zero overlap)
**Mechanic:** Rotate 2×2 blocks by 90° to sort a scrambled grid of numbers into order.

## Rules (canonical, Simon Tatham's Portable Puzzle Collection — "Twiddle")

1. An N×N grid (N = 3, 4, 5, 6) is filled with the numbers 1 to N².
2. Numbers start in a scrambled (solvable) arrangement.
3. **The only move:** pick any 2×2 square of cells and rotate the four numbers
   inside it 90° clockwise or counter-clockwise.
4. **Goal:** restore the numbers to ascending order, reading left→right, top→bottom
   (1 in the top-left, N² in the bottom-right).
5. No clues / no locked cells — pure permutation sorting (like a Rubik's scramble).
6. For N ≥ 3, **every** permutation of 1..N² is reachable via 2×2 rotations
   (a 90° rotation is a 4-cycle, an odd permutation, so both parities are generated
   and the full symmetric group S_{N²} is covered). Therefore every scramble is solvable.

## Why this is a clean, safe build

- **Generator is trivial:** start from solved grid, apply K random 2×2 rotations
  (clockwise/counter-clockwise, random top-left position). Solvability guaranteed by
  construction. Difficulty ≈ K (scramble depth).
- **Uniqueness is trivial:** single target state (sorted). Every scramble has exactly
  one goal, so no uniqueness solver is needed.
- **Hint path is free:** the generator knows the exact inverse move sequence that solves
  each scramble → store it as the "solution" for the in-game hint.

## Competitors referenced

- **Simon Tatham's Twiddle** (canonical, chiark.greenend.org.uk/~sgtatham/puzzles/) —
  the gold-standard implementation. Scramble-depth difficulty selector.
- **Puzzle Baron's "Twiddle"** and various "rotate the grid / sort the tiles" web games.
- **15-Puzzle / sliding tile** (different mechanic: slide, not rotate) — exists on GZ
  as sliding-puzzle; Twiddle is mechanically distinct (no empty cell).

## Systems to implement (parity with GZ S-grade standard)

- Level select with lock + star ratings (Beginner→Master, 27 levels)
- Move counter + best-moves record (localStorage, versioned save)
- Timer + best time
- Hint (reveals next solving rotation), Undo, Reset-scramble
- Step-by-step tutorial (rotate a 2×2 → watch numbers cycle)
- Procedural BGM + SFX via Web Audio API, mute toggle
- Win detection = board equals sorted order; celebratory particles + screen shake
- Click/tap a cell → rotates the 2×2 whose top-left is that cell (clockwise);
  right-click / long-press → counter-clockwise. Large 44px tap targets.
- Analytics + JSON-LD (VideoGame + FAQPage + HowTo + BreadcrumbList)
- Mobile-first responsive (390×844 → 1280×720)

## Level plan (27 levels, 6 tiers)

| Tier | Count | Grid | Scramble depth K |
|------|-------|------|------------------|
| Beginner | 4 | 3×3 | 6–10 |
| Easy | 4 | 3×3 | 14–20 |
| Medium | 5 | 4×4 | 24–34 |
| Hard | 5 | 4×4 | 40–55 |
| Expert | 4 | 5×5 | 70–95 |
| Master | 5 | 6×6 | 110–160 |

All 27 verified: valid permutation of 1..N², not pre-solved, solvable by construction.
