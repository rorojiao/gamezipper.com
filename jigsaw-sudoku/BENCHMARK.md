# Jigsaw Sudoku — Competitive Benchmark

## Game: Jigsaw Sudoku (Irregular Sudoku / Squiggly Sudoku)
**Slug:** `jigsaw-sudoku`
**Tier:** Sudoku Variant (Game #391)
**Selection score:** 22/25
- Market demand: 5/5 (top-5 Sudoku variant on sudoku.com, BrainBashers, Cracking the Cryptic; "Jigsaw Sudoku" is one of the most searched Sudoku variants)
- SEO gap: 5/5 (zero coverage on GameZipper — only "Jigsaw Puzzle" picture-jigsaw exists, no overlap)
- Retention: 4/5 (single-session puzzles, daily-challenge hook drives return visits)
- Feasibility: 4/5 (region-tiling generation + constraint solver is well-understood; more complex than 3x3-box variants but proven)
- Zero overlap: 4/5 (distinct from all 14 existing Sudoku-family games — region-SHAPE variant vs linear/positional constraints)

## Rules (authoritative — Nikoli / sudoku.com consensus)

1. Fill a 9×9 grid with digits 1–9.
2. Each **row** must contain 1–9 exactly once.
3. Each **column** must contain 1–9 exactly once.
4. Instead of 3×3 boxes, the grid is divided into **9 irregularly-shaped regions** (each exactly 9 connected cells).
5. Each **irregular region** must also contain 1–9 exactly once.
6. The region boundaries are given (shown as bold/thick lines between cells); they are part of the puzzle definition.

**6×6 variant (beginner):** same rules, 6 rows × 6 cols, 6 regions of 6 cells each, digits 1–6.

## Key differences from standard Sudoku
- The 3×3 box constraint is REPLACED by irregular-region constraints.
- Region shapes vary per puzzle — no two puzzles need share the same tiling.
- Logic techniques differ: "region-scanning" replaces "box-scanning"; many standard techniques (naked/hidden pairs, X-Wing) still apply but operate on regions instead of boxes.

## Competitor analysis (top 3)

### 1. sudoku.com (Jigsaw Sudoku mode)
- Levels: 6 difficulty tiers (Easy → Master/Diabolical)
- Features: notes/pencil marks, hints (limited), mistakes counter, auto-check, highlight same digit, daily challenge, undo
- Monetization: interstitial ads between levels, banner, hint/undo coins
- Art: clean light theme, distinct region colors, thick region borders

### 2. BrainBashers (Irregular Sudoku)
- Daily puzzle + archive
- Pure web, keyboard + mouse
- Minimal UI, timer, pencil marks, check button
- Multiple region sets per day

### 3. Cracking the Cryptic (app + YouTube)
- Hand-crafted "Squiggly Sudoku" puzzles
- Focus on elegance/uniqueness, no random gen
- Notes, coloring tools, candidate highlighting
- Premium positioning — shows the variant is beloved by serious solvers

## Systems to implement (parity checklist)
- [x] 9×9 and 6×6 grids with irregular regions (bold borders)
- [x] Region color-coding (subtle background tints per region for readability)
- [x] Digit input + pencil/notes mode
- [x] Row / col / region conflict highlighting
- [x] Hint system (reveal a cell via solver)
- [x] Undo stack
- [x] Mistake counter + auto-check toggle
- [x] Timer + pause
- [x] Daily challenge (seeded)
- [x] Tier progression with star ratings (time-based)
- [x] Tutorial overlay (rules + how regions work)
- [x] localStorage progress + version
- [x] Procedural BGM + SFX (Web Audio)
- [x] SEO: VideoGame + FAQPage + HowTo + BreadcrumbList JSON-LD

## Difficulty curve (27 levels, 6 tiers)
- **Beginner (L1-4):** 6×6 grid, 4 region shapes, generous givens (18-22)
- **Easy (L5-8):** 6×6 grid, varied shapes, fewer givens (12-16)
- **Medium (L9-12):** 6×6 grid, fewer givens (8-11)
- **Hard (L13-18):** 9×9 grid, complex shapes, givens 28-34
- **Expert (L19-23):** 9×9 grid, givens 22-27
- **Master (L24-27):** 9×9 grid, minimal givens (17-21), intricate shapes

All 27 levels must be independently verified UNIQUE (single-solution) by a constraint solver.

## Visual theme
- Dark gradient background (#0a0a1a → #1a1033), neon accent
- Region color-coding: 9 distinct subtle tints (low-opacity pastels on dark)
- Thick region borders in accent color
- Differentiate from Hyper Sudoku (sky-blue) and Greater-Than (amber/emerald) — use **rose/teal** primary accent (#f43f5e rose + #14b8a6 teal)
