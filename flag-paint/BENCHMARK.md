# Flag Paint: World Tour — Competitor Benchmark

## Selected Game
**Flag Paint: World Tour** — flag-coloring geography puzzle (Rabbit Mountain / Poki clone)
Slug: `/flag-paint/` | Category: puzzle

## Why This Game (Score 20/25)
- D (Market): Top puzzle on Poki, millions of plays, "Flag Paint: World Tour" by Rabbit Mountain — Google Play `com.rabbitmountain.puzzle1` → 3
- S (SEO): "flag paint", "paint the flag", "world tour puzzle", "country flag game" — zero GZ coverage → 4
- R (Retention): 195 countries collection, daily flags, educational replayability → 3
- F (Feasibility): Grid/region fill + tap paint, Canvas, straightforward → 5
- Z (Zero-overlap): No flag-painting game exists (color-by-number, paint-splash, maze-paint all different mechanics) → 5

## Primary Competitors
| Attribute | Flag Paint: World Tour (Rabbit Mountain) | Roller Splat! (Voodoo) | Color by Number |
|---|---|---|---|
| Platform | Poki, Google Play, iOS | Poki, Google Play | Many |
| Mechanic | Paint flag regions with correct colors | Swipe roller to paint maze floor | Tap numbered cells with color |
| Levels | 195 countries (world tour) | Endless procedural | Image-based |
| Theme | Geography / educational | Abstract paint | Pictures |
| Our differentiator | **Smooth paint-spread animation + flag trivia + continent progression + juicy feedback** | — | — |

## Core Mechanic
Flag-coloring puzzle as world tour:
1. Each level shows a country's flag with EMPTY (white/outline) regions
2. A color palette displays the flag's available colors (2-6 colors depending on complexity)
3. Player taps a color, then taps regions to paint them
4. Paint spreads with a satisfying fluid animation from tap point
5. Win when ALL regions match the target flag
6. "Visit" the country — world map lights up, trivia card shows
7. Limited mistakes (hearts) for challenge in later levels

## Flag Representation
Each flag = list of regions. Each region has a shape + geometry + target color:
- **Background**: solid rectangle (1 region)
- **Stripes**: horizontal or vertical bands
- **Circle/Disc**: centered or offset
- **Cross**: Nordic, Greek, Swiss, UK-style
- **Star/Star field**: simplified for USA
- **Diamond/Triangle**: Brazil, Nepal, Czechia
- **Crescent/Emblem**: Turkey, Algeria (simplified)

Player paints each region. Tap detection = topmost region under pointer.

## Difficulty Tiers (30 levels, 5 continents)
| Tier | Levels | Continent | Complexity | Colors |
|---|---|---|---|---|
| Beginner | 1-6 | Europe I | Simple 2-3 region flags | 2 |
| Easy | 7-12 | Europe II | Stripes, simple crosses | 2-3 |
| Intermediate | 13-20 | Americas + Africa | Circles, diamonds, multi-region | 3-4 |
| Advanced | 21-26 | Asia I | Crescents, stars, complex | 4-5 |
| Expert | 27-30 | Asia II + Oceania | Most complex (USA, UK, India) | 5-6 |

## Flag Level List (30 handcrafted)
1. Japan — white bg + red disc
2. Bangladesh — green bg + red disc
3. France — blue/white/red vertical stripes
4. Italy — green/white/red vertical stripes
5. Belgium — black/yellow/red vertical
6. Ireland — green/white/orange vertical
7. Germany — black/red/gold horizontal
8. Netherlands — red/white/blue horizontal
9. Poland — white/red horizontal
10. Indonesia — red/white horizontal
11. Sweden — blue bg + yellow Nordic cross
12. Denmark — red bg + white Nordic cross
13. Switzerland — red bg + white cross
14. Romania — blue/yellow/red vertical
15. Spain — red/yellow/red horizontal
16. Austria — red/white/red horizontal
17. Canada — red/white/red + maple leaf (simplified)
18. Argentina — light blue/white/light blue + sun (simplified)
19. Brazil — green bg + yellow diamond + blue circle
20. Czechia — white/red + blue triangle
21. Greece — blue/white stripes + cross
22. Israel — white + blue stripes + star
23. Turkey — red bg + white crescent/star
24. Morocco — red bg + green star
25. Thailand — red/white/blue/white/red
26. Malaysia — red/white stripes + blue canton
27. USA — stripes + star field (simplified)
28. UK — Union Jack (simplified crosses)
29. India — saffron/white/green + blue wheel (simplified)
30. South Africa — complex 6-color (simplified Y-shape)

## Systems to Implement (P0 — required)
- Flag canvas with region-based rendering (background, stripes, shapes)
- Tap-to-paint interaction (select color → tap region → fill with animation)
- Color palette (flag-specific colors, highlight selected)
- Paint-spread animation (radial fill from tap point, ~300ms)
- Hearts system (3 hearts; -1 on wrong color in Advanced+ tiers; Beginner = no penalty)
- Level progression + world map select (continents unlock)
- 30 handcrafted flag levels with accurate colors
- Correct/complete detection (compare painted vs target per region)
- Level complete celebration (flag sparkles, confetti, trivia card)
- LocalStorage progress save (with version field) — completed flags, stars, hearts
- Star rating (3 stars = no mistakes, 2 = 1 mistake, 1 = 2+ mistakes)
- Hint system (auto-fill one correct region, limited per level)
- Tutorial overlay (skippable) for first play
- Procedural BGM (Web Audio API) — relaxing world-tour theme
- SFX: paint, select color, correct, wrong, complete, button, unlock
- Country trivia display after completion (capital, continent, fun fact)
- Mobile + desktop responsive (portrait primary for flags)
- ALL English UI
- Cleanup function (cancel rAF, audio nodes, listeners)

## Art Direction
- Clean flat flag designs with accurate official colors
- Dark gradient background (GameZipper style) behind flag canvas
- Glowing region outlines on hover/selected
- Paint = fluid radial gradient spread
- World map with glowing dots for visited countries
- Soft glass-morphism panels for palette/UI
- Large tap targets (min 44px) for color buttons
- Emoji-free title

## Differentiators from Competitor (Opportunity)
1. Satisfying paint-spread animation (competitor = instant fill)
2. Educational trivia (competitor = just painting)
3. World map progression visualization (competitor = flat list)
4. No excessive ads (competitor #1 complaint)
5. Continent-based difficulty curve
6. Complete shipped 30 flags (no paywalls)

## Flag Data Structure
```js
{
  id, name, country, capital, continent, difficulty,
  palette: ['#hex', ...],  // available colors
  regions: [
    { type:'bg', color:0 },           // background, palette index
    { type:'rect', x,y,w,h, color:1 },
    { type:'circle', cx,cy,r, color:2 },
    { type:'cross', style:'nordic'|'greek'|'swiss'|'union', color, ... },
    { type:'triangle', points:[[x,y],...], color },
    { type:'diamond', cx,cy,rw,rh, color },
    { type:'star', cx,cy,r, points:5, color }
  ],
  aspectRatio: 1.5  // width/height (most flags 3:2)
}
```
