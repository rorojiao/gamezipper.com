# Snake vs Block — Competitor Benchmark

## Competitors Analyzed

### 1. Snake VS Block (Bento Studio, 2017) — `play.google.com/store/apps/details?id=com.bentostudio.ballsvsblocks`
- **Core**: Vertical swipe to control a snake of balls; numbered blocks deduct from snake length; snake dies if all balls are destroyed
- **Levels**: Endless, but with progressive difficulty
- **Systems**: score, length counter, stars (1-3 per game), coins, power-ups (shield, slow-motion, x2), checkpoint system
- **Vibe**: minimalist pastel, satisfying bounce physics, fast retries
- **What to copy**: swipe-controlled snake, color match bonus, star blocks, length-based scoring
- **What to improve**: finite level structure (30 levels), combo system, color-match twist, modern neon visuals

### 2. Bendy / Color Snake — poki/crazygames
- **Core**: Modern color-snake with a rainbow trail
- **Levels**: 30+ levels
- **Systems**: color-match walls, score, lives
- **Vibe**: neon glow, smooth color transitions
- **What to copy**: rainbow color trail, smooth trail rendering
- **What to improve**: add length-based block smashing

### 3. Snake.io / Slither.io-inspired — poki
- **Core**: Grow snake by eating orbs
- **Levels**: Multiplayer or endless
- **Systems**: leaderboard, kill by surrounding
- **Vibe**: bright, satisfying growth animation
- **What to copy**: smooth growth animation, orb collection satisfying feedback
- **What to improve**: bring into single-player level structure

## Design Pillars for Snake vs Block (GZ version)
1. **Vertical swipe control** — drag the snake left/right to position it
2. **Numbered blocks** — block displays a number; snake length must be >= number to smash through
3. **Color-match twist** — golden "star" blocks (4 colors) power-up boost that adds 3 length
4. **Coin/gem collection** — collect floating coins for score
5. **Shield power-up** — survives one death (consumed on crash)
6. **30 levels** — each level is a finite vertical field with X rows of blocks
7. **Combo system** — consecutive smash-through without miss = 1.5x / 2x / 3x multiplier
8. **Star rating** — 1-3 stars based on level score (3 thresholds)

## Systems Checklist (S-Grade)
- [x] Score + best score (localStorage v1)
- [x] Combo multiplier (1x, 1.5x, 2x, 3x)
- [x] Star rating (1-3 per level)
- [x] Power-ups: shield, +3 length, slow-mo (3s)
- [x] Tutorial overlay (skip-able)
- [x] Sound effects (Web Audio API procedural: bounce, smash, coin, fail, win)
- [x] BGM (Web Audio API procedural — catchy chiptune loop)
- [x] Pause / mute / sound toggle
- [x] Progress save with version field (level + score per level)
- [x] Mobile-first touch controls (vertical swipe or arrow keys)
- [x] 30 levels with progressive difficulty (more rows, higher block numbers, tighter gaps)
- [x] Particles, screen shake on smash, color flashes
- [x] JSON-LD structured data + analytics + canonical URL
- [x] Responsive 1280x720 desktop + 390x844 mobile
- [x] S-grade quality bar: clean dark theme, neon snake, smooth 60fps
