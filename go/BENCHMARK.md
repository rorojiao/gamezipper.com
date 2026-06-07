# Go Board Game — Competitive Benchmark

## Competitive Landscape

| Platform | Type | MAU | AI | Key Features |
|----------|------|-----|----|----|
| Online-Go.com (OGS) | Web Multiplayer | 200K+ | KataGo (paid) | Tournaments, ladders, puzzles, AI review |
| BadukPop | Mobile | 1M+ DL | Multi-level | Tutorial, puzzles, AI games |
| AI Sensei | Mobile | 500K+ DL | KataGo | AI analysis, teaching |
| KGS | Desktop/Java | Legacy | GTP bots | Classic, rooms, teaching |

## GameZipper Go — Target Feature Set

### Core Features (MVP)
- 3 board sizes: 9x9 (beginner), 13x13 (intermediate), 19x19 (expert)
- MCTS AI opponent with configurable playouts (500-5000)
- Chinese area scoring (stones + territory + komi 7.5)
- Ko rule (simple ko + positional superko)
- Capture detection via flood-fill liberty counting
- Pass, resign, undo
- Move history with navigation
- Territory estimation on game end

### Should Have
- 3 difficulty levels mapped to board+playout combos
- Tutorial system (6 lessons: basics, liberties, capture, groups, ko, territory)
- Timer per player
- Sound effects (stone placement, capture, game end)
- Dark theme with wooden board texture
- localStorage for game state and stats
- Responsive (mobile + desktop)

### Nice to Have
- Joseki/handicap support
- AI move analysis highlights
- Score estimation during game

## Scoring: Chinese Rules (Area Scoring)

```
Score = stones_on_board + territory + komi
White gets 7.5 komi (compensation for going second)
Winner = higher score
```

Chinese scoring is simpler: count stones + empty intersections surrounded by that color.

## AI: Monte Carlo Tree Search (MCTS)

```
1. Selection: UCB1 formula selects child node
2. Expansion: Add new child node
3. Simulation: Random playout to game end
4. Backpropagation: Update win/loss counts up tree

UCB1 = w/n + C * sqrt(ln(N)/n)
C = 1.414 (exploration constant)
```

Browser constraints: 500-5000 playouts per move (no neural network).
- Beginner 9x9: 500 playouts (~1s)
- Intermediate 13x13: 2000 playouts (~3s)
- Expert 19x19: 5000 playouts (~8s)

## Implementation Recommendations

- Canvas rendering for board (performance)
- Union-Find data structure for group tracking
- Flood-fill for liberty counting
- Positional superko via board state hashing (string key)
- Web Worker for AI to avoid blocking UI
- Seeded PRNG for deterministic playouts
