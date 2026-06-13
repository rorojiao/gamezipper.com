# Competitive Benchmark: Maze Paint (Amaze!)

## Primary Competitor
**Amaze GO!** by Oakever Games
- Google Play: #5 Top Free Puzzle (June 2026)
- Rating: 4.7★
- Core mechanic: Swipe to paint maze paths with a rolling ball

**Amaze!** by Crazy Labs (original)
- Google Play: 100M+ downloads
- Rating: 4.3★
- The genre-defining game

## Core Mechanics (to replicate)
1. Grid-based maze with walls and open cells
2. Player controls a paint ball
3. Swipe in cardinal direction — ball slides until hitting a wall
4. All cells ball passes over get painted in the ball's color
5. Goal: paint ALL open cells
6. Progressive difficulty across 1000+ levels (mobile)

## Systems to Implement
| System | Competitor | Our Implementation |
|--------|-----------|-------------------|
| Level progression | 1000+ levels, themed worlds | 30 levels, 5 tiers |
| Star rating | 3-star based on moves | 3-star based on moves vs par |
| Hints | Watch ad for hint | Hint button (highlights next move) |
| Level select | Grid with stars earned | Grid with stars + lock progression |
| Sound | Paint splat SFX + ambient BGM | Web Audio procedural SFX + BGM |
| Ads | Interstitial between levels | Monetag zones |
| Progress save | Cloud sync | localStorage with version |
| Daily challenge | Daily unique level | Daily seed-based level |

## Difficulty Progression Design
- Tier 1 (L1-6): 3x3 to 5x5 simple shapes (box, L, T, plus)
- Tier 2 (L7-12): 5x5-6x6 with internal walls, corridors
- Tier 3 (L13-18): 7x7 mazes with dead ends and branching
- Tier 4 (L19-24): 8x8 complex mazes with multiple rooms
- Tier 5 (L25-30): 9x9-10x10 hardest puzzles

## Visual Reference
- Dark gradient background (GameZipper style)
- Neon glowing paint trails
- Colorful ball with glow/particle trail
- Satisfying paint splash particles
- Smooth ball movement animation

## Monetization
- Monetag MultiTag zones (110120 banner, 110121 native, 110122 interstitial)
- Interstitial between levels (every 3 levels)
- No IAP needed (free browser game)
