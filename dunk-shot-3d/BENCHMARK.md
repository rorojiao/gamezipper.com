# Dunk Shot 3D — Competitor Benchmark

## Genre
3D casual sports arcade — one-tap timing/arcade basketball. Tap to release the ball, swish it through the hoop, chain combos, chase high scores.

## Headline Competitors Analyzed
1. **Dunk Shot** (Voodoo / SayGames) — mobile viral hit, 50M+ downloads
2. **Basketball Stars** (Miniclip) — competitive 1v1 basketball
3. **Dunk Hit** (Voodoo) — spin-the-baller mid-air trick shots
4. **Flip Dunk** (Voodoo) — timing-based swish with rim physics
5. **Idle Basketball** (Green Panda Games) — tycoon spin
6. **Basketball Arena** (Masomo) — real-time head-to-head

## Core Systems Matrix (what we MUST implement)

| System | Dunk Shot | Flip Dunk | Our Game |
|---|---|---|---|
| Tap-to-release mechanic | ✓ | ✓ | ✓ |
| Ball physics (gravity, bounce, rim) | ✓ | ✓ | ✓ |
| Swish detection / "perfect" feedback | ✓ | ✓ | ✓ |
| Combo multiplier (consecutive swishes) | ✓ | ✓ | ✓ |
| Streak fire / particles / screen shake | ✓ | ✓ | ✓ |
| Level progression (chapters / maps) | ✓ | ✓ | ✓ (5 tiers, 30 levels) |
| Trick walls / moving obstacles | ✓ | ✓ | ✓ (5 obstacle types) |
| Star rating (1-3 per level) | ✓ | ✓ | ✓ |
| Best score (local) | ✓ | ✓ | ✓ (localStorage) |
| Ball skins unlock | ✓ | ✓ | ✓ (6 balls) |
| Court themes | ✓ | ✗ | ✓ (6 courts) |
| Achievements | ✓ | ✗ | ✓ (12 achievements) |
| Tutorial (skippable) | ✓ | ✓ | ✓ (4 steps) |
| Daily challenge | ✓ | ✗ | ✓ (procedural daily seed) |
| Power-ups (slow-mo, magnet, double) | ✓ | ✓ | ✓ (3 power-ups) |
| Sound effects (swish, bounce, score) | ✓ | ✓ | ✓ (9 procedural SFX) |
| BGM (procedural) | ✓ | ✓ | ✓ (Web Audio pad) |
| Reset progress | ✓ | ✓ | ✓ |
| Sound on/off toggle | ✓ | ✓ | ✓ |
| Vibration toggle | ✓ | ✗ | ✓ |

## Level Design
- **Tier 1 (1-6)**: Open gym, single rim, learn timing
- **Tier 2 (7-12)**: Side walls, double rim
- **Tier 3 (13-18)**: Moving barriers, pin obstacles
- **Tier 4 (19-24)**: Rotating rims, multi-balls
- **Tier 5 (25-30)**: Boss courts (Tokyo, Paris, NYC), 3 rims, wind, fast scroll

Each level: 1-3 rims, 1-2 obstacles, target score to clear.
Star rating: <100% = 1★, 100% = 2★, >120% with combo ≥3 = 3★.

## Scoring Formula
```
base = 100 (per swish)
combo_mult = 1 + min(combo, 10) * 0.1   // 1.0 -> 2.0
trick_bonus = 50 (perfect angle, off-backboard swish)
power_bonus = 25 (used slow-mo or magnet)
level_score = base * combo_mult + trick_bonus + power_bonus
```

## Progression / Economy
- 30 levels gated by cumulative score
- Skins unlocked by: level stars (some), achievements, score milestones
- No IAP (this is a free web game; ad-driven)

## Tech Requirements
- Single-file HTML, ~50KB+ JS
- Canvas 3D-feel using Canvas 2D + perspective tricks (single-file constraint)
- Mulberry32 seeded RNG for level generation
- Web Audio API procedural SFX + pad BGM
- localStorage save (versioned `gz_dunk_v1`)

## Visual Style
- Vibrant gradient courts (sunset, neon, stadium)
- Photoreal ball with rim shadow
- Particle burst on swish
- Glassmorphism HUD with neon accents
- text-shadow for titles, NO -webkit-text-stroke

## Why This Game Wins
- ✅ Zero existing overlap (Dunk Shot is the closest, not present in GZ)
- ✅ Proven viral mechanic (>50M downloads lineage)
- ✅ Single-file Canvas 3D fully feasible
- ✅ Strong SEO ("dunk shot" / "dunk hit" / "basketball game online")
- ✅ 30 levels × 6 themes = 180 unique visual combinations
- ✅ Combo system → retention → ad impressions
