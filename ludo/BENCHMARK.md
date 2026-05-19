# Ludo — Competitive Benchmark

## Primary Competitor: Ludo King
- **Downloads**: 1.75 BILLION (Google Play)
- **Platforms**: iOS, Android, Web (Poki, CrazyGames)
- **Rating**: 4.3 stars on Google Play

## Core Systems to Implement

### 1. Board Layout
- 15x15 cross-shaped board with 4 colored home bases (Red, Green, Yellow, Blue)
- Each player has 4 tokens starting in their home base
- Central home area (6 colored triangles leading to center)
- Safe spots marked with stars on the board
- Start positions for each color

### 2. Game Rules
- Roll 6 to release a token from base to start position
- Move tokens clockwise by dice value
- Capture: Land on opponent's token → send it back to their base
- Safe spots: Tokens on safe spots cannot be captured
- Extra turn: Rolling 6 grants another turn
- Three consecutive 6s: Third 6 is forfeited (turn ends)
- Home stretch: Enter colored home column, need exact roll to reach center
- First player to get all 4 tokens home wins

### 3. AI System (3 difficulties)
- **Easy**: Random valid moves
- **Medium**: Prioritize captures and entering home
- **Hard**: Strategic — prioritize safe moves, block opponents, race to home

### 4. Game Modes
- VS AI (1-3 opponents)
- Local 2-4 Player (pass-and-play)
- Quick Match (2 players vs 2 AI)

### 5. Visual Feedback
- Token movement animation (smooth slide)
- Dice roll animation (3D rotation feel)
- Capture effect (particle burst)
- Safe zone glow
- Home stretch color trail
- Win celebration (confetti/particles)

### 6. Scoring & Progress
- Win counter per session
- Win streak tracking
- Total games played
- Best streak saved to localStorage
- Match history

### 7. UI/UX
- Dark gradient background (GameZipper style)
- Neon accent colors for each player
- Large tap targets for mobile
- Clear token selection when multiple moves available
- Highlight valid moves
- Sound toggle
- Settings panel

### 8. Audio
- Dice roll sound
- Token move sound
- Capture sound
- Home entry sound
- Win fanfare
- Button click sounds
- Background music (Web Audio procedural)

### 9. Tutorial
- First-time tutorial explaining:
  - How to release tokens (roll 6)
  - How to move
  - Capture mechanic
  - Safe spots
  - Home stretch rules
  - Win condition

## Style Reference
- Dark modern board game aesthetic
- Neon glowing tokens and paths
- Smooth CSS transitions
- Glass-morphism panels
- No emoji in title
