# BENCHMARK.md — Save the Doge / Draw-to-Rescue Puzzle Game

## Competitive Analysis: Top 3 Competitors

**Game slug:** `save-the-doge`
**Genre:** Draw-to-Rescue Physics Puzzle
**Target:** Browser (HTML5) — GameZipper.com

---

## Game Overview

"Save the Doge" is a hyper-casual draw-to-rescue puzzle game where players sketch protective barriers to shield a helpless dog character from incoming hazards. The core loop is: **observe hazard trajectories → draw protective lines/shapes → watch physics simulation determine success or failure**.

- **Total downloads (mobile):** 100M+ (Save the Doge + Save the Doge 2 bundle, NOSTRA GAMES)
- **Genre tag:** Casual, Draw Puzzle, Physics, Brain Teaser
- **Platform:** Mobile (iOS/Android), now available on Poki/CrazyGames browser
- **Rating:** ~4.5 stars (Google Play); 8.5/10 comparable for Think to Escape on CrazyGames

---

## Competitor 1: Save the Doge (NOSTRA GAMES) — Primary Reference

**URL:** https://play.google.com/store/apps/details?id=com.badunoglob
**Downloads:** 100M+ | **Rating:** 4.5★ | **Levels:** 100+ (Save the Doge 1 + 2 combined)

### Core Mechanic
- Player draws free-form lines/shapes on screen
- Drawn lines become solid physics objects on "play"
- Hazards (bees, fire, water, spikes, falling objects) move along trajectories
- Drawn barriers block, bounce, or redirect hazards to protect Doge

### Hazard Types
| Hazard | Behavior | Visual |
|--------|----------|--------|
| Bees | Swarm toward Doge in arcs | Small yellow flying creatures |
| Fire | Spreads horizontally/vertically | Orange/red animated flames |
| Water | Floods from top/side | Blue wave animation |
| Spikes | Static danger zones | Metallic grey spikes |
| Falling rocks | Drop from top with gravity | Brown circular objects |

### Level Progression
- Levels 1–20: Single hazard type, simple trajectories (bees only)
- Levels 21–50: Combined hazards (bees + fire, bees + water)
- Levels 51–100: Complex multi-hazard, limited ink, tight solutions
- Later levels require curved/angled barriers for deflection

### Difficulty Escalation Mechanics
1. **Hazard count increases** — more bees, larger fire fronts
2. **Trajectory complexity** — curved vs. straight-line approaches
3. **Ink/line limit decreases** — fewer strokes allowed in later levels
4. **Hazard speed increases** — faster bee swarm speed in later levels
5. **Combined hazards** — multiple hazard types in same level

### Monetization
- **Interstitial ads:** Played between levels (standard mobile)
- **Rewarded video ads:** For hint access (shows optimal draw path)
- **Hint system:** Pay-to-reveal solution path; critical monetization lever
- **No forced ads** — player can watch ad for hint when stuck

### Art Style
- **Character:** Cute shiba-inu "Doge" — expressive panic/relief animations
- **Environment:** Clean minimalist backgrounds, soft pastel tones
- **Hazards:** Simple shapes with bold colors (yellow bees, orange fire, blue water)
- **UI:** Rounded corners, cheerful color palette, large touch targets

### Win/Lose Conditions
- **Win:** Doge survives for 5 seconds after hazard launch with no contact
- **Lose:** Any hazard touches Doge
- **Instant restart** — no loading between attempts

### Star Rating System
- 3 stars: Solved with minimum ink/line usage
- 2 stars: Solved but exceeded minimum ink
- 1 star: Solved with maximum ink (barely passed)

---

## Competitor 2: Draw Save Puzzle

**URL:** https://www.bestcrazygames.com/game/draw-save-puzzle
**Released:** March 12, 2021 | **Tags:** Casual, Brain, 2D, Bird, 1player

### Differences from Save the Doge
- Multiple character types to protect (includes bird, other animals)
- "Draw, erase, and strategize" mechanic — eraser tool available
- Simpler art style, less character animation
- Fewer downloads but same core mechanic
- Released on browser platforms earlier

### Key Features
- Eraser tool to correct drawn lines before play
- Self-paced level selection
- Casual brain-game positioning

---

## Competitor 3: Think to Escape (Phix)

**URL:** https://www.crazygames.com/game/think-to-escape
**Rating:** 8.5/10 (841 ratings) | **Developer:** Phix | **Released:** June 2022

### Note: Different Mechanic
Think to Escape is a **point-and-click escape game**, NOT a draw-to-rescue game. Included here because the task brief listed it as a competitor. The actual draw-to-rescue mechanic is unique to Save the Doge and Draw Save Puzzle.

