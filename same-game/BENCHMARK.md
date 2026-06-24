# Competitive Benchmark — Same Game (Clickomania)

## Game Overview
Same Game (also known as Clickomania, SameGame, Tile Bust) is a classic grid-based
puzzle where players click connected groups of 2+ same-colored tiles to remove them.
Tiles fall via gravity, columns shift left when emptied, and the goal is to maximize
score (or clear the board entirely for a bonus).

## Origin & History
- Created by Kuniaki Moribe in 1985 under the name "Chain Shot!"
- Popularized as "SameGame" on Unix/X11 systems in 1992
- Renamed "Clickomania" when ported to Windows in 1995
- Became a built-in game in many OS distributions (including some Linux distros)
- Modern mobile versions: "Tile Bust", "Same Game", "Color Clear" — 10M+ downloads combined

## Top Competitors

### 1. Same Game Classic (Mobile)
- Downloads: 5M+
- Features: Classic scoring, undo, multiple difficulty levels
- Monetization: Banner ads + rewarded video for undo/shuffle
- Weakness: Dated UI, no level progression, no star ratings

### 2. Tile Bust / Color Clear (Mobile)
- Downloads: 10M+
- Features: Daily challenges, multiple grid sizes, leaderboards
- Monetization: Interstitial ads between levels, IAP for power-ups
- Weakness: Heavy ad frequency, IAP pressure

### 3. Clickomania (Web)
- Browser-based versions available but mostly basic/ugly
- No modern mobile-responsive design
- No SEO optimization, hard to find via search

## Market Gap Analysis
- **Zero Same Game / Clickomania clones on GameZipper** (verified via grep)
- Closest existing games: Bejeweled (swap-match, different mechanic)
- Block Blast (Tetris-style placement, different mechanic)
- The "click connected groups to remove" mechanic is completely absent from GZ
- Strong SEO opportunity for "same game", "clickomania", "tile crush" keywords

## GameZipper Adaptation
- 30 levels across 6 tiers with progressive grid sizes and color counts
- Seeded deterministic generation (reproducible boards)
- Star rating system (1-3 stars based on target scores)
- Board clear bonus for strategic players
- Power-ups: Hint (highlight best group), Undo, Shuffle
- Daily challenge with rotating seed
- Dark neon theme matching GameZipper aesthetic
- Web Audio API sound effects + ambient BGM
- localStorage progress saving

## Scoring Formula
- Group removal: (n - 2)^2 where n = group size (classic SameGame formula)
- Board clear bonus: +500
- Remaining tiles penalty: -(remaining)^2 applied to final score
- Star targets calibrated per level difficulty

## Monetization
- Monetag banner ads (below game)
- No interstitials during gameplay (only between levels)
- Power-ups are unlimited (no IAP pressure)
