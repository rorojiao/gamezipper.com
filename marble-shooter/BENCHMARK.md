# Marble Shooter — Competitive Benchmark

## Core Competitors
1. **Zuma Deluxe** (PopCap, 2003) — The OG marble popper
2. **Luxor** (MumboJumbo) — Egyptian-themed, linear path shooter
3. **Marble Shooter** (CrazyGames) — Browser version with landscape backgrounds
4. **Zooma Marble Blast** (WellGames) — Free browser marble popper
5. **Sparkle** — Streamlined marble popper with upgrades

## Core Mechanics to Implement

### 1. Shooting System
- Frog/cannon at center of screen
- Aim with mouse/touch (360° rotation)
- Shoot colored marbles toward chain
- Right-click / tap to swap current and next marble color
- Smooth marble flight animation with arc trajectory

### 2. Chain System
- Marbles roll along a predefined path (bezier curves / spiral paths)
- Chain moves continuously toward the skull/endpoint
- When 3+ same-color marbles connect → they pop
- Chain collapse: when gap created, marbles behind fall forward
- If marbles reach the skull → game over
- Speed increases with level progression

### 3. Path Design (30+ levels)
- Level 1-5: Simple spirals (teach basic mechanics)
- Level 6-10: S-curves and loops
- Level 11-15: Multiple converging paths
- Level 16-20: Complex spirals with narrow passages
- Level 21-25: Split paths that merge
- Level 26-30: Multi-layer with speed zones

### 4. Power-Up System (7 types)
| Power-Up | Effect | Frequency |
|----------|--------|-----------|
| **Lightning Bolt** | Destroys all marbles of one color on screen | Rare |
| **Reverse** | Pushes chain backward for 5 seconds | Common |
| **Slow** | Slows chain speed for 8 seconds | Common |
| **Bomb** | Explodes nearby marbles in radius | Uncommon |
| **Color Splash** | Changes all marbles of one color to another | Rare |
| **Accuracy** | Shows aiming trajectory line for 10 seconds | Uncommon |
| **Multiplier** | 2x score for next 30 seconds | Uncommon |

### 5. Scoring System
- Base points per marble popped: 10
- Chain combo bonus: x1.5, x2, x2.5, x3 (consecutive pops)
- Gap shot bonus: 50 points (shoot through gap to create match on far side)
- Level completion bonus: 100 × level number
- Speed bonus: remaining time × 5
- Star rating: ⭐⭐⭐ (≥80% max score), ⭐⭐ (≥50%), ⭐ (complete)

### 6. Difficulty Progression
- Chain speed: starts slow, increases 15% per level
- Colors: 3 colors (L1-5), 4 (L6-15), 5 (L16-25), 6 (L26-30)
- Chain length: 20 marbles (L1) → 60 marbles (L30)
- Power-up frequency decreases at higher levels
- Some levels have obstacles (gaps in path, speed zones)

### 7. Visual Style
- Dark gradient background with glowing path
- Neon-colored marbles with shine/glow effects
- Particle explosions on marble pops
- Smooth chain movement with individual marble rotation
- Screen shake on chain reaction combos
- Skull endpoint with pulsing danger indicator

### 8. Audio
- Satisfying marble pop sound (varied by combo)
- Chain movement rumble
- Power-up activation sounds
- Level complete fanfare
- Game over sound
- Ambient background music (mysterious/tribal)

### 9. Systems
- Level select with star ratings
- Progress save (localStorage with version)
- Tutorial (first 3 levels with tooltips)
- Hint system (highlights best shot after 10s inactivity)
- Daily challenge mode
- Stats tracking (total pops, best combo, time played)
