# Pop Them — Benchmark & Game Design Reference

> **Genre:** Chain Reaction / Group Elimination Puzzle  
> **Platform target:** HTML5 browser game (desktop + mobile)  
> **Last updated:** 2026-06-01

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Competitive Landscape](#competitive-landscape)
3. [Core Mechanic Deep-Dives](#core-mechanic-deep-dives)
4. [Scoring Systems Comparison](#scoring-systems-comparison)
5. [Level Design and Progression](#level-design--progression)
6. [Power-Ups and Specials](#power-ups--specials)
7. [Economy and Monetization](#economy--monetization)
8. [Visual and Audio Style](#visual--audio-style)
9. [Recommended Design for Pop Them](#recommended-design-for-pop-them)
10. [Sources](#sources)

---

## Executive Summary

"Pop Them" is a **tap-to-eliminate group puzzle game** in the lineage of PopStar, Pet Rescue Saga, and Toon Blast. The core loop is:

1. **See** a grid of colored blocks/bubbles
2. **Tap** any group of 2+ connected same-colored blocks
3. **Watch** blocks pop, gravity pull remaining blocks down, empty columns collapse left
4. **Score** points based on group size
5. **Repeat** until no moves remain or target score is reached

This document benchmarks the top competitors and defines the design targets for our implementation.

---

## Competitive Landscape

### Primary Competitors

| Game | Developer | Platform | Grid Size | Colors | Release |
|------|-----------|----------|-----------|--------|---------|
| **PopStar** | Guangzhou Xuansen | iOS/Android | 10x10 | 5 | 2013 |
| **Pop Them!** | Tummy Games DOO | iOS/Android/Web | Variable | 5-6 | 2022+ |
| **Pet Rescue Saga** | King | iOS/Android/Web | Variable (8x8 to 9x9+) | 5-6 | 2012 |
| **Toon Blast** | Peak Games | iOS/Android | Variable (up to 9x9) | 4-5 | 2017 |
| **Pop Star (various clones)** | Multiple | Web/Mobile | 10x10 | 5 | Various |

### Market Positioning

- **PopStar** is the purest "endless score attack" variant — no levels, no moves limit, just maximize score
- **Pop Them!** adds connect-the-dots chaining (draw paths through same-colored emoji) with level-based goals
- **Pet Rescue Saga** wraps group elimination in a rescue theme with diverse level objectives
- **Toon Blast** uses collapse-and-refill with special block creation for combo chains

**Our "Pop Them" positioning:** A PopStar-style pure tap-to-pop grid game with level-based progression, target scores, and limited moves — the best of both worlds.

---

## Core Mechanic Deep-Dives

### PopStar (Primary Benchmark)

- **Grid:** 10x10
- **Colors:** 5 tile types
- **Group minimum:** 2 adjacent same-color tiles (horizontal/vertical adjacency only)
- **Gravity:** After elimination, tiles above fall down to fill gaps within columns
- **Column collapse:** If a column becomes entirely empty, all columns to the right shift left to fill the gap
- **Game end:** No groups of 2+ same-color tiles remain
- **Magic tool:** Can change the color of a single block (limited uses)

**Key insight:** The "no moves limit, maximize score" design creates infinite replayability. Players must think strategically about elimination order to create larger groups through gravity manipulation.

### Pop Them! (Tummy Games)

- **Connection style:** Draw a path through 3+ same-colored emoji balls in any direction (including diagonal)
- **Loop bonus:** Close a loop (connect back to start) to clear the entire board of that color
- **Obstacles:** Wooden locked gates, boxes, evil emojis — pop nearby to destroy them
- **Moves:** Limited moves per level with specific goals
- **Pachinko bonus:** Fill a jar with remaining balls, break it, balls fall through pegs for bonus rewards
- **Levels:** 30+ levels with progressive difficulty, gate unlocking on map

**Key insight:** The connect-the-dots path mechanic is more casual and ASMR-focused. Our game should stick to the simpler "tap a group" mechanic for faster gameplay.

### Pet Rescue Saga

- **Group minimum:** 2+ same-color blocks (like PopStar)
- **Block types:** Regular colored blocks, caged blocks, locked blocks, mesh-covered blocks, multiplier blocks
- **Gravity:** Standard — blocks fall down when blocks below are eliminated
- **Objectives per level:** Variable — reach target score, rescue X pets, clear X% of blocks, rescue all pets
- **Pets:** Animals sit on top of blocks; drop them to the bottom to "rescue" them
- **Lives system:** Lose a life on failure; lives regenerate over time (25 min per life)
- **Star system:** 1-3 stars per level based on performance; more stars = more coins

**Key insight:** Multiple level objective types prevent monotony. The pet rescue mechanic adds emotional engagement.

### Toon Blast

- **Core action:** Tap groups of 2+ connected same-color cubes to blast them
- **Collapse + refill:** After blasting, cubes above fall down AND new cubes fill from top
- **Special blocks** (created from large matches):
  - **5 cubes** → Rocket (clears a row or column)
  - **7 cubes** → Bomb (clears a 3x3 area)
  - **9 cubes** → Disco Ball (clears all cubes of one color)
- **Combo chain:** Combining specials triggers devastating chain reactions
- **Level goals:** Collect X items, clear X blocks, reach X score — within move limits

**Key insight:** The special block system from large matches is the key innovation. It rewards building big groups.

---

## Scoring Systems Comparison

### PopStar Scoring

| Group Size (n) | Score = n * n * 5 | Cumulative Example |
|:-:|:-:|:-:|
| 2 | 20 | 20 |
| 3 | 45 | 65 |
| 4 | 80 | 145 |
| 5 | 125 | 270 |
| 6 | 180 | 450 |
| 7 | 245 | 695 |
| 8 | 320 | 1,015 |
| 9 | 405 | 1,420 |
| 10 | 500 | 1,920 |
| 15 | 1,125 | — |
| 20 | 2,000 | — |

**Clear bonus:** `Bonus = max(0, 2000 - m * m * 20)` where m = remaining tiles. Perfect clear = 2,000 bonus.

### Proposed "Pop Them" Scoring (n * (n-1))

| Group Size (n) | Score = n * (n-1) | Cumulative Example |
|:-:|:-:|:-:|
| 2 | 2 | 2 |
| 3 | 6 | 8 |
| 4 | 12 | 20 |
| 5 | 20 | 40 |
| 6 | 30 | 70 |
| 7 | 42 | 112 |
| 8 | 56 | 168 |
| 9 | 72 | 240 |
| 10 | 90 | 330 |
| 15 | 210 | — |
| 20 | 380 | — |

**Why n*(n-1)?** The quadratic curve rewards larger groups exponentially, but with slightly lower raw numbers than PopStar's n*n*5. This gives more headroom for multipliers and combos.

**Recommended multipliers:**
- **Combo bonus:** Sequential pops without "dead time" grant +50% per chain step (pop 2: 1x, pop 3: 1.5x, pop 4: 2x, etc.)
- **Clear bonus:** Perfect clear (0 tiles remaining) = +2,000 points. Partial clear = `max(0, 2000 - m * m * 20)`
- **Level target multiplier:** Targets scale ~1.3x per level tier

### Pet Rescue Saga Scoring

- Scoring is less formulaic — based on blocks matched plus objectives completed
- Stars are the primary metric (1-3 per level)
- Block-clear percentage drives star count

### Toon Blast Scoring

- Score per block destroyed + bonuses for special block activations
- Move-based scoring: remaining moves convert to bonus points at level end
- Stars (1-3) based on score thresholds

---

## Level Design and Progression

### Recommended Level Structure for "Pop Them"

#### Level Types

| Type | Objective | Frequency |
|------|-----------|-----------|
| **Target Score** | Reach score X within Y moves | Primary (60%) |
| **Clear Percentage** | Clear X% of blocks within Y moves | Secondary (25%) |
| **Perfect Clear** | Clear ALL blocks within Y moves | Challenge (15%) |

#### Difficulty Curve

| Levels | Grid Size | Colors | Moves | Target Score | New Element |
|--------|-----------|--------|-------|-------------|-------------|
| 1-3 | 8x8 | 3 | Unlimited | 100-300 | Tutorial — no move limit |
| 4-8 | 8x8 | 3 | 20-25 | 300-600 | Introduce move limits |
| 9-12 | 9x9 | 4 | 18-22 | 600-1,000 | 4th color |
| 13-18 | 9x9 | 4 | 16-20 | 1,000-1,500 | Tighter move counts |
| 19-25 | 10x10 | 5 | 15-20 | 1,500-2,500 | Full grid, 5 colors |
| 26-30 | 10x10 | 5 | 12-18 | 2,500-3,500 | Expert tier |
| 31-40 | 10x10 | 5 | 10-16 | 3,500-5,000 | Increasingly tight |
| 41-50 | 10x10 | 5 | 8-15 | 5,000-8,000 | Hard mode |

#### Star System (3-star per level)

| Star | Condition |
|------|-----------|
| 1 Star | Reach target score |
| 2 Stars | Reach 130% of target score |
| 3 Stars | Reach 160% of target score OR clear all blocks |

#### Progression Gates

- **Level unlock:** Complete previous level (1-star minimum)
- **Chapter gates:** Every 10 levels; requires X total stars to unlock next chapter
- **Chapters:** 5 chapters of 10 levels each = 50 levels at launch

### Competitor Progression Models

| Game | Levels | Progression | Gate Mechanism |
|------|--------|-------------|----------------|
| PopStar | Infinite (endless) | Score-based | N/A — pure score attack |
| Pet Rescue Saga | 9,400+ | Linear map | Lives system (wait or pay) |
| Toon Blast | 5,000+ | Linear map | Lives system + team social |
| Pop Them! | 30+ | Map with gates | Stars + coins to unlock |

---

## Power-Ups and Specials

### Recommended Power-Ups for "Pop Them"

| Power-Up | Effect | Unlock Level | Cost (coins) |
|----------|--------|:------------:|:------------:|
| **Color Swap** | Change one block's color to any other | Level 5 | 100 |
| **Row Blast** | Clear an entire row | Level 10 | 200 |
| **Column Blast** | Clear an entire column | Level 15 | 200 |
| **Color Bomb** | Clear ALL blocks of one color from the board | Level 20 | 300 |
| **Undo** | Undo last move | Level 1 | 50 |
| **+5 Moves** | Add 5 extra moves to current level | Level 1 | 150 |

### Special Block Formation (Toon Blast-inspired)

Creating these from strategic large-group pops adds a combo layer:

| Match Size | Special Created | Effect |
|:----------:|----------------|--------|
| 7+ blocks | **Bomb Block** | Clears 3x3 area around it |
| 10+ blocks | **Lightning Block** | Clears entire row AND column |

### Pet Rescue Saga Boosters (reference)

| Booster | Effect | Unlocked |
|---------|--------|:--------:|
| Block Buster | Smash one block | Level 7 |
| Color Pop | Remove all blocks of one color | Level 10 |
| Column Blaster | Clear a column | Level 17 |
| Mesh Masher | Remove all wire cages | Level 19 |
| Master Key | Unlock all locked blocks | Level 33 |
| Line Blaster | Clear an entire row | Level 48 |
| Paintbrush | Paint 5 blocks same color | Level 164 |

### PopStar Magic Tool

- **Magic Wand:** Change one block's color to any chosen color
- Earned through gameplay; stored for later use
- Critical for late-game strategy

---

## Economy and Monetization

### Recommended Economy

| Currency | Source | Use |
|----------|--------|-----|
| **Stars** | Earn 1-3 per level | Progression gates |
| **Coins** | Level completion, bonus chests, daily bonus | Power-ups, extra moves |

### Coin Rewards

| Action | Coins |
|--------|:-----:|
| Complete level (1 star) | 10 |
| Complete level (2 stars) | 25 |
| Complete level (3 stars) | 50 |
| Perfect clear bonus | +30 |
| Daily bonus (streak) | 10-50 |
| Chapter completion | 200 |

### Competitor Economy Reference

| Game | Currency | Sources | Sinks |
|------|----------|---------|-------|
| Pop Them! | Coins | Stars, ads, chests, Wheel of Fortune | Power-ups, extra lives |
| Pet Rescue Saga | Coins/Gold | Levels, daily bonus, purchases | Boosters, extra moves, lives |
| Toon Blast | Coins | Levels, team gifts, purchases | Boosters, extra moves, lives |
| PopStar | Magic (uses) | Gameplay | Block color changes |

### Retention Features

| Feature | Description | Priority |
|---------|-------------|:--------:|
| **Daily bonus** | Coin reward that increases with consecutive login streak | Must |
| **Star gates** | Require X stars to unlock next chapter | Must |
| **Best score tracking** | Personal best per level | Must |
| **Bonus chests** | Earned every 5 levels with random coin rewards | Should |
| **Achievement badges** | "Clear 10 boards", "Score 5000 in one game", etc. | Should |
| **Wheel of Fortune** | Spin for bonus coins (inspired by Pop Them!) | Could |

---

## Visual and Audio Style

### Recommended Style: "Cute and Colorful"

| Element | Specification |
|---------|--------------|
| **Block style** | Rounded squares with subtle inner highlight (3D bubble feel) |
| **Color palette** | 5 vibrant, high-contrast colors: Red, Blue, Green, Yellow, Purple |
| **Background** | Gradient sky or abstract pattern, changes per chapter |
| **Grid** | Subtle dark border lines, slightly recessed cells |
| **Pop animation** | Scale up + fade out + particle burst in block's color |
| **Gravity animation** | Smooth ease-out bounce when blocks land (200ms) |
| **Column collapse** | Smooth horizontal slide (150ms) |

### Pop Animation Sequence

```
Frame 0:   Block at normal size (1.0x)
Frame 50ms: Block scales to 1.2x, glow intensifies
Frame 100ms: Block shrinks to 0.3x, particles spawn
Frame 150ms: Block at 0.0x (gone), particles expanding
Frame 300ms: Particles fade out
```

### Audio Design

| Sound | Description |
|-------|-------------|
| **Block select** | Soft click/pop |
| **Block pop (small)** | Light "bloop" — pitch scales with group size |
| **Block pop (large, 7+)** | Satisfying "BOOM" with reverb |
| **Gravity fall** | Subtle thud when blocks land |
| **Column collapse** | Whoosh sound |
| **Level complete** | Cheerful jingle |
| **Perfect clear** | Triumphant fanfare |
| **Game over** | Gentle descending tone |

### Competitor Visual Styles

| Game | Style | Key Visual Traits |
|------|-------|-------------------|
| PopStar | Minimal/Geometric | Star shapes, solid colors, clean grid |
| Pop Them! | Cute/Emoji | Emoji faces on bubbles, bright, playful |
| Pet Rescue Saga | Cartoon/Cute | 3D animals, colorful blocks, themed backgrounds |
| Toon Blast | Cartoon/Toony | Bright cubes, character mascots, animated effects |

---

## Recommended Design for Pop Them

### Architecture Summary

```
+-----------------------------------------+
|              LEVEL SELECT MAP            |
|  (5 chapters x 10 levels, star gates)   |
+------------------+----------------------+
                   |
+------------------v----------------------+
|            GAME BOARD                    |
|  +----------------------------------+   |
|  |  10x10 Grid of colored blocks    |   |
|  |  5 colors: R G B Y P             |   |
|  |  Tap group of 2+ -> pop          |   |
|  |  Gravity DOWN | Columns LEFT      |   |
|  +----------------------------------+   |
|  [Score] [Moves: 15] [Target: 1500]    |
|  [Undo] [+5 Moves] [Color Bomb]        |
+-----------------------------------------+
                   |
+------------------v----------------------+
|         SCORING ENGINE                   |
|  Base: n * (n - 1) per group            |
|  Combo: x1.5 per chain step             |
|  Clear bonus: 2000 - m^2 * 20           |
|  Stars: 1>=target  2>=1.3x  3>=1.6x    |
+-----------------------------------------+
```

### Core Game Loop

```
START LEVEL
    |
    v
DISPLAY GRID (10x10, 5 colors)
    |
    v
PLAYER TAPS GROUP ---- No valid group? --> END LEVEL
    |                                         |
    v                                         v
POP ANIMATION                     Count remaining tiles
    |                             Award clear bonus
    v                             Calculate total score
APPLY GRAVITY (blocks fall)       Award stars
    |                             Return to map
    v
COLLAPSE EMPTY COLUMNS
    |
    v
AWARD SCORE: n * (n-1)
    |
    v
CHECK COMBO (consecutive pops)
    |
    v
MOVES REMAINING? -- Yes --> WAIT FOR INPUT
    |
    No
    |
    v
CHECK TARGET SCORE -- Met? --> LEVEL PASSED
    |
    Not met
    |
    v
LEVEL FAILED (offer +5 moves for coins)
```

### Level Data Schema

```json
{
  "id": 1,
  "chapter": 1,
  "grid": {
    "rows": 10,
    "cols": 10,
    "colors": 3,
    "seed": null
  },
  "objective": {
    "type": "target_score",
    "target": 300,
    "stars": [300, 400, 480]
  },
  "moves": 25,
  "powerups_available": ["undo"],
  "special_blocks": []
}
```

### Key Differentiators from Competitors

1. **Pure tap-to-pop** (not connect-the-dots like Pop Them!) — faster gameplay
2. **Level-based with target scores** (not endless like PopStar) — clear progression
3. **n * (n-1) scoring** — simpler to understand than n * n * 5, still rewards big groups
4. **No lives system** (no wait-to-play gates) — instant replay for web game
5. **Combo chain bonus** — rewards strategic elimination order
6. **Perfect clear bonus** — high-skill ceiling goal per level

### Minimum Viable Feature Set

| Priority | Feature |
|:--------:|---------|
| P0 | 10x10 grid with 5 colors, tap-to-pop, gravity, column collapse |
| P0 | n * (n-1) scoring |
| P0 | 25 levels with target scores and move limits |
| P0 | Star system (1-3 per level) |
| P0 | Level select screen with progression |
| P1 | Pop animation with particles |
| P1 | Undo power-up |
| P1 | +5 Moves power-up |
| P1 | Clear bonus calculation |
| P2 | Combo chain multiplier |
| P2 | Color Bomb power-up |
| P2 | Row/Column Blast power-up |
| P2 | Special blocks (Bomb, Lightning from large groups) |
| P2 | Daily bonus |
| P2 | Achievement badges |
| P3 | Bonus chests every 5 levels |
| P3 | Chapter completion rewards |
| P3 | Wheel of Fortune |
| P3 | Background music |

---

## Sources

- [PopStar Solver — Game Rules (GitHub)](https://github.com/cebrusfs/popstar-solver) — Detailed mechanics, scoring formulas
- [PopStar on game-solver.com](https://game-solver.com/popstar) — Scoring formula: n*n*5, bonus formula
- [Pop Them! on BubbleShooter.net](https://bubbleshooter.net/game/pop-them) — Pop Them! mechanics, levels, power-ups
- [Pop Them! on PuzzleLevel.com](https://puzzlelevel.com/game/pop-them) — Detailed how-to-play, economy, retention
- [Pet Rescue Saga Wiki — Boosters](https://pet-rescue-saga.fandom.com/wiki/Booster) — Booster types and unlock levels
- [Pet Rescue Saga Tips — HubPages](https://discover.hubpages.com/games-hobbies/Pet-Rescue-Saga-Tips-and-Tricks) — Game rules, objectives, star system
- [Toon Blast Booster Guide](https://tipsandtricksfor.com/toon-blast-boosters-and-combinations-guide) — Special block types
- [Toon Blast Game Analysis — Medium](https://medium.com/@ekinmelissezer/game-analysis-of-toon-blast-mechanics-level-design-difficulty-patterns-and-monetization-signals-022748ae51b4) — Core loop and collapse mechanics
- [Toon Blast Prototype — LinkedIn](https://linkedin.com) — BFS-based connected tile detection
