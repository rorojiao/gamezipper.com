# Connect Four — Competitive Benchmark

## Top Competitors
1. **Coolmath Games "Four In A Row"** — Most popular browser version
   - AI opponent with difficulty levels
   - Online multiplayer
   - Clean minimalist design
   - Score tracking
2. **papergames.io Connect 4** — 2-player + AI + tournament mode
   - Daily competition
   - Multiplayer tournaments
   - Clean responsive design
   - Player profiles
3. **calculators.org Connect 4** — HTML5, mobile-friendly
   - Computer vs player + 2 player
   - Score tracking
   - Mobile responsive
4. **BrainPlay Connect 4** — Modern design
   - AI difficulty levels
   - Friends play
   - Modern UI/UX

## Core Systems to Implement
1. **Game Board**: 7 columns x 6 rows, gravity-based disc drop
2. **Win Detection**: Horizontal, vertical, diagonal (both directions) — 4 in a row
3. **AI Opponent**: Minimax with alpha-beta pruning, 3 difficulty levels (Easy/Medium/Hard)
4. **Game Modes**: vs AI, vs Player (local)
5. **Score System**: Win tracking, win streaks, total games
6. **Visual Effects**: Disc drop animation, winning line highlight, particle effects on win
7. **Sound**: Web Audio API — disc drop, win, lose, hover sounds
8. **Progress Save**: localStorage — scores, settings, difficulty preference
9. **Tutorial**: First-game hint showing how to play
10. **Responsive**: Desktop + mobile layout
11. **Undo**: Undo last move (vs AI only)

## Visual Style
- Dark gradient background with neon accents
- Smooth disc drop animation (gravity + bounce)
- Glowing winning line
- Particle celebration on win
- Modern rounded UI elements

## Key Numerics
- Board: 7×6
- Win condition: 4 in a row
- AI depth: Easy(2), Medium(4), Hard(6)
- Animation: 300ms disc drop
