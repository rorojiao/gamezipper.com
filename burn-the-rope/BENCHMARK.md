# Burn the Rope — Competitive Benchmark

## Candidate
**Burn the Rope** — flame propagation + gravity rotation puzzle
Slug: `burn-the-rope` | Category: puzzle | Emoji: 🔥

## Market Gap Analysis (2026-06-27)
- `grep -ic 'burn\|flame\|wick\|candle\|torch\|rope-fire' js/games-data.js` = **0** across 448 games
- Closest siblings on GameZipper are all mechanically distinct:
  - **Cut the Rope**: cut ropes to feed candy (physics/cut, not fire)
  - **Hotaru Beam**: Nikoli light-up puzzle (bulb/beams, not fire propagation)
  - **Light Beam Puzzle**: mirror reflection (static, not dynamic spread)
  - **Rope Rescue**: draw ropes to rescue (drawing, not burning)
  - **Fireboy & Watergirl**: co-op platformer (platforming, not puzzle)

## Top Competitor Analysis

### Burn the Rope (Big Blue Bubble, 2010)
- **Downloads**: 50M+ across iOS/Android
- **Core mechanic**: Tap to ignite a point on a rope network. Fire spreads along
  ropes but ONLY in the "upward" direction relative to gravity. Rotate the device
  to change gravity direction and guide flames to burn ALL rope segments.
- **Key features**:
  - 200+ levels across multiple difficulty tiers
  - Bugs/ants crawl along ropes (bonus collectibles — eat for extra points)
  - Different rope colors, types (fire-resistant, fast-burning)
  - Water droplets that extinguish fire (obstacles)
  - 3-star rating per level
  - Charming fire/bug animations and particle effects
- **Monetization**: Paid ($0.99-1.99) initially, then freemium with interstitials
  and in-app purchases for level packs. The free-to-play version drove massive downloads.
- **Why it works**: The "rotate to keep fire alive" mechanic creates an intuitive
  physical-intuition puzzle. Short satisfying sessions, "aha!" moments, instant retry.

### Clones & Variants
- **Rope Burn** (various indie): simplified versions, lower quality
- **Burn the Rope Worlds** (sequel): added themed worlds, new rope types
- No high-quality browser/HTML5 version exists — all clones are mobile-only or low quality

## Systems to Replicate (S-Level Standard)
1. ✅ **Rope network system**: nodes + edges forming connected graphs
2. ✅ **Fire propagation physics**: discrete model — fire spreads node-to-node, only upward
3. ✅ **Gravity rotation**: rotate playfield to change fire direction
4. ✅ **Ignition**: tap to start fire at any rope point
5. ✅ **Win condition**: burn ALL rope segments in the level
6. ✅ **Star rating**: 3 stars (complete / eat all bugs / speed bonus)
7. ✅ **Bug collectibles**: ants crawl along ropes, fire eats them for bonus
8. ✅ **Level progression**: 30 levels, 6 tiers, increasing complexity
9. ✅ **Visual polish**: animated flames, charred rope segments, particle effects
10. ✅ **Procedural audio**: fire crackling, burn SFX, victory chimes

## Technical Design
- **Rendering**: HTML5 Canvas 2D with ctx.rotate() for gravity rotation
- **Fire model**: Discrete — each rope segment has burn state; fire front advances at
  fixed speed; only spreads to segments where destination is "upward" (dot product of
  travel direction with gravity-up vector > 0)
- **Controls**: Desktop = arrow keys / A,D to rotate; Mobile = on-screen buttons + drag
- **Level format**: { nodes: [{x,y}], edges: [{a,b}], bugs: [{node,dir,speed}], start: nodeId }
- **Solver verification**: BFS from ignition point checking all rotation states

## Monetization Plan
- Interstitial ad every 3 levels
- Rewarded "skip level" and "show solution" ads
- Natural short sessions → high ad density without annoyance
