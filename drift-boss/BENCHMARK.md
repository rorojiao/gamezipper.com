# Drift Boss — Competitive Benchmark

## Game Overview
- **Developer**: MarketJS
- **Platforms**: CoolMath Games, CrazyGames, Poki, iOS, Android
- **Genre**: One-button endless arcade
- **Status**: #1 CoolMath Games 2026, major April 2026 update
- **World Records**: 15,000-36,000 points

## Core Gameplay
- **Controls**: HOLD = drift right, RELEASE = go straight (one input)
- **Objective**: Drive as far as possible on a narrow, twisty floating platform without falling
- **Scoring**: Distance-based, speed increases with distance
- **Coins**: Collectible during runs, spent on cars and boosters

## Track Generation
- Procedural endless ribbon with random turns, curves, varying widths
- Sharp switchbacks and tight corners
- No two runs identical
- Road gets narrower and faster with distance

## Progression Systems
- **Car Skins**: 28+ unlockable cars with different drift physics
- **Boosters**: Double Score, Car Insurance (continue after fall), Coin Rush
- **3 Modifiers**: Alter drift mechanics per car
- **Daily Rewards**: Login streaks
- **Wheel of Prizes**: Random reward events

## Difficulty Curve
- Early: Wide roads, gentle curves, slow speed
- Mid: Narrower roads, sharper turns
- Late: Fast speed, tight timing required
- Score and speed correlate — further = harder

## Retention Hooks
1. One-button depth: Simple to learn, impossible to master
2. Risk/reward tension: Speed escalation
3. 30-90 second rounds: "Just one more try"
4. Visible progress: High scores, car unlocks, coins
5. Muscle memory development: Players feel improvement
6. No social friction: Pure solo flow state
7. Cross-platform: Same game everywhere

## Visual Style
- Side-scrolling 2D, pseudo-3D car sprite
- Clean, colorful, minimalist
- Floating platforms in stylized sky/void
- Simple geometry car shapes
- School-friendly aesthetic

## Sound Design
- Engine/drift SFX
- Near-miss and crash sounds
- Simple background music
- Satisfying audio feedback

## Technical Specs for Clone
| Aspect | Spec |
|--------|------|
| Engine | HTML5 Canvas |
| Rendering | 2D side-scroller, 60fps |
| Physics | Velocity + turn-rate, gravity for falls |
| Input | Spacebar/mousedown/touchstart |
| Track | Procedural: array of turn angles + widths |
| Audio | Web Audio API |
| Storage | localStorage (score, coins, cars) |
| Target | <100KB single file |
