# Star Battle — BENCHMARK.md (Competitive Analysis)

## Game Overview
Star Battle (also known as "Two Not Touch", "Queens" on LinkedIn, "Starstruck" on Netflix)
- **Created by**: Hans "Hns" Eendebak (Netherlands, 2003) for World Puzzle Championship
- **Core Rules**: Place exactly N stars in every row, column, and outlined region. No two stars may touch — not even diagonally.
- **Unique solution**: Every valid puzzle has exactly one solution via pure logic.

## Top Competitors

### 1. Egghead Games — "Star Battle Puzzles" (iOS/Android)
- Grid sizes: 8×8 (1★), 10×10 (1-2★), 12×12 (2★), 14×14 (3★)
- Smart hints that explain logic (not just reveal answer)
- Ad-free by design, IAP for puzzle volumes
- Timer + Expert badge, Zen mode (no timer)
- Tutorial, undo, error checking

### 2. Puzzle Baron — "Star Battles" (Web + Mobile)
- **30,000+ puzzles** — largest library
- Timer + competitive leaderboards + Hall of Fame
- 1-3 star variants
- Daily puzzles, hints, undo, error checking
- Ad-supported web

### 3. Hoshi — "Star Battle Puzzle" (iOS/Android)
- 1-5 star range (widest in mobile)
- Procedural generation = unlimited puzzles
- Daily + Weekly "Genius Challenge"
- Timer + global leaderboards
- 5 difficulty levels (Easy to Diabolical)

### 4. puzzle-star-battle.com (Web)
- 1-6 stars, including "Shapeless" variants
- Daily (4★), Weekly (5★), Monthly (6★) specials
- Timer-based, Patreon for ad-free
- Print capability

### 5. Cooltime — "Star Battle - Logic Puzzle" (Android)
- Pastel colors, haptic feedback
- Daily streak tracking
- 5 difficulty tiers

## Feature Matrix

| Feature | Our Target |
|---------|-----------|
| Grid Sizes | 5×5→14×14 (5 sizes) |
| Star Counts | 1-3 stars |
| Levels | 25+ (5 tutorial + 20 progressive) |
| Scoring | Time-based + star rating (1-3★) |
| Hints | Smart hints (mark invalid cells) |
| Undo | Full undo stack |
| Error Checking | Real-time conflict highlighting |
| Tutorial | Interactive 3-step onboarding |
| Save/Load | localStorage with version |
| Dark Mode | Default (GameZipper style) |
| Sound | Web Audio procedural BGM + SFX |
| Daily Puzzle | No (static levels) |

## Visual Style Target
- GameZipper dark gradient background (#0a0a1a → #1a1a2e)
- Neon accent stars (gold/amber glow with particles)
- Regions colored with subtle translucent fills
- Grid lines: soft glow effect
- Star placement: animated pop-in with sparkle particles
- Confetti celebration on level complete

## Level Design Blueprint
| Level | Grid | Stars | Difficulty |
|-------|------|-------|-----------|
| 1-3 | 5×5 | 1 | Tutorial (guided) |
| 4-6 | 6×6 | 1 | Easy |
| 7-9 | 8×8 | 1 | Medium |
| 10-14 | 8×8 | 2 | Medium |
| 15-18 | 10×10 | 2 | Hard |
| 19-22 | 10×10 | 2 | Hard+ |
| 23-25 | 12×12 | 2 | Expert |
| 26-30 | 14×14 | 2-3 | Master |

## Key Differentiators for GameZipper
1. **Visual polish**: Neon glow stars on dark theme (no competitor does this)
2. **Full sound design**: BGM + interaction SFX (no competitor has this)
3. **Smooth animations**: Particles, celebrations, transitions
4. **Smart error highlighting**: Real-time conflict detection with visual feedback
5. **Progressive difficulty curve**: 30 levels from tutorial to expert
