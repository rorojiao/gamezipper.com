# Dots and Boxes — Competitive Benchmark

## Competitor Analysis (2026-05-17)

### 1. Dots and Boxes - Classic Strat (Google Play)
- **Core**: 3 difficulty levels, tap dots to draw lines, close squares
- **Grid sizes**: 3x3, 4x4, 5x5, 6x6
- **Features**: Score tracking, AI opponent, clean minimal UI
- **Rating**: 4.2 stars

### 2. Coolmath Games - Dots and Boxes
- **Core**: Browser-based, click and drag to draw lines
- **Grid**: Variable sizes (3x3 to 8x8)
- **Features**: Single player vs AI, simple clean interface
- **Strengths**: Instant play, no download, educational appeal

### 3. Gametable.org - Dots and Boxes
- **Core**: Browser game, 2-player local or vs AI
- **Features**: Score display, turn indicator, clean grid
- **Strengths**: Family-friendly, responsive design

### 4. dotsandboxes.org
- **Core**: Strategic depth, strategy guides
- **Features**: AI difficulty levels, move history
- **Strengths**: Educational content + game

## Systems to Implement

### Core Gameplay
- Grid of dots (3x3 to 7x7 selectable)
- Click between dots to draw lines (horizontal/vertical)
- Completing a box = score point + extra turn
- Game ends when all boxes claimed
- Highest score wins

### Scoring System
- 1 point per box completed
- Score multiplier for chains (consecutive boxes)
- Star rating: 1★ (<50%), 2★ (50-79%), 3★ (80-100% boxes)
- Best score saved per grid size (localStorage)

### AI Opponent (Minimax)
- Easy: Random valid moves
- Medium: Basic strategy (avoid giving boxes, take when possible)
- Hard: Minimax with alpha-beta pruning (depth 4-6)

### Progression System
- 20 levels across grid sizes:
  - Levels 1-5: 3x3 grid (Easy AI)
  - Levels 6-10: 4x4 grid (Easy-Medium AI)
  - Levels 11-15: 5x5 grid (Medium AI)
  - Levels 16-18: 6x6 grid (Hard AI)
  - Levels 19-20: 7x7 grid (Hard AI)
- Win condition: Capture more boxes than AI
- Must win to advance (retry on loss)

### Tutorial
- First-time: Interactive tutorial showing how to draw lines and capture boxes
- Highlights: dots, lines, boxes, scoring
- Skippable after first play

### Visual Style
- Dark gradient background (#0a0a1a → #1a1a3a)
- Neon accent: cyan (#00f0ff) for lines, gold (#ffd700) for captured boxes
- Dot glow effects, line draw animations
- Box capture particle celebration
- Smooth CSS transitions

### Audio (Web Audio API)
- Click/draw line: soft click sound
- Capture box: satisfying chime
- Chain capture: ascending tone sequence
- Win: victory fanfare
- Lose: gentle descending tone
- Button hover: subtle blip

### Mobile
- Touch-friendly: large dot targets (min 44px)
- Swipe or tap between dots to draw
- Responsive canvas scaling
