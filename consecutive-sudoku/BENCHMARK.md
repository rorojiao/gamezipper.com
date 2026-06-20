# Consecutive Sudoku — Competitive Benchmark

## Selection Rationale
Selected as the next uncovered, high-SEO-demand Latin-square Sudoku variant after
the successful Thermo / X / Odd-Even / Sandwich / Arrow series. Rules are 100%
confident; a constructive generator (valid completed grid → compute bars →
cell-removal with uniqueness solver) was proven during development.

## Top 3 Competitors Analyzed

### 1. BrainBashers — Consecutive Sudoku
- **Core**: Classic web puzzle, daily + archive
- **Levels**: 6x6 and 9x9, daily puzzle
- **Systems**: Timer, check, print, difficulty selector
- **Style**: Clean white background, classic print aesthetic
- **Music**: none
- **Strengths**: Trusted brand, daily engagement
- **Weaknesses**: No audio, no mobile touch optimization, no progression meta

### 2. Cracking the Cryptic (YouTube / apps)
- **Levels**: Hand-crafted expert puzzles
- **Systems**: Notes, hints, undo, conflict detection
- **Style**: Minimalist, focus on logic
- **Music**: none
- **Strengths**: Massive community, premium hand-crafted quality
- **Weaknesses**: Paid apps; web version limited

### 3. Sudoku.com (Consecutive variant)
- **Levels**: Large volume, mobile-first
- **Systems**: Hints, auto-check, daily challenge, stats, notes
- **Style**: Bright, colorful, mobile-optimized
- **Music**: light ambient
- **Strengths**: Polished mobile UX, huge user base
- **Weaknesses**: Ads-heavy, limited free puzzles

## Systems Implemented (S-Grade Parity)
| System | Status |
|--------|--------|
| 4x4 / 6x6 / 9x9 grids | ✅ |
| Unique-solution generator (constructive) | ✅ 27/27 verified by independent solver |
| Consecutive bars (gold, glowing) | ✅ signature visual |
| No-bar = non-consecutive constraint | ✅ enforced |
| Hint system (reveal correct cell) | ✅ |
| Undo | ✅ |
| Erase | ✅ |
| Notes mode (candidates) | ✅ |
| Timer + best time | ✅ |
| Star rating (1-3 by mistakes/hints/time) | ✅ |
| localStorage v1 (consecutiveSudokuV1) | ✅ |
| Daily Challenge (deterministic seed) | ✅ |
| Tier system: Beginner→Master | ✅ 6 tiers |
| Level select grid (tier filter) | ✅ |
| Tutorial modal (3 steps) | ✅ |
| BGM (procedural ambient via Web Audio) | ✅ |
| SFX: place/erase/conflict/hint/win/select | ✅ 6 sounds |
| Touch optimization, mobile-first responsive | ✅ height-aware canvas |
| Dark gradient + neon accent GameZipper look | ✅ |
| 4 JSON-LD blocks | ✅ |
| og:title/description/image, canonical | ✅ |
| Custom icon.png + og-image.png (procedural) | ✅ |

## Difficulty Curve (27 levels, 6 tiers)
- **Beginner (4x4)**: 4 levels, 8 clues each
- **Easy (6x6)**: 4 levels, 14 clues each
- **Medium (6x6)**: 4 levels, 12 clues each
- **Hard (9x9)**: 6 levels, 40 clues each
- **Expert (9x9)**: 5 levels, 35 clues each
- **Master (9x9)**: 4 levels, 32 clues each

## Visual Style
- Dark navy/indigo/purple gradient background
- Neon cyan + purple accent (GameZipper standard)
- Gold glowing bars between consecutive cells (the signature element)
- Rounded glass-morphism panels
- Confetti celebration on win
