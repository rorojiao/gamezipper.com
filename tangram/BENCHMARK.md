# Tangram Puzzle — Competitive Benchmark

## Core Mechanics
Seven geometric pieces (tans): 2 large triangles, 1 medium triangle, 2 small triangles, 1 square, 1 parallelogram. Arrange all pieces to fill a target silhouette without overlaps.

## Competitor Analysis

### 1. Polygrams - Tangram Puzzles (iOS/Android)
- **Levels**: 2500+ brain-teasing levels
- **Systems**: Beginner + Master difficulty tiers, hint system, progress tracking, Game Center achievements
- **Art**: Colorful flat design, simple geometric aesthetics
- **UX**: One-touch gameplay, one-hand playable, no WiFi required

### 2. Blocks - New Tangram Puzzles (iOS)
- **Levels**: 1935+ levels (still growing)
- **Systems**: Daily puzzles, hint system, level progression, star rating
- **Art**: Clean minimalist blocks, gradient backgrounds
- **UX**: Drag and rotate, daily challenges, progress sync

### 3. Tangram Puzzles - Math Playground (Web)
- **Levels**: 25 puzzles
- **Systems**: Snap-to-position, click and drag, visual feedback
- **Art**: Colorful geometric pieces, grid overlay
- **UX**: Simple browser play, mouse/touch

### 4. FreeGames.org Tangrams (Web)
- **Levels**: Multiple silhouette puzzles
- **Systems**: Drag to move, rotate pieces, free play mode
- **Art**: Classic tan colors on clean background

## Target Feature Set (Must Implement)

### Core Gameplay
- 7 tangram pieces with accurate proportions (based on standard tangram ratios)
- Drag to move pieces, tap/button to rotate (45° increments), double-tap to flip
- Snap-to-grid and snap-to-target-position
- Target silhouette displayed as shadow/outline
- Win detection: all pieces placed within silhouette bounds

### Level System (Minimum 30 levels, 5 difficulty tiers)
- **Easy (6 levels)**: Simple shapes (square, rectangle, triangle, house, boat, arrow)
- **Medium (6 levels)**: Animals (cat, dog, bird, fish, rabbit, swan)
- **Hard (6 levels)**: Complex animals/objects (horse, camel, runner, candle, heart, bridge)
- **Expert (6 levels)**: Abstract/artistic shapes
- **Master (6 levels)**: Very complex multi-part figures
- Each level shows target silhouette, piece tray at bottom
- Stars: 1-3 stars based on hints used and time

### Scoring System
- Base score per level (100 points)
- Time bonus: faster = more points (up to 200 bonus)
- Hint penalty: -25 points per hint used
- 3-star threshold: 250+, 200+, 150+

### Hint System
- 3 hints per level (free)
- Hint shows one piece in its correct position
- Hints regenerate daily (for daily puzzles)

### Progress System
- localStorage save: current level, completed levels, stars, hints used
- Level select screen with star display
- Progress percentage per difficulty tier
- Total completion tracking

### Tutorial System
- Level 1: Guided tutorial showing drag mechanics
- Level 2: Shows rotation
- Level 3: Shows flipping (parallelogram)
- Can skip tutorial

### UI/UX
- Level select: grid of thumbnails with lock/star icons
- Game screen: silhouette target (top), piece tray (bottom)
- Controls: rotate button, flip button, hint button, reset button
- Settings: sound toggle, reset progress
- Dark theme with neon accents (GameZipper style)

### Audio
- BGM: Ambient puzzle music (Web Audio API procedural)
- SFX: piece pickup, piece drop, snap, rotate, flip, hint, level complete, star earned

## Technical Notes
- All 7 pieces defined as polygons with standard tangram proportions
- Target silhouettes stored as polygon outlines
- Collision detection: point-in-polygon for piece placement
- Win condition: all piece centroids within target silhouette bounds
- Pieces must not overlap (overlap detection)
