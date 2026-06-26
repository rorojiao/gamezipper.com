# Phase 2 — Competitive Benchmark: Bowling Master

## Top Competitor: Strike! By Belunder Games
- Downloads: 100M+ (Google Play)
- Rating: 4.3/5 (500K+ reviews)
- Monetization: Interstitial ads between games, rewarded ads for extra balls

## Top Competitor: Bowling King (Miniclip)
- Downloads: 100M+
- Rating: 4.2/5
- Features: 1v1 multiplayer, tournaments, custom balls, venue unlocks

## Key Mechanics to Reproduce
1. **Aim + Power**: Drag to set direction and power, release to bowl
2. **Pin Physics**: Ball-pin elastic collision, pin-pin chain reaction
3. **Pin Configurations**: Standard 10-pin triangle + puzzle variations
4. **Friction**: Ball decelerates over distance (lane friction)
5. **Gutter**: Ball in gutter = missed shot
6. **Scoring**: Pins knocked down per shot, total pins per level
7. **Star Ratings**: Based on shots used vs par (3/2/1 stars)
8. **Level Progression**: Increasing difficulty, new mechanics per tier

## Our Differentiators (Puzzle Mode)
- **Solo puzzle** (not 1v1): Clear all pins in limited shots
- **Obstacles**: Oil slicks (change ball direction), barriers (block)
- **Custom pin layouts**: Beyond standard 10-pin (clusters, splits, lines)
- **30 handcrafted levels**: 6 tiers of escalating difficulty
- **Special pins**: Golden pins (bonus points), heavy pins (need more force)

## Technical Approach
- Canvas 2D top-down view (portrait, mobile-first)
- Physics: Sub-stepped elastic collision (ball-pin, pin-pin)
- Pin states: STANDING → FALLING → DOWN
- Chain reactions: fallen pins slide and knock standing pins
- Audio: Web Audio API (ball roll, pin hit, strike fanfare)

