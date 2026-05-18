# Dominoes - Competitive Benchmark

## Competitor Analysis

### 1. Dominoes 365 (dominoes365.io)
- **Game Modes**: Draw, Block, All Fives
- **Scoring**: Points based on opponent's remaining pips; All Fives scores multiples of 5
- **Target Score**: 100/150 points
- **AI**: 3 difficulty levels
- **Features**: Tutorial, undo, stats tracking, clean modern UI
- **Art Style**: Minimalist dark theme, white tiles with black dots

### 2. PlayDrift Dominoes (dominoes.playdrift.com)
- **Game Modes**: Draw, Block, All-Fives (Muggins)
- **Scoring**: Winner gets opponent's pip count; All-Fives scores multiples of 5
- **Target Score**: 100 points
- **AI**: Multiple difficulties
- **Features**: Online multiplayer, chat, leaderboard
- **Art Style**: Clean green felt table, classic domino tiles

### 3. CoolDominoes (cooldominoes.com)
- **Game Modes**: Draw, Block, All Fives
- **Scoring**: Standard rules
- **Features**: Ad-free, clean UI, hint system
- **Art Style**: Modern flat design

### 4. MobilityWare Dominoes (iOS/Android)
- **Game Modes**: Draw (default), Block
- **Scoring**: First to 100/150 points wins
- **AI**: Smart AI with strategy
- **Features**: Daily challenge, achievements, stats, undo, hint, tutorial
- **Art Style**: Premium polished UI

## Systems to Implement

### Core Mechanics
1. **Double-Six Domino Set**: 28 tiles (0-0 through 6-6)
2. **Tile Matching**: Place tiles matching open ends of the chain
3. **3 Game Modes**:
   - **Draw**: Draw from boneyard if no playable tile
   - **Block**: Pass if no playable tile (no boneyard)
   - **All Fives (Muggins)**: Score points when open ends sum to multiple of 5

### Scoring System
- **Draw/Block**: Winner scores sum of opponent's remaining pips
- **All Fives**: Player scores the multiple-of-5 sum immediately on each play
- **Blocked game**: Player with lowest pip count wins; scores difference
- **Target**: First to 100 points wins the match

### AI System
- **Easy**: Random valid moves
- **Medium**: Prefers higher pip count tiles, basic strategy
- **Hard**: Evaluates board position, strategic tile management, blocks opponent

### Progression & Features
- Win/loss/draw statistics
- Win streaks
- Best scores
- Move counter per round
- Undo button
- Tutorial/how-to-play overlay
- Sound toggle

### Audio
- Tile placement sound (satisfying click/clack)
- Draw from boneyard sound
- Score notification sound
- Win celebration sound
- Error/invalid move sound
- Background ambient music

### Visual Style
- Dark gradient background (GameZipper theme)
- Ivory/cream domino tiles with rounded corners
- Black dots with subtle shadow
- Neon accent colors for interactive elements
- Smooth tile placement animations
- Particle effects on scoring
