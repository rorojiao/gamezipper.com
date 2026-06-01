# TriPeaks Solitaire — Benchmark Analysis

## Selected Game
**TriPeaks Solitaire** (also known as Three Peaks, Triple Peaks, Tri Towers)
**Slug**: `tripeaks-solitaire`
**Score**: 21/25 (Market=4, SEO=4, Retention=4, Feasibility=5, Overlap=4)

## Game Mechanics
- **Core**: Clear 3 pyramid formations by pairing cards ±1 rank with the waste pile top card
- **Setup**: 28 cards in 3 overlapping pyramids (4 rows each, shared bottom row), 24 cards in stockpile
- **Rules**: Match any face-up tableau card that is one rank higher or lower than the waste top card. Ace wraps to King.
- **Win**: Clear all tableau cards
- **Loss**: No moves available and stockpile exhausted
- **Win Rate**: ~51% (easier than Klondike at 33%)
- **Stockpile**: Cycle through once only

## Competitor Analysis

### 1. Solitaired.com TriPeaks
- Features: Undo, hints, auto-complete, streak tracking, daily challenge
- Scoring: Base points + streak multiplier
- Visual: Clean card design, green felt background, smooth animations

### 2. CardGames.io TriPeaks
- Features: Multiple difficulty levels, statistics tracking, tutorial
- Scoring: Points per card removed + bonus for clearing peaks
- Visual: Classic card game aesthetic, wood grain table

### 3. FreeGames.org TriPeaks
- Features: Multiple layouts (traditional + custom), continuous rounds, high score
- Scoring: Cumulative score across rounds
- Visual: Simple HTML5 cards, responsive

### 4. Washington Post TriPeaks
- Features: Daily challenge, timer, score comparison
- Scoring: Time bonus + card removal bonus
- Visual: Newspaper-themed card backs

## Systems to Implement

### Core Systems
1. **Card Engine**: 52-card deck, shuffling, dealing
2. **Pyramid Layout**: 3 overlapping pyramids with face-down/face-up states
3. **Match Logic**: ±1 rank matching (Ace wraps to King)
4. **Stockpile**: Single-pass draw
5. **Win/Loss Detection**: All tableau cleared = win

### Scoring System
- Points per card removed (10 base)
- Peak bonus (50 pts for clearing each peak)
- Streak multiplier (consecutive matches × 2)
- Time bonus (faster = more points)
- Stars: ⭐ 1-star (clear), ⭐⭐ (clear with <5 stock used), ⭐⭐⭐ (clear with <3 stock used)

### Progression System
- 30+ levels with increasing difficulty
- Difficulty: fewer face-up cards, harder arrangements, special cards
- Star rating per level (1-3 stars)
- Level unlock progression
- Daily challenge (seeded random)

### Power-ups
- **Undo**: Undo last move (3 per game)
- **Hint**: Highlight a valid move (3 per game)
- **Extra Card**: Peek next stockpile card
- **Wild Card**: Match any card (earned through streaks)

### UI/UX
- Tutorial with animated hand (first-time players)
- Card flip animations, peak clearing celebration
- Combo counter with particle effects
- Progress bar showing cards remaining
- Sound effects for: card flip, match, mismatch, peak clear, win, lose
- Settings: Sound toggle, card back theme

### Data Persistence
- localStorage with version field
- Save: current level, stars per level, total score, best scores, daily challenge date/completion
- Stats: games played, games won, win streak, best streak

## Visual Style
- Dark gradient background (GameZipper style)
- Neon-accent card borders
- Smooth card flip animations (CSS 3D transform)
- Particle burst on peak clear
- Glass-morphism UI panels
- Card design: Clean white face, dark gradient back with pattern

## Music/Sound
- BGM: Relaxing ambient, soft piano + synth pads, slow tempo (puzzle appropriate)
- SFX: Card flip, card place, match ping, combo chime, peak clear fanfare, win celebration, lose tone
