# Color Helix: Smash Jump — Competitor Benchmark

## Competitors Analyzed

### 1. Helix Jump (Voodoo) — `poki.com/en/g/helix-jump`
- **Core**: Tap to rotate spiral tower, drop ball through gaps, avoid red zones
- **Levels**: 60+ procedural levels
- **Systems**: score, combo multiplier (1x-5x), particle effects, color cycles
- **Vibe**: minimalist neon, single-tap, hard-cliff difficulty
- **What to copy**: smooth rotation animation, color cycles, combo system
- **What to improve**: add color-matching layer + smash power-ups

### 2. Color Switch — poki/crazygames
- **Core**: Tap to make colored ball pass through matching color arcs
- **Levels**: 30+ handcrafted
- **Systems**: stars (1-3 per level), retry counter, simple tutorial
- **Vibe**: soft pastel + neon, family-friendly
- **What to copy**: color-match mechanic, star rating
- **What to improve**: vertical helix drop adds depth

### 3. Helix Ball / Smash Helix — poki/crazygames
- **Core**: Bounce a ball through spiral helix, smash through colored rings
- **Levels**: 20+ levels
- **Systems**: smash combo, speed boost
- **Vibe**: 3D-ish rendering, particle explosions
- **What to copy**: smash effects, score combos
- **What to improve**: integrate color-match for level variety

## Design Pillars for Color Helix: Smash Jump

1. **Helix drop core** — like Helix Jump, ball drops through spiral tower
2. **Color-match twist** — each helix ring has a color; ball must match to smash through, mismatched ring kills
3. **Smash bonuses** — color match triggers explosion that clears nearby rings
4. **Combo system** — consecutive matches = multiplier (1x-5x)
5. **30+ levels** — progressive: faster speed, more mismatched rings, more colors

## Systems Checklist (S-Grade)
- [x] Score + best score (localStorage v1)
- [x] Combo multiplier
- [x] Star rating (1-3 per level)
- [x] Power-ups: shield (1 free pass), slow-mo (5s)
- [x] Tutorial overlay (skip-able)
- [x] Sound effects (Web Audio API procedural)
- [x] BGM (Web Audio API procedural)
- [x] Pause / mute / sound toggle
- [x] Progress save with version field
- [x] Mobile-first touch controls
- [x] 30+ levels with progressive difficulty
- [x] Particles, screen shake, color flashes on smash
- [x] Analytics + SEO structured data
- [x] Achievement system (5 achievements)

## Level Design
- **L1-5**: 3 colors, slow speed, tutorial-style
- **L6-10**: 4 colors, medium speed
- **L11-15**: 5 colors, fast speed, mix of smash/safe/miss rings
- **L16-20**: 5 colors + 1 power-up per level
- **L21-25**: 6 colors, very fast, double rings
- **L26-30**: 6 colors, chaotic, combo-heavy
