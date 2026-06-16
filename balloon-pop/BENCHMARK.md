# Balloon Pop Master — Competitor Benchmark

## Top Competitors
1. **Balloon Pop (Kids)** — Mobile, 10M+ downloads. Tap/throw to pop balloons, color matching, arcade.
2. **Bloons TD series** ( Ninja Kiwi) — Dart-throwing monkey pops balloons; massive franchise. Dart accuracy + power.
3. **Balloon Bash / Dart Games** — Classic carnival-style dart-throw arcade.

## Core Systems to Match
- **Throw mechanic**: limited darts per level (3-5), aim trajectory, release to throw
- **Balloon types**: normal (1pt), special bonus (5pt), bomb (game over if popped), gold (combo multiplier)
- **Combo system**: chain pops within X ms = multiplier x2, x3, x4
- **Scoring**: stars per level (1-3) based on balloons popped / darts used
- **Level structure**: 25+ levels with progressive difficulty
  - L1-5: single row, slow balloons, 5 darts
  - L6-10: multiple rows, faster balloons, 4 darts
  - L11-15: bomb balloons appear, gold balloons bonus
  - L16-20: moving platforms/wind, 3 darts
  - L21-25: complex layouts, multi-target requirements
- **Tutorial**: First level walks through aim + throw + combos
- **Progress save**: localStorage with version field, per-level best score + stars
- **Sound**: Pop SFX (Web Audio procedural), combo chime, success fanfare, fail thud
- **Visual**: Dark gradient bg, neon balloon outlines, particle burst on pop, screen shake on bomb

## Visual Style Reference
- Dark navy → purple gradient background
- Neon balloon colors (pink, cyan, yellow, green, orange)
- Particle confetti on pop
- Glassy dart UI

## Music
- Upbeat chiptune BGM (Web Audio procedural)
