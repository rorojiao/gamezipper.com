# Lava Rising — Competitive Benchmark

## Game Concept
Vertical climbing game where player jumps between platforms while lava/hazard rises from below. Survive as long as possible, collect coins/gems, unlock power-ups.

## Competitors

### 1. Doodle Jump (Classic)
- **Downloads:** 500M+ on mobile
- **Core Loop:** Auto-bounce upward, tilt to steer, collect power-ups
- **Systems:** High score, power-ups (spring, jetpack, shield), enemies, breakable platforms
- **Difficulty:** Infinite, gets harder with height
- **Art:** Hand-drawn notebook style

### 2. Ice Climber (Nintendo)
- **Downloads:** NES classic, part of Smash Bros roster
- **Core Loop:** Climb platforms vertically, break ice blocks, avoid enemies
- **Systems:** 32 levels, bonus stages, enemies, scrolling screen
- **Difficulty:** Level-based, increasing enemy count

### 3. Mega Jump
- **Downloads:** 100M+
- **Core Loop:** Tilt to collect coins, bounce off platforms, avoid obstacles
- **Systems:** In-game currency, character unlocks, missions, power-ups
- **Difficulty:** Progressive with height

## GZ Gap Analysis
- **No vertical climbing/survival game** in GameZipper's 240+ library
- Neon Run (runner) and Slope (rolling) are horizontal/angled — this is vertical
- Avoidance + platforming combo is underserved

## Target Feature Set (S-Grade)

### Core Mechanics
- Player auto-jumps when landing on platforms (like Doodle Jump)
- Tilt/swipe left-right on mobile, arrow keys on desktop
- Lava/acid rises from below at increasing speed
- Procedurally generated platforms (never the same run twice)
- Different platform types: normal, moving, breakable, spring (super jump), ice (slippery)

### Level System
- **Mode 1: Endless** — Infinite climb, high score, lava speed increases over time
- **Mode 2: Challenges** — 30 pre-designed levels with target heights/goals
- Challenge tiers: Easy (slow lava, many platforms) → Hard (fast lava, moving platforms, fewer platforms, enemies)

### Scoring
- Height-based scoring (1 point per unit climbed)
- Combo bonus for consecutive platform landings without falling
- Coin/gem collection for bonus points
- 3-star rating per challenge level based on height reached
- Best score saved to localStorage

### Power-ups
- Shield (1-hit protection, 10s)
- Jetpack (auto-ascend, 5s)
- Magnet (auto-collect nearby coins, 8s)
- Slow Lava (reduce lava speed 50%, 8s)
- Double Jump (extra jump mid-air)

### Enemies/Hazards
- Flying bats (move horizontally)
- Spiky platforms (damage on contact)
- Falling rocks
- Fireballs (lava eruption from below)

### UI/UX
- Title screen with animated lava background
- Character select (6 unlockable characters)
- Level select with 3-star display
- In-game HUD: score, height, power-up timer, lava warning
- Game over screen: score, best score, height, restart button
- Settings: sound/music toggle
- Tutorial: overlay on first play

### Visual Style
- Dark volcanic theme with glowing lava
- Neon orange/red accent colors
- Particle effects: lava bubbles, sparks, fire embers
- Character glow effect
- Platform variety with distinct colors per type

### Audio
- Web Audio procedural BGM: intense, escalating drums + synth
- SFX: jump, land, collect coin, power-up, hit, death, lava splash

### Technical
- Canvas-based rendering
- 60fps with delta time
- Touch + keyboard support
- Responsive: 390x844 to 1920x1080
- Single file HTML, no external deps
