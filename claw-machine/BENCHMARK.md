# Claw Master — BENCHMARK.md (Competitive Analysis)

## Game Overview
Claw Master — a satisfying skill-based puzzle where players position a claw to grab prizes from a machine, meeting level-specific objectives (grab target prizes, reach score thresholds, collect rarities).

- **Inspiration**: "Claw Machine" / "Catch Master" mobile games (50M+ downloads combined), real-world UFO catcher / crane game arcades, "Gacha" capsule mechanics
- **Core Loop**: A claw moves horizontally above a pile of prizes. Player taps to drop the claw. The claw descends, grabs (or misses), ascends, and delivers the prize to the chute. Each level has a specific objective (grab N prizes, grab the golden prize, achieve a point target).
- **Satisfaction Drivers**: Anticipation of the grab, the claw closing animation, prizes tumbling into the chute, collection completion

## Top Competitors Analyzed

| Source | Format | Features | Monetization | Session |
|--------|--------|----------|--------------|---------|
| **Claw Machine** (various mobile) | Mobile | 3D claw, realistic physics, prize collection, unlockable machines | Interstitial + rewarded | 3-8 min |
| **Catch Master** | Mobile | Multiple machines, rare prizes, daily rewards | Interstitial + IAP | 4-8 min |
| **Gacha / Capsule** games | Mobile | Capsule dispensing, collection mechanics, rarity tiers | Rewarded + IAP | 5-10 min |
| **Web clones** (various) | HTML5 | Basic grab mechanic, limited prizes, poor polish | Display ads | 1-3 min |

## Required Systems (S-Tier Standard)

1. ✅ **Core claw mechanic** — claw moves horizontally, tap/click to drop
2. ✅ **Physics simulation** — claw descent, grab detection (proximity + claw jaws), prize gravity, pile settling
3. ✅ **30 levels across 5 tiers** — progressive objectives:
   - Tier 1 (Beginner): Grab 3+ prizes from easy piles (large prizes, no obstacles)
   - Tier 2 (Easy): Reach score targets, medium prize sizes
   - Tier 3 (Medium): Grab specific colored/rare prizes, tighter timing windows
   - Tier 4 (Hard): Moving prizes, bonus multipliers, limited attempts
   - Tier 5 (Master): Precision grabs, time limits, golden prize challenges
4. ✅ **Prize variety** — 6 prize types (ball, gem, star, heart, crown, gold) with different point values and grab difficulty
5. ✅ **Star rating** — 3 stars based on efficiency (prizes per attempt, bonus objectives)
6. ✅ **Grab strength mechanic** — claw grip strength varies (adds skill element)
7. ✅ **Prize collection** — visual collection tracker showing prizes won
8. ✅ **Web Audio API** — claw motor hum, grab sound, drop chime, win fanfare
9. ✅ **Daily challenge** — date-seeded random machine layout
10. ✅ **Achievements** (8) — first grab, 3-star, complete a tier, daily streak, golden prize, perfect level, collection milestone, claw master
11. ✅ **localStorage progress** — level completion, stars, achievements, collection
12. ✅ **Mobile-first responsive** — touch + mouse
13. ✅ **Dark neon theme** — GameZipper aesthetic (neon cyan/magenta on dark gradient)

## Level Design Blueprint
| Tier | Levels | Prize Count | Prize Types | Special |
|------|--------|-------------|-------------|---------|
| 1 (Beginner) | 1-6 | 8-12 | Balls only | Large prizes, strong grip |
| 2 (Easy) | 7-12 | 10-15 | Balls + Gems | Score targets |
| 3 (Medium) | 13-18 | 12-18 | + Stars, Hearts | Grab specific colors |
| 4 (Hard) | 19-24 | 15-20 | + Crowns | Limited attempts, moving pile |
| 5 (Master) | 25-30 | 18-25 | + Gold | Precision, time limits, golden prize |

## Technical Approach
- **Rendering**: Canvas 2D — cabinet frame, prizes as circles/shapes, claw as articulated line segments
- **Physics**: Simplified — prizes are circles with position/velocity, gravity pulls down, pile = resting positions, claw grabs if jaws overlap prize center within threshold
- **Grip mechanic**: Claw grip strength = 60-90% (randomized per drop), affects whether grabbed prize slips
- **Scoring**: Prize value × grip bonus; level pass = meet objective; stars = efficiency ratio
- **Animation**: RequestAnimationFrame loop, claw state machine (moving → descending → grabbing → ascending → delivering)

## Differentiation vs. Competitors
1. **No download, no signup** — instant browser play (most competitors are app-only)
2. **Puzzle-level objectives** — not just free-grab; each level has a specific goal
3. **Dark neon aesthetic** — distinct from competitors' bright/cartoony themes
4. **Full sound design** — most web clones have no audio
5. **30 handcrafted levels** — most web clones have random-only play
6. **Daily challenge + achievements** — retention features missing from web clones
