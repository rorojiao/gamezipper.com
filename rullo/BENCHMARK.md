# Rullo — Competitive Benchmark

## Phase 0 Candidate Rationale

**Candidate:** Rullo (`/rullo/`)
**Benchmark family:** Rullo / "Rulls" — Maciej Targoni minimal binary-toggle sum-target puzzles
**Score:** 22/25

| Criterion | Score | Evidence |
|---|---:|---|
| Market demand | 7/10 | Rullo is a popular iOS/Android minimalist puzzle by Lukasz Miesowicz; described as "addictive binary number puzzle", 4.5+ ratings, distributed in 14+ languages. The "Klocki author's Polish minimalist puzzle" wave is well-known on Poki/CrazyGames. |
| Search/SEO gap | 5/5 | `rullo`, `Rullo`, `sum-puzzle`, `toggle-grid`, `row column sum` all grep 0 in the catalog. No sibling implements the "binary toggle to match row+column sum targets" mechanic. |
| Monetization potential | 4/5 | Pure brain teaser, short retry loops, level progression, high dwell time — same profile as Water Sort / 2048. |
| Feasibility | 3/3 | Single-file Canvas + deterministic CSP solver (binary search for sum-equal sub-solutions). No external assets required. |
| Uniqueness | 3/2 bonus | Differentiated as a minimalist 2D neon board: each cell holds a number 1-9; you toggle cells ON/OFF. The row target sums are the cells currently ON; column target sums are also the cells currently ON. Unique-solution verified per level. |

## Competitor Systems to Match

### Rullo (iOS / Android)
- 6×6 grid of numbers 1-9, each displayed on a token that can be toggled.
- Row targets shown on the right; column targets on the bottom.
- Tap a cell to toggle it in/out of the sum.
- Win condition: every row's ON-cell sum equals its row target AND every column's ON-cell sum equals its column target.
- Helpers: hints (show one solution), undo, restart.
- ~50 handcrafted levels across 5 packs.

### GameZipper S-Grade Additions
- 30 verified unique-solution levels across 5 tiers (4×4 → 7×7).
- Tactile flip animation + per-cell glow when part of a correct row/column sum.
- Hint system, undo, reset, keyboard support, mobile touch support.
- 3-star ratings and localStorage progress.
- Procedural Canvas visuals: dark navy board, neon cyan numbers, ripple pulse on toggle.
- Web Audio API ambient BGM + click/success/error/win SFX.
- SEO blocks: VideoGame, FAQPage, HowTo, BreadcrumbList.
- Generated/procedural art assets: `icon.png` and `og-image.jpg`.

## Differentiation

Rullo is **not** Kakuro (free-form number placement) and **not** Kakurasu (shade cells whose positional value sums to the target). Rullo is a binary toggle of pre-placed numbers — the numbers stay put, you turn them on or off, and the sum of all ON cells in a row/column must match the targets shown for that row/column. The solver must find a subset of each row that sums to the row target AND has the same subset intersection with the column. It's a 2D binary-CSP that scales from 4×4 (tutorial) to 7×7 (master).

## QA Requirements

- Every level must have at least one valid solution; the canonical solution embedded in the level must pass the in-engine win-checker.
- All embedded level data must be self-consistent (row targets = sum of solution's row cells, col targets = sum of solution's col cells).
- 30-level in-engine verification must replay the known solution for all 30 levels and report a successful win.
- Game page must include `adsterra-manager.js`, `monetag-manager.js`, `gz-ad-below-game`, and `game-footer.js`.
- Every S-grade prerequisite: dark theme, Web Audio, JSON-LD, localStorage save, cleanup on unload, no `text-stroke`, gz-analytics beacon present.
