# Pool (Billiards) — Competitive Benchmark

## Target Game
- **Slug**: `pool`
- **Category**: Sports / Puzzle
- **Format**: Single-file HTML5 Canvas game

## Competitor Analysis

### 1. 8 Ball Pool (Miniclip)
- **Players**: 500M+ downloads, #1 mobile/web pool game
- **Core Mechanics**: 8-ball rules, aim with mouse drag, power meter, spin control, cue ball placement after scratch
- **Systems**: 
  - Ranked matchmaking (1v1, tournaments)
  - Coin economy (bet coins on matches, buy cues)
  - Cue collection (30+ cues with different stats)
  - Chat & emojis
  - Daily rewards, spin wheel
  - Level progression (1-100)
- **Levels**: Infinite (online matchmaking)
- **Visual**: Realistic 2D top-down, green felt, wooden rails
- **Audio**: Realistic cue hit, ball collision, pocket sounds, ambient crowd

### 2. Pool: 8 Ball Billiards (CrazyGames)
- **Players**: Millions of monthly plays
- **Core Mechanics**: 8-ball and 9-ball modes, simple aim/shoot
- **Systems**:
  - AI opponent (3 difficulty levels)
  - Local 2-player
  - Power gauge
  - Ball-in-hand after scratch
  - Game timer
- **Levels**: N/A (match-based)
- **Visual**: Clean 2D top-down, realistic table
- **Audio**: Hit sounds, pocket sounds

### 3. Billiards (Poki)
- **Players**: Top 20 Poki sports game
- **Core Mechanics**: Standard 8-ball, intuitive controls
- **Systems**:
  - AI opponent
  - Power/angle control
  - Foul tracking
  - Turn indicator
- **Levels**: N/A
- **Visual**: Minimalist 2D, clean UI
- **Audio**: Satisfying physics sounds

## Systems to Implement (ALL REQUIRED)

### Core Gameplay
- [x] Realistic 2D physics engine (ball-ball collision, ball-cushion bounce, friction)
- [x] Cue aiming (line from cue ball to mouse, dotted trajectory)
- [x] Power meter (hold and release, or drag distance)
- [x] Spin control (optional, advanced)
- [x] Ball pocketing (6 pockets, realistic detection)
- [x] Cue ball scratch handling (ball-in-hand placement)

### Game Modes
- [x] 8-Ball (solids vs stripes)
- [x] 9-Ball (numbered sequence)
- [x] Practice (free play, no opponent)

### AI System
- [x] 3 difficulty levels (Easy/Medium/Hard)
- [x] AI aims with slight randomness based on difficulty
- [x] AI evaluates best shots (pocketable balls first)

### Scoring & Progression
- [x] Score per ball pocketed
- [x] Bonus for consecutive shots
- [x] Foul tracking (scratches, wrong ball first)
- [x] Win/loss statistics (localStorage)
- [x] Game history

### Tutorial
- [x] Interactive tutorial: aim, power, rules basics

### Audio (Web Audio API)
- [x] Cue hit sound
- [x] Ball-ball collision sounds
- [x] Ball-cushion bounce sounds
- [x] Pocket sounds
- [x] Foul/error sound
- [x] Win/lose fanfare
- [x] Background music (ambient)

### Visual Design
- [x] Dark neon theme (GameZipper style)
- [x] Green felt table with realistic rails
- [x] Smooth 60fps animations
- [x] Ball shadows
- [x] Trajectory guide line (dotted)
- [x] Power indicator
- [x] Particle effects on pocket

### Key Numerical Values
- Table: 2:1 ratio (standard pool table proportions)
- Ball radius: proportional to table width (~1/32 of table width)
- Physics: coefficient of restitution ~0.95, friction ~0.985 per frame
- Pocket radius: ~1.8x ball radius
- Cue power: 0-20 units (mapped to velocity)
- AI Easy: ±15° aim error, AI Hard: ±3° aim error

## Quality Bar
- Single HTML file, self-contained
- Responsive (desktop + mobile)
- Touch support (tap to aim, drag for power)
- All English UI
- SEO structured data
- Analytics tracking
- localStorage progress saving
