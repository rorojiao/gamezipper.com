# Tomb of the Mask — Competitive Benchmark

> GameZipper.com | Game Slug: `tomb-of-the-mask`
> Platform Target: Single-file HTML5 Canvas (desktop + mobile web)
> Audience: Western / European casual gamers
> Benchmark Date: June 2026

---

## 1. Original Game Overview

| Field | Detail |
|-------|--------|
| **Title** | Tomb of the Mask |
| **Developer** | Happymagenta (Lithuania) |
| **Publisher** | Playgendary (Cyprus) |
| **First Released** | February 9, 2016 (iOS) |
| **Android** | June 19, 2018 |
| **Genre** | Arcade / Puzzle / Maze |
| **Downloads** | 100M+ (Google Play) |
| **Rating** | 4.1★ / 5 (2.48M reviews) |
| **Metacritic** | 80/100 |

---

## 2. Core Gameplay Mechanics

### 2.1 Movement System
- **Swipe-to-slide**: Swipe Up/Down/Left/Right to move character through vertical maze
- **Slide until stopped**: Character slides continuously until hitting a wall or obstacle
- **Pac-Man-like**: Grid-based movement through corridors
- **Controls**: Touch swipe (mobile), Arrow keys / WASD (web)

### 2.2 Two Game Modes
#### Arcade Mode (Endless)
- Procedurally generated vertical maze scrolling upward
- Rising lava chases player — constant urgency
- High-score chasing: dots + coins + distance = score

#### Stage Mode (Levels)
- 700+ handcrafted stages
- Self-contained maze puzzles with clear exit
- Progressive difficulty

---

## 3. Collectibles & Scoring
- **Dots**: Scattered in corridors, base points
- **Coins**: Higher value, used as currency
- **Scoring**: dots×10 + coins×50 + distance bonus + time bonus

---

## 4. Power-Up System

| Power-Up | Effect |
|----------|--------|
| **Shield** | Protects from one hit |
| **Magnet** | Attracts nearby coins/dots |
| **Freeze** | Immobilizes enemies |
| **Speed Boost** | Faster movement |

---

## 5. Enemies & Hazards
- **Spikes**: Fixed deadly tiles
- **Spike Traps**: Emerge/retract on timer
- **Pufferfish**: Inflate/deflate periodically
- **Cannons**: Fire projectiles at intervals
- **Bats**: Patrol predefined paths
- **Snakes**: Patrol corridors

---

## 6. Art Style
- Retro pixel art with neon colors
- Dark background, bright neon outlines
- 8-bit arcade aesthetic (compared to Downwell + Pac-Man)
- Color scheme: dark blue/black bg, yellow-green player, neon walls

---

## 7. Music Style
- Chiptune / 8-bit retro
- Fast-paced, loop-based
- Arcade cabinet feel

---

## 8. Key "One More Try" Factors
1. Instant restart (< 1 second)
2. Short sessions (10-60 seconds per attempt)
3. Rising lava = constant tension
4. Skill expression through mastery
5. Collection compulsion (masks, perks)

---

## 9. What We Must Implement
- Grid-based swipe-to-slide movement
- Vertical scrolling maze with rising lava
- Dots + coins collection
- 4 power-ups (Shield, Magnet, Freeze, Speed)
- Enemies (bats, snakes) + hazards (spikes, traps)
- Scoring system with combo multiplier
- Tutorial system
- At least 25 handcrafted levels + endless arcade mode
- Retro neon pixel art style
- Chiptune BGM + SFX via Web Audio API
