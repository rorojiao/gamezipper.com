# Hexxagon (Ataxx) — Competitive Benchmark

## Competitors Analyzed
1. **Hexxagon.com / classic web Hexxagon** — hex grid, 2-player + AI, the Capcom 1992 standard
2. **Ataxx (Wikipedia/canonical implementations)** — 7×7 square variant, clone+jump+convert
3. **Hexxagon II (Arternum 1993)** — expanded board, power-ups, 4 blocked tiles
4. **Mathsisfun Hexxagon** — flash-era port, vs computer difficulty slider
5. **Ataxx Pro (mobile)** — modern polish, themes, achievements
6. **Hex Empire / Hexcell** — cousin hex-conquest games (broader genre)

## Game Rules (canonical Hexxagon / Ataxx)
- Hexagonal board (radius-4 hex of hexes = 61 cells), Red vs Blue
- Each turn, pick one of your pieces and either:
  - **Clone** — place a new piece on an empty adjacent cell (distance 1); source stays
  - **Jump** — move the piece to an empty cell exactly 2 hexes away; source empties
- After landing, every adjacent (distance 1) enemy piece **converts** to your color
- If you have no legal move you **pass**; game ends when both pass or board is full
- Winner = player with more pieces

## Must-Have Systems (Union of all competitors)
| System | Priority | Notes |
|--------|----------|-------|
| AI Difficulty Levels | CRITICAL | 5 levels (Beginner→Master), minimax + alpha-beta |
| Valid Move Highlighting | CRITICAL | Show clone vs jump moves distinctly |
| Score Display | CRITICAL | Real-time piece count for both colors |
| Tutorial / How to Play | HIGH | Clone vs jump explained + convert mechanic |
| Hint System | HIGH | Suggest best move (0/6 competitors have this) |
| Undo Move | MEDIUM | Undo last human+AI ply pair |
| Sound Effects | HIGH | Place, convert, jump, win/lose (Web Audio) |
| BGM | MEDIUM | Ambient strategy music (procedural) |
| Statistics | MEDIUM | Win/loss tracking, win streaks per difficulty |
| Board Themes | MEDIUM | Multiple color themes (neon, classic, etc.) |
| Animations | HIGH | Piece pop-in, conversion flip, capture glow |
| Mobile Support | CRITICAL | Touch-friendly, responsive hex layout |
| Progress Save | HIGH | Save game state + stats to localStorage |
| Pass Indicator | HIGH | Show when a player must pass (niche but critical UX) |

## AI Design
- **Beginner**: random valid move
- **Easy**: greedy — maximize immediate net piece gain (converts − own loss)
- **Medium**: minimax depth 2, positional weights (corner bias)
- **Hard**: minimax depth 3, alpha-beta, mobility + corner evaluation
- **Expert**: minimax depth 4, alpha-beta, mobility + stability + corner eval

## Evaluation Heuristic
- Piece parity: ±1 per piece
- Corner control: +30 (corners can't be converted from outside the board)
- Edge cells: +8 (fewer adjacent enemies)
- Mobility (legal move count): +4 per move advantage
- Frontier (pieces adjacent to empty): −2 (vulnerable to conversion)

## Scoring Formula
- Final margin × 10
- Bonus: corner pieces × 25
- Win bonus: +150; shutout (opponent = 0) +300
- Difficulty multiplier: Beginner ×1 … Expert ×2.5

## Key Differentiators vs Competitors
1. ✅ Hint system (0/6 have it)
2. ✅ Full Web Audio SFX + procedural BGM (most have no audio)
3. ✅ Board themes (rare)
4. ✅ Undo (rare in hexxagon clones)
5. ✅ Pass indicator + auto-pass UX
6. ✅ Neon/dark modern visual identity (most hexxagon clones look dated)
7. ✅ Statistics + streak tracking per difficulty
