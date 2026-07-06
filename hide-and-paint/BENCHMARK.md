# Hide and Paint — Competitive Benchmark Report

**Game Category:** Stealth / Color Matching / Hide-and-Seek (single-player adaptation)
**Benchmark Date:** 2026-07-06
**Target Spec:** Single-file HTML5 Canvas 2D game, 25+ levels, 5 themes, ~30-50KB
**Sources Analyzed:** Poki, CrazyGames, AppMagic, Steam (Meccha Chameleon, Chameleon Run, Huebner, I Love Hue)

---

## 1. Executive Summary

Hide and Paint (OnRush Studio, Poki 4.3★, 2026-07 release) is a multiplayer 3D hide-and-seek game where players control a blank white chameleon that must paint itself to match its surroundings and freeze. The genre lives at the intersection of **stealth**, **color matching**, and **timed puzzle**. For GameZipper's single-file 2D canvas adaptation, we capture the core fantasy ("blend into the world") and translate it into a top-down arcade stealth format: the player guides a chameleon across themed scenes, **sampling colors from color pads** and **painting themselves to match moving patrol zones** before a sweeping **spotlight** catches them. This preserves the brand-defining "chameleon + paint" identity while remaining mobile-friendly and zero-asset.

---

## 2. Top Competitor Games Analyzed

### Game 1: Hide and Paint (OnRush Studio, Poki 2026-07)
- **Rating:** 4.3/10 (Poki), multiplayer
- **Description:** 3D chameleon, paint self to match scene, freeze to hide from hunters
- **Features:** WASD movement, mouse camera, F=paint, freeze pose, online multiplayer (8+ players)
- **Why we adapt:** Brand-new, viral, 0-1 day old, top 2026 gap
- **Our adaptation:** Top-down 2D, single-player, color-pad sampling + timed patrol avoidance

### Game 2: Meccha Chameleon (Cygames/Craft, Poki)
- **Description:** Side-scrolling color-matching platformer, paint trail to survive
- **Features:** Color trail matching background, multi-level
- **Relevance:** Direct inspiration for Hide and Paint (Poki tags Hide and Paint under "Meccha Chameleon inspired")

### Game 3: Chameleon Run (HyperBeard, mobile)
- **Downloads:** 10M+
- **Description:** Endless runner, color-shift on contact with color zones
- **Features:** Auto-run, tap to swap color, score per match

### Game 4: I Love Hue (Zut!, mobile)
- **Downloads:** 5M+
- **Description:** Arrange colors in gradient order
- **Relevance:** Color-perception gameplay DNA

### Game 5: Huebner / Hue Ball (web)
- **Description:** Move a color-matched ball to color pads, change color on contact
- **Relevance:** Direct mechanic match (sampling + applying color)

### Game 6: Stealth games (Hitman GO, Lara Croft GO)
- **Description:** Top-down turn-based stealth, patrol AI, line-of-sight cones
- **Relevance:** Patrol/spotlight detection pattern

### Game 7: Hidden Folks (Adriaan de Jongh)
- **Description:** Hand-drawn hidden object search
- **Relevance:** Poking interest; complementary to our sister game hidden-object/

---

## 3. Core Mechanic Design (GameZipper adaptation)

### 3.1 The Loop
1. Player is a **white chameleon** (white = visible / conspicuous)
2. The scene contains **3-6 color pads** (rocks, plants, crystals — each a unique HSL)
3. Player **moves chameleon to a pad** → automatically **absorbs that color** (1.2s charge)
4. Player **moves chameleon over a target zone** (e.g., a bush, a wall) and **paints** the body to match
5. A **spotlight / hunter beam** sweeps the map on a timer — if it touches the chameleon and the **current color is too different from the local environment**, the chameleon is **spotted** → level fail
6. To clear the level: **paint at least 2 zones** and **survive N seconds** of patrolling

### 3.2 Controls (mobile-first)
- **Drag / joystick** to move chameleon (touch on lower 60% of screen)
- **Tap a color pad** to absorb (or auto-absorb on contact)
- **Tap an unpainted zone** to paint self (F equivalent)
- **Desktop:** WASD/arrow keys to move, F to paint, mouse on pads to absorb

### 3.3 Detection Logic
- Spotlight cone samples 4 pixels in front of player
- For each sample, compare player color vs background color
- If ΔHue > 30° (in HSL) OR ΔLightness > 0.20 → **warning pulse** (visual)
- If spotlight **stays on player for 1.5s with mismatched color** → **spotted** → level fail

---

## 4. Level Structure

### 4.1 Level Count
| Tier | Levels | Difficulty |
|------|--------|-----------|
| Tutorial | 1-3 | 3 pads, 1 spotlight, no timer |
| Easy | 4-8 | 4 pads, 1 spotlight, 30s timer |
| Medium | 9-15 | 5 pads, 2 spotlights, 45s timer |
| Hard | 16-22 | 6 pads, 2 spotlights, 60s timer |
| Master | 23-25 | 6 pads, 3 spotlights, 90s timer |

**Target for GameZipper: 25 levels**

### 4.2 Theme Categories (5)
1. **Forest** — greens, browns (trees, grass, dirt)
2. **Desert** — yellows, oranges (sand, rocks, cacti)
3. **Ocean Reef** — teals, purples (coral, sand, water)
4. **Volcano** — reds, blacks (lava, obsidian, ash)
5. **Ice Cave** — whites, blues (ice, snow, stone)

