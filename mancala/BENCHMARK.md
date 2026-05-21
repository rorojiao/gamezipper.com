# Mancala — BENCHMARK.md

## Competitor Analysis

### 1. Coolmath Games Mancala
- **Core**: Classic Kalah rules, 6 pits × 2 rows, 4 seeds per pit
- **Modes**: vs Computer only, no difficulty selector
- **Systems**: Score tracking, simple stone animation
- **Visual**: Clean wooden board, simple stone graphics
- **Audio**: Click sounds only

### 2. CrazyGames Mancala Classic (2026)
- **Core**: Full Kalah rules with captures and free turns
- **Modes**: vs AI + local 2-player
- **Systems**: Score tracking, move history, difficulty levels
- **Visual**: Modern 3D-style board, polished stones
- **Audio**: BGM + SFX

### 3. BrainPlay Mancala
- **Core**: Standard Kalah
- **Modes**: vs AI
- **Systems**: Score, best score, simple stats
- **Visual**: Minimalist dark theme
- **Audio**: Basic SFX

### 4. MSN Games Classic Mancala
- **Core**: Full Kalah rules
- **Modes**: vs AI + vs Player
- **Systems**: Score, undo, hint
- **Visual**: Classic wooden aesthetic
- **Audio**: Full BGM + SFX

## Must-Implement Systems

| System | Description | Priority |
|--------|-------------|----------|
| **Game Modes** | vs AI (Easy/Medium/Hard) + local 2-player | CRITICAL |
| **Kalah Rules** | 6 pits, 4 seeds, capture opponent stones, extra turn on last-in-store | CRITICAL |
| **Scoring** | Real-time score display, captured stones count, game-over summary | CRITICAL |
| **AI Opponent** | Minimax with alpha-beta pruning, 3 difficulty depths | CRITICAL |
| **Move Validation** | Only valid pits highlighted, can't click empty pits | CRITICAL |
| **Undo** | Undo last move (vs AI only) | HIGH |
| **Tutorial** | First-time how-to-play overlay | HIGH |
| **Progress Save** | localStorage with stats: wins/losses/streak | HIGH |
| **SFX** | Stone drop, capture, extra turn, game over, button clicks | HIGH |
| **BGM** | Procedural Web Audio ambient loop | MEDIUM |
| **Animations** | Stone dropping, capture effect, score popup, board glow | HIGH |
| **Responsive** | Desktop (1280x720) + Mobile (390x844) | CRITICAL |
| **Touch** | Large tap targets, swipe to pick pit | HIGH |

## Key Kalah Rules Reference
- Board: 2 rows of 6 pits + 2 stores
- Start: 4 stones per pit, stores empty
- Move: Pick all stones from one pit, distribute counter-clockwise
- Extra turn: If last stone lands in your store
- Capture: If last stone lands in empty pit on your side, capture that stone + all opposite pit stones → your store
- End: When one side is completely empty, other player captures remaining stones
- Win: Most stones in store wins
