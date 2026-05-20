# Simon Says — Competitive Benchmark

## Competitors Analyzed
1. **FreeGames.org Simon Says** — Simple 4-color buttons, infinite sequence, no levels
2. **Plays.org Simon Says** — Mobile-friendly HTML5, neon lights, sound feedback
3. **Calculators.org Simon Says (treZimon)** — Progressive difficulty, mobile-responsive, score tracking
4. **NITE.GAMES Simon Says** — Brain training theme, concentration challenge
5. **Official Hasbro Simon** — Classic electronic game rules since 1979

## Core Mechanic
- 4 colored buttons (Red, Blue, Yellow, Green) arranged in quadrants
- Computer plays a sequence of colors/sounds
- Player must repeat the exact sequence
- Each round adds one more step to the sequence
- One mistake = game over

## Systems to Implement

### 1. Core Gameplay
- 4 color quadrant buttons with unique tones
- Sequence display with visual + audio feedback
- Progressive difficulty (sequence grows each round)
- Speed increases at higher levels

### 2. Difficulty System
- **Easy**: Slower speed (1.2s per flash), max 20 rounds
- **Medium**: Normal speed (0.8s per flash), max 30 rounds
- **Hard**: Fast speed (0.5s per flash), no max rounds
- Speed mode: Extreme fast, for hardcore players

### 3. Scoring System
- Points per correct round (10 × round_number)
- Speed bonus for quick responses
- Perfect bonus for completing without mistakes
- Combo multiplier for consecutive correct inputs
- High score saved per difficulty (localStorage)

### 4. Sound System (Web Audio API)
- 4 unique tones (C, E, G, C-octave — classic Simon frequencies)
- Error buzzer sound
- Level complete celebration jingle
- Menu click/transition sounds
- BGM: Soft ambient electronic during gameplay

### 5. Visual Design
- Dark gradient background (GameZipper style)
- Neon glow effects on buttons
- Pulse animations on button press
- Sequence playback with bright glow
- Wrong answer: red flash + shake animation
- Level up: particle celebration effect
- Smooth CSS transitions throughout

### 6. UI/UX
- Main menu: Play, How to Play, Settings
- In-game: Score display, round counter, difficulty indicator
- Game Over: Score summary, best score, play again
- Settings: Sound on/off, difficulty, speed mode
- Tutorial: First-time popup showing how to play
- Stats: Games played, best scores, total rounds completed

### 7. SEO & Analytics
- Title: "Play Simon Says Online Free - Memory Pattern Game | GameZipper"
- JSON-LD: VideoGame + FAQPage + HowTo
- OG tags, canonical URL
- Analytics tracking

### 8. Responsive Design
- Desktop: 1280×720, large buttons
- Mobile: 390×844, touch-friendly 44px+ tap targets
- Canvas-based rendering for smooth 60fps

## Art Style Reference
- Dark background (#0a0a1a to #1a1a3a gradient)
- Neon accent colors: Red (#ff4444), Blue (#4488ff), Green (#44ff88), Yellow (#ffcc44)
- Glow effects on active buttons
- Clean modern typography
