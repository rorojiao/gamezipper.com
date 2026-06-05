# Glass Rush 3D — Competitive Benchmark

## Concept
3D first-person endless runner where a glowing energy ball blasts through crystalline tunnels, smashing glass and crystal obstacles. Tap/swipe to tilt the ball left-right-up-down, smash obstacles to gain speed, collect orbs for score, dodge spikes to survive.

## Competitor Analysis (Top 3)

### 1. Smash Hit (Mediocre, 2014) — Genre founder
- **Core**: 1st-person endless ball-flight through glass halls
- **Mechanics**: Tap to throw metal ball, ball travels automatically forward, hits shatter glass; tapping near an obstacle breaks it; rare power-ups slow time or make ball indestructible
- **Levels**: 11 stages × multiple checkpoints (procedural sections within)
- **Systems**: Score (smash combos), best score, level progress save, slow-mo power, multi-ball
- **Aesthetic**: Crystal/glass aesthetic, deep blue gradient, particle-rich shatters
- **Audio**: Hallucinatory ambient pads, deep bass, shattering SFX
- **Weakness**: No leaderboard, no daily challenge, no skin customization

### 2. Into the Dead (PikPok, 2012) — 1st-person zombie runner
- **Core**: 1st-person endless runner with obstacles
- **Mechanics**: Swipe left/right to dodge, swipe up to slash, swipe down to slide
- **Levels**: Procedural, infinite; mission system
- **Systems**: Missions, weapons, gold, perk system, leaderboard
- **Aesthetic**: Apocalyptic red/dark, blood splatter
- **Audio**: Heartbeat, footsteps, zombie groans

### 3. Subway Surfers (SYBO, 2012) — Endless runner reference
- **Mechanics**: Swipe to dodge, jump, slide; collect coins, power-ups
- **Levels**: Procedural, infinite
- **Systems**: Hoverboard, characters, boards, daily challenge, leaderboard, missions
- **Aesthetic**: Vibrant graffiti, urban
- **Audio**: Upbeat music, satisfying SFX

## Our Differentiation
- **Crystal/glass aesthetic** unique to GZ (none of our 246 games)
- **Tilt-to-smash** swipe controls (more immediate than swipe-to-dodge)
- **Combo system**: consecutive smashes build multiplier
- **6 obstacle types** (glass walls, moving slabs, rotating prisms, spike traps, light barriers, low ceilings)
- **5 difficulty tiers × 30 levels** = 150 hand-tuned levels
- **3 power-ups** (Slow-Mo, Multi-Ball, Magnet)
- **Daily seed challenge** with leaderboard via localStorage

## System Spec
| System | Implementation |
|--------|----------------|
| Levels | 30 levels × 5 tiers (Starter/Classic/Challenge/Expert/Master) = 150 hand-tuned procedural seeds |
| Score | Base per smash × combo multiplier × level multiplier |
| Combos | 1.5x / 2x / 3x / 5x at 5/10/20/40 streaks |
| Power-ups | Slow-Mo (4s), Multi-Ball (3 balls 6s), Magnet (attract orbs 6s) |
| Achievements | 12 (smash 100, 500, 1000, full-combo, all-powerups, etc.) |
| Skins | 6 unlockable ball colors (Cyan/Magma/Forest/Violet/Sunset/Cosmic) |
| Tutorial | 4-step skippable (move / smash / combo / power) |
| Save | localStorage v3.0 — level, score, best, coins, achievements, settings |
| Audio | 9 procedural SFX (smash/combo/spike_hit/level_complete/game_over/click/hover/orb/powerup) + 3-scene procedural BGM (menu/game/gameover) |
| Analytics | site-analytics.cap.1ktower.com |
| SEO | 4 JSON-LD (VideoGame/FAQPage/HowTo/BreadcrumbList) + og: meta |

## Art & Music
- **Style**: Crystalline neon — cyan/blue/purple gradient on dark navy void
- **Procedural rendering**: All 3D via Canvas 2D pseudo-3D (z-projection of tunnel segments)
- **Particle systems**: Glass shatter (8-12 pieces with rotation+gravity+alpha), spark trails on smash, orb collection bursts
- **Custom image assets**:
  - `icon.png` 512×512 — neon ball with crystal shard
  - `og.png` 1200×630 — tunnel+ball+shards
  - Will be generated via RunningHub API in Phase 4
- **Music**: Procedural Web Audio (slow ambient pads + arpeggio + bass) — 16s seamless loop
