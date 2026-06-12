# Blumgi Slime — Game Benchmark Report

## 1. Overview

Blumgi Slime is a casual one-button physics platformer developed by Blumgi, an independent game studio based in France. Originally released in February 2023 and last updated in July 2024 (mobile: June 2025), the game features a cute slime character that can only move by jumping. The player charges a jump by holding down a button, then releases to launch — the longer the hold, the higher and farther the slime flies. The goal is to reach a checkered flag platform at the end of each level while dodging spikes, pits, moving obstacles, springs, portals, and reverse-gravity sections.

Key facts:
- Genre: Arcade / Skill / Platform
- Platforms: Browser (Poki), Android, iOS, Windows
- Poki rating: 4.3 / 5 across 970,211 votes
- Likes: 791.3K, Dislikes: 178.9K
- Google Play: 4.5 stars from 259 reviews, 50K+ downloads
- Levels: 150 levels across 15 themed worlds (10 levels/world)
- Two-player local multiplayer mode (added in a later update)
- Free-to-play with ads; no paid IAP confirmed

## 2. Primary Competitors (Top 3)

### A. Stickman Hook (Madbox)
- Developer: Madbox (Poki exclusive)
- Release: December 2018; latest update September 2025
- Poki rating: 4.4 / 5 across 7,753,435 votes
- Levels: Hundreds (Classic mode) + Grapplehook mode unlocks after 30 levels
- Mechanics: Tap/hold to attach a grappling hook to anchor points; release to swing and chain momentum
- Skins: 23 total — 9 progression skins (8 unlocked via play), 14 watch-ad skins
- Monetization: Ad-supported; skins unlocked via watching ads
- Art style: Minimalist black stickman on white/colorful backgrounds
- Why a competitor: Single-button skill-based arcade with momentum-and-timing mastery

### B. Red Ball 4 (Yohoho Games)
- Poki rating: 4.5 / 5 across 1,150,727 votes
- Levels: 70 levels across themed worlds (regular + moon world)
- Mechanics: Two-button control (arrows to roll, Up/Space to jump). Physics-based rolling ball that can push boxes to solve puzzles. Enemy monster cubes defeated by jumping on them.
- Collectibles: Stars scattered per level — collecting all earns a gold medal
- Art style: Bright 2D cartoon, friendly red-ball protagonist, varied themed worlds
- Why a competitor: Long-running Poki platformer with similar level-based progression

### C. Slime Laboratory
- Genre: Slime-themed casual platformer / puzzle
- Mechanics: Slime avatar with physics-based movement through obstacle-filled lab environments (acid pits, spikes, conveyers)
- Art style: Bright, gooey slime aesthetic, cartoonish
- Why a competitor: Direct thematic overlap — also a slime hero platformer on Poki

## 3. Feature Comparison Matrix

| Feature | Blumgi Slime | Stickman Hook | Red Ball 4 | Slime Lab |
|---|---|---|---|---|
| One-button control | Yes | Yes | No (4 keys) | Yes |
| Total levels | 150 | Hundreds | 70 | Many |
| Worlds / themes | 15 themed worlds | Linear color sets | Multiple themed worlds | Lab levels |
| Skins / cosmetics | Unlockable via coins | 23 (progression + ad) | Limited | Limited |
| Two-player mode | Yes (local) | No | No | No |
| Physics puzzle elements | Springs, portals, reverse gravity | Springs, momentum | Boxes, enemies | Acid, conveyers |
| Coins/collectibles | Yes | N/A | Stars per level | Per-level pickups |
| Time-based scoring | Yes | N/A | N/A | N/A |
| Mobile + desktop | Yes | Yes | Yes | Yes |
| Ad-supported | Yes | Yes | Yes | Yes |
| Rating (Poki) | 4.3 | 4.4 | 4.5 | ~4.2-4.4 |

## 4. Game Mechanics Analysis

Blumgi Slime uses a charge-and-release jump mechanic. The slime has no walking; the only motion is a parabolic arc whose power scales with hold duration. This produces:
- High skill ceiling: players develop muscle memory for partial vs full charges
- Touch-friendly: works equally on mouse, touch, and stylus
- Predictable physics: single input simplifies state space

Variety comes from environmental additions:
- Spikes, pits, lava — instant-fail hazards
- Moving platforms — rhythm-based timing
- Springs — amplify jump power
- Portals — teleport between locations
- Reverse gravity — flips orientation in later levels
- Checkered platforms / flags — level endpoint

## 5. Monetization Analysis

All competitors use the ad-supported free-to-play model on Poki. Blumgi Slime's ad timing (after death/level end) follows best practice. Stickman Hook's watch-an-ad-to-unlock-skin system is the most elegant monetization loop.

## 6. Art & Audio Style

- 2D vector-style with soft pastel palette
- Cute rounded slime character with expressive squash-and-stretch animation
- Each world has distinct color theme and background motif
- Bouncy, light SFX (boing, pop, success chime)

## 7. Recommendations for Our Version

1. Keep single-button charge-jump core — key reason for broad mobile appeal
2. Target 80-150 hand-tuned levels in 8-15 themed worlds
3. Add coins + cosmetic skins as long-tail progression
4. Place ads only after death or level completion
5. Add charge meter / visual feedback for jump power
6. Ship mobile-first with responsive desktop
7. Distinctive visual identity — avoid generic green slime
8. Retention hooks: best scores, star ratings per level
