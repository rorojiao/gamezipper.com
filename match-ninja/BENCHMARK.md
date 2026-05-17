# Match Ninja — Competitive Benchmark

## Game Overview
**Slug**: `match-ninja`
**Genre**: Shape Matching Puzzle
**Target**: Web browser (desktop + mobile)

## Core Competitors

### 1. Match Ninja (Rayole Software)
- **Platform**: Android (AppBrain trending May 2026, 100K+ downloads)
- **Core Mechanic**: Spot-and-tap — target shape shown at bottom, find exact match among similar shapes on screen
- **Visual Style**: Clear, colorful icons, not noisy
- **Audio**: Small clicks and pings, pleasant
- **Systems**: Levels, reward points, daily challenges, bonus opportunities
- **Key Feel**: Calm, satisfying groove, almost meditative

### 2. Shape Matching (Lagged/Fabbox Studios)
- **Platform**: Web browser
- **Core Mechanic**: Match shapes, 20 levels, 80+ cute shapes
- **Systems**: Levels, achievements
- **Key Feel**: Fun, not easy

### 3. Tiles Master (Poki)
- **Platform**: Web browser
- **Core Mechanic**: Match tiles to clear board, fruit and clover designs
- **Systems**: Levels, puzzle + matching elements
- **Key Feel**: Strategic tile matching

## Systems to Implement (Must-Have)

| System | Description | Priority |
|--------|-------------|----------|
| **Shape Matching Core** | Target shape displayed, find identical match among grid of similar shapes | MUST |
| **Level System** | 30+ levels with increasing difficulty (more shapes, more similar decoys, time pressure) | MUST |
| **Scoring** | Points per correct match, combo bonus for streaks, time bonus, star rating (1-3 stars) | MUST |
| **Progress Save** | localStorage with version field, save current level, best scores, stars per level | MUST |
| **Tutorial** | First-time tutorial (hand with arrow showing tap), skippable | MUST |
| **Combo System** | Consecutive correct matches multiply score | MUST |
| **Lives System** | 3 lives per level, wrong taps cost a life | MUST |
| **Hint System** | Highlight the correct shape (limited hints, earn via stars) | MUST |
| **Achievements** | Speed demon, perfect levels, combo records | SHOULD |
| **Daily Challenge** | Special daily level with bonus rewards | SHOULD |
| **Sound Effects** | Correct match, wrong match, combo, level complete, button clicks (Web Audio) | MUST |
| **BGM** | Calm ambient music loop (Web Audio procedural) | MUST |
| **Visual Feedback** | Particles on match, screen shake on wrong, celebration on level complete | MUST |
| **Star Rating** | 1-3 stars per level based on score thresholds | MUST |

## Difficulty Progression

| Level Range | Grid Size | Decoys | Time | Special |
|-------------|-----------|--------|------|---------|
| 1-5 | 2x2 (4 shapes) | Very distinct shapes | 30s | Tutorial |
| 6-10 | 3x3 (9 shapes) | Similar colors | 25s | Combo intro |
| 11-15 | 4x4 (16 shapes) | Similar shapes | 25s | Rotated shapes |
| 16-20 | 5x5 (25 shapes) | Very similar | 20s | Timed bonus |
| 21-25 | 5x5 (25 shapes) | Near-identical decoys | 20s | Moving shapes |
| 26-30 | 6x6 (36 shapes) | Extreme similarity | 15s | All mechanics |

## Shape Types
- Geometric: circle, triangle, square, pentagon, hexagon, star, diamond, cross, heart
- Variations: filled, outline, different sizes, rotated versions
- Colors: 8+ distinct colors, increasingly similar at higher levels
- Each level generates shapes algorithmically for variety

## Art Style Reference
- Dark gradient background (GameZipper style)
- Neon accent colors for highlights
- Shapes: clean vector look with glow effects
- UI: glassmorphism panels, rounded corners
- Ninja theme: subtle ninja star decorations, shadow effects
