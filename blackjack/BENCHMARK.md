# Blackjack (21) — Competitive Benchmark

## Competitive Analysis

### Competitor 1: Blackjack by Blackjack.io (browser)
- **Core**: Classic Blackjack, 1-8 decks, Hit/Stand/Double/Split/Surrender
- **Betting**: $5-$500 table limits, chip system
- **Variants**: Classic, Multi-hand (3 hands), Insurance
- **UI**: Green felt table, card animations, dealer speech
- **Scoring**: Win/Loss/Push tracking, streaks, session stats
- **Monetization**: Ads between rounds

### Competitor 2: Blackjack by CrazyGames
- **Core**: Standard rules, 6 decks
- **Betting**: Adjustable bet amounts
- **Systems**: Dealer stands on soft 17, Blackjack pays 3:2
- **UI**: Top-down table view, card reveal animations
- **Stats**: Win rate, hands played

### Competitor 3: 247 Blackjack (247blackjack.com)
- **Core**: Full rules with all side bets
- **Betting**: Free play with virtual chips
- **Variants**: Classic, Spanish 21, Free Bet Blackjack, Perfect Pairs
- **Systems**: Hint system, basic strategy guide overlay
- **Tutorial**: Built-in strategy trainer
- **Social**: Leaderboard

## GameZipper Blackjack — Feature Parity Matrix

| Feature | Competitor Avg | GZ Target |
|---------|---------------|-----------|
| Hit / Stand | ✅ All | ✅ |
| Double Down | ✅ All | ✅ |
| Split (pairs) | ✅ Most | ✅ |
| Surrender | ✅ Some | ✅ |
| Insurance | ✅ Most | ✅ |
| Dealer rules (stand soft 17) | ✅ All | ✅ |
| Blackjack pays 3:2 | ✅ All | ✅ |
| Chip betting system | ✅ All | ✅ |
| Multiple bet sizes | ✅ All | ✅ |
| Balance tracking | ✅ All | ✅ |
| Statistics (win rate/hands) | ✅ Most | ✅ |
| Tutorial/How to play | ✅ Some | ✅ |
| Card counting hints | ❌ Rare | ✅ (unique differentiator) |
| Basic strategy overlay | ❌ Rare | ✅ (unique differentiator) |
| Sound effects | ✅ Most | ✅ |
| Animations | ✅ All | ✅ |
| Mobile responsive | ✅ All | ✅ |
| Dark neon theme | ❌ | ✅ (GZ signature) |

## Core Numerics
- Starting balance: $1,000
- Min bet: $10
- Max bet: $500
- Blackjack payout: 3:2
- Insurance payout: 2:1
- Double down: double bet, receive exactly 1 card
- Split: up to 3 splits (4 hands max)
- Surrender: lose half bet, available on first 2 cards
- Dealer: hits on soft 17, peeks for Blackjack
- 6 decks, reshuffled at 75% penetration
