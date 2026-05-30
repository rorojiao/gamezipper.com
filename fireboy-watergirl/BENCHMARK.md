# Fireboy & Watergirl — Competitive Benchmark

## Game Overview
- **Genre**: Co-op Puzzle-Platformer
- **Developer**: Oslo Albet (2009-2026, 7 installments)
- **Platforms**: Browser (Flash → HTML5), Steam, Mobile
- **Target Demo**: Ages 10-15, casual gamers, school-age co-op play
- **Install Base**: 100M+ plays across all versions (CoolMath staple)

## Core Mechanics (Universal Across Series)
1. **Two-Character Control**: Fireboy (Arrow Keys) + Watergirl (WASD)
   - Solo: one player controls both characters simultaneously
   - Co-op: two players share one keyboard
2. **Elemental Rules**:
   - Fireboy: immune to lava, killed by water, collects red diamonds
   - Watergirl: immune to water, killed by lava, collects blue diamonds
   - Green acid: kills BOTH characters
3. **Exit Synchronization**: Both must reach their respective doors simultaneously
4. **Mechanisms**: Buttons (hold), levers (toggle), pushable boxes, elevators, platforms
5. **Ranking System**: A/B/C rank per level based on diamonds collected and time

## Systems to Implement
| System | Description | Priority |
|--------|-------------|----------|
| Two-character control | Arrow keys + WASD, simultaneous movement | CRITICAL |
| Elemental hazards | Lava (safe for fire), Water (safe for water), Acid (kills both) | CRITICAL |
| Platform physics | Gravity, jumping, collision, one-way platforms | CRITICAL |
| Button/Lever mechanisms | Pressure plates (hold), toggle switches | CRITICAL |
| Pushable boxes | Characters push boxes to hold buttons or create bridges | HIGH |
| Diamond collection | Red (Fireboy), Blue (Watergirl), Green (either) | HIGH |
| Level completion | Both at exit doors, show rank | HIGH |
| Level select map | Grid layout, shows completed levels + ranks | MEDIUM |
| Progress save | localStorage, track completed levels + ranks | HIGH |
| Tutorial levels | First 3 levels teach mechanics gradually | HIGH |
| Time tracking | Level timer, affects rank | MEDIUM |
| Sound effects | Jump, collect, die, complete, button press | HIGH |

## Competitor Reference: Original Fireboy & Watergirl (Forest Temple)
- 32 levels with branching level select
- Difficulty: starts simple, ramps to complex multi-mechanism puzzles
- Level structure: single-screen rooms (no scrolling)
- Each level is self-contained puzzle
- Average play time: 2-5 min per level

## Our Implementation Scope
- **Slug**: `fireboy-watergirl`
- **Levels**: 25 levels (5 tutorial + 20 progressive)
- **Style**: Dark temple theme, neon accents (GameZipper style)
- **Controls**: Arrow keys (Fireboy) + WASD (Watergirl), with touch d-pads for mobile
- **Mobile**: Virtual dual-dpad overlay (left side = Watergirl, right side = Fireboy)
- **Single file**: All in index.html

## Visual Style Reference
- Dark gradient background (deep purple/blue temple walls)
- Fireboy: orange/red glow character
- Watergirl: blue/cyan glow character
- Lava: red-orange animated pools
- Water: blue animated pools
- Acid: green glowing pools
- Diamonds: red and blue gems with sparkle animation
- Exit doors: glowing portals (orange for fire, blue for water)
- UI: Glass-morphism panels, rounded corners

## Score Formula
- Base score: 100 per level
- Diamond bonus: +10 per diamond collected
- Time bonus: max(0, 300 - seconds_elapsed)
- Rank: A (≥90%), B (≥70%), C (≥50%), D (<50%) of max possible score
