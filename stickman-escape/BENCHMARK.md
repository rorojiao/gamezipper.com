# Stickman Escape — Competitive Benchmark

## Game Overview
**Genre:** Precision Platformer / Action Puzzle  
**Core Mechanic:** Control a stickman through single-screen trap-filled levels with precise jumping, wall-sliding, and timing-based obstacle avoidance. Death = instant respawn.  
**Target Audience:** Casual mobile gamers, teens 13-25, fans of Vex/Happy Wheels/Geometry Dash

## Competitor Analysis

### 1. Vex 6 (Poki — Top 10 most played)
- **Downloads/Plays:** 50M+ plays on Poki alone, 4.5★ rating
- **Levels:** 50+ levels across 5 acts, plus daily challenges
- **Core Mechanics:**
  - Wall jumping/climbing (slide down walls, jump off)
  - Moving platforms (horizontal + vertical)
  - Spike traps (floor/ceiling/wall)
  - Swinging hammers
  - Bounce pads
  - Checkpoints (save progress within level)
  - Water swimming sections
- **Systems:**
  - Stars: 1-3 per level (based on deaths/time)
  - Trophy room (collectible achievements)
  - Daily challenge mode
  - Speedrun timer with ghost replay
  - Skin unlocks (hats, colors)
  - Difficulty: Easy → Hard → Hardcore (toggle)
- **Controls:** Arrow keys + Space/Up to jump (simple 3-button)
- **Art Style:** Minimal stick figure, dark background, neon accent colors, smooth animations
- **Monetization:** Banner ads, pre-roll ads
- **Session Length:** 30s-2min per level, highly addictive

### 2. Stickman Hook (Madbox — 100M+ downloads)
- **Downloads/Plays:** 100M+ mobile, viral on social media
- **Core Mechanic:** Physics-based swinging (NOT platform jumping — different genre)
- **Key Difference from Our Game:** Stickman Hook = swinging from point to point, NO traps/platform jumping
- **Systems:** Level-based, skin unlocks, physics ragdoll on death
- **Art Style:** Bright, colorful, 3D-ish perspective

### 3. Geometry Dash (RobTop — 100M+ downloads)
- **Downloads/Plays:** 100M+ across all platforms
- **Core Mechanic:** Auto-scroll, single-button tap to jump, rhythm-based obstacles
- **Key Difference:** Auto-scroll (no free movement), rhythm-synced, one-button
- **Systems:** Level editor, user-generated levels, practice mode, demons difficulty
- **Art Style:** Geometric shapes, neon, pulsing backgrounds synced to music

### 4. Level Devil (Poki — 20M+ plays)
- **Core Mechanic:** Run to the exit door while the level actively fights you (floors collapse, walls move, traps appear)
- **Key Difference:** Platformer but with "evil level" twist
- **GZ Status:** Already deployed as `level-devil`

### 5. Run 3 (Poki — Top 20)
- **Core Mechanic:** Infinite runner in a 3D tunnel, rotate gravity
- **Key Difference:** Endless runner, not trap-based platformer

## Competitive Positioning

| Feature | Vex 6 | Stickman Hook | Geometry Dash | **Stickman Escape (Ours)** |
|---------|-------|---------------|---------------|---------------------------|
| Free movement | ✅ Arrow keys | ❌ Swing only | ❌ Auto-scroll | ✅ Arrow keys |
| Wall jump | ✅ | ❌ | ❌ | ✅ |
| Spike traps | ✅ | ❌ | ❌ | ✅ |
| Moving platforms | ✅ | ❌ | ✅ | ✅ |
| Swing mechanics | ✅ | ✅ | ❌ | ✅ (bonus) |
| Checkpoints | ✅ | ❌ | ❌ | ✅ |
| Star rating | ✅ 3 stars | ❌ | ❌ | ✅ 3 stars |
| Daily challenge | ✅ | ❌ | ✅ | ✅ |
| Skin system | ✅ | ✅ | ✅ | ✅ |
| Difficulty modes | ✅ | ❌ | ✅ | ✅ |
| Physics engine | Light | Heavy | None | Light (movement + bounce) |
| Controls | 3 buttons | 1 button | 1 button | 3 buttons |

## Our Game Design Spec

### Core Mechanics (Must-Have)
1. **Movement**: Arrow keys (←→) or swipe/drag on mobile
2. **Jump**: Space/Up/W or tap on mobile
3. **Wall Slide**: Slide down walls slowly, jump off (wall jump)
4. **Instant Death**: Touch spikes/traps = respawn at checkpoint/start
5. **Checkpoints**: Flag poles mid-level, save progress

### Trap Types (Progressive Introduction)
- Chapter 1 (Easy): Floor spikes, basic gaps, simple platforms
- Chapter 2 (Medium): Moving platforms (H+V), ceiling spikes, bounce pads
- Chapter 3 (Hard): Swinging hammers, crumbling platforms, wall spikes
- Chapter 4 (Expert): Saw blades, conveyor belts, timed doors, ice physics
- Chapter 5 (Nightmare): All combined, faster timing, multi-trap combos

### Scoring System
- **3 Stars per level**: Based on completion with ≤ N deaths
  - ★★★ = 0-2 deaths
  - ★★☆ = 3-5 deaths  
  - ★☆☆ = 6+ deaths
- **Total Stars**: Display in level select, unlock chapters
- **Speedrun Timer**: Per-level, save best time in localStorage

### Progression
- **30 levels** across 5 chapters (6 per chapter)
- **Chapter unlock**: Need 12/18 stars from previous chapter to unlock next
- **Daily Challenge**: 1 procedurally-generated level per day (seeded by date)

### Power-ups (Rare)
- Shield (1-time spike protection)
- Double Jump
- Slow Motion (brief time slow)
- Found in hidden/optional paths

### Meta-Systems
- **Skins**: 8 unlockable stickman skins (earned by total stars)
- **Tutorial**: Chapter 1, Level 1 is guided tutorial
- **Sound**: Web Audio procedural SFX (jump, death, checkpoint, star)
- **BGM**: Web Audio procedural electronic/chiptune loop

### Technical Specs
- **Canvas-based** rendering, 60fps target
- **Frame-rate independent** physics (delta time)
- **Responsive**: Desktop (1280x720) + Mobile (390x844)
- **Touch**: Virtual D-pad + jump button overlay on mobile
- **File size target**: 40-60KB

### Controls Mapping
| Input | Desktop | Mobile |
|-------|---------|--------|
| Move Left | ← / A | D-pad left |
| Move Right | → / D | D-pad right |
| Jump | Space / W / ↑ | Jump button |
| Wall Jump (auto) | Touch wall + Jump | Touch wall + Jump button |

## Art Direction
- Dark background (gamezipper style: #0a0a1a gradient)
- Neon stickman (white body, colored accessories)
- Traps: Red/orange glow for danger
- Platforms: Subtle gray with edge highlights
- Checkpoints: Green glow flag poles
- Stars: Yellow, animated sparkle
- Particles: Death burst, star collect, checkpoint activate
