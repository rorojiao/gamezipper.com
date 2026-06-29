# Gear Chain Logic — Competitive Benchmark

## Selected Game: Gear Chain Logic
**Slug:** gear-chain
**Category:** Puzzle / Brain Teaser / Mechanical
**Tagline:** Engineer the Perfect Gear Train — Master Transmission Ratios

## Differentiation from Existing gear-logic

| Aspect | gear-logic (existing) | gear-chain (this game) |
|--------|----------------------|----------------------|
| Core mechanic | Place gears on grid to connect motor→target | Assign teeth counts to pre-placed gears in a fixed network |
| Challenge type | Spatial routing (where to place) | Mathematical (what teeth to assign) |
| Physics depth | Connectivity only | RPM ratios + direction logic + multi-target |
| Gear sizes | Small/Medium/Large (placement) | Precise teeth counts from palette (8/12/16/20/24) |
| Win condition | All targets spinning | Target RPM + direction both match |
| Difficulty axis | Grid complexity + obstacles | Chain length + ratio math + constraints |
| Unique mechanics | — | Pre-filled constraint gears, dual targets, idler gears |

## Competitive Analysis

### Reference 1: Gears Logic (Mobile, 10M+ downloads)
- Grid placement puzzle, 200+ levels
- Our differentiation: Fixed network topology, focus on transmission math not placement

### Reference 2: Gear Puzzle / Gear Wheel (browser casual)
- Simple 2-3 gear chains
- Our differentiation: Complex 5-7 gear chains, dual targets, pre-filled constraints, precise RPM goals

### Reference 3: Mechanical Engineering Education Tools
- Gear ratio calculators (not games)
- Our differentiation: Gamified — level progression, star ratings, hints, progressive difficulty

## Core Mechanics

### Physics Model
- **Mesh rule:** Adjacent gears in the network mesh when both have teeth assigned
- **RPM propagation:** ω_out = ω_in × (t_in / t_out)
- **Direction:** Alternates CW/CCW with each meshing gear
- **Driver:** Fixed teeth + RPM + direction (always spinning)
- **Target:** Must reach exact required RPM AND correct direction (CW/CCW)

### Gameplay Loop
1. Level shows a network of gears with fixed positions
2. Driver (D) and Target (T) are marked; their teeth are fixed
3. Intermediate gears need teeth assignment from palette
4. Some gears are pre-filled (constraint — can't change)
5. Player taps a gear to cycle through palette options
6. RPM/direction displayed in real-time on each gear
7. When target RPM + direction both match → level complete!

### Level Tiers

| Tier | Levels | Gear Count | Features |
|------|--------|-----------|----------|
| 1 (Tutorial) | 1-5 | 2-4 | Single target, basic ratios |
| 2 | 6-10 | 3-5 | Decoy gears (not on solution path) |
| 3 | 11-15 | 4-6 | 2-value palette, tighter constraints |
| 4 | 16-20 | 5-6 | Longer chains, complex ratios |
| 5 | 21-25 | 5-6 | Pre-filled constraint gears (R) |
| 6 (Master) | 26-30 | 5-7 | Dual targets (T1+T2) |

## Visual Design
- **Background:** Dark gradient (#0a0a1a → #1a1f3a), steampunk accent
- **Gears:** Metallic gradient with visible teeth, glowing when powered
- **Driver:** Orange/red glow, always rotating
- **Target:** Green glow when correct, red pulse when wrong
- **Connections:** Lines between meshed gears, highlighted when active
- **RPM display:** Number on each gear, color-coded (green=correct, red=wrong)
- **Direction arrows:** CW/CCW indicators

## Score & Stars
- **3 stars:** Solved without hints
- **2 stars:** Used 1 hint
- **1 star:** Used 2+ hints or solved with help

## Audio Design
- **BGM:** Mechanical ambient (Web Audio API — low-frequency hum + rhythmic ticks)
- **SFX:** Gear click (assign teeth), mesh sound (correct), win chime, error buzz, button tap
