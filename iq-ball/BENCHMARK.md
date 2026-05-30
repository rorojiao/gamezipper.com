# IQ Ball - Competitive Benchmark

## Game Overview
IQ Ball is a physics-based grappling hook puzzle game originally on Coolmath Games. 
The player controls a small purple ball character that extends a grappling hook to 
grab surfaces and swing/fling itself to reach a red bullseye target.

## Key Competitors

### 1. IQ Ball (Coolmath Games / Flash)
- **Levels**: 25 levels
- **Core Mechanic**: Click to extend grappling hook to surfaces, swing/fling to target
- **Scoring**: Minimize clicks (IQ score based on efficiency)
- **Surfaces**: Can attach to wood/organic, NOT to metal
- **Obstacles**: Seesaws, trains, crates, moving platforms, multiple targets
- **Physics**: Momentum-based swinging, gravity, rope tension
- **Visual**: Cute purple ball character, colorful 2D art
- **Audio**: Upbeat cheerful soundtrack

### 2. Catch the Candy (Series)
- **Levels**: 50+ per variant (Christmas, Halloween, etc.)
- **Same mechanic**: Extend arm/grapple to reach candy
- **Additional features**: Moving obstacles, physics objects, themed levels
- **Multiple variants**: Seasonal versions extend playtime

### 3. Grapple Grip (Browser)
- **Levels**: 30+ puzzle platformer levels
- **Grappling hook**: Navigate levels, reach exit
- **Mobile**: Touch controls supported
- **Features**: Physics-based swinging, momentum

## Systems to Implement

1. **Grappling Hook Mechanic**: Click/tap to shoot hook to nearest valid surface, swing physics
2. **Physics Engine**: Gravity, momentum, rope tension, collision detection
3. **Level System**: 30+ unique levels with progressive difficulty
4. **Scoring**: Click count per level (fewer = better), star rating system (3 stars)
5. **Surface Types**: Grapple-able (wood/textured) vs non-grapple-able (metal/slippery)
6. **Obstacles**: Moving platforms, seesaws, breakable crates, trains, buttons/switches
7. **Target System**: Red bullseye target per level
8. **Progress Save**: localStorage with level completion and star ratings
9. **Tutorial**: First 3 levels teach mechanics progressively
10. **Hint System**: Show suggested grapple points (limited hints)
11. **Sound Effects**: Grapple shoot, swing whoosh, level complete, star earned, UI clicks
12. **BGM**: Upbeat, cheerful, puzzle-appropriate background music
13. **Visual Polish**: Particle effects on grapple, trail effect, celebration on level complete
14. **Undo/Reset**: Reset current level, undo last move
15. **Analytics**: site-analytics tracking
16. **SEO**: JSON-LD, meta tags, canonical URL

## Level Design Principles
- Each level introduces at least one new concept
- First 5 levels: tutorial (basic grapple, swing, momentum)
- Levels 6-15: intermediate (moving platforms, seesaws, breakables)
- Levels 16-25: advanced (trains, switches, multi-step puzzles)
- Levels 26-30+: expert (complex combinations)
- Every level should have an "aha moment"
- Multiple solutions possible per level

## Visual Style
- Clean, modern dark gradient (GameZipper style)
- Cute character with expressive eyes
- Neon accent colors for grapple rope and targets
- Smooth animations and particle effects
- NO emoji in title

