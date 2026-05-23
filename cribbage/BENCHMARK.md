# Cribbage - Competitive Benchmark

## Overview
Cribbage is a classic card game for 2 players, dating back to the 17th century. Players score points by card combinations (pairs, runs, flushes, 15s) during play and show phases. First to 121 points wins.

## Competitors

### 1. cardgames.io/cribbage
- **UI**: Clean card table green background, simple layout
- **Features**: vs AI, local multiplayer, statistics, rules page, options
- **Scoring**: Standard cribbage pegboard, automatic point counting
- **Missing**: No difficulty levels, no tutorial, basic visuals

### 2. Bicycle Cards Cribbage (iOS/Android)
- **Downloads**: 500K+
- **Features**: Tutorial, AI difficulty (Easy/Medium/Hard), achievements, daily challenge
- **Scoring**: Animated pegboard, card highlighting for scoring combinations
- **Visual**: Classic card design, wooden table aesthetic

### 3. Cribbage Pro (Mobile)
- **Downloads**: 1M+
- **Features**: Online multiplayer, ranked play, detailed statistics, undo, hints
- **Scoring**: Manual confirmation of scoring combinations
- **Visual**: Premium card rendering, smooth animations

## Core Mechanics to Implement

### Phase 1: The Deal
- Deal 6 cards each, discard 2 to crib (4 cards in hand, 4 in crib)
- Non-dealer cuts the starter card
- If starter is a Jack, dealer gets 2 points ("his heels")

### Phase 2: The Play
- Players alternate playing cards, running total must not exceed 31
- Scoring during play:
  - 15: exactly 15 in run = 2 points
  - Pair: 2 points
  - Three of a kind: 6 points
  - Four of a kind: 12 points
  - Run of 3+: 1 point per card
  - Flush (4+ same suit in play): 4 points (only if all played)
  - "Go": last player to play gets 1 point (2 if exactly 31)
- Must play if possible; if cannot play, say "Go"

### Phase 3: The Show
- Non-dealer shows hand first, counts all scoring combinations
- Then dealer shows hand
- Then dealer shows crib (uses starter card)
- Scoring:
  - 15s: every combination of cards summing to 15 = 2 points each
  - Pairs: 2, Three of kind: 6, Four of kind: 12
  - Runs: consecutive cards (A-5), 1 point per card
  - Flush: 4 cards same suit = 4, 5 with starter = 5
  - His Nobs: Jack in hand matching starter suit = 1 point

### Pegboard
- Traditional cribbage pegboard (2 lanes per player)
- Pegs advance around the board (121 holes = 2 laps + 1)
- Front peg shows current position, back peg shows previous

## Systems to Build
1. **AI Opponent**: 3 difficulty levels (Easy=random discard/play, Medium=basic strategy, Hard=optimal discard+play)
2. **Pegboard**: Visual peg scoring board
3. **Scoring Engine**: Complete cribbage scoring rules (pairs, runs, 15s, flushes, nobs)
4. **Tutorial**: Step-by-step new player guide
5. **Statistics**: Win/loss record, skunks, best hand, average score
6. **Undo**: Undo last action (before opponent plays)
7. **Hints**: Suggest best play
8. **Settings**: Sound/music toggle, peg speed, auto-count toggle
9. **Card Rendering**: Canvas-rendered playing cards
10. **Animations**: Card dealing, peg moving, scoring popups

## Scoring Reference
| Combination | Points |
|---|---|
| Fifteen (sum=15) | 2 |
| Pair | 2 |
| Three of a kind | 6 |
| Four of a kind | 12 |
| Run of 3 | 3 |
| Run of 4 | 4 |
| Run of 5 | 5 |
| Flush (4 in hand) | 4 |
| Flush (5 with starter) | 5 |
| His Nobs | 1 |
| His Heels (starter Jack) | 2 |
| Go (last to play) | 1 |
| Go (exactly 31) | 2 |

## Difficulty Curve
- **Easy**: Random valid play, random discard to crib
- **Medium**: Prioritize 15s and pairs, keep connected cards, basic discard strategy
- **Hard**: Optimal discard (maximize hand score + crib potential), optimal play (counting cards, strategic "Go" calls)
