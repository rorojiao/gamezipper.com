# Mahjong Connect — Competitive Benchmark

## Selected Game
**Mahjong Connect (Shisen-Sho / Lianliankan / Onet)** — path-drawing tile-matching puzzle

## Top 3 Competitors Analyzed

### 1. Mahjong Connect (classic web portal version — Arkadium / 247 Games)
- **Mechanic**: Click 2 matching tiles. If they can be connected by a path with at most 2 right-angle turns (90° bends), both tiles are removed.
- **Layouts**: Turtle, classic flat 12×8, pyramid, tower — typically 144 tiles.
- **Tile set**: Traditional Mahjong (Suit tiles: Bamboo, Characters, Dots 1-9; Honors: Winds E/S/W/N, Dragons R/G/W; Bonus: Seasons, Flowers).
- **Systems**:
  - Score: base 10/match + time bonus + combo multiplier (consecutive matches within 3s)
  - Hint button (limited uses, shows a valid pair)
  - Shuffle button (limited uses, rearranges remaining tiles)
  - Undo (limited)
  - Timer with bonus points for fast completion
  - Star rating (3 stars = fast + few hints, 1 star = slow + many hints)
- **Monetization**: Banner ads + interstitial between levels + rewarded video for extra hints/shuffles.

### 2. Onet / Pokemon Connect (mobile, 50M+ downloads)
- **Mechanic**: Same path-with-2-turns rule, but tiles are SYMBOLS (fruits, pokemon, animals) instead of Chinese characters. More accessible to non-Asian markets.
- **Layouts**: Rectangle grids (e.g., 10×8 = 80 tiles, 12×7 = 84 tiles), always solvable layouts.
- **Systems**:
  - Levels: 50-100+ handcrafted
  - Hint, shuffle, bomb (auto-remove pair), freeze time power-ups
  - Star ratings
  - Daily challenges
  - Progress save
- **Art style**: Cute colorful cartoon icons on light pastel backgrounds.

### 3. Mahjong Chain (Big Fish Games)
- **Mechanic**: Same connect rule, but the path can travel through already-cleared cells (line of sight through empty space).
- **Variants**: Chain mode (connect in a sequence), classic mode.
- **Systems**: Score multipliers, time pressure, daily puzzle.

## Our Implementation Plan

### Differentiator
We will implement the **classic Mahjong Connect** with TRADITIONAL Mahjong tile set (for SEO authority and visual richness) AND a **dual tile-set toggle** (traditional ↔ symbol/fruit mode for accessibility).

### Core Systems to Implement (must match competitors)
1. **Path-finding with ≤2 turns** (BFS or custom line-of-sight algorithm)
2. **Visual path rendering** — glowing line drawn between matched tiles, fade out
3. **Traditional 144-tile set** rendered as Canvas-drawn glyphs (no external images, no copyright issues):
   - Bamboo 1-9 (vertical stick patterns)
   - Characters (Arabic numerals 1-9 + 万 glyph)
   - Dots/Circles 1-9 (circle patterns)
   - Winds: East 南, South 南, West 西, North 北 (we'll use English E/S/W/N for clarity)
   - Dragons: Red 中, Green 發, White (blank)
   - Seasons: Spring/Summer/Autumn/Winter (any 2 seasons match)
   - Flowers: Plum/Orchid/Chrysanthemum/Bamboo (any 2 flowers match)
4. **30 handcrafted levels** scaling difficulty:
   - T1 (L1-6): 8×4 grid, 32 tiles, 8 unique types — gentle intro
   - T2 (L7-12): 10×6 grid, 60 tiles, 12 types — full classic feel
   - T3 (L13-18): 12×7 grid, 84 tiles, 16 types — strategic
   - T4 (L19-24): 14×8 grid, 112 tiles, 18 types — large classic
   - T5 (L25-30): 12×8 grid, 96 tiles, 18 types + TIME LIMIT — expert
5. **Scoring**: 10 base + 2×combo + time bonus. 3-star rating per level.
6. **Power-ups**: Hint (3 uses/level), Shuffle (2 uses/level), Undo (5 uses/level)
7. **Modes**: Classic (untimed), Time Attack (timed)
8. **Daily Challenge**: Seeded by date
9. **Progress save**: localStorage with version field, level unlock, best scores, total stars
10. **Tutorial**: First-visit overlay explaining connect rule with animation
11. **BGM + SFX**: Web Audio API (procedural — ambient puzzle BGM + match/pop/win SFX)

### Visual Style
- Dark gradient background (#0a1a2e → #16213e → #0f3460), neon cyan/amber accents
- Tiles: ivory cream with subtle 3D bevel, colored glyphs
- Path: glowing amber/cyan line with particle trail
- Animations: tile pop on match, particle burst, path glow fade

### Difficulty Curve
- L1-6: Easy (4 pair types, open grid)
- L7-12: Medium (12 pair types)
- L13-18: Hard (16 pair types, tighter grid)
- L19-24: Very Hard (18 pair types, full classic)
- L25-30: Expert (18 pair types + 90s/120s/180s time limits)

## Key Technical Notes
- **Pathfinding algorithm**: For 2 tiles at (r1,c1) and (r2,c2):
  - 0 turns: same row or column with clear line
  - 1 turn: L-shaped path with corner at (r1,c2) or (r2,c1), both segments clear
  - 2 turns: try all rows r and columns c as the middle segment endpoints; check 3-segment path is clear
- All pathfinding must consider the grid INCLUDING a 1-cell border (tiles can route around the outside edge)
- Tiles removed leave empty cells that become path-routable

## Success Criteria
- All 30 levels solvable (validated by Phase 6)
- All 12 systems above implemented
- QA: 40-point checklist passes
- Single-file HTML5, English UI, Canvas-based, 60fps
