# Farkle — Competitor Benchmark

## Competitors Analyzed

### 1. CardGames.io Farkle
- **URL**: https://cardgames.io/farkle
- **Features**: vs Computer, vs Human, score to 10000, standard scoring combos
- **Scoring**: Single 1=100, Single 5=50, Three 1s=1000, Three of a kind (2-6)=face×100, Four of a kind=2×three, Five=2×four, Six=2×five, Straight 1-6=1500, Three Pairs=1500, Hot Dice (all 6 dice scoring)=must re-roll
- **AI**: Multiple difficulty levels
- **UI**: Simple, clean, dice animations
- **Missing**: No achievements, no stats tracking, no custom rules

### 2. farkle.games
- **URL**: https://farkle.games
- **Features**: Step-by-step tutorial, scoring guide, practice mode
- **Scoring**: Standard Farkle rules with optional variations
- **UI**: Modern, animated dice, tutorials for beginners

### 3. BuddyBoardGames Farkle
- **URL**: https://buddyboardgames.com/farkle
- **Features**: Online multiplayer with friends, custom rules (toggle variations)
- **Rules**: Customizable — players can enable/disable scoring variations
- **UI**: Social-focused, room-based play

### 4. Farkle 10000 (App Store/Google Play — LITE Games)
- **Features**: vs AI, online multiplayer, custom dice skins, achievements
- **Scoring**: Standard, 10000 target
- **Monetization**: 60+ custom dice/cup designs

### 5. Farkle Online 10000 (MWM)
- **Features**: Offline play, 60 custom dice/cup designs, multiplayer
- **Platform**: iOS, Android

## Scoring Reference (Standard Rules)

| Combination | Points |
|---|---|
| Single 1 | 100 |
| Single 5 | 50 |
| Three 1s | 1,000 |
| Three 2s | 200 |
| Three 3s | 300 |
| Three 4s | 400 |
| Three 5s | 500 |
| Three 6s | 600 |
| Four of a Kind | 2× three-of-a-kind value |
| Five of a Kind | 2× four-of-a-kind value |
| Six of a Kind | 2× five-of-a-kind value |
| Straight (1-2-3-4-5-6) | 1,500 |
| Three Pairs | 1,500 |
| Two Triplets | 2,500 |
| Four + Pair | 1,500 |
| Hot Dice (all 6 scoring) | Must roll all again (+500 bonus optional) |

## Systems to Implement

1. **Core Mechanics**: 6 dice, roll, set aside scoring dice, roll remaining, bank or risk
2. **Scoring**: All standard combinations above
3. **Win Condition**: First to 10,000 points
4. **AI Opponent**: 3 difficulty levels (Easy=aggressive, Medium=balanced, Hard=strategic)
5. **Modes**: vs AI, Local 2-Player
6. **Tutorial**: Step-by-step for beginners
7. **Scoring Reference**: Built-in guide showing all combinations
8. **Stats**: Wins/losses, farkle count, highest turn score, longest winning streak
9. **Sound**: Dice roll, scoring select, bank, farkle, win fanfare (Web Audio API)
10. **Visual**: Animated 3D dice, particle effects, shake animation on farkle
11. **Settings**: Sound toggle, scoring variation toggles, target score selection
12. **Progress Save**: localStorage with version field

## AI Strategy

### Easy (Greedy)
- Always rolls unless single die remaining with <30% scoring chance
- Doesn't track opponent score

### Medium (Balanced)
- Banks at 300+ points per turn
- Increases aggression when behind

### Hard (Strategic)
- Tracks opponent score, adjusts strategy
- Banks at 400+ normally, 250+ when ahead by 2000+
- Risk-aware: considers probability of farkling

## Visual Style
- Dark gradient background with subtle texture
- 3D-looking dice with shadows and rotation animation
- Neon accent colors (green for scoring, red for farkle, gold for bank)
- Particle burst on bank/win
- Screen shake on farkle
- Glass-morphism score panels
