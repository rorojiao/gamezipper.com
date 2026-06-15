# BENCHMARK.md — Notnot Brain Direction Puzzle

## Competitor Analysis

### Primary Competitor: Notnot (by Tushar Lobo)

**Market Data**
- Downloads: 5M+
- Platform: Mobile (iOS/Android)
- Category: Puzzle, Reflex, Brain Training
- Monetization: Free with ads, premium unlock
- Rating: 4.4★ Google Play

**Core Mechanics**
- Brain direction / Simon-says variant
- Player observes arrow direction(s) on screen
- Must tap/press in correct direction within time limit
- Multiple cue types: single arrow, sequence, rotating arrows
- Speed and accuracy increase per level

**Input Method**
- Tap/Click buttons for 4 directions (Up/Down/Left/Right)
- Optional swipe gestures
- Responsive to both desktop and mobile

**Difficulty Progression**
- Tier 1: Single static arrow, generous time (3s)
- Tier 2: Arrow sequence, reduced time (2.5s)
- Tier 3: Rotating arrows, faster (2s)
- Tier 4: Multiple simultaneous cues, very fast (1.5s)
- Tier 5: Reverse cues, ultra-fast (1s)

**Monetization**
- Interstitial ads every 5 levels
- Banner at bottom
- Optional premium unlock ($2.99) to remove ads

**Unique Selling Points**
- Minimalist neon aesthetic
- Instant pick-up, hard to master
- Endless procedural levels
- Global leaderboard

## Implementation Target for GameZipper

### Gameplay Core
- 30 levels across 5 tiers (6 levels each)
- Procedurally generated arrow patterns
- Deterministic LCG seeded RNG
- Timer-based scoring (3-star)
- Hint system (shows correct direction after delay)
- Undo (consumes time penalty)

### Technical Requirements
- Canvas 2D rendering
- Arrow shapes: 4 directions, smooth rotation animation
- Timer bar visual countdown
- Particle effects on correct/wrong taps
- Touch/mouse pointer events
- Responsive desktop+mobile
- Web Audio SFX (correct/wrong/timeout/win/star)

### Art Style
- Dark background (#0a0a1a)
- Neon arrows (cyan, magenta, lime, yellow)
- Minimalist UI (no clutter)
- RunningHub OG image + icon

### Music/SFX
- Web Audio procedural BGM (upbeat loop)
- 4 SFX: correct, wrong, timeout, level complete
- Mute toggle

### SEO & Structured Data
- Description: "Brain direction puzzle! Follow arrows, react fast. 30 levels across 5 tiers."
- Tags: brain, direction, arrow, reflex, puzzle, speed, casual
- JSON-LD: VideoGame + HowTo + FAQPage

### QA Requirements
- 30 levels solvable with time budget
- All arrow patterns valid (no impossible cases)
- Mobile touch targets >= 36px
- No external deps, single-file HTML