# Stack Ball — Competitor Benchmarking

## Game Overview
Stack Ball is a "helix drop" arcade game where a bouncing ball falls through rotating helix platforms. Tap/click to smash through colored platforms, but avoid black/dark platforms or you lose. The ball bounces on platforms and the player taps to force it through, breaking platforms in a satisfying chain.

## Top Competitors

### 1. Stack Ball - Blast through platforms (by AI Games FZ)
- **Downloads**: 100M+ on Google Play
- **Core Mechanic**: Ball drops through helix tower, tap to smash through colored platforms
- **Levels**: 1000+ levels, endless mode
- **Scoring**: Points per platform broken, combo multipliers for consecutive breaks
- **Power-ups**: Fireball mode (break everything including black platforms after 3 consecutive combos)
- **Visual**: 3D helix tower, colorful platforms, particle effects on break
- **Monetization**: Interstitial ads between levels, rewarded ads for continue

### 2. Helix Jump (by Voodoo)
- **Downloads**: 500M+ 
- **Core Mechanic**: Similar helix drop, rotate tower by swiping left/right
- **Levels**: Endless procedural levels with increasing difficulty
- **Scoring**: Points per platform, bonus for full-helix clears
- **Power-ups**: Super ball (breaks through everything temporarily)
- **Visual**: Minimalist 3D, neon colors, smooth animations
- **Monetization**: Ads between runs, skin shop

### 3. Drop Stack Ball (by Good Kids)
- **Downloads**: 50M+
- **Core Mechanic**: Same helix drop concept with 2D rendering
- **Features**: Multiple ball skins, daily challenges, leaderboards
- **Scoring**: Level-based with 3-star rating system

## Key Systems to Implement

1. **Core Mechanic**: Ball bounces on rotating helix platforms, tap to smash through
2. **Platform Types**:
   - Normal (colored) — can break through
   - Dark/Black — instant death if hit (unless fireball mode)
   - Power-up platforms — grant temporary invincibility
3. **Combo System**: Breaking consecutive platforms without bouncing builds combo
4. **Fireball Mode**: After N consecutive breaks, ball enters fire mode (breaks everything)
5. **Level System**: 50+ levels with increasing difficulty (more black platforms, faster rotation)
6. **Scoring**: Points per platform, combo multiplier, level completion bonus
7. **Progression**: Level unlock, star ratings (1-3), best scores
8. **Ball Skins**: Unlockable skins earned through gameplay
9. **Tutorial**: First-time guide showing tap mechanic
10. **Progress Save**: localStorage with version field
11. **Sound Effects**: Web Audio API (bounce, smash, fireball, death, level complete)
12. **Visual Effects**: Particles on break, screen shake, fire trail, celebration on level complete

## Technical Approach
- 2D Canvas rendering (top-down or side view of helix)
- Ball physics: gravity + bounce + forced descent on tap
- Platform layers with gaps that rotate
- Simple collision detection
- 60fps with delta time
