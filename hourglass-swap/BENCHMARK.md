# Hourglass Swap — Competitive Benchmark

## Candidate: Hourglass Swap (#488)
**Mechanic**: Multiple hourglasses with different sand capacities. Flip them in combinations to measure exact target time intervals.

## Competitive Analysis

### Direct Competitors
| Game | Platform | Downloads/Plays | Key Mechanics |
|------|----------|----------------|---------------|
| Hourglass Puzzle (Various) | Mobile / Web | Niche | Classic water-jug math puzzle with sand timers |
| Sand Timer Puzzle | iOS/Android | 1M+ | Flip timers, track elapsed sand, hit target time |
| Die Hard Water Jug | Math puzzle sites | Classic riddle | 3/5 gallon jug measuring — same math class |
| Time Measure Puzzle | CrazyGames | Moderate | Similar timing logic with visual feedback |

### Gap Justification
- **grep hourglass = 0** across 487 existing GameZipper games
- Existing sand games (Sand Sort, Sandtrix, Sand Balls) are color-sorting/matching, NOT timing/measuring
- Classic math puzzle (GCD/Bézout's identity) with strong educational appeal
- No browser-based hourglass timing puzzle in GameZipper catalog

## Core Systems Required
1. **Hourglass rendering** — Canvas 2D: glass bulbs, sand particles flowing, flip animation
2. **Sand timing engine** — Track sand level in each hourglass; sand flows top→bottom at rate proportional to amount
3. **Flip mechanic** — Tap/click to instantly flip an hourglass (top↔bottom swap)
4. **Time tracking** — Global clock advances; player can flip any hourglass at any time
5. **Target condition** — When any hourglass's top (or bottom) reaches exactly the target amount, level is won
6. **Level progression** — Start with 2 hourglasses → 3 → 4; introduce "exact moment" targets
7. **Star rating** — Based on number of flips (fewer = more stars)
8. **Hint system** — Show optimal flip sequence for current state

## Mathematical Foundation
Based on **Bézout's identity**: With hourglasses of capacities *a* and *b*, you can measure any multiple of gcd(a,b). The puzzle generates levels where:
- 2-glass levels: target = achievable value using gcd of two glass capacities
- 3-glass levels: More complex interleaving
- Each level has a guaranteed solution via BFS over the state space

## Visual Design
- Dark theme (#0a0a1a → #1a1a3e gradient) matching GameZipper standard
- Hourglasses: amber/gold glass with golden sand particles
- Sand flow: animated particles falling through constriction
- Flip animation: 180° rotation with easing
- Target indicator: glowing line on the measuring hourglass

## Monetization
- Standard GameZipper ad integration (Monetag MultiTag)
- Interstitial ad between tier transitions
- No in-app purchases (free puzzle game)

## Differentiation Statement
"Hourglass Swap is NOT a sand-sorting game. It's a precision timing puzzle using classic water-jug mathematics — flip sand timers in the right sequence to measure exact target times. Think Die Hard 3 meets relaxing puzzle aesthetics."
