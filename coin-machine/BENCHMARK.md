# Coin Merge Machine — Competitive Benchmark

## Overview
Coin Merge Machine is a physics-based merge puzzle game (Suika/Watermelon-style) themed around coins. Players drop coins into a machine, identical coins merge on contact to create higher-value coins. The goal is to create the highest-value coin possible before the machine overflows.

## Competitors Analyzed

### 1. Coin Merge Machine (Kuyi Mobile / GamePush)
- **Platforms**: Poki (10K+ likes), GamePix (6.8/30 votes), Agame
- **Released**: March 2025
- **Engine**: Unity WebGL
- **Core Mechanic**: Drop coins into a container, identical coins merge on contact
- **Coin Hierarchy**: Bronze → Silver → Gold (1 → 2 → 4 → 8 → 16 → 32 → 100)
- **Game Over**: Machine fills above a line
- **Key Feature**: Next coin preview, physics-driven drops, chain reactions for bonus
- **Developer**: GamePush (Agame listing) / Kuyi Mobile (Poki listing)
- **Monetization**: Ads (Poki wrapping)

### 2. Watermelon Merge / Suika Game
- **Downloads**: 100M+ (mobile), massive viral hit
- **Core Mechanic**: Same as Coin Merge but with fruit theme
- **Hierarchy**: Cherry → Strawberry → Grape → Orange → Persimmon → Apple → Pear → Peach → Pineapple → Melon → Watermelon (11 tiers)
- **Physics**: Soft-body physics, realistic collisions
- **GZ Coverage**: YES (Watermelon Merge exists)
- **Difference**: Fruit vs Coins, different merge chain

### 3. Merge the Numbers (Poki)
- **Core Mechanic**: Drop number tiles, same numbers merge (2048-style but with physics)
- **Hierarchy**: 2 → 4 → 8 → 16 → 32 → 64 → 128 → 256 → 512 → 1024 → 2048
- **Physics**: Gravity-based, tiles fall and stack
- **GZ Coverage**: YES (Merge the Numbers exists on Poki, unclear if GZ has it)

### 4. Block Hexa Merge 2048
- **Core Mechanic**: Hex grid merge
- **Different**: Grid-based, not physics drop — not a direct competitor

## Systems to Implement

### Core Gameplay
- Physics engine (gravity, collision detection, bouncing)
- Coin dropping from top (tap/click to drop)
- Coin merging on contact (same value → double value)
- Chain reactions (merged coin triggers further merges)
- Game over detection (overflow line)
- Score tracking (sum of all merges)

### Coin Hierarchy (11 tiers)
| Level | Value | Name | Color |
|-------|-------|------|-------|
| 1 | 1 | Copper | #B87333 |
| 2 | 2 | Bronze | #CD7F32 |
| 3 | 4 | Silver | #C0C0C0 |
| 4 | 8 | Gold | #FFD700 |
| 5 | 16 | Platinum | #E5E4E2 |
| 6 | 32 | Emerald | #50C878 |
| 7 | 64 | Ruby | #E0115F |
| 8 | 128 | Sapphire | #0F52BA |
| 9 | 256 | Diamond | #B9F2FF |
| 10 | 512 | Amethyst | #9966CC |
| 11 | 1024 | Legendary | #FF4500 |

### UI Systems
- Score display (top center)
- Next coin preview (top right)
- Best score (localStorage)
- Settings (sound toggle, music toggle)
- Tutorial overlay (first visit)
- Game over screen with restart

### Progression
- Endless mode (no levels, high score chase)
- Unlock notification when creating a new coin type for the first time
- Collection tracker (which coin types have been created)

### Audio
- Drop sound (satisfying clink)
- Merge sound (rising tone based on coin value)
- Chain reaction sound (escalating pitch)
- Game over sound (descending tone)
- Background music (casual/ambient loop)

### Visual Style
- Dark machine/chamber aesthetic (metallic look)
- Coins rendered as circles with metallic gradients
- Value displayed on each coin
- Particle effects on merge (sparkle burst)
- Shake effect on big merges
- Glow effect on high-value coins

## GZ Gap Analysis
- GZ has Watermelon Merge (fruit theme) but NO coin merge game
- Coin theme has broader casual appeal (everyone likes money)
- Coin merge = more satisfying for casual players (vs fruit which is niche)
- SEO keywords: "coin merge", "merge coins", "coin machine", "drop coins game"

## Technical Approach
- Canvas 2D rendering (no WebGL needed for circles)
- Simple circle-circle collision detection
- Circle physics: gravity, velocity, bounce (coefficient of restitution)
- Container walls: rectangle boundaries with collision
- Merge detection: check all pairs of touching circles with same value
- Performance: spatial hashing for collision (grid-based, not O(n^2))
- Max ~50 coins on screen at once (manageable)
