# Euchre — Competitive Benchmark

## Game Overview
Euchre is a classic 4-player trick-taking card game popular in the US/Canada, especially in the Midwest.
- 4 players in 2 teams (partnership: N/S vs E/W)
- 24-card deck: 9, 10, J, Q, K, A of each suit
- Trump suit determined through bidding round
- First team to 10 points wins

## Top Competitors

### 1. cardgames.io/euchre
- **Platform**: Web (cardgames.io) — top result for "euchre online"
- **Features**: AI opponents, statistics, customizable avatars, knock euchre variant
- **Scoring**: Standard (1/2/4 pts), 10 to win
- **AI**: Single difficulty level (changeable opponents)
- **Visuals**: Clean 2D cards (Nicu Buculei), simple felt table, jQuery animations

### 2. World of Solitaire Euchre
- **Platform**: Web
- **Features**: Multiple AI levels, clean UI, responsive
- **Scoring**: Standard rules

### 3. PlayOK Euchre
- **Platform**: Web — online multiplayer
- **Features**: Real opponents, chat, ranking
- **Scoring**: Standard rules

## Core Mechanics (Must Implement)

### Card Ranking (Trump Suit)
Right Bower (J of trump) > Left Bower (J of same color as trump) > A > K > Q > 10 > 9
Non-trump suits: A > K > Q > J > 10 > 9

### Dealing
- 5 cards per player (dealt 2-3 or 3-2)
- 4 cards left as "kitty"
- Top card of kitty turned face up

### Bidding (Trump Selection)
1. **Round 1**: Each player (starting left of dealer) can "Order it up" or "Pass"
   - Ordering picks up the face-up card as trump
2. **Round 2**: If all pass in Round 1, each player can name a trump suit or "Pass"
3. **Stick the Dealer**: If all pass in Round 2, dealer MUST name trump

### Going Alone
- The player who calls trump can choose to "Go Alone"
- Their partner sits out (doesn't play cards)
- Winning 5 tricks alone = 4 points
- Winning 3-4 tricks alone = 1 point (same as normal)

### Gameplay
- Player left of dealer leads first trick
- Must follow suit if possible
- Highest card of led suit wins (unless trumped)
- Highest trump wins if trumped

### Scoring
| Result | Makers Score | Defenders Score |
|--------|-------------|-----------------|
| Win 3-4 tricks | 1 | 0 |
| Win 5 tricks (march) | 2 | 0 |
| Go Alone, win 3-4 | 1 | 0 |
| Go Alone, win 5 | 4 | 0 |
| Defenders euchre (win 3+) | 0 | 2 |
| **Win Target** | **10 points** | |

## Features to Implement

### Must-Have
1. Full 4-player Euchre with AI (3 opponents, 1 partner)
2. Trump bidding (Order up + Name suit + Stick the Dealer)
3. Going Alone option
4. Standard scoring to 10
5. AI opponent intelligence (3 difficulty levels)
6. Card validation (must follow suit)
7. Trump hierarchy (Right Bower > Left Bower > A > K > Q > 10 > 9)
8. Visual card rendering (Canvas)

### Nice-to-Have
1. Trick history/animation
2. Score display with pegboard or point tracker
3. Statistics (games won/lost, winning streaks)
4. Tutorial for new players
5. Undo functionality
6. Sound effects (card play, trick win, euchre)
7. Dark neon GameZipper theme

## Visual Style Reference
- GameZipper dark theme: dark gradient background (#0a0a1a), neon accents
- Clean card rendering with suit colors (red/black)
- Highlighted playable cards
- Trump indicator with suit color
- Score panel at top
- Partner indicator
- Trick pile in center

## Scoring Complexity
Euchre has moderate scoring complexity — standard rules with:
- 5 possible scoring outcomes per hand
- Going Alone doubles potential points
- Euchre (defenders winning) = 2 points penalty
- No "win by 2" rule needed
