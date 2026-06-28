# Slingshot Puzzle — Benchmark Document

## Core Game Concept
Physics-based puzzle game where the player pulls back a slingshot/elastic and launches a projectile to hit targets, knock down structures, or collect items using angle + power calculations.

## Competitor Analysis

### 1. Angry Birds (Rovio Entertainment)
- **Platform**: iOS, Android, Browser, Console
- **Downloads**: 4B+ cumulative franchise
- **Core Mechanic**: Pull back slingshot, release to launch bird; destroy structures and pigs
- **Level Count**: Hundreds per game variant
- **Difficulty Curve**: Progressive — introduces new bird types and structure materials
- **Scoring**: Stars based on score threshold (1-3 stars); high score per level
- **Customization**: Different bird abilities (speed boost, split, bomb)
- **Art Style**: Colorful cartoon, 2D physics, satisfying destruction

### 2. Crush the Castle / Siege Hero
- **Platform**: Browser, iOS, Android
- **Mechanic**: Aim projectiles to destroy castle structures; limited ammo

### 3. Ragdoll Cannon
- **Platform**: Browser
- **Mechanic**: Launch from cannon to reach goal; trajectory prediction

## Systems to Implement (Mandatory)

### Core Systems
1. **Slingshot System**: Drag-back-to-aim with visible elastic band
2. **Physics System**: Projectile ballistic motion (gravity + velocity)
3. **Trajectory Preview**: Dotted predicted path while aiming
4. **Target System**: Breakable targets, collectible items, goal zones
5. **Obstacle System**: Static walls, destructible blocks, bounce pads
6. **Collision Detection**: Projectile vs targets/obstacles/walls

### Progression Systems
7. **Level Select**: Grid with lock/unlock/3-star status
8. **Star Rating**: 1-3 stars based on shots used (fewer = more stars)
9. **Difficulty Progression**: 5 tiers × 6 levels = 30 levels

### Scoring & Feedback
10. **Score System**: Points per target hit; efficiency bonus
11. **Shot Counter**: Limited shots (3-5) per level
12. **Particle Effects**: Impact bursts, destruction, confetti
13. **Screen Effects**: Subtle shake on impact

### Save & Settings
14. **Progress Save**: localStorage (version, completion, stars)
15. **Sound Toggle**: Mute/unmute
16. **Haptic Feedback**: navigator.vibrate on mobile

### Tutorial
17. **Tutorial**: First 3 levels with hint overlays

## Art Style Reference
- Dark gradient background (GameZipper style)
- Neon glowing projectile (cyan/white core)
- Wooden/metal targets, crack textures
- Slingshot Y-frame with visible elastic band
- Particle trail behind projectile

## Music Style
- Casual/relaxing electronic, soft synth pads
- SFX: stretch, release, impact, break, win
