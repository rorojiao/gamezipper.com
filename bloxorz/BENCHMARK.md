# Bloxorz — Competitive Benchmarking Report

> **Date:** May 25, 2026  
> **Purpose:** Phase 2 competitive analysis for the GameZipper Bloxorz implementation  
> **Scope:** Block-roll puzzle games — direct competitors and spiritual successors

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Competitor Profiles](#competitor-profiles)
   - [1. Bloxorz (Original — Damien Clarke / DX Interactive)](#1-bloxorz-original--damien-clarke--dx-interactive)
   - [2. Bloxorz: Brain Game (Infocom Studios — Mobile App)](#2-bloxorz-brain-game-infocom-studios--mobile-app)
   - [3. Bloxpath (agoo — Steam / Itch.io)](#3-bloxpath-agoo--steam--itchio)
   - [4. Boulders: Puzzle (Farewell Games — Itch.io / Android)](#4-boulders-puzzle-farewell-games--itchio--android)
   - [5. Rolling Cat 3D (Mustafa Mert Aladağ — Itch.io)](#5-rolling-cat-3d-mustafa-mert-aladağ--itchio)
   - [6. Sokoblox (SED4906 — Itch.io / Pico-8)](#6-sokoblox-sed4906--itchio--pico-8)
   - [7. Deadlime/Miniclip Bloxorz Remake (Unity)](#7-deadlimeminiclip-bloxorz-remake-unity)
3. [Mechanics Comparison Matrix](#mechanics-comparison-matrix)
4. [Feature Comparison Matrix](#feature-comparison-matrix)
5. [Art Style & Audio Comparison](#art-style--audio-comparison)
6. [Scoring & Progression Systems](#scoring--progression-systems)
7. [Key Takeaways & Recommendations](#key-takeaways--recommendations)

---

## Executive Summary

The block-roll puzzle genre is anchored by the original **Bloxorz** (2007), which remains the gold standard with 33 levels and a unique combination of rolling, standing, splitting, switches, bridges, and teleporters. The competitive landscape includes:

- **Direct clones** rehosting the original on CoolMath, CrazyGames, etc. (33 levels, no new content)
- **Mobile adaptations** expanding to 300+ levels with stars, hints, and themes (Infocom Studios)
- **Spiritual successors** innovating on mechanics: Bloxpath (200 puzzles, 20+ mechanics, Steam), Boulders (connectable pieces + level editor)
- **Prototype/indie experiments**: Rolling Cat 3D (6 levels), Sokoblox (Sokoban hybrid, 15 levels)

**Critical insight:** No competitor has built a "definitive modern Bloxorz" that combines the original's full tile mechanics with modern UI (undo, hints, stars, level editor, mobile touch). This is a clear market gap.

---

## Competitor Profiles

### 1. Bloxorz (Original — Damien Clarke / DX Interactive)

| Attribute | Detail |
|---|---|
| **Developer** | Damien Clarke (DX Interactive) |
| **Release** | August 22, 2007 (Flash) |
| **Platform** | Browser (Flash → HTML5/Unity), CoolMath Games, CrazyGames, Miniclip, Math Playground, Friv, many mirrors |
| **Levels** | **33 levels** with 6-digit passcode for each |
| **Rating** | 4.5/5 on CoolMath (505,489 votes) |
| **Players** | 100,000,000+ lifetime (per Deadlime/Miniclip) |
| **Price** | Free (ad-supported on most portals) |

#### Block Mechanics
- **1×1×2 rectangular block** that rolls on its long face, short face, or stands vertically (1×1)
- **Three orientations**: Lying flat (2 tiles), standing on end (1 tile), split into two 1×1 cubes
- **Split mechanic**: Parentheses switch `()` teleports and splits block into two 1×1 cubes
- **Spacebar** toggles between split cubes; cubes rejoin when placed adjacent
- Split cubes can activate soft switches but **cannot** activate heavy switches or enter the exit hole

#### Special Tiles
| Tile Type | Behavior |
|---|---|
| **Soft Switch (Octagon ○)** | Activated by any block orientation (lying, standing, split) |
| **Heavy Switch (X-shaped ✕)** | Only activated when block is **standing vertically** |
| **Split Switch (Parentheses `()`)** | Teleports block to new locations and **splits into two 1×1 cubes** |
| **Bridge tiles** | Toggle open/close via switches; some are permanent, some toggle each activation |
| **Green/Red indicator squares** | Flash to show which bridges are being operated |
| **Orange (Fragile) tiles** | Break if block stands vertically on them — instant fall/restart |
| **Exit hole (square)** | Must land block vertically to complete the level |

#### Scoring System
- **Move counter** displayed per level (number of arrow-key presses)
- **No par scores, no stars, no explicit grading** in the original
- Move count resets on fall/death
- **Speedrunning** community active on speedrun.com — official any% record: ~10 minutes for all 33 levels
- **Passcode system** — each level has a 6-digit code for level select/skip

#### UI Features
- Arrow keys (or WASD) for movement
- Spacebar to toggle split cubes
- Level passcode display (top-right corner)
- "Load Stage" from main menu via passcode entry
- **No undo** — must restart level on mistake
- **No hints** — no built-in solution guide
- Simple main menu: Play, Load Stage
- Level completion → next level automatically

#### Art Style
- **Isometric 3D** perspective on a 2D Flash canvas
- **Dark blue/purple** color palette for tiles and platforms
- Block is a **gray/blue metallic** rectangle with visible edges
- Minimalist, clean grid aesthetic
- Floating platform over a dark void background
- No character, no decoration — purely geometric

#### Music & Audio
- **Ambient electronic** title screen music by **Damian Clarke**
- Sound effects for: rolling, falling, switch activation, bridge toggle, level complete
- Minimal audio design — functional, not atmospheric
- Audio is subtle and non-intrusive

#### Speedrunning Mechanics (Advanced)
- Game runs at **36 FPS** (HTML5 Chrome)
- Each move animation is **8 frames** (~222ms), except Wide-Down which is **9 frames**
- **Input buffering** allows overlapping directional inputs
- **Fast toggling** — swap split cubes mid-animation for simultaneous movement
- **Chained fast toggling** — move both cubes at near-full speed

---

### 2. Bloxorz: Brain Game (Infocom Studios — Mobile App)

| Attribute | Detail |
|---|---|
| **Developer** | Infocom Studios |
| **Platform** | Android (Google Play), iOS |
| **Levels** | **300 levels** (with planned updates) |
| **Price** | Free with in-app purchases |
| **Rating** | Popular mobile adaptation |

#### Block Mechanics
- Same core mechanics as original Bloxorz
- **Touch/swipe controls** — scroll anywhere on screen to move block
- Rectangular block rolling, standing, splitting

#### Special Tiles
- Same tile types as original: Soft switches, Hard switches, Split/teleporter switches
- Orange fragile tiles
- Bridges with switch connections
- Illuminated goal grid (instead of square hole)

#### Scoring System
- **3-star rating** per level based on minimum number of moves
- Move counter displayed
- Stars incentivize replay for optimization
- This is a **significant addition** over the original

#### UI Features
- **Hints system**: 10 free hints per day; shows solution path and minimum moves
- **Solves system**: Auto-solves the level (earns only 1 star)
- **Level select** screen with progress tracking
- **Tutorial** with switch explanations
- **In-app purchases**: Themes, block skins, additional hints/solves
- **Welcome bonus**: 3 free themes + 3 block colors + 3 free solves

#### Art Style
- **Colorful, attractive graphical themes** (3 free + premium)
- Block comes in **3 color variants** free + premium options
- Modern mobile-friendly UI
- Brighter, more polished than original

#### Music & Audio
- Mobile-optimized sound effects
- Custom music per theme

---

### 3. Bloxpath (agoo — Steam / Itch.io)

| Attribute | Detail |
|---|---|
| **Developer** | agoo (solo indie) |
| **Platform** | Steam (PC), Itch.io (WebGL demo), Y8 |
| **Release** | June 3, 2025 (Steam) |
| **Levels** | **~200 puzzles** (full), ~30 (demo), organized into regions |
| **Price** | Paid (Steam), Free demo |
| **Rating** | 98% positive (50 reviews on Steam) — "Very Positive" |

#### Block Mechanics
- **Pure rolling mechanics** — no switches, no dead ends, no splitting
- **~20 unique gameplay mechanics** including multi-block interactions
- **10 core mechanics** progressing from simple rolling to complex
- Focus on spatial reasoning and logical depth
- Difficulty described as "slightly higher than The Witness"

#### Special Tiles
- **No switches or bridges** (deliberate design choice)
- Various tile mechanics for puzzle variety (exact types not fully documented)
- Regions with distinct puzzle styles

#### Scoring System
- No explicit scoring mentioned — focus is on puzzle completion
- Tree-like unlocking system (skip to other regions when stuck)

#### UI Features
- **Keyboard, mouse, and gamepad** support
- **Input buffering** and configurable repeat input delays
- **Zero loading screens** — seamless scene transitions
- **Unlocked framerate** with VSync option
- **Tree-like level unlock** — explore different regions when stuck
- Smooth procedural animations

#### Art Style
- **Minimalist** aesthetic — clean, modern
- Natural, smooth state transition animations
- Meticulously polished level transition effects
- "Satisfies the aesthetic needs of OCD players"
- Procedural animations for block movement

#### Music & Audio
- Satisfying, smooth procedural audio/animations
- Minimalist sound design matching visual style

---

### 4. Boulders: Puzzle (Farewell Games — Itch.io / Android)

| Attribute | Detail |
|---|---|
| **Developer** | Farewell Games |
| **Platform** | Windows (Itch.io), Android (APK) |
| **Release** | July 6, 2021 (1.0) |
| **Levels** | **Multiple levels** + community levels + custom levels |
| **Price** | Free |

#### Block Mechanics
- **Cuboid that can connect/disconnect pieces** — unique twist on Bloxorz
- Roll cuboid to connect to the **goal cube**
- **Player cubes** can be picked up to make cuboid longer or dropped to make it shorter
- Length manipulation is core to solving puzzles

#### Special Tiles
| Tile Type | Behavior |
|---|---|
| **Ground Cube** | Movement surface; can disconnect cuboid to make it shorter |
| **Destructor Cube** | Destroys player cube on contact, breaking cuboid at that point |
| **Duplicator Cube** | Transforms player cube into another duplicator, breaking cuboid |
| **Goal Cube** | Connect cuboid to this to beat the level |

#### Scoring System
- **Moves**: Count of cuboid rotations
- **Steps**: Individual cube movements (cuboid of 3 cubes × 1 move = 3 steps)
- **Time**: Elapsed time to completion
- All three metrics are **optional** — toggle in settings
- Compare scores with friends

#### UI Features
- **Level editor** included (free) — create and share levels
- **Community levels** — play user-created content
- Settings to enable/disable competitive metrics
- Simple, functional UI

#### Art Style
- **Low-poly 3D** aesthetic
- Clean, colorful block designs
- Grid-based levels with visible cube types

#### Music & Audio
- Basic sound effects for rolling, connecting, breaking

---

### 5. Rolling Cat 3D (Mustafa Mert Aladağ — Itch.io)

| Attribute | Detail |
|---|---|
| **Developer** | Mustafa Mert Aladağ (Grizla Studios) |
| **Platform** | Itch.io (WebGL), Unity |
| **Levels** | **6 levels** (prototype) |
| **Price** | Free |

#### Block Mechanics
- Bloxorz-like rolling but with a **cat character** instead of a block
- Cat must be in **vertical state** to interact with objects or finish the level
- Mouse drag to choose roll direction (not arrow keys)

#### Special Tiles
- Basic platforms only (prototype stage)
- No switches, bridges, or teleporters

#### Scoring System
- None (prototype)

#### UI Features
- Mouse-drag controls
- Minimal prototype UI

#### Art Style
- **3D Unity** with cat character model
- Cute, casual aesthetic targeting casual + strategy market

#### Music & Audio
- Basic Unity audio

---

### 6. Sokoblox (SED4906 — Itch.io / Pico-8)

| Attribute | Detail |
|---|---|
| **Developer** | SED4906 |
| **Platform** | Itch.io, Pico-8, Lexaloffle |
| **Levels** | **15 levels** |
| **Price** | Free |

#### Block Mechanics
- **Hybrid of Sokoban + Bloxorz**: roll block AND push boxes
- Combines pushing mechanics with rolling mechanics
- Made in Godot engine

#### Special Tiles
- Sokoban-style push targets + Bloxorz rolling tiles

#### Scoring System
- Not documented (simple puzzle game)

#### Art Style
- Retro pixel art (Pico-8 aesthetic)
- Minimalist

---

### 7. Deadlime/Miniclip Bloxorz Remake (Unity)

| Attribute | Detail |
|---|---|
| **Developer** | Deadlime Games (with Miniclip) |
| **Platform** | Browser (Miniclip), Unity Web Player |
| **Release** | December 10, 2017 |
| **Levels** | **50+ levels** across 2 worlds |
| **Price** | Free |

#### Block Mechanics
- Same core Bloxorz rolling, standing, splitting mechanics
- Enhanced with **new tiles and mechanics**

#### Special Tiles
- Original Bloxorz tiles plus:
  - Teleportation
  - Splitting pieces
  - Switches and bridges
  - **Tiles which respond to different pressures**
- **2 worlds**: Original levels + newly created winter-themed levels
- Each world has **different themes, blocks, and tiles**

#### Scoring System
- Not explicitly documented

#### UI Features
- World select (2 worlds)
- Level select within each world
- Theme variation between worlds

#### Art Style
- **3D Unity** rendering (upgraded from Flash)
- Winter theme with snow/ice visual elements
- Different block and tile designs per world

---

## Mechanics Comparison Matrix

| Mechanic | Bloxorz Original | Bloxorz Brain Game | Bloxpath | Boulders | Rolling Cat | Deadlime Remake |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Rolling (lying flat)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Standing vertically** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Split into 2 cubes** | ✅ | ✅ | ❌ | ✅ (connect/disconnect) | ❌ | ✅ |
| **Soft switch (any orientation)** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Heavy switch (standing only)** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Split/Teleporter switch** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Bridges (toggle/permanent)** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Orange fragile tiles** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Teleportation** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Pressure-sensitive tiles** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Connect/disconnect cuboid** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Destructor/Duplicator cubes** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Multi-block interactions** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **~20 unique mechanics** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## Feature Comparison Matrix

| Feature | Bloxorz Original | Bloxorz Brain Game | Bloxpath | Boulders | Rolling Cat | Deadlime Remake |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Level Count** | 33 | 300 | ~200 | Multiple | 6 | 50+ |
| **Undo** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Hints** | ❌ | ✅ (10/day) | ❌ | ❌ | ❌ | ❌ |
| **Auto-solve** | ❌ | ✅ (limited) | ❌ | ❌ | ❌ | ❌ |
| **Level Select** | ✅ (passcodes) | ✅ | ✅ (tree) | ✅ | ❌ | ✅ (worlds) |
| **Level Editor** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Community Levels** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Star Rating** | ❌ | ✅ (3 stars) | ❌ | ❌ | ❌ | ❌ |
| **Move Counter** | ✅ | ✅ | ❌ | ✅ (optional) | ❌ | ❌ |
| **Time Tracking** | ❌ | ❌ | ❌ | ✅ (optional) | ❌ | ❌ |
| **Passcode/Level Codes** | ✅ (6-digit) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Save Progress** | ❌ (passcodes) | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Mobile Touch** | ❌ (PWA only) | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Gamepad Support** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Themed Worlds** | ❌ | ✅ (themes) | ✅ (regions) | ❌ | ❌ | ✅ (2 worlds) |
| **Block Skins/Colors** | ❌ | ✅ (3+ premium) | ❌ | ❌ | ✅ (cat skin) | ❌ |
| **Tutorial** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **In-app Purchases** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Art Style & Audio Comparison

| Game | Visual Style | Color Palette | Perspective | Music Style | SFX |
|---|---|---|---|---|---|
| **Bloxorz Original** | Isometric 3D on 2D canvas | Dark blue/purple, gray metallic block | Isometric | Ambient electronic (Damian Clarke) | Rolling, falling, switch clicks, bridge toggle, level complete |
| **Bloxorz Brain Game** | Modern mobile 3D | Colorful, bright, themeable | Isometric/3D | Theme-based music | Mobile-optimized SFX |
| **Bloxpath** | Ultra-minimalist 3D | Clean, muted tones | Isometric/3D | Minimalist ambient | Smooth procedural audio |
| **Boulders** | Low-poly 3D | Colorful blocks | 3D isometric | Basic | Rolling, connecting, breaking |
| **Rolling Cat** | Unity 3D, cute character | Warm, playful | 3D | Casual | Cat-related SFX |
| **Sokoblox** | Retro pixel art | Pico-8 palette | Top-down/iso | Chiptune | Retro SFX |
| **Deadlime Remake** | Unity 3D | Themed (original + winter) | Isometric/3D | Enhanced original | Upgraded original SFX |

---

## Scoring & Progression Systems

### Original Bloxorz
- **No scoring** beyond move count per level
- **Passcode progression** — no persistent save; players write down codes
- Speedrunning community uses real-time + move count

### Bloxorz: Brain Game (Mobile)
- **3-star rating** per level (minimum moves)
- **Daily hints** (10/day) + purchasable hints
- **Solves** (auto-complete, 1 star only) — 3 free + purchasable
- **300 levels** with gradual difficulty curve
- **In-app purchases** for themes, skins, hints, solves

### Bloxpath
- **Tree-like unlock structure** — multiple paths, skip stuck areas
- **~200 puzzles** across themed regions
- No explicit scoring — completion-based progression
- Seamless transitions between puzzles

### Boulders
- **Optional metrics**: Moves, Steps (per-cube), Time
- **Level editor** for unlimited content
- **Community levels** for replayability
- Social comparison with friends

---

## Key Takeaways & Recommendations

### 1. Market Gap: Modern Definitive Bloxorz
No competitor combines the original's **full tile mechanics** (soft/heavy/split switches, bridges, fragile tiles, teleporters, splitting) with **modern features** (undo, hints, star ratings, mobile touch, level editor). This is the #1 opportunity.

### 2. Must-Have Features (Based on Competitor Analysis)
| Priority | Feature | Justification |
|---|---|---|
| **P0** | All original tile mechanics | Core identity — no competitor has all of them + modern UI |
| **P0** | Undo button | Every player wants this; not one competitor offers it |
| **P0** | Mobile touch controls | Only Infocom's app does this well |
| **P0** | Level select with progress save | Original's passcode system is archaic |
| **P1** | Star rating (3-star per level) | Infocom proved this works for engagement |
| **P1** | Move counter + par score | Baseline expectation for puzzle games |
| **P1** | Hints system | Infocom's 10 hints/day model works |
| **P2** | Level editor | Only Boulders offers this — major differentiator |
| **P2** | Community levels | Extends playtime without dev content cost |
| **P2** | Themed worlds/skins | Deadlime + Infocom proved themes work |
| **P3** | Gamepad support | Bloxpath does this; nice-to-have |
| **P3** | Speedrun mode/timer | Active speedrun community on speedrun.com |

### 3. Level Count Benchmark
- Original: **33 levels** — iconic but short
- Mobile app: **300 levels** — shows demand for more content
- Bloxpath: **~200 puzzles** — premium tier
- **Recommendation**: Launch with **33 classic levels** + plan expansion to 100+

### 4. Difficulty Curve Insights
- Original Bloxorz introduces mechanics gradually: basic rolling → switches → bridges → heavy switches → orange tiles → split/teleporter
- Bloxpath notes: "Early puzzles help familiarize with mechanics, later ones challenge inspiration and insight"
- **Recommendation**: Follow original's tutorial-by-doing approach, with first 5 levels teaching core mechanics

### 5. Art Style Recommendation
- Original's isometric 3D minimalist style is **timeless** and still works
- Avoid Bloxpath's extreme minimalism (too niche)
- Avoid Infocom's generic mobile style (forgettable)
- **Sweet spot**: Clean isometric 3D with modern lighting/shadows, themed color palettes, satisfying animations (Bloxpath-level polish on original-style design)

### 6. Audio Recommendation
- Original's ambient electronic soundtrack by Damian Clarke is iconic
- **Recommendation**: Ambient lo-fi/electronic soundtrack with satisfying SFX for each interaction (roll, switch click, bridge extend, tile crumble, level complete fanfare)
- Sound design should reinforce spatial awareness (directional audio cues)

### 7. Competitive Positioning
| Our Game vs | Key Differentiator |
|---|---|
| vs Original Bloxorz | Modern UI, undo, hints, stars, mobile, save progress |
| vs Bloxorz Brain Game | Better web experience, no IAP walls, original tile mechanics preserved |
| vs Bloxpath | Full Bloxorz mechanics (switches, splitting), not just pure rolling |
| vs Boulders | More polished, all original tile types, broader appeal |
| vs Flash mirrors | Modern performance, touch support, persistent progress |

---

## Sources

- CoolMath Games: https://coolmathgames.com/0-bloxorz
- CrazyGames: https://crazygames.com/game/bloxorz
- Flash Gaming Wiki: https://flashgaming.fandom.com/wiki/Bloxorz
- Damien Clarke (developer): https://damienclarke.me
- Deadlime Games (Miniclip remake): https://deadlime.com/home/bloxorz.html
- Bloxorz Brain Game (Google Play): https://play.google.com/store/apps/details?id=com.infocom.bloxorz
- Bloxpath (Steam): https://store.steampowered.com/app/3249900/Bloxpath
- Bloxpath (Itch.io demo): https://agoo.itch.io/bloxpath
- Bloxpath Press Kit: https://indienova.com/en/g/bloxpath/presskit
- Boulders: Puzzle (Itch.io): https://farewell-games.itch.io/boulders-puzzle
- Rolling Cat 3D: https://mstfmrt07.itch.io/rolling-cat
- Sokoblox: https://sed4906.itch.io/sokoblox
- Speedrun.com Bloxorz: https://speedrun.com/bloxorz
- Bloxorz Speedrun Guide: https://github.com/yujene/bloxorzguide
- ProGameGuides (all passcodes): https://progameguides.com/bloxorz/all-bloxorz-cheat-codes-passcodes-for-every-stage
