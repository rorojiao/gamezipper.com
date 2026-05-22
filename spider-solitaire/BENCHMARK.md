# Spider Solitaire - Competitive Benchmark

## Core Rules (from Microsoft/trysolitaire.com/solitaires.gg)

### Setup
- **2 decks (104 cards)**, 10 tableau columns
- Columns 1-4: 6 cards each (5 face-down, 1 face-up)
- Columns 5-10: 5 cards each (4 face-down, 1 face-up)
- Stock pile: 50 cards (5 deals × 10 cards)

### Goal
- Build 8 complete King-to-Ace sequences in the same suit
- Complete sequences auto-remove to foundation

### Rules
1. Cards stacked in descending order (K, Q, J, 10...A)
2. Any card can go on any card one rank higher (regardless of suit)
3. **Only same-suit sequences can be moved as a group**
4. Any card can fill an empty column
5. Cannot deal from stock if any column is empty
6. 5 deals available from stock

### Difficulty Levels
| Level | Suits | Win Rate |
|-------|-------|----------|
| 1-Suit | Spades only | ~60% |
| 2-Suit | Spades + Hearts | ~15% |
| 4-Suit | All 4 suits | ~5% |

### Scoring System (Windows Standard)
- Starting score: 500
- Each move: -1 point
- Each undo: -1 point
- Completed suit sequence: +100 points
- Theoretical max: ~1,254 points
- Average winning score: 400-700
- Good score: 900-1,100

## Competitive Feature Matrix

| Feature | Microsoft Solitaire | solitaire.com | spidersolitaire.io | Spiderette | **GZ Target** |
|---------|-------------------|---------------|---------------------|-------------|---------------|
| 1/2/4 Suit | ✅ | ✅ | ✅ | ✅ | ✅ |
| Unlimited Undo | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hints | ✅ | ✅ | ✅ | ✅ | ✅ |
| Daily Challenge | ✅ | ✅ | ✅ | ❌ | ✅ |
| Statistics | ✅ | ✅ | ✅ | ✅ | ✅ |
| Win Streaks | ✅ | ✅ | ❌ | ❌ | ✅ |
| Timer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auto-Complete | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sound Effects | ✅ | ❌ | ✅ | ✅ | ✅ |
| BGM | ✅ | ❌ | ❌ | ✅ | ✅ |
| Score Tracking | ✅ | ✅ | ✅ | ✅ | ✅ |
| Best Score | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tutorial | ✅ | ❌ | ✅ | ❌ | ✅ |
| Settings | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mobile Touch | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dark Theme | ✅ | ❌ | ✅ | ✅ | ✅ |

## Key Differentiators for GZ
1. **Smooth drag-and-drop** with card snapping
2. **Double-click auto-move** to valid position
3. **Hint system** that highlights best move
4. **Win animation** with card cascade effect
5. **Daily challenge** with seed-based puzzle
6. **Score + Best Score + Move counter**
7. **Web Audio BGM + procedural SFX**
8. **Canvas-rendered cards** (custom design, dark neon theme)
9. **Undo system** with full history
10. **Auto-complete** when all cards face-up and sorted