- Genre: Escape/puzzle (hotel fire scenario)
- Mechanic: Click to collect objects, solve logic puzzles, open safes
- Has sequels: Think to Escape 2, Think to Escape 3
- Browser-first (CrazyGames platform)

---

## Key Systems to Replicate

### 1. Drawing Mechanic
- Touch/mouse drag to draw free-form lines
- Lines rendered as smooth curves (bezier interpolation)
- Stroke width: 4–6px for visibility
- Color: solid dark color contrasting with background

### 2. Physics Simulation
- On "play" press: drawn lines become static rigid bodies
- Simple 2D physics: gravity, collision detection, basic bounce
- Recommended engine: Matter.js (browser-compatible, 2D)
- Collision categories: barrier, hazard, character, ground

### 3. Hazard Types
- Bees: Bezier-curve movement toward Doge, slight randomization
- Fire: Static source, expanding front over time
- Water: Gravity-based flow (particle or grid simulation)
- Spikes: Static collision geometry
- Falling objects: Gravity + horizontal velocity component

### 4. Character States
- **Idle:** Doge sits, slight breathing animation
- **Panic:** Wide eyes, trembling when hazard approaches
- **Hit:** Red flash, fall animation → level fail
- **Celebrating:** Tail wag, happy jump on level win

### 5. Win/Lose Conditions
- Win: Character survives 5 seconds after all hazards resolved
- Lose: Any hazard hitbox overlaps character hitbox
- Auto-resolve after win/lose: 1.5s animation → level select

### 6. Star Rating System
| Stars | Criteria |
|-------|----------|
| 3 | Solved with ≤ minimum ink strokes |
| 2 | Solved with > minimum but ≤ average ink |
| 1 | Solved with maximum ink limit |

### 7. Hint System
- Button in UI: "Show Hint" (lightbulb icon)
- Triggers rewarded video ad OR direct purchase
- Overlay: ghosted optimal path drawn on screen for 3 seconds
- Player can still draw over the hint

### 8. Ink/Line Limit Per Level
- Defined per level: e.g., Level 1 = 3 strokes max, Level 50 = 1 stroke max
- Ink meter shown in UI
- Stroke counter decrements on each new line
- Prevents brute-force solutions in later levels

### 9. Progressive Difficulty
- Tutorial levels 1–5: Single bee, generous ink, wide Doge
- Levels 6–20: Multiple bees, curved trajectories
- Levels 21–50: Two hazard types combined
- Levels 51–100: Minimal ink, complex multi-hazard, precise timing

---

## Technical Implementation Notes

### Rendering
- Canvas 2D for drawing layer + physics debug
- DOM/Canvas overlay for UI (buttons, level select)
- Target: 60fps on mid-range desktop browsers

### Physics
- Matter.js recommended for browser physics
- Alternatively: simple AABB collision for hazards
- Drawn lines converted to polygon bodies

### State Management
- Level data: JSON array (level number, hazard config, ink limit, star thresholds)
- Progress: localStorage (stars per level, highest level unlocked)
- No backend required for MVP

### Save/Load
- Auto-save progress to localStorage on level complete
- Load saved progress on game open

---

## Competitor Comparison Table

| Feature | Save the Doge | Draw Save Puzzle | Think to Escape |
|---------|--------------|-----------------|-----------------|
| **Draw mechanic** | Yes | Yes | No (point-click) |
| **100+ levels** | Yes | Unknown | 3 sequels |
| **Physics sim** | Yes | Yes | No |
| **Character types** | Doge only | Multiple | Human |
| **Hazards** | Bees/fire/water/spikes | Various | Fire/logic |
| **Star rating** | Yes | Likely | No |
| **Hint system** | Rewarded video | Unknown | No |
| **Browser version** | Poki/CrazyGames | BestCrazyGames | CrazyGames |
| **Monetization** | Interstitial + rewarded | Unknown | None (browser) |
| **Download scale** | 100M+ | Lower | 8.5/10 rated |

---

## GameZipper Gap Analysis

**Current status:** No draw-to-rescue puzzle game on GameZipper
**Opportunity:** Save the Doge clone with original Doge character
**Difficulty:** EASY — single-file HTML5 feasible (Matter.js physics + Canvas 2D)
**Recommended scope:** 30–50 levels for initial release, expand to 100+ post-launch

---

*Sources: GameCritix review (gamecritix.co.uk), BestCrazyGames, CrazyGames, Google Play store listing, YouTube walkthroughs (ScorpioOfShadows, night gaming), developer documentation.*