Each theme = distinct palette + distinct background pattern (noise-based) + distinct spotlight color

---

## 5. Scoring System

### 5.1 Points
| Component | Points |
|-----------|--------|
| Paint a zone | +100 |
| Survive full timer | +500 |
| Bonus per remaining second | +10/s |
| No-detection bonus (never spotted) | +1000 |
| Star: 1 (clear) / 2 (<15s used) / 3 (perfect, no detection, all 5 zones painted) |

### 5.2 Combo
- Chain paints within 3s of each other → +50 combo
- Chain of 3+ → 2× score

---

## 6. Monetization & Ad Patterns

### 6.1 Ad Placement
| Location | Type | Frequency |
|----------|------|-----------|
| Between levels | Interstitial | Every 3 levels |
| Level fail | Rewarded (continue) | On-demand |
| Settings | Banner | Persistent (header) |

### 6.2 Rewarded Ads
| Reward | Duration |
|--------|----------|
| Continue after spotted | 15s |
| Reveal best pad | 10s |
| 2× score next level | 30s |

---

## 7. Key Features

### 7.1 Essential (Core Loop)
- Top-down canvas 2D world (1024×768 logical, scaled)
- Player chameleon (32×32 sprite, painted by code)
- Color pads (4-6 per level, distinct HSL)
- Target zones (where to paint, 2-5 per level)
- Spotlight enemies (1-3 per level, patrol/rotate)
- HUD: level, time, score, current color swatch, paint charges
- Pause menu
- Game over / level complete screens

### 7.2 Engagement Features
- 25 levels, 5 themes
- Star rating per level
- localStorage progress
- Combo display
- Spotlight warning flash
- Particle trail behind chameleon (painted color)
- Ambient background (no sound for V1)

### 7.3 Nice to Have (V2)
- Daily challenge (deterministic seed)
- Achievement badges (10)
- Color-blind mode (icon shapes overlay)
- Theme unlocks (purchase)

---

## 8. UI / UX Patterns

### 8.1 Color Swatch (Top-Right)
Player's current color in a glowing circle — color updates on absorb.
Tap to "drop" current color back to nearest pad (charge back).

### 8.2 Score Display (Top-Left)
Level number, time remaining, score, stars.

### 8.3 Mini-Map (Bottom-Right)
30% scale, shows pads (•) and spotlights (cone).

### 8.4 Level Complete Screen
Stars animation, score breakdown, "Next" / "Replay" / "Home"

### 8.5 Spotted Screen
Red flash, "SPOTTED!" text, score so far, "Retry" / "Watch Ad to Continue"

---

## 9. Technical Implementation

### 9.1 Stack
- **HTML5 Canvas 2D** (no WebGL — easier mobile, no shader issues)
- **No external assets** — all graphics procedural (painted chameleon, noise-based backgrounds, particle effects)
- **No Three.js** — top-down 2D fits canvas 2D
- **Web Audio API** — minimal (skip for V1, can add WebAudio bleeps)
- **localStorage** — progress, stars, total score
- **Frame budget:** 60fps desktop, 30fps mobile (adaptive)

### 9.2 Color System
- Pad colors: pre-defined HSL per theme
- Player color: stored as `{h, s, l}` (HSL), eased between absorbs
- Paint blending: linear HSL lerp on contact
- Detection: ΔH (0-180°) + ΔL (0-1), threshold checks

### 9.3 AI Spotlights
- Patrol path = list of waypoints per spotlight
- Cone angle 35°, range 280px
- Speed scales with difficulty
- Phases: pause(0.5s) → sweep(2s) → pause → repeat

### 9.4 Rendering Order
1. Background (themed noise pattern, painted once to off-screen canvas)
2. Target zones (subtle glowing outlines)
3. Pads (pulsing dots)
4. Spotlights (cone with gradient)
5. Player chameleon (32×32 painted sprite)
6. Particle trail
7. HUD overlay
8. Modal screens (pause, complete, fail)

---

## 10. Target Spec Alignment

| Spec | Benchmark | Our Plan |
|------|-----------|----------|
| 25+ levels | 20-100 typical | 25 fits standard |
| 5 themes | 5-7 found | 5 themes |
| Canvas-drawn | Fully achievable | 2D canvas, no Three |
| Timer | 30-90s | 30-90s range |
| Color match | Meccha/I Love Hue | HSL distance check |
| Stealth detection | Hitman GO pattern | Cone + 1.5s dwell |
| Daily puzzle | Common | V2 feature |
| 30-50KB | Single-file | Lean code, no libs |

---

## 11. Recommended GameZipper Spec Summary

- **Levels:** 25
- **Themes:** 5 (Forest, Desert, Ocean, Volcano, Ice)
- **Pads per level:** 3-6
- **Target zones per level:** 2-5
- **Spotlights per level:** 1-3
- **Time:** 30-90s (tier-dependent)
- **Scoring:** 100/zone + 500/full clear + 10/s bonus + 1000/no-detect
- **Stars:** 3 = perfect (all zones + no detection), 2 = <15s used, 1 = clear
- **Features:** Color swatch HUD, mini-map, combo, particle trail, pause
- **Ads:** Interstitial every 3 levels, rewarded continue on fail

---

*Sources: Poki.com (Hide and Paint page), AppMagic, CrazyGames, App Store, Steam (Meccha Chameleon, Hitman GO), Gamasutra color-game design articles*
