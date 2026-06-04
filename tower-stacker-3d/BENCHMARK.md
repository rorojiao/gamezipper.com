# Tower Stacker 3D — Competitive Benchmark (2026-06-04)

## Top 3 Competitors

### 1. Tower Stack Color 3D (Azur Games, mobile-first)
- 3D isometric top-down tower
- Stack colored segments, perfectly aligned = pass
- Misalignment = top segment falls off, tower shrinks
- 3D depth perspective, color match mechanic
- 50+ levels, increasing speed
- Coins → unlock new tower skins (wood/stone/glass/neon)

### 2. Tower Craft / Skyscraper Builder (Casual Azur Games)
- Build the tallest skyscraper possible
- 3D perspective with parallax
- Crane swings back and forth, drop floors
- Watch out for wind gusts
- Pure stacking skill, no color matching
- Coins = floor skins + building shapes

### 3. Lollipop Stack Run (Y8 126K plays)
- 3D hyper-casual run-and-collect
- Lollipop person grows by collecting same-color lollipops
- Avoid spikes/obstacles
- Endless runner + stack
- Skin shop with cosmetics

## Synthesis — GZ Tower Stacker 3D Design

**Core concept:** 3D isometric tower stacker. Player taps/touches to drop each floor. Crane swings left-right; timing the drop builds a stable tower. Misalignment removes a floor. Collect 3 stars per level for perfect runs.

**Systems to implement:**
1. **30 levels** across 6 biomes (Workshop, Glass Atrium, Neon City, Sky Temple, Crystal Peak, Aurora)
2. **Crane swinging mechanic** — speed increases per level
3. **3-star rating** — perfect alignment (+crown bonus) = 3 stars, near-perfect = 2 stars, completed = 1 star
4. **6 tower skins** unlocked by stars (Wood, Stone, Crystal, Neon, Ice, Gold)
5. **Combo system** — chain of perfect drops multiplies score (x2, x3, x5, x10)
6. **Power-ups** — Slow Crane (5 perfect in a row), Perfect Aim (auto-align for next 2 drops), Extra Floor (recover from miss)
7. **High score per level** + cumulative global best
8. **Daily challenge** — random biome, leaderboard of best score today
9. **Achievements** — 12 achievements (10/30/50 perfect drops, 3-stars on biome, all skins unlocked, etc.)
10. **Tutorial** — 3 guided levels with on-screen tips
11. **Progress save** — localStorage v1 (stars, skins, achievements, level progress)
12. **BGM** — chill synthwave + 8 SFX (drop, perfect, miss, level up, star, click, fanfare, whoosh)
13. **Vibration** on mobile (navigator.vibrate) for haptics

**Art direction:**
- Isometric 3D rendering via Canvas 2.5D (axonometric projection)
- Gradient sky per biome (workshop=warm, neon=magenta/cyan, etc.)
- Particle effects: confetti on 3-star, dust on miss, sparkle on perfect
- Glass-morphism HUD, neon accents

**Technical:**
- Single index.html, self-contained
- Canvas 2D rendering with manual isometric projection
- 60fps, delta-time update loop
- Touch + mouse input
- Responsive (1280x720 desktop, 390x844 mobile portrait)
- All English UI

## Gap Validation
GameZipper currently has 2D stackers (stack-ball, sushi-stack, stacker) but NO 3D isometric tower stacker. This fills the gap.
