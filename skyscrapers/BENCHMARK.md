# Skyscrapers — Competitive Benchmark

Last updated: 2026-06-07

## Top 3 Competitors Analyzed

### 1. puzzle-skyscrapers.com
- **Core**: HTML5 Skyscrapers (a.k.a. "Towers") — single-page web app
- **Levels**: 4x4, 5x5, 6x6, 7x7, 8x8, 9x9 (unlimited procedural)
- **Systems**: Hint button, Reset, Timer, Undo, Solution check, daily challenge
- **Style**: Minimalist dark theme, isometric city silhouettes on cell click
- **Music**: none / silent
- **Strengths**: Clean UI, fast generator
- **Weaknesses**: No audio, no progression meta

### 2. thepuzzlelabs.com/skyscrapers
- **Levels**: 1,500 hand-crafted puzzles across 5 difficulty levels (4x4 → 8x8)
- **Systems**: Daily puzzle, print, share, difficulty selector, leaderboard
- **Style**: Clean white background with blue accents, classic puzzle-magazine aesthetic
- **Music**: none
- **Strengths**: Volume of content (1,500 is the SEO jackpot), daily engagement
- **Weaknesses**: Looks dated; no mobile-optimized touch affordances

### 3. Conceptis Puzzles — Skyscrapers
- **Levels**: Variable size, free + paid tiers, multi-puzzle magazines
- **Systems**: Multi-puzzle bundles, account system, e-magazine delivery
- **Style**: Black/white print-style with subtle color highlights
- **Music**: none
- **Strengths**: Trusted publisher, deep rules tutorials
- **Weaknesses**: Less web-app focused, more PDF-style

---

## Systems to Implement (S-Grade Parity)

| System | Source | Priority |
|--------|--------|----------|
| 4x4, 5x5, 6x6, 7x7, 8x8 grids | All 3 | Must |
| Procedural puzzle generator with unique-solution guarantee | puzzle-skyscrapers, conceptis | Must |
| 30+ handcrafted solvables (or seeded procedural) | thepuzzlelabs | Must |
| Visibility clue placement (border) | All | Must |
| Hint system (highlight a correct cell) | puzzle-skyscrapers | Must |
| Undo / Redo | puzzle-skyscrapers, conceptis | Must |
| Reset puzzle | All | Must |
| Timer + best time per level | All | Must |
| Star rating (1-3 based on time/no-hint) | thepuzzlelabs | Must |
| Solution-validator auto-check (highlight errors) | puzzle-skyscrapers | Must |
| localStorage v1 (skyscrapersV1) — level progress, best, stars | GameZipper standard | Must |
| Daily Challenge (deterministic seed) | thepuzzlelabs | Must |
| Tier system: Easy/Medium/Hard/Expert | thepuzzlelabs | Must |
| Level select grid | GameZipper standard | Must |
| Tutorial modal (5 steps: Welcome, Rule, Visibility, Clues, Solve) | GameZipper standard | Must |
| BGM (procedural ambient — MiniMax unavailable here) | GameZipper S-Grade | Must |
| SFX: click/place, conflict, undo, hint, win, level-clear | GameZipper S-Grade | Must |
| Touch optimization, mobile-first responsive | GameZipper standard | Must |
| Dark gradient + neon accent GameZipper look | GameZipper standard | Must |
| 4 JSON-LD blocks (VideoGame, FAQPage, HowTo, BreadcrumbList) | GameZipper standard | Must |
| Custom 512x512 icon.png | RunningHub | Must |
| og:title, og:description, og:image, canonical URL | GameZipper standard | Must |

---

## Difficulty Curve (30 levels, 4 tiers)

- **Easy (4x4)**: Levels 1-8 — minimal clues, lots of 4's and 1's
- **Medium (5x5)**: Levels 9-16 — moderate clues
- **Hard (6x6)**: Levels 17-24 — fewer clues
- **Expert (7x7)**: Levels 25-30 — sparse clues, multi-step logic

## Visual Style Direction
- **Dark night-cityscape gradient** (deep navy → indigo → purple)
- **Neon cyan/magenta building highlights** when a cell is "active"
- **Vertical light beams** rising from placed cells (the "skyscrapers")
- **Skyline silhouette** rendered as a decorative top border (the puzzle's namesake)
- **Glassy panels** for UI (modals, hint button, level select)
- **Animated particles** floating up like city lights on win

## Sound Direction
- **BGM**: Lo-fi ambient with slow synth pads + soft piano (procedural via Web Audio API)
- **SFX**: Crisp digital "place" tick, sub-bass "conflict" thump, glassy "win" chime, "undo" swoosh, "hint" zap
