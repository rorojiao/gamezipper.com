# Crazy Eights - Competitive Benchmark

## Competitors Analyzed

### 1. CardGames.io Crazy Eights (cardgames.io/crazyeights)
- **Players**: 1 vs 3 AI opponents
- **Features**: Simple card matching, wild 8s with suit selection, draw from stock
- **Scoring**: Points based on remaining cards in opponents' hands
- **UI**: Clean minimal design, no animations
- **Missing**: No special cards (skip/reverse/draw2), no sound, no achievements

### 2. UNO Online (unoonline.io / calculators.org/uno)
- **Players**: 2-4 players, vs AI or multiplayer
- **Features**: 
  - Color matching + number matching
  - Special cards: Skip, Reverse, Draw Two, Wild, Wild Draw Four
  - "UNO" call when one card left
  - Round-based scoring to target (e.g., 500 points)
- **Scoring**: Face value cards (0-9), Skip/Reverse/Draw Two = 20pts, Wild/Wild+4 = 50pts
- **UI**: Vibrant colored cards, animations, sound effects
- **Advanced**: House rules, customizable settings

### 3. CrazyEights.io
- **Players**: Online multiplayer focused
- **Features**: Classic Crazy Eights rules, room creation, invite friends
- **Scoring**: Standard Crazy Eights scoring
- **UI**: Modern flat design, responsive

## Feature Matrix to Implement

| Feature | CardGames.io | UNO Online | CrazyEights.io | OUR TARGET |
|---------|:-----------:|:----------:|:--------------:|:----------:|
| Match by Suit | ✅ | ✅ | ✅ | ✅ |
| Match by Rank | ✅ | ✅ | ✅ | ✅ |
| Wild 8s (suit change) | ✅ | ✅ (Wild) | ✅ | ✅ |
| Skip Card | ❌ | ✅ | ❌ | ✅ |
| Reverse Card | ❌ | ✅ | ❌ | ✅ |
| Draw Two | ❌ | ✅ | ❌ | ✅ |
| Draw Four (Wild) | ❌ | ✅ (Wild+4) | ❌ | ✅ |
| "UNO" Call | ❌ | ✅ | ❌ | ✅ "Crazy!" call |
| AI Difficulty Levels | ❌ | ✅ | ❌ | ✅ (Easy/Med/Hard) |
| Round Scoring | ✅ | ✅ | ✅ | ✅ |
| Target Score Win | ❌ | ✅ | ❌ | ✅ (First to 200) |
| Tutorial | ❌ | ❌ | ❌ | ✅ |
| Sound Effects | ❌ | ✅ | ❌ | ✅ |
| BGM | ❌ | ✅ | ❌ | ✅ |
| Animations | ❌ | ✅ | ✅ | ✅ |
| Achievements | ❌ | ❌ | ❌ | ✅ |
| Statistics | ❌ | ✅ | ❌ | ✅ |
| Undo | ❌ | ❌ | ❌ | ✅ |
| Settings | ❌ | ✅ | ❌ | ✅ |
| Responsive/Mobile | ✅ | ✅ | ✅ | ✅ |
| Local 2-Player | ❌ | ❌ | ❌ | ✅ |

## Scoring System
- Number cards (2-10): Face value
- Jack, Queen, King: 10 points each
- Ace: 15 points
- Special cards (Skip, Reverse, Draw 2): 20 points each
- Wild 8 / Wild Draw Four: 50 points each
- **Winner scores total of all opponents' remaining cards**
- **First player to reach 200 points wins the game**

## Card Design
- 4 suits: Red, Blue, Green, Yellow (UNO-style colors)
- Numbers: 1-9 per suit (36 cards)
- Skip: 2 per color (8 cards)
- Reverse: 2 per color (8 cards)
- Draw Two: 2 per color (8 cards)
- Wild Eight: 4 cards
- Wild Draw Four: 4 cards
- **Total: 68 cards** (UNO-style Crazy Eights deck)

## Special Card Effects
1. **Skip**: Next player loses their turn
2. **Reverse**: In 2-player = acts as Skip. In 3+ player = reverses play direction
3. **Draw Two**: Next player draws 2 cards and loses their turn
4. **Wild Eight**: Player chooses new suit color
5. **Wild Draw Four**: Player chooses suit, next player draws 4 and loses turn (can only play when no other playable card)

## Difficulty Levels
- **Easy**: AI plays randomly from valid cards, doesn't strategize
- **Medium**: AI prefers action cards, basic strategy (holds wilds)
- **Hard**: AI counts cards, strategic wild usage, targets player with fewest cards

## Music Style
- Upbeat casual card game music, similar to UNO mobile app
- Light percussion, cheerful melody, loop-friendly
