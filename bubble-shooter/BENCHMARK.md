# Bubble Shooter — Competitive Benchmark

## Target Game
**Slug**: bubble-shooter
**Type**: Puzzle / Arcade (Aim-and-Shoot Bubble Matching)

## Market Data
- 500M+ all-time downloads across app stores
- Consistently top-10 puzzle game globally
- Classic casual genre with proven retention (color matching + satisfying pop mechanics)

## Top 3 Competitors

### 1. Bubble Shooter Classic (BrainStation)
- **Core Mechanic**: Aim with mouse/touch → shoot bubble from bottom → matches 3+ same-color → pop → floating bubbles fall
- **Levels**: 1000+ procedurally generated
- **Systems**:
  - Score: Base 10pts per bubble, combo multiplier for chain reactions, bonus for hanging bubbles
  - Star rating: 1-3 stars based on score thresholds
  - Aim line: Dotted trajectory preview (bounces off walls)
  - Wall bounce: Bubbles bounce off left/right walls once
  - Next bubble preview: Shows next 2 bubbles
  - Special bubbles: Bomb (clears area), Rainbow (matches any color), Fire (burns through column)
  - Power-ups: Aim assist, color swap, bomb
  - Progress: Level select with stars, localStorage save
- **Art**: Clean 2D, colorful bubbles with glossy/shiny effect, gradient backgrounds
- **Music**: Relaxing ambient, satisfying pop sound effects

### 2. Bubble Shooter by Ilyon (Bubble Shooter!)
- **Core Mechanic**: Same aim-and-shoot, adds ceiling push mechanic
- **Levels**: 5000+
- **Systems**:
  - Score: Points per pop, combo chains, streak bonus
  - Star rating: 1-3 stars
  - Aim line: Limited range (shows ~30% of trajectory)
  - Special bubbles: Color bomb, lightning, fireball
  - Power-ups: Swap, aim boost, extra bubbles
  - Daily rewards, spinning wheel, energy system
  - Social: Leaderboard, Facebook login
- **Art**: Bright cartoon style, themed backgrounds per level pack
- **Music**: Upbeat, cheerful

### 3. Puzzle Bobble / Bust-a-Move (Taito classic)
- **Core Mechanic**: Classic origin — aim shooter, match 3+ bubbles
- **Levels**: 100+ handcrafted with increasing complexity
- **Systems**:
  - Score: Drop bonus (hanging bubbles), speed bonus, clear bonus
  - Ceiling drops each turn (adds urgency)
  - Two-player mode
  - Special patterns for bonus points
- **Art**: Retro pixel art, iconic characters
- **Music**: Catchy chiptune

## Systems to Implement (Minimum Viable)

### Core Gameplay
1. **Bubble Grid**: Hex-offset grid (even rows offset), starting from top
2. **Shooter**: Fixed at bottom center, aim with mouse/touch
3. **Aim Line**: Dotted trajectory preview with wall bounce visualization
4. **Bubble Physics**: Linear trajectory, one wall bounce, snap to grid on contact
5. **Match Detection**: Flood-fill to find connected same-color groups ≥3
6. **Pop Animation**: Scale + fade + particles
7. **Drop Detection**: After pop, check for floating (disconnected) bubbles → drop them with gravity
8. **Ceiling**: If bubbles reach bottom row → game over

### Scoring System
- Pop bubble: 10 pts each
- Drop bonus: 15 pts per dropped bubble
- Combo: Chain reactions multiply score (x2, x3, etc.)
- Level clear bonus: Remaining shots × 50 pts
- 3-star rating per level based on score thresholds

### Progression
- 30 levels minimum (5 packs × 6 levels)
- Difficulty progression: fewer colors early (3), more later (6)
- Level select screen with star display
- localStorage save: current level, best scores, stars

### Power-ups (every 5 levels unlock one)
1. **Color Bomb**: Clears all bubbles of targeted color
2. **Swap**: Swap current and next bubble
3. **Aim Line+**: Extended trajectory preview
4. **Fireball**: Burns through bubbles in a line

### Special Bubbles (appear in later levels)
- **Bomb**: Pops surrounding 3×3 area
- **Rainbow**: Matches any color
- **Stone**: Cannot be popped, must be dropped (appears T3+)

### Audio (Web Audio API procedural)
- Pop sound: Short sine wave with quick decay
- Drop sound: Descending pitch sweep
- Shoot sound: Quick "whoosh"
- Level complete: Ascending arpeggio
- Game over: Descending tones
- BGM: Ambient electronic, gentle pads

### UI/UX
- Title screen with play button
- Level select grid with stars
- In-game: Score (top-left), shots remaining (top-right), current + next bubble (bottom)
- Pause menu: Resume, Restart, Settings (sound toggle, music toggle)
- Tutorial: First level shows aim line + "Tap to shoot" overlay

### Visual Style
- Dark gradient background (GameZipper style)
- Glossy bubbles with inner highlight/shadow
- Particle effects on pop (small circles scatter)
- Smooth animations (bubble travel, pop, drop)
- Glass-morphism panels

## Key Technical Challenges
1. **Hex grid coordinate system**: Offset coordinates for bubble placement
2. **Aim trajectory with wall bounce**: Calculate reflection point
3. **Flood-fill match detection**: BFS/DFS from placed bubble
4. **Floating bubble detection**: Check connectivity to ceiling after removal
5. **Snap-to-grid**: Find nearest valid grid position for placed bubble
6. **Collision detection**: Circle-circle for bubble-bubble, circle-line for walls
