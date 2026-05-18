# Gomoku - Competitive Benchmark

## Competitors Analyzed

### 1. Gomoku.com
- **Board**: 15x15
- **AI Difficulty**: Easy, Medium, Hard, Master (4 levels)
- **Modes**: Single player vs AI
- **Features**: Clean UI, responsive, undo
- **Scoring**: Win tracking

### 2. The Gomoku (App Store - jp.co.unbalance)
- **Board**: 15x15 (Gomoku + Renju rules)
- **AI Difficulty**: 15 levels (beginner to expert/world-class)
- **Modes**: Single player, online ranking
- **Features**: Renju rules (3x3, 4x4, overline restrictions for Black), score ranking, global leaderboard
- **Downloads**: Top Gomoku app

### 3. GomokuAI (itch.io - LNHGames)
- **Board**: 15x15
- **AI**: Minimax with Alpha-Beta pruning
- **Features**: AI difficulty scaling, processing time indicator

### 4. Gomoku GPT (minitoolai.com)
- **Board**: 15x15
- **AI**: GPT-based opponent
- **Features**: No login required, instant play

## Systems to Implement

### Core Gameplay
- 15x15 board with Go-style stones (black/white)
- Two-player: Human (Black) vs AI (White)
- First to get 5 in a row (horizontal, vertical, diagonal) wins
- Draw detection (board full)

### AI System
- Minimax with Alpha-Beta pruning
- 4 difficulty levels: Easy (depth 1-2), Medium (depth 3-4), Hard (depth 5-6), Expert (depth 7+)
- Position evaluation: open fours, open threes, threats, center control
- Opening book (first 3-5 moves)

### Scoring & Progression
- Win/loss/draw tracking
- Win streak counter
- Total games played
- Win rate percentage
- Best streak record

### Game Modes
- VS AI (4 difficulties)
- Local 2-player (same device)

### UI/UX
- Wooden board texture (canvas-drawn)
- Black and white stone rendering with 3D effect (gradient/shadow)
- Last move indicator (highlight)
- Winning line highlight animation
- Hover preview (ghost stone)
- Move history panel
- Undo button (vs AI only)
- New game button

### Settings
- Sound toggle
- AI difficulty selector
- Board size option (9x9, 13x13, 15x15)
- Theme toggle (dark/light board)

### Tutorial
- How to play instructions
- Basic strategy tips
- Pattern recognition guide (open three, four, etc.)

### Visual Style
- Dark gradient background (GameZipper style)
- Wooden board with grid lines
- Smooth stone placement animation
- Victory celebration particles
- Neon accent colors for UI elements

### Sound (Web Audio API)
- Stone placement click
- Win fanfare
- Invalid move buzz
- Button hover/click feedback
- Ambient BGM (optional toggle)

### SEO
- Title: Play Gomoku Online Free - Five in a Row Strategy Game | GameZipper
- Keywords: gomoku, five in a row, gomoku online, gomoku game, strategy board game
- Structured data: VideoGame, FAQPage, HowTo
