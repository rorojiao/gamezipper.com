# 100 Doors Puzzle Box - Competitive Benchmark

## Game Overview
- **Slug**: `100-doors`
- **Type**: Point-and-click escape door puzzle game
- **Target**: 50 levels with diverse puzzle mechanics, hint system, star ratings
- **Platform**: Browser (HTML5, single-file, Canvas-based)

## Competitive Analysis

### 1. 100 Doors Challenge (Google Play - Peaksel Games)
- **Downloads**: 50M+ across franchise
- **Mechanic**: Each level = one locked door. Tapping, dragging, shaking, tilting to solve
- **Levels**: 80-100+ per game, multiple sequels
- **Monetization**: Ad-supported (interstitial between levels)
- **Art**: 2D illustrated rooms, varied themes per door
- **Key Takeaway**: Simple concept, massive level variety keeps players engaged

### 2. 100 Doors: Escape Room (Google Play - ZenFox)
- **Downloads**: 10M+
- **Mechanic**: Hidden object + code puzzles + mini-games within each door scene
- **Levels**: 100+ doors, increasing complexity
- **Monetization**: Freemium with hint purchases + ads
- **Art**: High-quality 2D art, atmospheric lighting
- **Key Takeaway**: Quality art elevates perceived value; hint system crucial for retention

### 3. Escape Manor (GameZipper - existing game)
- **Type**: Point-and-click escape room with inventory system
- **Levels**: 30 rooms across 5 chapters
- **Key Takeaway**: Different genre overlap - Escape Manor is multi-room exploration, 100 Doors is single-screen bite-sized puzzles. Different enough to coexist.

## 100 Doors Puzzle Box Game Design Specification

### Core Mechanic
Each level presents a single screen with a locked door. Players must interact with objects on screen (tap, drag, swipe) to find clues, solve mini-puzzles, enter codes, or trigger mechanisms to unlock and open the door. No inventory carry-over between levels - each level is self-contained.

### Level Structure (50 levels across 5 zones)
- **Zone 1: The Cottage** (Levels 1-10) - Tutorial zone, simple tap/drag puzzles
- **Zone 2: The Library** (Levels 11-20) - Code/cipher/number puzzles
- **Zone 3: The Laboratory** (Levels 21-30) - Pattern/logic/sequence puzzles
- **Zone 4: The Tower** (Levels 31-40) - Multi-step combination puzzles
- **Zone 5: The Vault** (Levels 41-50) - Complex multi-mechanic puzzles

### Puzzle Types (at least 15 distinct mechanics)
1. **Simple tap** - Tap the door handle to open (Level 1 tutorial)
2. **Key find** - Tap to reveal hidden key, drag to lock
3. **Color sequence** - Tap colored objects in correct order
4. **Number code** - Find hidden numbers, enter 4-digit code
5. **Slider puzzle** - Slide tiles to reveal keyhole
6. **Pattern repeat** - Watch a pattern of lights, repeat it
7. **Tug/pull** - Drag objects to uncover mechanism
8. **Rotation** - Rotate dials/objects to align symbols
9. **Math equation** - Solve simple equation to get code
10. **Hidden switches** - Tap objects to reveal hidden buttons
11. **Simon says** - Memory pattern game on door panel
12. **Jigsaw placement** - Drag pieces to correct positions
13. **Timing** - Press button at right moment
14. **Counting** - Count specific objects in scene
15. **Symbol matching** - Match symbols between clue and lock

### Systems to Implement
1. **Hint System**: 3 free hints per level, progressive reveal (hint 1: vague direction, hint 2: specific object, hint 3: solution)
2. **Star Rating**: 3 stars per level based on time + hints
   - 3 stars: Under 60s, 0 hints
   - 2 stars: Under 120s, ≤1 hint
   - 1 star: Any completion
3. **Progress Save**: localStorage with level completion + stars
4. **Zone Unlock**: Complete all levels in zone to unlock next
5. **Level Select**: Visual grid showing completion status
6. **Sound Effects**: Web Audio API procedural sounds

### Interaction Design
- **Tap/Click**: Primary interaction - tap objects to interact
- **Drag**: Move items, slide panels, rotate dials
- **Each level is self-contained**: No inventory, no carry-over

### Art Direction
- **Style**: Cozy illustrated rooms, warm lighting
- **Colors**: Warm amber/brown tones with accent highlights per zone
- **Rendering**: Canvas 2D with procedural art (no external images needed)
- **Each door unique**: Distinct color scheme and decorations per level

### Audio Design
- **BGM**: Soft ambient background music (Web Audio procedural)
- **SFX**: Door open, lock click, button press, hint reveal, level complete fanfare
- **All via Web Audio API (procedural)**

### SEO & Meta
- **Title**: Play 100 Doors Puzzle Box Online Free - Escape Door Puzzle Game | GameZipper
- **Description**: Open 50 locked doors by solving clever puzzles! Tap, drag, and think your way through 50 unique brain-teasing escape challenges.
- **Tags**: 100 doors, escape, puzzle, point and click, brain teaser, door puzzle

### Monetization
- Monetag MultiTag: integrated via monetag-manager.js
- CustomEvent dispatches for gameover and level-complete
