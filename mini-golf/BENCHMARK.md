# Mini Golf - Competitive Benchmark Analysis

## Genre
Top-down 2D mini-golf / mini-putt with realistic ball physics, themed courses, and progressive difficulty. Players aim and putt a golf ball across obstacle-filled courses into a hole in the fewest strokes possible.

## Top Competitors (May-June 2026)

### 1. **Mini Golf King** (RisingWings / PnixGames) — 10M+ downloads
- Top-view 2D mini-golf with smooth 2D physics
- Real-time 1v1 multiplayer (clan wars, tournaments)
- 200+ courses across 6+ themes (Classic, Pirate, Space, Western, Candy, Ocean)
- Power-up cards (Magnet, Big Ball, Accuracy, Lucky)
- 1:1 real-time matchmaking
- Equipment upgrades (ball skins, trails)
- Star rating (1-3) per hole based on strokes vs par
- Daily/weekly events
- Currency: Gems + Coins
- **Strength**: Live multiplayer + huge course variety
- **Weakness**: Heavy pay-to-progress

### 2. **Golf Battle** (OneButton Games)
- PvP duel-style mini-golf
- 1:1 real-time matches, ranked leaderboards
- 40+ courses, 4 themes (Pirate, Spooky, Western, Gold Rush)
- Aim & shoot with one-tap power control
- Hole-in-one bonuses
- **Strength**: Snappy competitive gameplay
- **Weakness**: Requires internet (no single-player depth)

### 3. **Golf Orbit** (Mountain Game / TapNation)
- Casual physics-based putting game
- "Sling" mechanic — pull back ball, release to launch
- 100+ hand-crafted levels
- No aim line; trial-and-error / trajectory planning
- Different terrain (ice, sand, water)
- **Strength**: Very accessible, satisfying physics
- **Weakness**: Pure aim guesswork (no aim guide) frustrates players

### 4. **Mini Golf 2D / Browser Mini Golf** (Playgama, Poki)
- Free browser 2D mini-golf
- Aim line with power meter (drag from ball, release to shoot)
- 30-50 levels, varying obstacles (walls, ramps, bumpers, moving blocks)
- 2D top-down perspective, Canvas rendering
- **Strength**: Free, no-install, instantly playable
- **Weakness**: Limited features, no progression

### 5. **Putt Master / Idle Mini Golf** (CrazyGames, iOS)
- Idle-style mini golf with upgrade progression
- Earn coins, buy better clubs
- Simple levels
- **Strength**: Progression loop
- **Weakness**: Lacks challenge

---

## Must-Have Systems (Competitive Standard)

| System | Description | Required? |
|--------|-------------|-----------|
| **Aim & shoot mechanic** | Drag from ball → aim line, release to shoot with proportional power | ✅ Critical |
| **Power meter / visual feedback** | Aim line shows direction + power (color/width changes) | ✅ Critical |
| **Realistic ball physics** | Ball rolls with friction, bounces off walls with damping | ✅ Critical |
| **Stroke counter** | Count strokes per hole, show total | ✅ Critical |
| **Par system** | Each hole has a par (2-5) — show vs player strokes | ✅ Critical |
| **Hole completion detection** | Detect when ball enters hole, animate drop | ✅ Critical |
| **Hole-in-one detection** | Special celebration animation for 1-stroke completion | ✅ Critical |
| **Obstacles** | Walls, ramps, bumpers, moving blocks, water hazards, sand traps | ✅ Critical |
| **Course progression** | 30+ holes, unlock new courses by completing previous | ✅ Critical |
| **Star rating (1-3)** | Star per hole: 1=cleared, 2=under par, 3=hole-in-one | ✅ Critical |
| **Total score tracking** | Total strokes vs total par for the course | ✅ Critical |
| **Restart hole** | Button to retry current hole | ✅ Critical |
| **Multiple courses / themes** | At least 3-5 themed course packs | ✅ Critical |
| **Sound effects** | Putt sound, wall bounce, hole drop, applause | ✅ Critical |
| **Background music** | Ambient sports BGM | ✅ Critical |
| **Progress save** | localStorage with versioned schema | ✅ Critical |
| **Best score per hole** | Track best strokes per hole | ✅ Critical |
| **Total stars across game** | Aggregate star count for progression feel | ✅ Critical |
| **Mute toggle** | SFX + BGM separately | ✅ Critical |
| **Tutorial** | First-time interactive guide | ✅ Critical |
| **Trajectory preview** | Dotted aim line shows power | ✅ Standard |
| **Undo / last shot preview** | Replay or undo stroke | Nice to have |
| **Skin/ball customization** | Unlock different ball designs | Nice to have |
| **Daily challenge** | One special course per day with leaderboard | Nice to have |
| **Multiplayer** | Real-time 1v1 (skipped — not feasible single-file) | Out of scope |

