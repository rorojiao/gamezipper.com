# BENCHMARK.md — Cut the Rope Physics Puzzle

## Competitive Analysis (2026-05-16)

### Competitors

#### 1. Cut the Rope (ZeptoLab) — 1B+ downloads
- **Core**: Physics puzzle — cut ropes to swing candy into Om Nom's mouth
- **Levels**: 400+ levels across 17 themed boxes (cardboard, fabric, foil, gift box, etc.)
- **Stars**: 3 stars per level (75 per box), star collection requires timing/strategy
- **Mechanics**: Ropes (single/multi), air cushions/bumpers, bubbles (float candy), teleport portals, magnets, anti-gravity
- **Scoring**: Stars per level (0-3), level completion tracking
- **Systems**: Tutorial (first levels teach mechanics), hints, Om Nom costumes, achievements
- **Art Style**: Bright, colorful, cartoonish, rounded shapes
- **Music**: Upbeat, playful, whimsical

#### 2. Cut the Rope: Magic (ZeptoLab)
- Added transformation mechanics — candy can transform into different shapes
- Introduced magic-themed obstacles
- Same star collection + Om Nom feeding core

#### 3. Candy Rope Cut (web clones on CrazyGames/Poki)
- Simplified versions with basic rope physics
- 20-50 levels, limited mechanics
- Basic scoring (stars or points)

### Key Systems to Implement

| System | Priority | Description |
|--------|----------|-------------|
| Rope Physics | CRITICAL | Verlet integration for rope simulation, swing dynamics |
| Candy Ball | CRITICAL | Circular candy attached to ropes, gravity-affected |
| Star Collection | CRITICAL | 3 stars per level, candy must touch them |
| Level Goal | CRITICAL | Candy must reach Om Nom (target zone) |
| Swipe to Cut | CRITICAL | Touch/mouse drag to cut rope segments |
| Air Cushions/Bumpers | HIGH | Bounce candy in new direction |
| Bubbles | HIGH | Float candy upward |
| Tutorial | HIGH | First 3-5 levels teach basic mechanics progressively |
| Scoring | HIGH | 3-star rating per level, best scores saved |
| Progress Saving | HIGH | localStorage with level completion + star data |
| Difficulty Progression | HIGH | 5 tiers of 5 levels each (25 total) |
| Hints System | MEDIUM | Optional hint for each level |
| Undo/Restart | HIGH | Quick restart button |
| Particle Effects | MEDIUM | Star collection sparkle, candy delivery celebration |
| Sound Effects | HIGH | Cut sound, star collect, success, fail, bounce |

### Difficulty Progression

| Tier | Levels | Grid/Size | Mechanics Introduced |
|------|--------|-----------|---------------------|
| 1 (Easy) | 1-5 | Simple, 1-2 ropes | Basic cut, single rope to target |
| 2 (Medium) | 6-10 | 2-3 ropes | Timing, order of cuts matters |
| 3 (Hard) | 11-15 | 3-4 ropes + bumpers | Air cushions, bounce angles |
| 4 (Expert) | 16-20 | Complex + bubbles | Bubbles, floating, timing |
| 5 (Master) | 21-25 | All mechanics combined | Multi-mechanic puzzles, precision |

### Art Direction
- **Style**: Bright, playful, colorful backgrounds per tier
- **Om Nom**: Green cute creature (simplified for canvas — round body, big eyes, open mouth)
- **Candy**: Red/white swirl circular candy
- **Ropes**: Brown/tan rope segments
- **Stars**: Golden, rotating, sparkle animation
- **UI**: Rounded buttons, gradient backgrounds, playful font

### Music Direction
- **BGM**: Upbeat, playful, whimsical — like children's cartoon
- **SFX**: Rope cut (snap), star collect (ding), Om Nom eat (chomp), fail (sad), bounce (boing)
