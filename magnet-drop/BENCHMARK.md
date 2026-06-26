# Magnet Drop — Competitive Benchmark

## Game Concept
Launch a steel ball and navigate it through a field of attracting (+) and
repelling (−) magnets, past walls and boost pads, to land it in the goal cup.
Physics-based single-file HTML5 puzzle with 30 handcrafted levels across 6 tiers.

## Why This Game (Market Gap)
- **Competitor genre**: Physics magnet ball games are a proven CrazyGames /
  magnetgames.net trend ("Magnetism" — silver ball to landing cup surrounded by
  magnets). The genre has steady search demand ("magnet game", "magnetism",
  "magnet puzzle", "steel ball magnet").
- **GameZipper gap**: `/magnets/` is a Nikoli +/- logic grid puzzle (no physics).
  `gravity-drop`, `gravity-orbit`, `plinko`, `pin-master` are gravity/pinball
  games with NO magnet polarity forces. The launch-ball + magnet-field + reach-goal
  mechanic is completely uncovered in the catalog (zero-overlap 5/5).
- **IP-safe**: Generic name "Magnet Drop", generic steel-ball/magnet physics,
  no copyrighted characters or brands.

## Top Competitors Analyzed
| Competitor | Platform | Downloads/Plays | Core Mechanic |
|-----------|----------|-----------------|---------------|
| Magnetism (magnetgames.net) | Web | Established niche | Silver ball to cup past attracting magnets |
| Magnet games (CrazyGames genre) | Web | Trending | Drop/place magnets, repel/attract |
| Gravity Drop (our own #432) | Web | Live | Remove blocks to guide ball (no magnets) |
| Pin Master (our own) | Web | Live | Tap pins, gravity drop plates |

## Features to Match / Exceed (S-Level Quality)
1. **Drag-to-aim launch** with live trajectory preview arc (slingshot-style).
2. **Realistic 2D physics**: gravity, air friction, restitution (bounce).
3. **Magnet polarity forces** (inverse-square):
   - Attractor magnets (pull the steel ball toward them).
   - Repulsor magnets (push the ball away).
   - Field visualization (faint glow / field lines).
4. **Fixed obstacles**: walls, barriers, ramps.
5. **Interactive elements**: boost pads (speed up), teleporter pairs.
6. **Goal cup**: ball must come to rest inside the goal to clear the level.
7. **Launch budget**: limited balls per level (par = 1–3); star ratings by balls used.
8. **30 handcrafted levels** across 6 tiers (5 each): Tutorial → Easy → Medium →
   Hard → Expert → Master, with smooth difficulty progression.
9. **Level select** grid with star ratings + lock gating.
10. **Hints system** (show suggested first-shot trajectory) + skip option.
11. **Achievements** (first clear, all-stars, perfect-run, magnet-master).
12. **Procedural Web Audio music** + SFX (launch, magnet hum, goal-in, win).
13. **Save progress** to localStorage (stars, unlocked tier, achievements, mute).
14. **Responsive canvas** (mobile touch + desktop mouse), no external assets.

## Monetization Fit
- Level-based short satisfying sessions → interstitial between levels.
- "Reach the goal" objective creates replay compulsion → rewarded ads for
  extra balls / hints / level skip.
- Star ratings drive retention and "complete all 3 stars" grinding.

## Success Criteria
- 100% QA checklist pass (40 points).
- All 30 levels verified solvable with correct difficulty progression.
- Single-file HTML, no external dependencies, mobile-friendly.
- 4-number sync on registration (GAMES count / schema / HTML / category count).
