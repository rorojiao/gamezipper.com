# Hearts (红心大战) — BENCHMARK.md

## Competitor Analysis

### 1. CardGames.io Hearts
- **URL**: https://cardgames.io/hearts
- **Players**: One of the most popular browser Hearts games
- **Features**:
  - AI opponents (3)
  - Card passing (Left, Right, Across, No Pass rotation)
  - Shoot the Moon (26 pts to all opponents)
  - Score tracking, game ends at 100 points
  - Undo button
  - Simple clean card rendering
  - No sound/music
  - No tutorial

### 2. 247 Hearts
- **URL**: https://247hearts.com
- **Features**:
  - 3 difficulty levels
  - Hint system
  - Score history/best scores
  - Customizable card backs
  - Timed mode
  - Statistics tracking

### 3. World of Card Games Hearts
- **URL**: https://worldofcardgames.com/hearts
- **Features**:
  - Multiplayer + AI bots
  - Multiple table themes
  - Chat system
  - Rating/leaderboard
  - Pass direction indicators

### 4. PlayHearts.net
- **URL**: https://playhearts.net
- **Features**:
  - Smart AI opponents
  - Quick browser play
  - Hearts rules guide
  - Tips and strategy

## Core Game Rules (Standard Hearts)

### Setup
- 4 players, standard 52-card deck
- Deal 13 cards each
- 2 of Clubs leads first trick

### Card Passing (before each hand)
- Round 1: Pass 3 cards Left
- Round 2: Pass 3 cards Right
- Round 3: Pass 3 cards Across
- Round 4: No Pass (keep hand)
- Rotation repeats

### Play Rules
- 2 of Clubs must lead first trick of each game
- Cannot play hearts or Queen of Spades on first trick (unless no choice)
- Cannot lead hearts until hearts are "broken" (played off-suit)
- Must follow suit if possible
- Highest card of led suit wins trick (no trumps)
- Winner of trick leads next

### Scoring
- Each Heart = 1 point (13 total)
- Queen of Spades = 13 points
- Jack of Diamonds = -10 points (optional rule)
- Game ends when any player reaches 100 points
- Lowest score wins

### Shoot the Moon
- If one player takes ALL 13 hearts + Queen of Spades (26 points):
  - Option A: That player gets 0, all others get +26
  - Option B: That player gets -26, all others get 0
- Use Option A (standard)

### AI Strategy Levels
- Easy: Random valid plays
- Medium: Basic strategy (avoid taking points, try to dump Q♠)
- Hard: Advanced (track cards, lead low, strategic passing, shoot the moon detection)

## Systems to Implement

| System | Priority | Details |
|--------|----------|---------|
| Card Passing | HIGH | Left/Right/Across/None rotation, 3 cards selected |
| Trick-taking | HIGH | Follow suit, highest wins, no trumps |
| Scoring | HIGH | Hearts=1pt each, Q♠=13pts, shoot the moon |
| AI Opponents | HIGH | 3 AI players with difficulty levels |
| Statistics | MEDIUM | Games won, avg score, moons shot, best score |
| Tutorial | MEDIUM | First-time player guide |
| Undo | MEDIUM | Undo last play (within trick) |
| Hints | MEDIUM | Suggest best play |
| Achievements | LOW | First win, shoot the moon, perfect game |
| Animations | HIGH | Card dealing, playing, collecting tricks |
| Sound FX | HIGH | Card play, trick win, shoot the moon, game over |
| BGM | MEDIUM | Ambient casino/card game music |
