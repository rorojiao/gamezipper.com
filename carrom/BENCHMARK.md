# Carrom Board — Competitive Benchmark

## Target Game
**Carrom Board** — Classic tabletop disc-flicking game for GameZipper.com

## Competitor Analysis

### 1. Carrom Pool (Miniclip)
- **Downloads**: 100M+ on Google Play
- **Rating**: 4.4/5 stars
- **Core Mechanics**: 
  - Flick-to-shoot striker disc with angle+power control
  - Physics-based disc collision and wall bouncing
  - 4 corner pockets for scoring
  - 19 coins (9 white, 9 black, 1 red queen)
- **Systems**:
  - Online multiplayer matchmaking
  - AI opponents (Easy/Medium/Hard)
  - Trophy/cup tournaments
  - Daily login rewards
  - Custom strikers and boards (cosmetics)
  - Chat and emojis during matches
  - Win streaks and XP leveling
- **Monetization**: Rewarded video ads (extra coins), in-app purchases (cosmetics, gems)
- **Art Style**: Top-down realistic carrom board with wooden textures, coin shadows
- **Music**: Light Indian-inspired ambient, satisfying coin clack SFX

### 2. Carrom Clash (Zynga/Studio)
- **Downloads**: 10M+
- **Rating**: 4.3/5
- **Core Mechanics**: 
  - Standard carrom rules with pocket bonus
  - Striker position line indicator
  - Aim line with trajectory preview
- **Systems**:
  - 1v1 real-time multiplayer
  - AI practice mode
  - Seasonal tournaments
  - Coin rewards system
  - Board themes (different wood patterns)
- **Monetization**: IAP for coins/gems, rewarded ads for bonus moves

### 3. Carrom - Disc Pool (Classic)
- **Downloads**: 5M+
- **Rating**: 4.5/5
- **Core Mechanics**:
  - Simple clean UI
  - Two-finger drag to aim, release to shoot
  - Physics: disc-disc collision, disc-wall bounce, friction
  - Queen cover rule (must pocket a piece after queen)
  - Foul on striker pocketing (return a piece)
- **Systems**:
  - Vs AI (3 difficulties)
  - Local 2-player (same device)
  - Score tracking
  - Move counter

## Gap Analysis — What GameZipper Should Build

### Must-Have Features (Competitive Parity)
1. **Core Physics Engine**: Disc-disc elastic collision, disc-wall bounce, friction/damping
2. **Striker Controls**: 
   - Drag-to-aim with power meter (longer drag = more power)
   - Aim line preview (dotted trajectory line)
   - Striker placement on baseline
3. **Standard Carrom Rules**:
   - 2 players (human vs AI or local 2P)
   - 9 white + 9 black coins + 1 red queen
   - Pocket own color pieces, then pocket queen (with cover)
   - Foul: striker goes in pocket → penalty piece returned
   - Win: first to pocket all own pieces + queen
4. **3 AI Difficulty Levels**: Easy (random aim), Medium (decent aim), Hard (near-perfect aim + strategy)
5. **Score System**: Points per pocket, bonus for queen, win streak tracking
6. **Progress Saving**: localStorage with wins, losses, streaks, best scores

### Differentiation Features (S-Class)
1. **Tutorial System**: Interactive first-play tutorial explaining flick mechanics and rules
2. **Board Themes**: 4 visual themes (Classic Wood, Modern Blue, Neon Glow, Royal Gold)
3. **Particle Effects**: Coin pocket sparkle, striker trail, collision impact particles
4. **Smooth Animations**: Disc sliding, bouncing, pocketing with easing
5. **Sound Design**: 
   - Disc clack on collision (pitch varies by force)
   - Pocket thud when coin goes in
   - Striker release swoosh
   - Queen pocket fanfare
   - Win celebration jingle
6. **Game Modes**: Classic, Quick Play (fewer pieces), Freestyle (no queen, pure scoring)
7. **Statistics**: Win rate, total games, best streak, accuracy percentage
8. **Undo/Replay**: Last-move replay for learning

### Technical Specs
- **Canvas Size**: 800x800 (square board), responsive scaling
- **Physics**: Simple 2D circle-circle elastic collision + circle-line wall bounce
- **Controls**: 
  - Desktop: Mouse drag on striker to aim + set power, release to shoot
  - Mobile: Touch drag on striker, release to shoot
- **Frame Rate**: 60fps with requestAnimationFrame + delta time
- **File Target**: 50-70KB single HTML file

### Scoring Formula
- White/Black pocket: 10 points
- Queen pocket (with cover): 30 points bonus
- Queen pocket (without cover): Queen returned, no bonus
- Striker foul: -5 points + return one pocketed piece
- Win bonus: 50 points + remaining opponent pieces × 10

### AI Strategy (Hard difficulty)
1. Prioritize pocketing own pieces over blocking
2. Set up combo shots (pocket 2+ pieces in one shot)
3. Position striker for optimal angle
4. When opponent has queen advantage, play defensively (block pockets)

### Monetization Integration (GameZipper Style)
- Monetag banner (bottom)
- Interstitial ad between games
- No IAP — pure ad-monetized
