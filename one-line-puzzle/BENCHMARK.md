# One Line Puzzle — Competitive Benchmark

## Game Overview
A puzzle where players draw a single continuous line through ALL dots on a grid without crossing or retracing any line segment. Each line segment between adjacent dots can only be used once.

## Competitors Analyzed

### 1. 1Line: Connect Dots (nixGames)
- **Platform**: Android, 50K+ downloads
- **Mechanic**: Connect all dots with one continuous line, no lifting
- **Levels**: Multiple difficulty tiers, variety of patterns
- **Systems**: Hint system, progress tracking
- **Style**: Clean minimalist, colored dots on grid

### 2. Single Line: Drawing Puzzle (CrazyGames)
- **Platform**: Web browser
- **Mechanic**: Draw shapes with one stroke, no line breaks
- **Levels**: Progressive difficulty
- **Style**: Minimal, focus on the line itself

### 3. One Line (Steam)
- **Platform**: PC/Steam
- **Mechanic**: Draw a single line filling the entire board
- **Levels**: Different mechanics introduced over time
- **Style**: Minimalist, clean

### 4. monostroke (monostroke.app)
- **Platform**: Web
- **Mechanic**: Trace one stroke through a small grid, longer line = more stars
- **Levels**: Endless levels, 3 challenge worlds, Gauntlet mode
- **Systems**: Star rating, themes, unlockable content

### 5. One Touch Line Drawing Puzzle (Google Play)
- **Platform**: Android
- **Mechanic**: Connect all dots with one continuous line, no lifting, no crossing, no backing up
- **Features**: Logic boost, focus training

### 6. Link Dots Puzzle (YouTube)
- **Platform**: Web
- **Mechanic**: Connect all dots using one continuous line
- **Features**: Relaxing gameplay, variety of patterns

## Core Mechanics (Must Implement)
1. **Grid-based dot layout**: Dots placed at grid intersections
2. **Single continuous line**: Player draws from dot to dot without lifting
3. **No crossing lines**: Line segments cannot intersect
4. **No retracing**: Each edge between two dots can only be drawn once
5. **All dots must be visited**: Complete Hamiltonian path through the graph
6. **Hint system**: Show next correct move
7. **Undo**: Go back one step

## Systems to Implement

### Scoring
- **Star rating**: 3 stars per level based on hints used (0 hints = 3 stars, 1 hint = 2 stars, 2+ hints = 1 star)
- **Level completion bonus**: Base points per level
- **Streak bonus**: Consecutive levels without hints

### Progression
- **50+ levels** across 5 difficulty tiers (Easy → Hard → Expert → Master → Grandmaster)
- **Grid sizes**: Start 3x3, progress to 6x6+
- **Difficulty increase**: More dots, fewer obvious paths, more complex patterns

### Hint System
- **Free hints**: 3 per level, regenerate over time
- **Visual hint**: Briefly flash the next correct dot

### Progress Saving
- localStorage with version field
- Track: completed levels, stars earned, hints used, best streak

### Tutorial
- First 3 levels are tutorial levels with on-screen guidance
- "Tap a dot to start, then draw through all dots without lifting!"

## Difficulty Progression

| Tier | Grid Size | Dots | Levels | Features |
|------|-----------|------|--------|----------|
| Easy | 3x3-4x4 | 6-10 | 10 | Simple paths, obvious solutions |
| Medium | 4x4-5x5 | 10-16 | 10 | More dots, multiple possible paths |
| Hard | 5x5-5x6 | 16-20 | 10 | Complex patterns, require planning |
| Expert | 5x6-6x6 | 20-25 | 10 | Dense grids, few valid paths |
| Master | 6x6-7x7 | 25-30 | 10 | Maximum difficulty, intricate patterns |

## Art Style
- Dark gradient background (GameZipper dark style)
- Neon-glow dots with different colors per difficulty tier
- Glowing line trail with gradient color
- Particle effects on level completion
- Smooth line drawing animation
- Glass-morphism UI panels

## Music Style
- Ambient electronic, calm and meditative
- Soft synthesizer pads
- Subtle beat that increases tempo with difficulty
- Satisfying completion chime

## Key Differentiators vs Competitors
1. **More levels** (50+ vs typical 30)
2. **Star rating with streak system**
3. **Progressive neon visual theme**
4. **Particle celebration effects**
5. **5 distinct difficulty tiers with visual themes**
6. **Hint regeneration system**
