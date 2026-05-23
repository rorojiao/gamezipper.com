# Chinese Chess (象棋) — Competitive Benchmark

## Competitors Analyzed

### 1. Chess.com Chinese Chess (Web)
- 50M+ monthly players across chess variants
- AI opponent with multiple difficulty levels
- Full Chinese Chess rules (all pieces, movements, check/checkmate)
- Move history, undo, timer
- Clean dark theme UI
- Rating system (ELO)

### 2. FlyOrDie Chinese Chess (Web)
- Classic web implementation since 2005
- vs AI + multiplayer
- Valid move highlighting
- Capture animation
- Timer per move
- Simple but effective UI

### 3. Chinese Chess Online (various web versions)
- Board is 9 columns × 10 rows
- River in the middle (row 5-6)
- Palace: 3×3 area for King/Advisor
- 32 pieces total (16 per side)
- Turn-based strategy

## Game Systems to Implement

### Core Rules
| Piece | Chinese | Movement |
|-------|---------|----------|
| King | 帅/将 | 1 step orthogonal, palace only |
| Advisor | 仕/士 | 1 step diagonal, palace only |
| Elephant | 相/象 | 2 steps diagonal, cannot cross river, blocked by intervening piece |
| Horse | 马 | L-shape (like chess knight), blocked by adjacent orthogonal piece |
| Chariot | 车 | Any distance orthogonal (like chess rook) |
| Cannon | 炮 | Moves like rook, but captures by jumping over exactly 1 piece |
| Soldier | 兵/卒 | 1 step forward before river, 1 step forward/left/right after river |

### Special Rules
- Flying General: Kings cannot face each other on same column with no pieces between
- Check and Checkmate detection
- Stalemate = loss for the player who cannot move
- Perpetual check = loss for checking player
- Perpetual chase = loss for chasing player

### Must-Have Systems
1. **AI Opponent** — Minimax with alpha-beta pruning, 3 difficulty levels (Easy/Medium/Hard)
2. **Move Validation** — All piece movement rules, blocking, palace, river restrictions
3. **Check/Checkmate Detection** — Real-time check warnings, checkmate end condition
4. **Valid Move Highlighting** — Show possible moves when piece selected
5. **Capture Animation** — Visual feedback when piece taken
6. **Move History** — Show all moves made in current game
7. **Undo** — Allow undoing last move
8. **New Game** — Restart anytime
9. **Sound Effects** — Move, capture, check, checkmate, select sounds
10. **Timer** — Optional per-move or total game timer
11. **Tutorial** — Show piece movement rules for new players
12. **Statistics** — Win/loss/draw record, current streak
13. **Dark neon theme** — GameZipper style

### Board Design
- 9×10 grid (9 columns, 10 rows)
- River line between row 5 and 6
- Palace diagonal lines (3×3 area)
- Intersection-based (pieces on intersections, not squares)
- Red pieces at bottom (rows 8-10), Black pieces at top (rows 1-3)
- Traditional Chinese characters on pieces

### Scoring/Progression
- AI difficulty progression (Easy → Medium → Hard)
- Win streak tracking
- Total games played
- Win rate statistics

### Target File Size
- 55-80KB (complex game with AI + full rules)
- Chinese Chess has more piece types and special rules than Checkers

## Art Direction
- Wooden board texture feel via CSS gradients
- Circular pieces with Chinese characters
- Red vs Black traditional colors
- Neon glow on selected pieces
- Dark background with traditional Chinese aesthetic
