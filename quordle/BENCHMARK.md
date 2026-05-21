# Quordle - Competitive Benchmark

## Core Concept
Guess FOUR 5-letter words simultaneously in 9 guesses. Each guess applies to all 4 boards. Green/Yellow/Gray feedback on each board independently.

## Competitors

### 1. Quordle (quordle.game) - THE ORIGINAL
- **Grid**: 4 boards, 2x2 layout, each 5 columns × 9 rows
- **Guesses**: 9 total guesses for all 4 boards
- **Feedback**: Green (correct position), Yellow (wrong position), Gray (not in word)
- **Keyboard**: Shared virtual keyboard with color-coded feedback per board
- **Daily Puzzle**: One puzzle per day (same for everyone)
- **Practice Mode**: Unlimited random puzzles
- **Share Results**: Emoji grid (🟩🟨⬛) for each board
- **Stats**: Games played, win %, current streak, max streak, guess distribution
- **UI**: Clean, minimal, dark mode available
- **Key UX**: Type once → fills all 4 boards → see different feedback on each

### 2. Dordle (zaratustra.itch.io/dordle)
- 2 boards, 7 guesses
- Simpler version of Quordle

### 3. Octordle (octordle.com)
- 8 boards, 13 guesses
- Much harder variant
- Same mechanic as Quordle but scaled up

## Systems to Implement (S-Grade)

### Core Gameplay
- 4 independent 5×9 grids (2×2 layout)
- 9 guesses total
- Green/Yellow/Gray color feedback
- Valid word dictionary validation (reject non-words)
- Win detection per board (all 5 green)
- Auto-fill across all 4 boards simultaneously

### Scoring & Stats
- Games played / Won / Win %
- Current streak / Max streak
- Guess distribution chart (1-9)
- Daily puzzle with seeded random
- Practice mode (unlimited random)

### Social
- Share results (emoji grid format)
- Copy to clipboard

### UX Polish
- Tile flip animation on reveal
- Keyboard shake on invalid word
- Win celebration animation (bounce)
- Toast notifications
- Sound effects (key press, flip, win, lose)
- Dark theme (GameZipper neon style)

### Responsive
- Desktop: 4 boards side-by-side (2×2)
- Mobile: 4 boards stacked (2×2, smaller tiles)
- Touch-friendly virtual keyboard
- Min 44px tap targets

### Technical
- Single file HTML
- Canvas or DOM rendering (DOM better for tile flip animations)
- Web Audio API for sounds
- localStorage for stats
- JSON-LD structured data
- SEO meta tags
- Analytics script
