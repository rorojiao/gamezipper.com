# Reversi / Othello — Competitive Benchmark

## Competitors Analyzed
1. **Reversi Web** (reversi.yuki-lab.com) — 6+ AI levels, hints, undo, sounds, tutorial
2. **Reversi Nexus** (reversi.nexus) — 13 AI personalities, opening book 135K+ games
3. **ReversiAI** (reversiai.com) — 7 difficulty levels, strategy guide
4. **Othellio** (othellio.com) — 10 AI levels, time controls, XOT mode
5. **Board Game Buddy** (boardgamebuddy.io) — ELO-based, talkative AI bots
6. **PlayReversi** (playreversi.app) — Analysis solver, ranked leagues

## Must-Have Systems (Union of all competitors)
| System | Priority | Notes |
|--------|----------|-------|
| AI Difficulty Levels | CRITICAL | 5+ levels (Easy→Master), minimax with alpha-beta pruning |
| Valid Move Highlighting | CRITICAL | Show legal moves with glow effect |
| Score Display | CRITICAL | Real-time piece count |
| Tutorial / How to Play | HIGH | Rules explanation + basic strategy tips |
| Hint System | HIGH | Suggest best move (rare in competitors = opportunity) |
| Undo Move | MEDIUM | Allow undo last move |
| Sound Effects | HIGH | Piece placement, flip, capture, win/lose (only 1 competitor has audio!) |
| BGM | MEDIUM | Ambient strategy music |
| Statistics | MEDIUM | Win/loss/draw tracking, ELO rating, win streaks |
| Board Themes | MEDIUM | Multiple visual themes (NO competitor has this!) |
| Animations | HIGH | Smooth piece flipping, placement, capture effects |
| Mobile Support | CRITICAL | Touch-friendly, responsive layout |
| Progress Save | HIGH | Save game state + stats to localStorage |

## AI Design
- **Level 1 (Beginner)**: Random valid moves
- **Level 2 (Easy)**: Maximize flips, 1-ply lookahead
- **Level 3 (Medium)**: Minimax depth 2, positional weights
- **Level 4 (Hard)**: Minimax depth 4, corner/edge strategy
- **Level 5 (Expert)**: Minimax depth 5, mobility + stability evaluation
- **Level 6 (Master)**: Minimax depth 6+, opening book, endgame solver

## Evaluation Heuristic
- Corner control: ±100
- Edge stability: ±25
- Mobility (valid moves): ±10
- Frontier discs (adjacent to empty): −5
- Piece parity: ±1

## Scoring Formula
- Base: piece count difference × 10
- Bonus: corner captures × 50
- Bonus: edge control × 20
- Win bonus: +100 for winning, +200 for shutout
- Speed bonus: fewer moves = higher score

## Key Differentiators vs Competitors
1. ✅ Board themes (no competitor has this)
2. ✅ Comprehensive sound + BGM (only 1/6 has audio)
3. ✅ Hint system (only 2/6 have hints)
4. ✅ Undo (only 1/6 has undo)
5. ✅ Achievement system (0/6 have achievements)
6. ✅ Statistics + ELO tracking
7. ✅ Neon/dark modern theme (unique visual identity)
