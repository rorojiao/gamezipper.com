# Mahjong Solitaire — Competitor Benchmark

## Competitors Analyzed

### 1. Microsoft Mahjong / Mahjong Titans
- **Layouts**: Turtle, Dragon, Fortress, Crab, and more (6+ layouts)
- **Systems**: Daily challenges, hints, undo, shuffle, timer, scoring by speed
- **Tiles**: 144 traditional tiles (Bamboo, Circles, Characters, Winds, Dragons, Seasons, Flowers)
- **Scoring**: Base points per match + time bonus + combo multiplier
- **Difficulty**: Progressive (more complex layouts unlock)
- **Visual**: Clean 3D-ish tiles with shadow depth, traditional green felt background

### 2. Mahjongg Solitaire (CrazyGames)
- **Layouts**: Single classic layout, timed
- **Systems**: No shuffle, timed, traditional rules
- **Visual**: Modern clean tiles, simple background

### 3. Mahjong Classic (CrazyGames)
- **Systems**: Infinite hints, shuffle, no time limit
- **Visual**: Modern, clean

### 4. Mahjong Unlimited (Playgama)
- **Layouts**: Infinitely generated levels
- **Systems**: 4 difficulty modes, optional timer, customizable visuals

### 5. Vita Mahjong
- **Systems**: Daily challenges, multiple layouts, brain training mode
- **Scoring**: Score + best score, time tracking

### 6. Mahjong Solitaire (Google Play)
- **Systems**: Hints, undo, shuffle, bombs, daily rewards, multiple themes
- **Progression**: Level-based with increasing difficulty

## Systems to Implement (ALL REQUIRED)

### Core Gameplay
- [x] Classic tile matching: match 2 identical free tiles
- [x] Free tile definition: not blocked by other tiles on left/right AND no tile on top
- [x] Special tiles: Seasons match any season, Flowers match any flower (4 groups)
- [x] Traditional 144-tile set: 36 Bamboo + 36 Circles + 36 Characters + 16 Winds + 12 Dragons + 4 Seasons + 4 Flowers

### Layout System (Minimum 10 Layouts)
- [x] Level 1-3: Turtle (classic) — easy, 3 layers
- [x] Level 4-5: Cross — medium
- [x] Level 6-7: Fortress — harder, compact
- [x] Level 8-9: Dragon — large spread
- [x] Level 10: Pyramid — triangular, challenging
- [x] Level 11-12: Diamond
- [x] Level 13-14: Spider Web
- [x] Level 15: Fortress Advanced
- [x] Level 16-18: Mixed advanced layouts
- [x] Level 19-20: Expert layouts

### Scoring System
- Base: 10 points per match
- Combo: x2 multiplier for consecutive matches under 3 seconds
- Time bonus: remaining seconds × 5 at level completion
- Hint penalty: -20 per hint used
- Undo penalty: -10 per undo
- Shuffle penalty: -50 per shuffle
- Star rating: 3 stars (>2000pts), 2 stars (>1000pts), 1 star (completed)

### Power-ups / Tools
- [x] Hint: highlights a valid pair (limited: 3 per level)
- [x] Shuffle: rearranges remaining tiles (limited: 2 per level)
- [x] Undo: undo last match (limited: 5 per level)
- [x] Bomb: remove any single tile (earned every 5 levels)

### Progression System
- [x] 20 levels, progressive difficulty
- [x] Unlock next level by completing current
- [x] Star ratings per level
- [x] Total stars tracked
- [x] localStorage save with version field

### Tutorial
- [x] First-time interactive tutorial (Level 1)
- [x] Highlight free tiles with glow
- [x] Explain matching rules
- [x] Skippable with "Skip Tutorial" button

### UI/UX
- [x] Dark gradient background (GameZipper style)
- [x] Tile design: traditional mahjong symbols rendered on canvas
- [x] Selected tile highlight (glow border)
- [x] Match animation (particles + scale)
- [x] Invalid match feedback (shake)
- [x] Timer display
- [x] Score display with combo indicator
- [x] Level select screen with star ratings
- [x] Pause menu
- [x] Sound toggle
- [x] Mobile: tap to select, large tiles

### Audio (Web Audio API)
- [x] BGM: Ambient oriental-style procedural music
- [x] Tile select sound
- [x] Match success sound
- [x] Invalid match sound
- [x] Level complete fanfare
- [x] Combo sound (escalating pitch)
- [x] Hint reveal sound
- [x] Shuffle sound

### Win/Lose Conditions
- Win: All tiles matched
- Lose detection: No valid moves remaining (offer shuffle if available)
- Shuffle check: After each match, verify valid moves exist

## Art Style
- Traditional Chinese mahjong aesthetic
- Deep green/teal gradient background
- Ivory/cream colored tiles with red/blue/green symbols
- Gold accent for selections and highlights
- Subtle shadow/depth for tile stacking