---

## Visual Style Reference
- **Top-down** orthographic 2D view of course
- Course layout: bright green fairway tiles, dark green rough, beige sand traps, blue water hazards
- Walls: wood/stone texture, neon outline glow
- Ball: classic white sphere with shadow, 3D-feeling shading
- Hole: dark circle with red flag pole + waving flag
- UI: dark gradient sidebars, neon accent colors (green/cyan/magenta), rounded buttons with glass-morphism
- Theme packs: Classic Garden / Pirate Cove / Space Station / Ice Cavern / Candy Land
- Particle effects: splash for water, sand puff for sand trap, star burst for hole drop, confetti for hole-in-one

## Audio Reference
- **Putt sound**: short bass thump, frequency-modulated by power (light tap vs strong swing)
- **Wall bounce**: short "tick" sound
- **Hole drop**: descending "plop" + subtle chime
- **Hole-in-one**: triumphant musical flourish + cheering
- **BGM**: light jazzy / lounge background with subtle swing beat
- **UI clicks**: soft click + hover beep
- **Sand trap**: subtle puffing sound
- **Water hazard**: splash

## Level Design Principles
- **Easy (Hole 1-10)**: Open fairways, simple straight putts, 1-2 walls, par 2-3
- **Medium (Hole 11-20)**: Add ramps, sand traps, water hazards, par 3-4
- **Hard (Hole 21-30)**: Multiple walls, moving obstacles, narrow corridors, bank shots required, par 4-5
- **Expert (Hole 31-40)**: Multi-step obstacles, ice slides, wind/curve, par 4-5
- **Each hole**: Unique layout with specific par + theme
- **Course structure**: 5 courses × 10 holes = 50 holes total

## Difficulty Curve
- **Hole 1-10**: 95%+ completion rate (frustration-free intro)
- **Hole 11-20**: 75-85% completion rate (skill building)
- **Hole 21-30**: 55-70% completion rate (challenging)
- **Hole 31-40**: 30-50% completion rate (expert / shareable)
- **Hole 41-50**: 15-30% completion rate (master tier)

## Core Numeric Formulas
- **Strokes scored**: Each successful putt = +1 stroke
- **Par calculation**: distance_to_hole / 200 ≈ par (min 2, max 6)
- **Star rating**:
  - 1 star = completed
  - 2 stars = strokes <= par - 1
  - 3 stars = hole-in-one (1 stroke)
- **Bounce damping**: velocity *= 0.7 on wall hit
- **Friction**: velocity *= 0.985 per frame (rolling friction)
- **Water hazard**: ball returns to last land position, +1 stroke
- **Sand trap**: friction reduced to 0.95, ball slows quickly

## Architecture
- Single file `mini-golf/index.html` (self-contained, no external deps except CDN fonts)
- Canvas 2D rendering
- Web Audio API for SFX + BGM
- All state in localStorage (`gz-minigolf-save-v1`)
- Course data: hard-coded in JS as 50 hole layouts
- Theme system: 5 themes (Classic, Pirate, Space, Ice, Candy)
- Mobile: touch + drag from ball

## S-Grade Quality Checklist
- [x] 50 holes across 5 themed courses
- [x] 1-3 star rating per hole
- [x] Aim & shoot with trajectory preview
- [x] Realistic 2D physics (friction, bounce, walls)
- [x] Obstacle variety (walls, ramps, water, sand, bumpers, ice, moving blocks)
- [x] 5 themed courses
- [x] BGM + SFX (Web Audio API)
- [x] Save/load progress
- [x] Tutorial
- [x] Responsive (desktop + mobile)
- [x] Analytics + SEO
- [x] Daily challenge (1 deterministic hole/day)
- [x] Achievements (5+)
- [x] Statistics (total strokes, holes played, hole-in-ones, stars)
