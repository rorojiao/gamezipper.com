# Flag Paint: World Tour — Competitive Benchmark

## Target Game
- **Flag Paint: World Tour** (Rabbit Mountain Entertainment, com.rabbitmountain.puzzle1)
- Google Play 5K+ DL, Poki web 68,036 votes 4.3★
- Contains ads, no IAP

## Genre Leaders
| Game | Developer | Downloads | Rating |
|------|-----------|-----------|--------|
| Paint the Flag | Mobsmile | 5M+ | 4.5★ |
| World Flags: Color Puzzle | kiwilab | 5M+ | 4.5★ |
| Color The Flag: Paint Puzzle | Darkcup | 50K+ | 4.4★ |
| Color Flag ASMR | Woeve | 10K+ | 4.4★ |

## Core Mechanic
1. Player sees country flag silhouette with regions outlined
2. Palette shows pre-filtered correct colors (genre key insight: NOT a guessing game)
3. Player arms a color → taps a region → fills if correct, error if wrong
4. All regions filled → confetti + country info card → next flag
5. World-tour progression with star ratings

## Difficulty Progression
- L1-10: Horizontal tricolors (France, Italy, Germany)
- L10-30: Asymmetric/diagonal designs
- L30+: Emblems, crosses, complex layouts

## Systems to Implement
- 30 flags across 5 difficulty tiers
- Star ratings (3★ perfect, 2★ with mistakes, 1★ completed)
- Hint system (reveals correct color for a region)
- Level select with progress lock
- Country info (name, capital, continent, fun fact)
- Confetti celebration + screen effects
- Procedural BGM (Web Audio) + 6 SFX types
- localStorage save with version
- Monetag ads (banner + interstitial every 3 levels)
- Monetag + SEO + structured data

## Art Style
- Clean flat design, GameZipper dark theme
- Flag regions drawn as solid color fills
- Dark gray outlines for unfilled regions
- Neon accent colors for UI
- Confetti particles on completion
