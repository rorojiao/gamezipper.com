# Pinball — Competitive Benchmark

## Market Data
- **Classic genre**: 50M+ total downloads across mobile platforms
- **Cultural icon**: 3D Space Cadet Pinball bundled with Windows for 15+ years
- **Web presence**: Featured on CrazyGames, Poki, SilverGames, Play-Games
- **Browser popularity**: Multiple HTML5 pinball clones consistently top web gaming charts
- **SEO**: "pinball game", "pinball online", "free pinball" — very high search volume

## Top Competitors

### 1. 3D Pinball (Space Cadet)
- Classic Windows game, 1B+ lifetime plays
- Single table, 3 ramps, multiple targets
- Score multiplier system, ball save, multiball
- **GZ gap**: No 3D/physics pinball at all

### 2. CrazyGames Pinball variants
- Multiple HTML5 pinball games
- Physics-based ball, flippers, bumpers
- Score systems, high score tracking

### 3. Poki Pinball Games
- Neon-themed pinball popular
- Quick sessions, high replayability
- Progressive scoring with combos

## Core Systems to Implement
- Physics engine: ball gravity, collision with walls/flippers/bumpers/targets
- Flipper control: left/right flipper (keyboard + touch)
- Score system: bumper points, target sequences, combo multipliers
- Ball management: 3 balls per game, ball save on drain
- Table elements: bumpers (circular), targets (rectangular), ramps, slingshots
- Plunger/launcher: spring-loaded ball launch
- Tilt detection: prevent excessive nudging
- High score: localStorage best score
- Sound: Web Audio for bumpers, flippers, drain, launch, bonus

## Visual Style
- Neon dark theme (consistent with GameZipper)
- Glowing elements, particle effects on hits
- Score display with animated counters
- Table layout: top-to-bottom gravity
- DMD-style (dot matrix) score display

## Difficulty/Progression
- Single endless table with escalating difficulty
- Bonus multiplier zones
- High score chasing (endless replayability)
- Optional: 2-3 table themes (Classic, Neon, Space)

## Technical Notes
- Canvas 2D rendering sufficient (no WebGL needed)
- Simple circle-polygon collision for ball physics
- Flipper rotation physics (angular velocity)
- Frame-rate independent physics (delta time)
- Touch: left half of screen = left flipper, right half = right flipper
