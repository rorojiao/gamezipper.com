# Zuma / Marble Shooter — Competitive Benchmark

## Overview
Zuma-style marble shooter: a fixed-path chain of colored marbles advances toward a skull hole. Player shoots marbles from a central turret (frog) to match 3+ same-color marbles, which pop and cause chain reactions. Game over when marbles reach the end.

## Core Mechanics (from original Zuma by PopCap, 2003)

### Path System
- Fixed winding track (spiral, S-curve, figure-8)
- Marbles move along the path at constant speed (speeds up over time)
- Chain continuously spawns from entry point
- When gap is created (marbles popped), marbles behind slide forward to fill gap
- If sliding creates new 3+ match → chain reaction (combo)

### Shooting
- Central stone frog turret, rotates 360°
- Aims with mouse cursor (desktop) or touch drag (mobile)
- Shows preview line/dotted trajectory
- Fires current marble toward aim point
- Marble travels in straight line and inserts into chain at nearest path position
- Swap button: swap current and next marble

### Matching & Popping
- 3+ consecutive same-color marbles → pop with animation
- Gap causes marbles behind to slide forward (chain reaction check)
- Chain combos multiply score
- Gap shot: shoot through gap to hit marbles further along the path

### Game Over
- Marbles reach the golden skull at end of path → lose
- Clear all marbles before they reach end → win level

## Power-Up System (original Zuma)

| Power-Up | Effect | Duration |
|----------|--------|----------|
| **Backward** (arrow) | Pushes chain backward briefly | 3 seconds |
| **Slow** (clock) | Halves chain speed | 8 seconds |
| **Accuracy** (crosshair) | Shows exact insertion point | 10 seconds |
| **Explosion** (bomb) | Destroys marbles in radius | Instant |
| **Color Change** (lightning) | Changes all marbles of one color | Instant |
| **Laser** | Destroys all marbles in a straight line | Instant |

Power-ups drop from popped marble combos (3+ chain reactions).

## Difficulty Progression (original Zuma Deluxe)

| Stage | Colors | Speed | Path Complexity |
|-------|--------|-------|-----------------|
| 1-3   | 3      | Slow  | Simple spiral    |
| 4-6   | 4      | Medium| S-curves         |
| 7-9   | 5      | Fast  | Complex spirals  |
| 10-12 | 6      | Very Fast | Figure-8s, overlaps |

## Scoring System (original)

- Base pop: 10 points per marble
- Chain reaction: x2, x3, x4... multiplier
- Combo (consecutive pops without missing): +50 bonus per combo level
- Gap shot bonus: +100 points
- Time bonus at level end: remaining time × 10
- Level clear bonus: 1000 + stage number × 500

## Visual Style

- **Original**: Aztec/Mayan temple theme, stone frog, gold accents
- **Modern clones**: Various themes (space, underwater, jungle, candy)
- Marble appearance: glossy 3D spheres with shine highlight, shadow
- Popping animation: shrink + particle burst in marble color
- Chain reaction: cascade effect with screen flash

## Audio Profile

- **BGM**: Tribal/ethnic percussion (original), ambient electronic (modern)
- **SFX**: Pop (satisfying click), shoot (whoosh), combo (ascending tones), power-up (magical chime), game over (deep gong), level complete (victory fanfare)

## Browser Competitors

### 1. Zuma Revenge (Poki/SilverGames)
- Flash port to HTML5, similar mechanics
- 60+ levels, boss battles
- 4 power-ups

### 2. Butterfly Kyodai (SilverGames) — not same genre

### 3. Marble Lines (various sites)
- Simplified version, straight paths
- 5 colors, 20 levels

### 4. Mystical Jade (browser)
- Chinese theme, jade-colored marbles
- 30 levels

### 5. Sparkle 2 (browser port)
- Orb shooter in space theme
- 5 power-up types

### 6. Bird's Town (browser)
- Cute bird theme, marble chain

## Gap Opportunity for GameZipper

- NO marble shooter / Zuma clone in GameZipper's 155 games
- "zuma game", "marble shooter", "bubble shooter" are extremely high-volume search terms
- Bubble Shooter exists but different mechanic (gravity vs fixed path)
- Mobile-friendly marble shooters are rare in browser space
- Classic game with proven engagement metrics

## Technical Architecture Notes

### Path System Implementation
- Define path as array of {x,y} waypoints
- Interpolate smooth curve between waypoints (catmull-rom or bezier)
- Marble chain = array of {color, pathProgress, offset} objects
- Chain movement: increment pathProgress each frame based on speed

### Collision Detection
- Shooting: ray from frog position toward mouse → find nearest path intersection
- Insertion: calculate position on path curve, insert marble into chain array
- Match check: scan chain for 3+ consecutive same color after insertion
- Chain reaction: after pop, check if remaining chain segments can combine

### Rendering
- Canvas-based (60fps)
- Draw path as a groove/track
- Draw marbles as circles with gradient (3D effect)
- Frog turret: draw circle with eyes tracking aim direction
- Particle effects: on pop, explosion, combo

### Performance Considerations
- Pre-render marble sprites (6 colors × 3 sizes = 18 sprites)
- Path calculations can be precomputed
- Particle pool (reuse particle objects)
- Max ~100 marbles on screen simultaneously
