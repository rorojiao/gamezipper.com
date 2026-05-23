# Golf Solitaire — Competitive Benchmark

## Game Overview
Golf Solitaire is a classic patience card game where cards are laid out in columns (the "fairway") and the player removes cards that are one higher or one lower than the foundation card. The goal is to clear all columns or maximize score.

## Core Mechanics
- **7 columns** of 5 face-up cards each (35 cards total)
- **Stock pile**: remaining 17 cards
- **Foundation**: starts with one card from stock
- **Rule**: play any card that is ±1 rank of the foundation card (wraps: K→A, A→2)
- **Wild card**: some variants allow any card on empty column

## Top Competitors

### 1. Golf Solitaire by MobilityWare
- 100M+ downloads on mobile
- Multiple courses (themes)
- Daily challenges
- Scoring: +1 per card removed, bonus for streaks
- Undo/Hint power-ups
- Stats: games won, best score, longest streak

### 2. Fairway Solitaire (Big Fish Games)
- Combines Golf Solitaire with course narrative
- Special cards: irons (remove specific), wildcards, power-ups
- Long clubs (remove any card from same column)
- Shop for power-ups with earned coins
- Achievements system

### 3. solitaire.co.uk Golf Solitaire
- Classic web implementation
- Clean card rendering
- Simple scoring: count cards remaining
- Undo button
- No tutorial

### 4. Microsoft Solitaire Collection (Golf variant)
- Part of premium solitaire suite
- Daily challenges
- Xbox Live integration
- Star ratings per game

## Key Systems to Implement

### Scoring System
- +1 point per card moved to foundation
- +2 bonus for clearing an entire column
- Streak bonus: consecutive plays without drawing from stock
- Final score: total - penalty (3pts per remaining card)

### Difficulty Levels
- **Easy**: 7 columns × 5 cards, 3 stock reshuffles allowed
- **Medium**: 7 columns × 5 cards, 2 stock reshuffles
- **Hard**: 7 columns × 5 cards, 1 stock reshuffle

### Progression
- Daily challenge (seeded random)
- Game number system (#1-#10000)
- Statistics tracking
- Win streaks

### Power-ups
- **Undo**: undo last move (limited)
- **Hint**: highlight playable cards
- **Peek**: see next stock card

### Visual Style
- Classic green felt background (golf course theme)
- Standard playing cards with clear rank/suit
- Smooth card flip/move animations
- Particle effects on column clear
- Dark neon GameZipper theme

## GZ Differentiation
- Dark neon theme (vs traditional green felt)
- Web Audio procedural BGM + SFX
- Canvas-rendered cards (no images needed)
- Mobile-first responsive design
- Daily challenge + seeded games
