# Color Cascade — Competitive Benchmark

## Concept
A fast-paced hybrid-casual puzzle where colorful shooter blocks slide across a conveyor at the bottom of the screen. Tap to launch the active shooter upward to clear matching colored pixels in the pixel-map grid above. Chain reactions, combo multipliers, perfect shots, and star ratings. Inspired by 2026 viral hits like **Pixel Fever!**, **Ball Run 2048**, and the **Block Blast** family.

## Competitor Analysis (3+ titles)

### 1. Pixel Fever! (PIXEL KING PTE. LTD., 2026)
- **Mechanic**: conveyor-shooter, tap-to-launch, color match on a pixel map
- **Levels**: 1000+ procedurally mixed
- **Systems**: 3-stars, no-fail continue, coin currency, lucky wheel, daily tasks
- **Audio**: punchy SFX, chiptune BGM
- **Style**: 2D pixel-art, vibrant, hyper-saturated

### 2. Block Blast! (Hungry Studio, 2024-2026 mega-hit)
- **Mechanic**: drag-and-place blocks on 8x8 grid, clear rows/columns
- **Levels**: endless + daily challenges
- **Systems**: combo, streak, daily reward, themes, no-fail continue
- **Audio**: soft pops, satisfying "blam" clears, calm BGM
- **Style**: flat 2D, soft pastel, no 3D

### 3. Ball Run 2048 (combine rolling + 2048)
- **Mechanic**: shoot numbered balls to merge with same-number rows
- **Systems**: chain reactions, multipliers, leaderboard
- **Audio**: rolling, merge "pop" SFX

## Our Differentiator
- **Conveyor + Shooter** hybrid (not just drop-block or just shoot-marble)
- **Color match** layer on top of grid-clear — double satisfaction
- **30 hand-crafted levels** with curve progression (no endless grind)
- **Mini-map preview** of next 5 shooters
- **Combo counter** with screen shake on 3+ chains

## Systems to Implement (S-grade)
1. **30 Levels** with progressive difficulty (size, color count, conveyor speed)
2. **Scoring**: pixel-cleared base × combo multiplier × level multiplier
3. **3-Star rating** per level (1★ = complete, 2★ = no continue, 3★ = perfect)
4. **Combo system**: chain 2+ matches = 1.5x / 2x / 3x multiplier
5. **Power-ups** (procedurally awarded): Bomb, Color Wipe, Slow-Motion
6. **Progress save** (localStorage with version field)
7. **Tutorial** (interactive first 3 levels, skippable)
8. **Sound FX** (procedural Web Audio: shoot, hit, clear, level-up, fail)
9. **BGM** (procedural Web Audio ambient chiptune)
10. **Settings**: sound on/off, reset progress
11. **Leaderboard** (local high score per level)
12. **Achievements** (5 milestones: first clear, 5 in a row, 10 perfect, 25 clears, 30 complete)
13. **Animations**: shooter slide, launch trail, hit ripple, clear particles, level-up banner
14. **Mobile**: touch-action:none, large tap targets, responsive layout

## Technical Stack
- Single-file HTML5 Canvas 2D
- 1280x720 desktop, 390x844 mobile, responsive scaling
- 60fps, delta-time independent
- Web Audio API procedural sound
- localStorage v1.0.0 save schema
