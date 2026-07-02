# Parking Jam — Competitive Benchmark

## Selected Game
- **Name**: Parking Jam
- **Slug**: parking-jam
- **Mechanic**: Rush Hour / Unblock Car puzzle. Slide cars horizontally or vertically on a grid; free the target car to the exit.

## Top 3 Competitors Benchmarked

### 1. Parking Jam 3D (Popcore, mobile)
- DAU: millions
- Levels: 5000+ procedural
- Systems: level select, stars (1-3 by moves), hints, undo, daily challenge, color cars, skins
- Art: 3D isometric, but 2D top-down is the classic form
- Monetization: interstitial ads, rewarded hints

### 2. Rush Hour (ThinkFun board game)
- Mechanic origin: 40 challenge cards from beginner to expert
- Defines the genre: 6x6 grid, horizontal cars slide horizontal only, vertical trucks slide vertical only
- Target: move red car out the right exit

### 3. Unblock Car (mobile, hundreds of variants)
- Levels: 1000s
- Systems: difficulty tiers, star ratings by par-moves, hint button, daily puzzle
- Art: top-down neon cars

## Systems to Implement (must match)
1. ✅ Grid-based level system (6x6 default, scaling to 7x7, 8x8)
2. ✅ Horizontal cars (slide left/right only), vertical cars (slide up/down only)
3. ✅ Target car (red) with exit marker on the right edge
4. ✅ Win condition: target car reaches exit
5. ✅ Move counter + par (optimal moves) for star rating
6. ✅ Hint system (one free move reveal, then watch-ad/cooldown)
7. ✅ Undo system
8. ✅ Level select with tier progression (locked until previous cleared)
9. ✅ Star ratings (3 stars = par or better, 2 = within 1.5x, 1 = solved)
10. ✅ Progress save (localStorage, versioned)
11. ✅ Tutorial overlay on level 1
12. ✅ Daily challenge (procedural level seeded by date)
13. ✅ Sound effects (Web Audio API)
14. ✅ Particles on win, screen feedback on slide
15. ✅ 30 handcrafted levels across 6 tiers
16. ✅ All levels verified solvable (CSP solver during generation)

## Art Direction
- Top-down neon dark theme (GameZipper house style)
- Gradient cars with subtle shadow
- Glowing exit arrow
- Grid lines subtle

## Music
- Ambient puzzle electronic (procedural via Web Audio API)
