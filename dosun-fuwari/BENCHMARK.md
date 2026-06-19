# Dosun-Fuwari — Benchmark & Competitive Analysis

## Game Identity
- **Name:** Dosun-Fuwari (Japanese: ドスン・フワリ)
- **Slug:** `dosun-fuwari`
- **Type:** Nikoli Japanese gravity logic puzzle
- **Category:** puzzle
- **Positioning:** Continues GameZipper's proven 28+ Nikoli logic-puzzle moat. SEO long-tail, precise-intent traffic.

## Official Rules (Nikoli-verified, nikoli.co.jp/en/puzzles/dosun_fuwari)
The grid is divided into bold-lined regions. Some cells may be black (solid walls, belong to no region).

1. **Each region must contain exactly ONE balloon (○, light, floats up) and ONE iron ball (●, heavy, sinks down).**
2. **Balloon float rule:** A balloon must be placed so that looking straight up its column within the grid, the cell directly above it is either:
   - the top edge of the grid, OR
   - a black cell (wall), OR
   - another balloon.
   In other words, balloons "rise" and stack under ceilings (grid top, walls, or other balloons).
3. **Iron ball sink rule:** An iron ball must be placed so that looking straight down its column, the cell directly below it is either:
   - the bottom edge of the grid, OR
   - a black cell (wall), OR
   - another iron ball.
   Iron balls "sink" and rest on floors (grid bottom, walls, or other iron balls).
4. **Uniqueness:** The puzzle has a single logical solution.
5. No two balls may share a cell; each region gets exactly 2 balls (1 balloon + 1 iron ball).

## Competitive Benchmarks

| Competitor | Source | Key Systems |
|---|---|---|
| **Nikoli official Dosun-Fuwari** | nikoli.co.jp/en/puzzles/dosun_fuwari | Hand-crafted puzzles, single-solution guarantee, paper→digital |
| **Cross-A** | crossa-a.com/puzzles/dosun-fuwari | Aggregator, solver, multiple sizes 6×6 to 12×12 |
| **puzzle-and-brains.com** | puzzle-loop variant sites | Stable search demand for "dosun fuwari rules / solve online" |

## Systems to Match (S-grade parity)
- ✅ Grid rendering with bold region borders + black walls
- ✅ Drag/tap placement: empty → balloon → iron ball → empty cycle
- ✅ Real-time constraint validation (visual feedback on rule violations)
- ✅ Level progression: 5×5 tutorial → 6×6 → 7×7 → 8×8 → 9×9, min 40 levels
- ✅ Difficulty curve: region complexity + wall count + inference depth
- ✅ Hint system (reveal one forced placement), Undo, Reset, Check
- ✅ Score + best score (localStorage, versioned save state)
- ✅ Tutorial / onboarding (first level guided)
- ✅ Procedural Web Audio: place, success, error, hint, level-complete sounds
- ✅ Animations: ball drop/rise easing, region highlight, completion celebration
- ✅ Mobile-first responsive (390×844) + desktop (1280×720), touch 44px targets
- ✅ Daily challenge (date-seeded puzzle) + unlimited practice mode

## Visual Style
- Japanese washi-paper aesthetic: cream/ivory background, ink-dark bold region lines
- Balloon: light gradient sphere with highlight (soft pink/blue tints)
- Iron ball: dark metallic sphere with reflection (charcoal gradient)
- Placement animation: gentle bounce
- Vibe: zen, handcrafted, tranquil

## Audio Style
- BGM: strategy/zen — shakuhachi flute + soft koto plucks + wind chimes, minimal, BPM ~70
- SFX: correct = clear bell ring; error = soft wooden fish "tok"; place = soft pop

## Difficulty / Level Design
- Tier A (tutorial): 5×5, simple rectangular regions, few walls (8 levels)
- Tier B (easy): 6×6, irregular regions (8 levels)
- Tier C (medium): 7×7, more walls + multi-step inference (8 levels)
- Tier D (hard): 8×8-9×9, complex regions, deep inference (8+ levels)
- Daily challenge: rotating sizes

## Single-Solution Guarantee
Each published level MUST be validated by a backtracking solver to have exactly one solution before shipping. This is the core quality gate for Nikoli-style puzzles.
