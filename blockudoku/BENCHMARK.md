# Blockudoku Competitive Benchmark

> Game: **Blockudoku** (Block + Sudoku) | Slug: `blockudoku`  
> Tier: 1 (23/25 Market Analysis Score)  
> Last Updated: 2026-05-26

---

## Table of Contents

1. [Genre Overview](#genre-overview)
2. [Core Gameplay Mechanics](#core-gameplay-mechanics)
3. [Competitor Analysis](#competitor-analysis)
   - [1. Blockudoku® by Easybrain](#1-blockudoku-by-easybrain)
   - [2. Woodoku by Tripledot Studios](#2-woodoku-by-tripledot-studios)
   - [3. 1010! Block Puzzle by Gram Games/Zynga](#3-1010-block-puzzle-by-gram-gameszynga)
   - [4. Braindoku by Murka](#4-braindoku-by-murka)
   - [5. SudoCube / Block Sudoku Puzzle (Various)](#5-sudocube--block-sudoku-puzzle-various)
4. [Scoring Systems & Formulas](#scoring-systems--formulas)
5. [All Systems Deep Dive](#all-systems-deep-dive)
6. [Art & Music References](#art--music-references)
7. [Monetization Patterns](#monetization-patterns)
8. [Competitive Feature Matrix](#competitive-feature-matrix)
9. [Key Differentiators for Our Version](#key-differentiators-for-our-version)

---

## Genre Overview

Block Sudoku is a hybrid puzzle genre that combines **block-stacking puzzle mechanics** (Tetris/1010! lineage) with **Sudoku-inspired grid clearing** (9×9 board with 3×3 sub-square regions). The genre is one of the highest-performing casual puzzle categories with a combined install base exceeding **300M+ downloads** across top titles.

**Why it works:**
- Easy to learn (seconds to understand), hard to master (strategic depth from combos/streaks)
- No time pressure in core mode (zen/relaxation positioning)
- Short sessions (2-5 min) with "one more round" hook
- Visually satisfying clear animations
- Infinite replayability via procedural piece generation

---

## Core Gameplay Mechanics

### Grid & Board
| Element | Value |
|---------|-------|
| Board Size | 9×9 cells (81 total) |
| Sub-regions | Nine 3×3 squares (like Sudoku) |
| Piece Queue | 3 pieces given simultaneously |
| Placement | Drag-and-drop; place all 3 before next set |
| Game Over | No valid placement exists for any remaining piece |

### Clear Conditions
Clearing occurs when any of the following are completely filled:
1. **Horizontal Row** — 9 cells in a row
2. **Vertical Column** — 9 cells in a column
3. **3×3 Sub-square** — 9 cells in any Sudoku box region
4. **Combinations** — Multiple clear conditions can trigger simultaneously

### Block Shapes (Standard Set)
The following shapes appear in various rotations:

| Category | Shapes | Block Count |
|----------|--------|-------------|
| **Single** | 1×1 | 1 |
| **Line** | 1×2, 1×3, 1×4, 1×5 | 2–5 |
| **Square** | 2×2, 3×3 | 4, 9 |
| **L-shape** | Various L & J orientations (2×3, 3×3 bounding box) | 3–5 |
| **T-shape** | Various T orientations | 4–5 |
| **S/Z-shape** | Skewed pieces | 4–5 |

> **Note:** The 3×3 square is the largest shape and rarest spawn. All 3 pieces must be placed before receiving new ones. Grayed-out pieces in the queue indicate no valid placement currently exists.

### Strategic Depth Elements
- **Corners**: Building from corners preserves more open lines/columns
- **Edge play**: 3×3 squares can be cleared independently, making edges valuable
- **Single gaps**: Leaving isolated 1-cell gaps is extremely dangerous (rare 1×1 spawns)
- **Center control**: Filling center quickly limits options

---

## Competitor Analysis

### 1. Blockudoku® by Easybrain

| Attribute | Details |
|-----------|---------|
| **Developer** | Easybrain Ltd (acquired by MWM/MobileWave Media) |
| **Launched** | March 2019 (iOS), 2019 (Android) |
| **Downloads** | 100M+ |
| **Rating** | 4.54/5 (1.2M+ reviews on Android) |
| **Revenue** | Top-50 puzzle game globally |
| **Platforms** | iOS, Android, Web |
| **Store ID** | `com.easybrain.block.puzzle.games` |

**Core Features:**
- 9×9 block puzzle board with Sudoku-style 3×3 sub-squares
- Blocks of various shapes with drag-and-drop placement
- **Combo system** — destroy multiple zones (lines + squares) with one move
- **Streak system** — clear zones on consecutive moves for score multiplier
- **Daily Challenges** — unique trophy rewards with number-coded blocks (e.g., blocks marked "2" must be part of 2 clears before disappearing)
- **Seasonal Events** — limited-time events with unique animated postcard collectibles
- **Tournaments** — compete against other players; real-time leaderboard
- **Goals/Challenging Goals** — personal best challenges and friend competition
- **No time limit** — think one step ahead
- **Offline play** — core game fully playable offline

**Game Modes:**
1. **Classic (Endless)** — Free play, aim for highest score
2. **Daily Challenge** — Score-based target that scales with player's average regular game score
3. **Seasonal Events** — Time-limited themed events with collectibles
4. **Tournament/Duel** — Real-time or async competitive mode

**Scoring Details:**
- 1 point per cell placed (4-block piece = 4 pts)
- Bonus points for clearing zones (lines, columns, 3×3 squares)
- Combo multiplier: clearing multiple zones in a single placement
- Streak multiplier: clearing at least one zone on consecutive turns
- Daily Challenge target scales dynamically based on player's historical average score

**Art Style:**
- Clean, flat, minimalist design
- Solid-colored blocks on a light gray/white grid
- Subtle grid lines distinguishing the 3×3 Sudoku regions
- Confetti animations on clears and milestone scores
- Dark/light theme options
- Smooth, satisfying block-blast-away animations

---

### 2. Woodoku by Tripledot Studios

| Attribute | Details |
|-----------|---------|
| **Developer** | Tripledot Studios |
| **Launched** | 2020 |
| **Downloads** | 50M+ |
| **Rating** | 4.6/5 |
| **Platforms** | iOS, Android |
| **Store ID** | `com.tripledot.woodoku` |

**Core Features:**
- 9×9 wooden-themed board with 3×3 sub-squares
- Wood-textured block pieces with grain details
- **League System** — weekly competitive promotion/relegation:
  - Tiers: Wooden → Bronze → Silver → Gold → Platinum → Diamond
  - Weekly reset; earn points across all game modes
  - Promotion/relegation zones; stay in same tier if neutral
- **Journey Mode** — collect gems of different colors by completing objectives within timed events
- **Daily Challenge** — place pieces around gems to collect them; calendar-based daily rewards
- **Gem Collection** — soft currency earned through gameplay
- **Beautiful graphics & satisfying sound effects** (wooden ASMR-like audio)
- **Offline playable**

**Game Modes:**
1. **Classic** — Endless play, beat high score
2. **Daily Challenge** — Gem-collection puzzle with daily calendar progression
3. **Journey** — Level-based progression with gem collection objectives; time-limited periods

**Art Style:**
- **Wood grain texture** theme — warm browns, natural wood colors
- 3D-ish block appearance with subtle depth/shadows
- Warm, cozy aesthetic
- Soothing sound design with wooden click/placement sounds
- Satisfying sound effects for clears

**Key Differentiator:** The **League system** with promotion/relegation creates persistent competitive engagement separate from one-off tournaments. The **Journey mode** adds level-based progression (unlike Blockudoku's purely score-based progression).

---

### 3. 1010! Block Puzzle by Gram Games/Zynga

| Attribute | Details |
|-----------|---------|
| **Developer** | Gram Games (acquired by Zynga) |
| **Launched** | 2014 |
| **Downloads** | 100M+ (original 1010! + variants) |
| **Rating** | 4.5/5 |
| **Platforms** | iOS, Android |
| **Store ID** | `com.gramgames.tenten` |

**Core Features:**
- 10×10 grid (NOT 9×9; no Sudoku sub-squares)
- Simple line clearing only (no 3×3 region mechanic)
- **Dynamite power-up** — watch ad to get a dynamite for clearing blocks
- **Second chance** — watch ad for a fresh set of blocks when stuck
- No time limit, no speed mechanics
- Randomly generated blocks each round
- **Short and Sweet gameplay** — designed for quick sessions
- **Interesting Goals** — unique challenges for adventure progression
- Offline play supported

**Key Differences from Blockudoku:**
- **10×10 grid** instead of 9×9 (no 3×3 Sudoku mechanic)
- **No sub-square clearing** — purely row/column based
- Simpler, more casual design
- Less strategic depth (no 3×3 combos possible)
- Focuses on relaxation over competition

**Art Style:**
- Colorful gem-like blocks (candy/crystal aesthetic)
- Vibrant, playful color palette
- Simple clean grid

> **Note:** 1010! is included as the genre progenitor. Its lack of the Sudoku 3×3 mechanic makes it strategically simpler, which is our opportunity — the 3×3 sub-square adds significant depth.

---

### 4. Braindoku by Murka

| Attribute | Details |
|-----------|---------|
| **Developer** | Murka Games Limited |
| **Downloads** | 10M+ |
| **Rating** | 4.4/5 |
| **Platforms** | iOS, Android |

**Core Features:**
- 9×9 Sudoku-inspired block puzzle
- Full combo and streak system with documented multipliers
- Same core mechanic as Blockudoku (lines + 3×3 squares)
- Combo and streak multipliers well-defined (see scoring section)

**Documented Scoring Formula (Braindoku):**
| Action | Points |
|--------|--------|
| Place a cell | 1 point per cell |
| Clear 1 zone | 18 points (9 cells × 2 pts) |
| Clear 2 zones | 36 points |
| Clear 3 zones | 54 points |
| etc. | 2 pts per cleared cell |

**Combo/Streak Multipliers (Braindoku):**
| Level | Multiplier |
|-------|-----------|
| 2× combo/streak | ×2 on placement + removal points |
| 3× combo/streak | ×3 on placement + removal points |
| 4× combo/streak | ×5 on placement + removal points |
| 5×+ combo/streak | ×10 on placement + removal points |

---

### 5. SudoCube / Block Sudoku Puzzle (Various)

| Attribute | Details |
|-----------|---------|
| **Developer** | Various (Rejoy/Reaxle, indie devs) |
| **Notable Titles** | SudoCube (com.rejoy.block.logic), Block Sudoku Woody Puzzle |
| **Downloads** | 1M–10M each |
| **Rating** | 4.2–4.5/5 |
| **Platforms** | iOS, Android |

**Notable Feature — "Holder" Mechanic:**
- Some variants introduce a **Holder** — an area (usually bottom-right) where players can store one block for later use
- Adds strategic depth: save a rare/useful piece (like a 3×3 square) for when it's most needed
- Can swap held block with current piece, but only one block at a time

**Features across variants:**
- Combo scoring for multi-line clears
- Streak scoring for consecutive clear moves
- Daily challenges
- Leaderboards
- Offline play
- Wood/minimalist themes

---

## Scoring Systems & Formulas

### Universal Base Formula (Across Competitors)

```
Total Score = Σ(Placement Points × Multiplier) + Σ(Clearing Bonus × Multiplier)
```

### Placement Points
| Piece Type | Points |
|-----------|--------|
| 1×1 block | 1 |
| 2-cell piece | 2 |
| 3-cell piece | 3 |
| 4-cell piece (square, L, T, etc.) | 4 |
| 5-cell piece (line, L) | 5 |
| 9-cell piece (3×3 square) | 9 |

### Clearing Bonus Points
| Action | Base Points |
|--------|------------|
| Clear 1 line/column/3×3 square | +18 (9 cells × 2 pts) |
| Clear 2 zones simultaneously | +36 |
| Clear 3 zones simultaneously | +54 |
| Clear 4 zones simultaneously | +72 |
| Clear N zones simultaneously | +18N |

### Combo System (Multi-zone Clear in Single Placement)
A **combo** occurs when a single block placement clears 2+ zones simultaneously.

| Zones Cleared | Effect |
|--------------|--------|
| 1 zone | Normal clear bonus |
| 2 zones | Combo triggered; bonus multiplied |
| 3+ zones | "Perfect clear" feel; highest single-move reward |

### Streak System (Consecutive Turn Clears)
A **streak** occurs when at least one zone is cleared on consecutive turns.

| Streak Count | Multiplier |
|-------------|-----------|
| 1st consecutive clear | ×1 (base) |
| 2nd consecutive clear | ×2 |
| 3rd consecutive clear | ×3 |
| 4th consecutive clear | ×5 |
| 5th+ consecutive clear | ×10 |

> The streak multiplier applies to BOTH placement points and clearing bonus for that turn. Missing a clear (placing without clearing any zone) resets the streak to 0.

### Score Formula Example

```
Turn 1: Place 4-block L-shape → 4 pts placement → clear 1 row (18 pts) → Total: 22 pts, Streak: 1
Turn 2: Place 3-block piece → 3 pts placement → clear 1 column (18 pts) → Streak ×2 → Total: (3 + 18) × 2 = 42 pts
Turn 3: Place 3×3 square → 9 pts placement → clear 1 row + 1 column + 1 3×3 square (54 pts) → Streak ×3, Combo bonus → Total: (9 + 54) × 3 = 189 pts
```

### 3×3 Square Clear Bonus
Completing a 3×3 sub-square (Sudoku box) grants approximately **3× bonus points** versus a single-line clear, due to the higher difficulty of completing it.

---

## All Systems Deep Dive

### 1. Scoring System
- **Placement scoring**: Linear (1 pt per cell)
- **Clearing scoring**: 2 pts per cleared cell (18 per zone)
- **Combo multiplier**: Triggered by multi-zone clears in single placement
- **Streak multiplier**: Exponential growth (×2, ×3, ×5, ×10)
- **Score thresholds**: Visual progress tracker showing milestone targets
- **High score tracking**: Local daily/weekly/monthly/all-time bests

### 2. Combo System
- **Trigger**: Clear 2+ zones with one block placement
- **Feedback**: Visual effects intensify with combo size; confetti at high combos
- **Strategy**: Players leave strategic gaps to set up future combos
- **Chain 3+ square clears**: Can yield up to ~500% effective multiplier

### 3. Streak System
- **Trigger**: Clear at least 1 zone on consecutive turns
- **Escalation**: ×2 → ×3 → ×5 → ×10 multiplier
- **Reset condition**: Any turn where no zone is cleared
- **Visual feedback**: Streak counter displayed; grows more dramatic
- **Tension**: Late-game streaks are highest-value but hardest to maintain

### 4. Power-ups / Boosters
| Power-up | Effect | Acquisition |
|----------|--------|-------------|
| **Hammer** | Remove a single block from the board | Rewarded / IAP |
| **Eraser** | Remove a row or column | Rewarded / IAP |
| **Bomb** | Clear a 3×3 area | Rewarded / IAP |
| **Dynamite** (1010!) | Clear random blocks for space | Watch ad |
| **Second Chance** (1010!) | Get new piece set when stuck | Watch ad |
| **Holder/Swap** | Store one piece for later use | Reward (SudoCube variant) |

### 5. Daily Challenges
- **Structure**: One unique challenge per day
- **Objectives**: Score-based target (scales with player skill level)
- **Special mechanic**: Number-coded blocks (e.g., block marked "3" must be in 3 clears before vanishing)
- **Rewards**: Unique trophies (collectible set); calendar progression
- **Retention**: Creates daily login habit; FOMO on missed days

### 6. Seasonal Events
- **Duration**: 1–4 week limited-time events
- **Theme**: Holidays, seasons (Christmas, Halloween, Summer, etc.)
- **Rewards**: Unique animated postcards, exclusive trophies
- **Mechanics**: Modified rules or special objectives during events
- **Purpose**: Re-engagement spike; new content without core mechanic changes

### 7. Tournaments & Leaderboards
- **Format**: Time-limited competitive rounds (hourly/daily/weekly)
- **Scoring**: Best single-game score within the time window
- **Rewards**: League placement, trophy rewards, gems
- **Social**: Compare with friends; global leaderboards
- **League tiers**: Wooden → Bronze → Silver → Gold → Platinum → Diamond (Woodoku model)

### 8. Achievements / Goals System
- **Personal goals**: Beat your own high score
- **Challenging goals**: Escalating difficulty targets
- **Trophies**: Earned through daily challenges and events
- **Progression**: Visual trophy case; achievement milestones
- **Social goals**: Compete with friends on shared leaderboards

### 9. Journey / Level Progression
- **Structure**: Level-based progression with gem/color collection
- **Objectives**: Collect specific gem colors by clearing them from the board
- **Time limit**: Events last a set period (e.g., 1 week)
- **Reward tiers**: Multiple reward tiers based on levels completed
- **Engagement hook**: "Just one more level" compulsion loop

---

## Art & Music References

### Blockudoku (Easybrain) — Minimalist Flat
| Element | Description |
|---------|-------------|
| **Color palette** | Soft pastels + bold accent colors per block color |
| **Grid** | Light gray grid lines on white background; 3×3 regions subtly distinguished |
| **Blocks** | Solid flat colors with rounded corners; clean silhouette |
| **Clear animation** | Blocks flash and dissolve/explode outward |
| **Confetti** | Celebratory particle burst on combos and milestones |
| **UI** | Clean sans-serif typography; minimal chrome |
| **Themes** | Light/dark mode toggle |

### Woodoku (Tripledot) — Warm Natural
| Element | Description |
|---------|-------------|
| **Color palette** | Warm wood tones (birch, walnut, oak); earthy greens and golds |
| **Grid** | Wood-textured board; darker lines for 3×3 regions |
| **Blocks** | 3D-ish wood grain texture; subtle shadow/depth |
| **Clear animation** | Blocks slide away with satisfying wooden clack |
| **Sound** | Wooden ASMR clicks, thuds on placement; warm clear sounds |
| **UI** | Handcrafted/artisan feel; warm typography |
| **Vibe** | Cozy, relaxing, "coffee shop" aesthetic |

### 1010! — Colorful & Vibrant
| Element | Description |
|---------|-------------|
| **Color palette** | Bright jewel tones; gem-like (ruby, sapphire, emerald, amethyst) |
| **Grid** | Clean lines; subtle background |
| **Blocks** | Glossy, gem-like appearance |
| **Clear animation** | Blocks flash and shatter with sparkle effects |
| **Sound** | Electronic/casual pop style; upbeat |
| **UI** | Playful, rounded, bubbly |

### Recommended Art Direction for Our Game
| Element | Recommendation |
|---------|---------------|
| **Theme** | Modern minimalist with subtle depth (flat + soft shadows) |
| **Color palette** | Soft gradient blocks (5-7 distinct colors); neutral grid (#F5F5F5 bg, #E0E0E0 grid lines) |
| **Block style** | Rounded corners (4-8px radius); subtle drop shadow; slight gradient |
| **Grid** | 3×3 region borders slightly thicker than cell borders |
| **Clear animation** | Satisfying dissolve + particle burst; intensity scales with combo size |
| **Typography** | Rounded sans-serif (e.g., Nunito, Poppins) |
| **Dark mode** | Full dark theme support (#1A1A2E bg, #16213E grid) |

### Recommended Music & Sound Design
| Element | Recommendation |
|---------|---------------|
| **Background music** | Lo-fi ambient / soft electronic; 60-90 BPM; seamless loop (2-4 min) |
| **References** | lofi.gg vibes; calm piano + soft beats; "Chillhop" genre |
| **Placement SFX** | Soft "thock" / "click" — satisfying but not harsh; pitch varies slightly per piece size |
| **Clear SFX** | Ascending sparkle/chime; multi-zone clears = chord (more zones = richer chord) |
| **Combo SFX** | Stacking chord progression; ×5+ streak = triumphant fanfare snippet |
| **Game Over SFX** | Gentle descending tone; not punishing |
| **UI SFX** | Soft tap sounds; subtle feedback |
| **Haptic** | Light haptic on placement; medium on clear; strong on combo/streak |
| **Volume control** | Separate sliders for music, SFX; mute option |
| **Audio sources** | Epidemic Sound, Artlist, or royalty-free lo-fi packs |

---

## Monetization Patterns

### Industry Standard Model

| Revenue Stream | Implementation |
|---------------|----------------|
| **Interstitial Ads** | Between games (every 2-3 games); skip after 5 seconds |
| **Rewarded Video Ads** | Watch for: extra life, power-ups, double score, skip pieces |
| **Banner Ads** | Subtle bottom banner during gameplay (less intrusive) |
| **Remove Ads IAP** | One-time purchase ($2.99–$4.99) to remove all ads |
| **Premium/Pro** | Additional features: themes, no ads, exclusive challenges |
| **Subscription** | Weekly/monthly VIP with exclusive content |

### Blockudoku (Easybrain) Monetization
- **Ads**: Interstitial + rewarded video
- **IAP**: Premium/ad-free version; power-up bundles
- **Events**: Seasonal monetization through exclusive content

### Woodoku (Tripledot) Monetization
- **Ads**: Interstitial + rewarded video + banner
- **Gems**: Soft currency (earned through play or ads)
- **IAP**: Gem packs; premium features
- **League rewards**: Tiered rewards incentivize continued play

### 1010! Monetization
- **Ads**: Rewarded video for "Dynamite" power-up and "Second Chance"
- **IAP**: Remove ads; ad-free experience
- **Goals/Adventure**: Additional IAP monetization through progression items

### Recommended Monetization Strategy
1. **Free-to-play** with rewarded ads (non-intrusive)
2. **Rewarded ads**: Extra life (continue when stuck), power-ups, double score
3. **Remove Ads**: $2.99 one-time purchase
4. **Premium themes**: $0.99–$1.99 each (wood, neon, dark, pastel, etc.)
5. **Daily reward calendar**: Login streak rewards (gems/coins)
6. **No pay-to-win**: All gameplay-affecting power-ups earnable through play
7. **Subscription**: Optional VIP ($4.99/week) with themes + ad-free + exclusive daily challenges

---

## Competitive Feature Matrix

| Feature | Blockudoku (Easybrain) | Woodoku (Tripledot) | 1010! (Zynga) | Braindoku (Murka) | Ours (Target) |
|---------|:---:|:---:|:---:|:---:|:---:|
| 9×9 Grid + 3×3 Squares | ✅ | ✅ | ❌ (10×10) | ✅ | ✅ |
| Drag & Drop | ✅ | ✅ | ✅ | ✅ | ✅ |
| Combo System | ✅ | ✅ | ✅ | ✅ | ✅ |
| Streak System | ✅ | ✅ | ❌ | ✅ | ✅ |
| Daily Challenges | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seasonal Events | ✅ | ✅ | ❌ | ❌ | ✅ |
| Tournament Mode | ✅ | ❌ | ❌ | ❌ | ✅ |
| League/Promotion | ❌ | ✅ | ❌ | ❌ | ✅ |
| Journey/Level Mode | ❌ | ✅ | ✅ (Goals) | ❌ | ✅ |
| Achievements/Trophies | ✅ | ✅ | ❌ | ✅ | ✅ |
| Power-ups | ✅ | ✅ | ✅ (Dynamite) | ✅ | ✅ |
| Holder/Swap Mechanic | ❌ | ❌ | ❌ | ❌ | ✅ |
| Dark/Light Theme | ✅ | ❌ | ❌ | ❌ | ✅ |
| Offline Play | ✅ | ✅ | ✅ | ✅ | ✅ |
| ASMR/Satisfying Audio | ❌ | ✅ | ❌ | ❌ | ✅ |
| Customizable Themes | ❌ | ❌ | ❌ | ❌ | ✅ |
| Web Version | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## Key Differentiators for Our Version

### 1. Holder/Swap Mechanic (Unique)
- Allow players to **store one block** for later use
- Adds significant strategic depth without complexity
- Can swap stored block once per turn
- Differentiates from all major competitors

### 2. Superior Audio Design
- **ASMR-quality placement sounds** (satisfying wooden/soft clicks)
- **Dynamic music** that intensifies with streak count
- **Combo sound design**: Richer chords for bigger combos
- **Haptic feedback** tuned for satisfaction

### 3. Deep Progression System
- **Journey Mode** with level-based progression (inspired by Woodoku but with our twist)
- **League system** with weekly promotion/relegation
- **Achievement tree** with meaningful milestones
- **Collection system**: Themes, block styles, grid skins

### 4. Customization & Themes
- **Multiple visual themes**: Minimalist, Wood, Neon, Pastel, Dark, Glass
- **Block style packs**: Different visual styles for blocks
- **Grid customization**: Border colors, background patterns
- **Earnable through play** OR purchase

### 5. Web-First Design
- **Playable in browser** (HTML5/WebGL) for instant access
- **PWA support** for install-on-device experience
- **Seamless cross-platform** progression (cloud save)
- **SEO-friendly web version** for organic discovery

### 6. Fair Scoring & No Manipulation
- Address common complaint about Easybrain: **"predetermined score ranges"**
- Truly random piece generation (seeded, auditable)
- **No difficulty manipulation** based on player performance
- Transparent scoring formula displayed to players

### 7. Social Features
- **Friend leaderboards** (not just global)
- **Challenge a friend** (send a board state)
- **Shared achievements**
- **Spectate live games** (async replay)

### 8. Accessibility
- **Color-blind friendly** palette option
- **High contrast mode**
- **Large text option**
- **One-handed play** support (compact UI option)
- **Reduced motion** mode for players sensitive to animations

---

## Appendix: Research Sources

- [Blockudoku - Google Play Store](https://play.google.com/store/apps/details?id=com.easybrain.block.puzzle.games)
- [Blockudoku - Easybrain Official](https://easybrain.com/blockudoku)
- [Blockudoku Strategy Guide - Gamezebo](https://gamezebo.com/walkthroughs/blockudoku-strategy-guide-the-best-hints-tips-and-cheats)
- [Braindoku Scoring - Murka Help Center](https://murka.helpshift.com/hc/en/25-braindoku---sudoku-block-puzzle/faq/1383-how-is-the-score-calculated/)
- [Woodoku - Google Play Store](https://play.google.com/store/apps/details?id=com.tripledot.woodoku)
- [Woodoku League Feature - Zendesk](https://woodoku.zendesk.com/hc/en-us/articles/29409674319389-What-is-the-League-Feature-in-Woodoku)
- [Woodoku Tips - Mobi.gg](https://mobi.gg/en/tips/woodoku-tips-and-tricks-best-score)
- [1010! - Zynga](https://zynga.com/games/1010)
- [Blockudoku AppBrain Stats](https://appbrain.com/app/blockudoku%C2%AE-block-puzzle-game/com.easybrain.block.puzzle.games)
- [Blockudoku Reddit Community](https://reddit.com/r/BlockuDoku)
- [Blockudoku on MWM](https://mwm.ai/apps/blockudoku-block-puzzle-game/1452227871)
