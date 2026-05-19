# Peg Solitaire — Competitive Benchmark

## Top Competitors

### 1. Peg Solitaire Online (pegsolitaire.fun)
- **Board types**: Triangle, Classic Cross (English), European, Diamond
- **Features**: Auto-solver, hints, undo, multiple themes, move counter
- **Levels**: Progressive difficulty (triangle 5 → 15 → full cross 33)
- **Aesthetics**: Clean, minimalist, marble textures
- **Music**: None (silent)

### 2. Marble Solitaire (playbrain.games)
- **Board types**: Classic English Cross (33 holes)
- **Features**: Undo, reset, move counter, best score tracking
- **Gameplay**: Click marble to select, click empty to jump. Must jump orthogonally. Jumped marble removed.
- **Win condition**: Single marble remaining (ideally center)
- **Difficulty**: Starts with full board, goal is to leave 1 marble

### 3. Peg Solitaire (peg-solitaire.com)
- **Board types**: English Cross, European, Triangle
- **Features**: Hint system, undo, auto-solve, move counter, timer
- **Scoring**: Based on remaining pegs (fewer = better), bonus for center finish
- **UX**: Click-to-select, valid moves highlighted, invalid moves rejected

### 4. Nitrome Ice Breaker (play-games.com)
- Note: Different game (ice cutting), but notable physics puzzle competitor

## Key Systems to Implement

### Core Gameplay
- Click/tap marble to select → valid move destinations highlight → tap destination to jump
- Jumped marble is removed
- Must jump orthogonally (up/down/left/right)
- Game ends when no valid moves remain
- Win: 1 marble left (perfect). Near-win: 2-3 marbles. Score based on remaining.

### Board Layouts (Progressive)
1. **Triangle 5** (5 marbles) — Tutorial
2. **Triangle 10** (10 marbles) — Easy
3. **Plus Shape** (13 marbles) — Medium
4. **Diamond** (21 marbles) — Medium
5. **English Cross** (32 marbles, classic) — Hard
6. **European Cross** (36 marbles) — Hard
7. **Diamond Large** (41 marbles) — Expert
8. **Super Cross** (45 marbles) — Expert
Total: 8+ layouts, each solvable

### Scoring System
- Pegs remaining → Score (1 peg = 1000, 2 = 800, 3 = 600, 4 = 400, 5+ = 200)
- Bonus for center-hole finish (+200)
- Star rating: ★★★ = 1 peg, ★★ = 2-3 pegs, ★ = 4-5 pegs
- Move efficiency bonus (fewer moves = higher bonus)
- Best score per layout (localStorage)

### Progression
- Layouts unlock sequentially (complete one → unlock next)
- Total stars tracked (target all 24 stars)
- Completion percentage

### Hint System
- Highlight a valid move (limited hints: 3 per layout)
- Hints recharge on layout completion

### Undo System
- Full undo history (unlimited)
- Undo button + gesture

### Tutorial
- First layout (Triangle 5) has guided tutorial
- "Tap a marble, then tap where to jump!"
- Visual arrow showing jump direction

### Visual Style
- Marble textures (procedural Canvas gradients)
- Wooden board background
- Satisfying removal animation (marble shrinks + fades)
- Jump animation (arc trajectory)
- Win celebration (particles)
- Valid move indicators (subtle glow)

### Audio (Web Audio API)
- Click/select sound
- Jump sound (satisfying click)
- Remove sound (pop)
- Invalid move sound (subtle buzz)
- Win fanfare
- BGM: Ambient wood/calm

### Analytics & SEO
- site-analytics.cap.1ktower.com
- JSON-LD: VideoGame + FAQPage + HowTo
- og:title, og:description
- Title: "Play Peg Solitaire Online Free - Classic Marble Puzzle | GameZipper"
