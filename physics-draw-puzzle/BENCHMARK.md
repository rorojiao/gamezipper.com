# Physics Drawing Puzzle — Competitive Benchmark

## Competitors Analyzed

### 1. Brain It On! (Orbital Nine Games)
- **Downloads**: 50M+ on Android
- **Levels**: 200 Classic + 100 Extended + 60 Relaxed + 20 Lander Training + 60 Press My Buttons = 440 total
- **Core Mechanic**: Draw shapes on screen → shapes become physics objects → solve puzzle
- **Systems**:
  - Star rating: 3 stars per level (based on ink efficiency)
  - Ink limit per level (draw less = more stars)
  - Community levels + Level editor
  - Share unique solutions with friends
  - Unlock levels by earning stars
  - Multiple valid solutions per puzzle
  - Goal types: Make objects touch, balance objects, destroy objects, land objects
- **Art Style**: Simple hand-drawn crayon style, clean white background
- **Music**: Minimal, focus on sound effects (drawing, collision, success)

### 2. Shatterbrain (Orbital Nine Games)
- **Downloads**: 1M+ on Android
- **Core Mechanic**: Draw shapes to break/shatter target objects
- **Systems**:
  - Leaderboards (fastest time, best solution)
  - Multiple solutions per puzzle
  - Dozens of levels with more added regularly
- **Key Difference from Brain It On**: Focus on DESTRUCTION, not construction

### 3. Love Balls (SuperTapx)
- **Downloads**: 100M+
- **Core Mechanic**: Draw lines to guide two balls to meet each other
- **Systems**:
  - Ink limit (strategic drawing)
  - Simple but addictive
  - Gravity-based physics
  - Cute character design

### 4. Draw Physics Line
- **Core Mechanic**: Draw shapes → push ball into matching color cup
- **Systems**:
  - Color matching
  - Multiple cups/targets
  - Brain-training angle

## Systems to Implement (Must-Have)

| System | Priority | Details |
|--------|----------|---------|
| Free-form drawing | CRITICAL | Mouse/touch draw shapes on canvas |
| Physics engine | CRITICAL | Gravity, collision, rigid body dynamics |
| Star rating (3 stars) | HIGH | Based on ink used vs par |
| Ink limit | HIGH | Limited drawing per level |
| 30 levels minimum | HIGH | Progressive difficulty |
| Goal types | HIGH | Reach target, balance, separate, push |
| Progress saving | HIGH | localStorage with version |
| Tutorial | HIGH | First 3 levels teach mechanics |
| Sound effects | HIGH | Web Audio API procedural |
| Hint system | MEDIUM | Show faint guide line |
| Undo drawing | MEDIUM | Clear last shape |
| Score system | MEDIUM | Stars + total score |

## Goal Types for Level Design

1. **Reach**: Guide a ball/object to a target zone
2. **Balance**: Keep objects balanced for N seconds
3. **Separate**: Move objects apart (red/blue separation)
4. **Push**: Push objects off platforms or into containers
5. **Bridge**: Create a bridge for objects to cross gaps
6. **Shield**: Protect objects from falling hazards

## Difficulty Progression

- Levels 1-5: Tutorial (simple reach goals, generous ink)
- Levels 6-10: Basic physics (bridges, ramps)
- Levels 11-15: Multi-object puzzles
- Levels 16-20: Precision challenges (limited ink)
- Levels 21-25: Complex multi-goal levels
- Levels 26-30: Expert puzzles (minimal ink, complex physics)

## Art Direction

- **Style**: Clean, modern, dark theme (GameZipper standard)
- **Background**: Dark gradient with subtle grid pattern
- **Objects**: Neon-outlined shapes with glow effects
- **Drawing**: Glowing neon line effect (player draws with light)
- **Particles**: Sparkle on success, trail on drawing

## Music Direction

- **Style**: Ambient electronic, thoughtful, puzzle-solving mood
- **Tempo**: Slow to moderate (60-80 BPM)
- **Instruments**: Soft synths, gentle piano, ambient pads
