# Tangram Puzzle — Competitor Benchmark

## Game Overview
Tangram is an ancient Chinese dissection puzzle consisting of 7 flat polygons (called tans) that are put together to form shapes. The objective is to replicate a pattern using all seven pieces without overlap.

## The 7 Tans (Standard Set)
1. 2 large right triangles
2. 1 medium right triangle
3. 2 small right triangles
4. 1 square
5. 1 parallelogram

## Competitor Analysis

### 1. Polygrams - Tangram Puzzles (RV AppStudios)
- **Platform**: iOS + Android (50M+ downloads)
- **Levels**: 999+ brain-teasing puzzles
- **Systems**: 
  - Achievements system with coins
  - Beginner + Master difficulty modes
  - Hint system
  - Daily challenges
  - Progress saving
  - Colorful minimalistic design
  - One-touch gameplay
  - No internet required
- **Art Style**: Colorful, minimalistic, flat design
- **Music**: Calming ambient

### 2. Tangram Puzzle: Polygrams Game (App Store)
- **Platform**: iOS (Top charts)
- **Levels**: 999+ HD picture puzzles
- **Systems**:
  - Endless rewards + achievements
  - Multiple game modes
  - Coin collection
  - Progress tracking
  - Hints
- **Art Style**: Clean, vibrant, neon accents

### 3. Blocks Fill Tangram (CrazyGames)
- **Platform**: Browser (CrazyGames)
- **Levels**: 12 journeys × 80 levels = 960 levels
- **Systems**:
  - Journey/level structure
  - Star rating per level
  - Progress saving
  - Block fitting mechanic (variant)
- **Art Style**: Colorful blocks, simple clean

### 4. Tangram Puzzle Online (PlayBrain)
- **Platform**: Browser
- **Levels**: 12 unique puzzles
- **Systems**:
  - Drag-and-drop controls
  - Rotation
  - Hints
  - Time tracking / best time
  - Simple UI
- **Art Style**: Clean, classic

### 5. Tangram (BrainPlay)
- **Platform**: Browser
- **Systems**:
  - Fixed orientation pieces (simpler variant)
  - Progressive difficulty
  - Board-filling mechanic

## Feature Requirements (Must-Have for S-Grade)

### Core Gameplay
- 7 standard tangram pieces with correct proportions
- Drag and drop placement
- Piece rotation (45° increments)
- Piece flipping (for parallelogram)
- Snap-to-grid / snap-to-position
- Ghost/silhouette target shape
- All 7 pieces must be used (no overlap)

### Level System
- **Minimum 30 levels** across 5 difficulty tiers:
  - Beginner (6 levels): Simple shapes, pieces pre-oriented
  - Easy (6 levels): Basic animals/objects
  - Medium (6 levels): More complex silhouettes
  - Hard (6 levels): Challenging compositions
  - Expert (6 levels): Very complex, abstract shapes
- Progressive difficulty
- Star rating (1-3 stars based on time/hints used)
- Level selection screen with completion status

### Systems
- **Scoring**: Points based on time + hints used + accuracy
- **Hints**: Show correct position of one piece (limited hints, earned by completing levels)
- **Tutorial**: Interactive tutorial teaching drag, rotate, flip
- **Progress saving**: localStorage with version field, tracks completed levels, stars, hints
- **Achievements**: First completion, speed demon, no-hint master, etc.
- **Undo/Reset**: Reset current level, undo last placement

### Art Style
- Dark gradient background (GameZipper style)
- Neon-colored pieces with subtle gradients
- Smooth animations for piece placement
- Particle effects on level completion
- Glass-morphism UI panels

### Music & Sound
- Calming ambient BGM (Web Audio API procedural)
- Piece pickup sound
- Piece placement snap sound
- Rotation click sound
- Level complete celebration
- Hint reveal sound
- Button click feedback

### SEO & Analytics
- Analytics script
- JSON-LD (VideoGame + FAQPage + HowTo + BreadcrumbList)
- OG tags
- Title: "Play Tangram Puzzle Online Free - Arrange 7 Pieces | GameZipper"
