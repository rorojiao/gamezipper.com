# BENCHMARK.md — Roll Rush (Going Balls / Roll Dash Style)

## Game Overview
**Title:** Roll Rush
**Slug:** roll-rush
**Category:** arcade / hyper-casual (cat: "arcade" in games-data.js)
**Tagline:** "Roll, bounce, smash. Outrun the chaos."
**Concept:** Player controls a ball rolling forward through a 3D-perspective obstacle course. Swipe/drag to control lane position, hold to jump over gaps, tap to smash through barriers. Each level has a finish line — reach it without falling off the track to win. 30+ hand-crafted levels + endless mode.

## Competitor Analysis (Top 3 Sourced From Research)

### Competitor 1: Going Balls (Supersonic Studios, 2021+)
- **Downloads:** 100M+
- **Core mechanic:** Tap to control ball speed/swipe to change lanes, hold to jump, smash breakable obstacles, collect gems
- **Levels:** 2000+ procedurally assisted levels with progressive difficulty
- **Style:** 3D-perspective vibrant obstacle course, low-poly cute aesthetic
- **Sound:** Bouncy ball roll, smash breakable, swoosh jumps
- **Visuals:** Bright, candy-colored, particle effects
- **Monetization:** Interstitial ads every 2-3 levels, rewarded ads for revive
- **Systems:** Level skip via watching ad, gem currency, daily reward, skin unlocks

### Competitor 2: Roll Race 3D (AlictUs, 2022+)
- **Downloads:** 50M+
- **Core mechanic:** Auto-forward ball, swipe left/right to dodge obstacles, collect coins
- **Levels:** 100+ level-based + endless mode
- **Style:** 3D low-poly track, varied biomes (lava, ice, neon)
- **Sound:** Roll loop, coin pickup, smash

### Competitor 3: Ball Run 2048 (MOONEE, 2023+)
- **Downloads:** 10M+
- **Core mechanic:** Merge balls by collecting same numbers, dodge larger obstacles
- **Levels:** 100+ merge + run levels
- **Style:** Minimalist 3D
- **Sound:** Pop merge, bouncy roll

## GZ Gap Analysis
- **Existing similar:** stack-ball (vertical tower smash), helix-jump (vertical descent), bottle-flip-3d (vertical flip)
- **GZ DOES NOT HAVE:** 3D perspective forward-rolling ball with lane-change mechanic
- **Closest competitor mechanic:** "Lava Rising" (just completed) uses vertical climbing; Roll Rush uses forward rolling
- **Market validation:** Going Balls alone = 100M+ downloads, all-time top-50 hyper-casual

## Systems to Implement (S-Grade Standard)

### Core Systems
1. **Lane control** — 3 lanes (left/center/right), swipe to change
2. **Jump mechanic** — hold/tap to jump over gaps and barriers
3. **Speed control** — tap top to sprint (consumes stamina)
4. **Obstacle types** — Static barriers, moving bars, low/flying obstacles, gaps in floor, breakable walls
5. **Collectibles** — Gems (currency), score points, magnet power-up, shield power-up
6. **Finish line** — Each level has a distance target + finish line gate

### Progression Systems
7. **30 levels** across 5 tiers (Trickster / Bouncer / Blaster / Surfer / Legend)
8. **3-star rating** per level (1 star = complete, 2 stars = under par time, 3 stars = collect all gems)
9. **Best time** per level (localStorage)
10. **Unlock system** — complete level N to unlock level N+1
11. **Endless mode** — unlocked after completing all 30 levels

### Player Systems
12. **Lives system** — 3 lives, lose 1 per fail, regen over time
13. **Continue / Revive** — 1 free continue per level via watching ad placeholder (we won't show ads)
14. **Skin shop** — Unlock 6 ball skins with gem currency (no real money)
15. **Daily reward** — login streak counter
16. **Achievements** — 10 achievements (complete 1 level, 5 levels, 10 levels, all 30, 3-star 5 levels, etc.)
17. **Leaderboard** — local top-10 best times

### Feedback Systems
18. **Particle FX** — trail on roll, smash debris, gem sparkle, finish confetti
19. **Camera shake** — on smash, on land
20. **Score popups** — floating +100, +500 text
21. **Combo system** — chain of smashes for multiplier
22. **Tutorials** — first-time mechanics (lane, jump, smash) with skip option

### Audio (Web Audio API procedural)
23. **BGM** — Upbeat chiptune-style endless runner loop
24. **SFX** — roll loop, jump, land, smash breakable, gem pickup, finish fanfare, fail, level start

## Difficulty Curve
- L1-6 (Trickster): 2 lanes, slow speed, 1 obstacle type
- L7-12 (Bouncer): 3 lanes, medium speed, 2 obstacle types, first gaps
- L13-18 (Blaster): 3 lanes, fast speed, 3 obstacle types, moving bars
- L19-24 (Surfer): 3 lanes, very fast, 4 obstacle types, low + flying combos
- L25-30 (Legend): 3 lanes, intense, all obstacle types + tight timing + double jumps needed

## Visual Style
- Dark gradient background (GameZipper standard) with neon accent
- 3D-perspective track using Canvas 2D pseudo-3D (vanishing point + scaling)
- Bright candy-colored obstacles against dark track
- Ball: gradient with neon glow trail
- 60fps Canvas animation
- Glass-morphism UI panels

## Technical Notes
- Single HTML file, ~60KB target
- Canvas 2D pseudo-3D (no WebGL needed) — track scales from far to near
- Object pooling for obstacles (recycle)
- Seeded random for level layouts (deterministic for QA validation)
- localStorage with version field "rollrush_v1"
- All level data in JS array (LEVELS const)
