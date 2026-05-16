# SoliTen — Competitive Benchmark

## Core Concept
SoliTen (Sum to 10) is a number puzzle game that combines solitaire card mechanics with match-10 gameplay. Players select numbered cards (1-9) to reach a sum of exactly 10, clearing them from the board. The game features zen-inspired aesthetics with calming visuals and soundtrack.

## Competitive Analysis

### Competitor 1: SoliTen by Tummy Games (Primary Benchmark)
- **Platform**: iOS + Android
- **Downloads**: 10,000+ (AppBrain)
- **Core Mechanic**: Tap cards to levitate, select combinations that sum to 10, clear all cards to complete level
- **Levels**: "Hundreds of unique board layouts"
- **Progression**: Increasing complexity, gentle difficulty curve
- **Visual Style**: Zen-inspired, calming, card levitation animation
- **Audio**: Soothing soundtrack, immersive sound design
- **Key Features**:
  - Match-10 card game mechanics (1-9 cards)
  - Tap to levitate cards, strategic selection
  - Power-ups (strategic)
  - Offline play, no ads (premium feel)
  - Beautiful zen environments

### Competitor 2: Number Match / Match Ten by Easybrain
- **Platform**: Mobile (massive hit)
- **Core Mechanic**: Cross out pairs of identical numbers OR pairs that sum to 10
- **Grid-based**: Numbers on a grid, cross out matching pairs
- **Scoring**: +150 for clearing all, +10 for rows, +4 for connecting far-apart numbers
- **Features**: Endless levels, hints, jokers (Add Rows, Hint, Bomb, Swap)
- **Star Rating**: Complete levels quickly for up to 3 stars

### Competitor 3: Make 10 (Grid-based variant)
- **Core Mechanic**: Drag number blocks onto 6x6 grid, align blocks in row/col that sum to 10
- **Game Over**: Board fills up, no more moves
- **Style**: Arcade/block-placement

### Competitor 4: Poki NUMBERS
- **Core Mechanic**: Cross out pairs that sum to 10 or identical numbers
- **Grid-based**: Line-by-line clearing
- **Special**: Can pair end-of-line with start-of-next-line

## Systems to Implement

### 1. Core Gameplay
- Grid/board of numbered cards (1-9)
- Tap cards to select them (levitate effect)
- Selected cards must sum to exactly 10
- When valid combination found → cards clear with animation
- Clear ALL cards to complete the level
- If stuck (no valid 10-sum combinations) → lose/shuffle option

### 2. Level System (30 levels minimum)
- Level 1-5: Small boards (4x3 = 12 cards), easy sums
- Level 6-15: Medium boards (5x4 = 20 cards), moderate difficulty
- Level 16-25: Larger boards (6x4 = 24 cards), harder combinations
- Level 26-30: Large boards (6x5 = 30 cards), complex puzzles
- Each level has a unique solvable card layout
- Difficulty progression: fewer obvious pairs, more strategic thinking needed
- Star rating: 1-3 stars based on moves used (par system)

### 3. Scoring System
- Base points per card cleared: 10
- Combo bonus: clearing multiple sets quickly = multiplier
- Star rating: Par moves system
  - 3 stars: at or under par moves
  - 2 stars: up to 1.5x par
  - 1 star: completed
- Level completion bonus: 100 + remaining cards bonus
- Total score accumulation across levels

### 4. Power-ups / Hints
- Hint: Highlights one valid 10-sum combination (3 per game)
- Shuffle: Rearranges remaining cards (2 per game)
- Undo: Reverses last move (5 per game)
- Power-ups earned through level completion / scoring

### 5. Progression & Save
- localStorage save: current level, best score per level, stars earned
- Total stars tracked for overall progress
- Version field for save migration
- Settings: sound toggle, music toggle, reset progress

### 6. Tutorial System
- Level 1 doubles as tutorial
- Step-by-step overlay: "Tap cards that add up to 10"
- Animated hand/drag guide
- Can skip tutorial

### 7. Visual Design
- Zen-inspired dark theme with soft gradients
- Card levitation animation on tap
- Particle effects on card clear
- Smooth transitions between levels
- Ambient floating particles in background
- Soft color palette: deep purples, teals, warm golds

### 8. Audio Design
- Calming ambient BGM (Web Audio API procedural)
- Card tap sound
- Card levitate sound
- Match found sound (satisfying chime)
- Level complete celebration
- Combo sounds
- UI button sounds

## Key Differentiators for GameZipper Version
- Web-first design (playable on any browser)
- Touch + mouse support
- Single-file HTML5 (no downloads)
- Instant play, no registration
- Mobile responsive (390x844 to 1280x720)
