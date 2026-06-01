# Ball Sort Puzzle — Competitive Benchmark

## Competitors Analyzed
1. **Ball Sort Puzzle** (IEC Global Pty Ltd) — 500M+ downloads
2. **Ball Sort: Color Water Puzzle** (Onetouch Game) — 100M+ downloads
3. **Water Sort Puzzle** (IEC Global) — 100M+ downloads
4. **Cups - Water Sort Puzzle** (CrazyGames web)
5. **Liquid Sort Puzzle** (web)

## Core Mechanics (All Competitors)
- Tubes with 4-item capacity
- Pour rule: can only pour top ball onto same-color top ball or empty tube
- Multi-pour: consecutive same-color balls transfer together
- No time limits, no penalties for moves
- Undo, Extra Tube, Restart = 3 core boosters

## Feature Matrix

| Feature | Ball Sort (IEC) | Color Water (Onetouch) | Water Sort (IEC) | Our Target |
|---------|----------------|----------------------|------------------|------------|
| Levels | 3000+ | 1000+ | 3000+ | 50+ (expandable) |
| Star Rating | No | Yes | No | Yes (1-3 stars) |
| Game Modes | 1 | 4 | 1 | 1 (classic) |
| Undo Booster | 5 per ad | Variable | 5 per ad | Unlimited undo (ad-supported) |
| Extra Tube | Yes | Yes | Yes | Yes |
| Skins/Themes | Limited | Full shop | Gacha+shop | Neon dark theme |
| Daily Challenge | No | Yes | No | No |
| Achievements | No | Yes | No | Yes |
| Leaderboard | No | No | No | Best score per level |

## Difficulty Scaling Formula
- Levels 1-10: 3-4 colors, 5-6 tubes (tutorial)
- Levels 11-20: 4-5 colors, 6-7 tubes
- Levels 21-30: 5-6 colors, 7-8 tubes
- Levels 31-40: 6-7 colors, 8-9 tubes
- Levels 41-50: 7-8 colors, 9-10 tubes
- Each color has exactly 4 balls
- Always 2 empty tubes for maneuvering

## Scoring System
- Base score per level: 100 points
- Move efficiency bonus: fewer moves = more stars
  - 3 stars: completed in optimal moves
  - 2 stars: completed in ≤ 1.5x optimal
  - 1 star: completed in > 1.5x optimal
- Combo bonus: consecutive same-color pours
- Best score saved per level (localStorage)

## Sound Design
- Ball drop sound (satisfying thunk)
- Pour sound (liquid swoosh)
- Level complete fanfare
- Error/invalid move buzz
- Background ambient music

## Visual Style Target
- Dark gradient background (GameZipper style)
- Neon-colored balls with glow effects
- Glass-morphism tube design
- Smooth pour animations
- Particle effects on level complete
- Star rating display

## Monetization (for reference)
- Interstitial ad every 3-5 levels
- Rewarded ad for extra tube / undo refill
- No IAP required (web game)
