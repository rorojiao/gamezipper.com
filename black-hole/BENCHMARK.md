# BENCHMARK.md — Black Hole (Hole.io / Donut County Style)

## Game Overview
**Title:** Black Hole
**Slug:** black-hole
**Category:** puzzle (cat: "puzzle" in games-data.js)
**Tagline:** "Consume the world. Grow your black hole. Rule the cosmos."
**Concept:** Player controls a black hole on a 2D arena filled with objects. Move the hole, consume smaller objects to grow bigger, then consume larger ones. 30+ hand-crafted levels + endless mode.

## Competitor Analysis (Top 3 Sourced From Research)

### Competitor 1: Hole.io (Voodoo, 2018+)
- **Downloads:** 200M+
- **Core mechanic:** Move hole around city, consume objects, grow, compete with other holes
- **Levels:** None — it's an endless io-style game with timer (120s matches)
- **Style:** Top-down 2D city, 3D-rendered objects
- **Sound:** Bouncy pop, satisfying suction sounds
- **Visuals:** Stylized low-poly city

### Competitor 2: Donut County (Ben Esposito, 2018)
- **Awards:** Best Game of 2018 (The Game Awards nomination), BAFTA nomination
- **Core mechanic:** Single-player puzzle, hole swallows objects in stages
- **Levels:** 20+ story-driven levels with unique environments (laundromat, donut shop, beach, etc.)
- **Style:** 2D top-down, illustrated, whimsical
- **Sound:** Cute pop, comedic gulp noises, ambient music
- **Visuals:** Hand-drawn storybook style

### Competitor 3: Eat the World (various)
- **Core mechanic:** Black hole variant, single-player arcade
- **Levels:** Time-based with size targets
- **Style:** Mobile 2D, neon, satisfying
- **Sound:** Bouncy, arcadey
- **Visuals:** Bright color palette

## S-Grade System Requirements (must implement all)

### Core Systems
- [x] **Hole growth physics** — radius = sqrt(consumed_mass), smooth visual scaling
- [x] **Object suction** — items within range get pulled in (magnet effect with velocity)
- [x] **30 hand-crafted levels** with unique object compositions, target sizes, and time/star ratings
- [x] **Progressive difficulty** — levels 1-5: small items; 6-15: mixed; 16-25: large obstacles; 26-30: boss-like compositions with moving hazards

### Meta Systems
- [x] **Scoring:** mass consumed × time bonus × level multiplier
- [x] **3-star rating per level** (1★ <50% target, 2★ 50-89%, 3★ 90%+)
- [x] **Best score per level** (localStorage)
- [x] **Total stars collected** (progression meter)
- [x] **Power-ups** (in 3 levels): vortex burst (3s), magnetic pull (5s), ghost mode (pass through walls)
- [x] **6 unlockable hole skins** (cosmetics, earned via stars: Cosmic, Plasma, Galaxy, Singularity, Event Horizon, Quasar)
- [x] **12 achievements** (e.g., "First Bite", "Size 5", "Perfect 3-Star Streak x5", "Speed Runner", "Vortex Master")
- [x] **Daily challenge** (seed-based, optional)

### UI/UX
- [x] **Tutorial** (3-step overlay, skippable) for first launch
- [x] **Level select** with star display and locked/unlocked states
- [x] **In-game HUD:** current size, target size, timer (for timed levels), mass counter
- [x] **Pause menu** with restart, settings, home
- [x] **Settings:** sound on/off, music on/off, vibration, reset progress (with confirm)
- [x] **Level complete** screen with stats, stars, next button
- [x] **Win animation** — confetti + growth burst + sound
- [x] **Lose animation** — fade + soft sound

### Audio (SFX via Web Audio API procedural + optional MiniMax BGM)
- [x] **Click/select:** short blip
- [x] **Suction (object near hole):** rising whirring loop
- [x] **Consume (object eaten):** pop with random pitch
- [x] **Growth (new tier):** boom + bass thump + screen flash
- [x] **Level complete:** ascending arpeggio
- [x] **Level fail:** descending tone
- [x] **Star earned:** chime
- [x] **Button hover:** subtle tick
- [x] **BGM:** ambient spacey electronic with bass pulse (Web Audio API procedural fallback)

### Visual Style
- Dark cosmic background (deep purple to black gradient)
- Particle stars in background (twinkling)
- Neon-accent hole (purple→magenta gradient with glow)
- Object colors: red, orange, yellow, blue, green, white (diverse palette)
- Smooth object rotation during suction
- Camera shake on big consume (size tier up)
- Glow effect on hole edge

## Level Design (30 levels, 6 tiers of 5)

### Tier 1: Cosmic Dust (Levels 1-5) — Simple, tutorial
- L1: 30 tiny orbs (size 1), target size 3, no timer
- L2: 40 orbs + 5 small rocks (size 2), target size 4
- L3: 25 orbs + 3 medium asteroids (size 3), target size 5
- L4: 35 orbs + 5 medium asteroids, target size 6
- L5: 40 orbs + 8 medium + 3 small stars, target size 8 (boss of tier 1)

### Tier 2: Asteroid Field (Levels 6-10) — Mixed sizes
- L6-10: 40-60 mixed objects (sizes 1-4), target 8-12

### Tier 3: Planetary Debris (Levels 11-15) — Larger objects
- L11-15: 30-40 objects (sizes 1-6), target 12-16

### Tier 4: Star System (Levels 16-20) — Many moving hazards
- L16-20: 30-50 objects (sizes 1-7), some orbit, target 16-20

### Tier 5: Nebula Storm (Levels 21-25) — Complex layouts
- L21-25: 40-60 objects (sizes 1-8), multiple clusters, target 20-26

### Tier 6: Singularity (Levels 26-30) — Final boss
- L26-30: 50-80 objects (sizes 1-10), boss-sized objects, target 28-40, timed

## Difficulty Curve
- **Time/level:** None (L1-15) → 90s (L16-25) → 60s (L26-30)
- **Hazard intensity:** 0 → 1 moving object → 3 moving → 5 moving
- **Power-up availability:** L11+ (vortex), L18+ (magnet), L25+ (ghost)

## Monetization Hooks (ad placements)
- Interstitial: every 3 levels complete
- Rewarded: continue after fail, double stars
- Banner: bottom of level select

## Technical Targets
- File: `black-hole/index.html` (single file, ~60-80KB target)
- Canvas-based 2D rendering at 60fps
- LocalStorage key: `gz_black_hole_save_v1`
- Frame-rate independent physics (delta time)
- Touch + mouse + keyboard support
- Responsive: scales to mobile (390x844) and desktop (1280x720)
- All English UI, no Chinese text
