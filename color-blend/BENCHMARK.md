# Color Blend Studio — Competitive Benchmark

## Game Concept
Mix primary colors (RYB/RGB additive & subtractive) to match target colors. Precision-based puzzle with progressive difficulty.

## Competitor Analysis

### 1. Blendoku (Mobile, 10M+ downloads)
- **Core**: Arrange tiles into gradient order (not mixing, but color theory)
- **Levels**: 500+ levels across 4 difficulties
- **Systems**: Star ratings, daily challenges, no tutorial needed (visual)
- **Art**: Minimal flat design, vibrant colors
- **Music**: Ambient electronic

### 2. I Love Hue (Mobile, 5M+ downloads)
- **Core**: Arrange color tiles into perfect gradients
- **Levels**: 300+ across multiple chapters
- **Systems**: Progress tracking, chapter unlock, no time pressure
- **Art**: Pastel/soothing palette, minimalist
- **Music**: Calm meditative tones

### 3. Color Switch (Mobile, 500M+ downloads)
- **Core**: Tap to pass through matching color obstacles
- **Systems**: Endless mode, unlockable skins, leaderboard
- **Art**: Bright neon, simple shapes
- **Music**: Upbeat electronic loop

### 4. Factory Balls (Web, classic puzzle)
- **Core**: Paint balls with tools to match target design
- **Levels**: 50 levels with increasing complexity
- **Systems**: Step counting, star ratings
- **Art**: Clean web cartoon style

### 5. Color Match / Paint Mix (Web casual)
- **Core**: Add paint amounts to match target color
- **Levels**: Usually 20-30 with increasing precision needed
- **Systems**: Score based on accuracy percentage

## Systems to Implement (Competitive Parity)
| System | Source | Implementation |
|--------|--------|----------------|
| Level progression | Blendoku, I Love Hue | 25+ levels, 5 difficulty tiers |
| Star rating | Factory Balls, Blendoku | 3-star based on accuracy |
| Color theory mode | Educational standard | RGB additive + RYB subtractive |
| Precision scoring | Paint Mix | % accuracy → score |
| Hints/powerups | I Love Hue | "Reveal target RGB" hint |
| Progress save | All competitors | localStorage with version |
| Tutorial | Factory Balls | Interactive first-level guide |
| Best score | All | Per-level and total stars |
| Difficulty curve | Blendoku | Tutorial → Easy → Medium → Hard → Master |

## Art Style Reference
- Dark gradient background (GameZipper style)
- Glowing color orbs/drops with neon aura
- Glass-morphism UI panels
- Particle effects on color mix
- Smooth blend transitions

## Music Style
- Ambient electronic, mysterious, ethereal (puzzle mood)
- Slow tempo, soft synthesizer pads
- Web Audio API procedural generation

## Scoring Formula
- Base: 1000 per level
- Accuracy bonus: accuracy% × 500
- Moves efficiency: (optimal_moves / actual_moves) × 300
- Time bonus: remaining time × 10 (timed levels only)
- 3 stars: accuracy ≥ 95%, 2 stars: ≥ 80%, 1 star: ≥ 60%
