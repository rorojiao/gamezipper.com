# Roll the Ball — Competitive Benchmark

## Selected Game
**Roll the Ball** (slug: `roll-the-ball`) — slide puzzle game where players rearrange pipe/path tiles to create a continuous route for a steel ball to roll from start to exit.

## Phase 0 Selection Score: 24/25

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Market Demand | 5/5 | 100M+ downloads, 1.54M reviews, 4.2 stars (BitMango original) |
| SEO Gap | 5/5 | Zero GZ coverage, "roll the ball" highly searched globally |
| Retention | 5/5 | Addictive puzzle loop, original has 1000+ levels |
| Feasibility | 4/5 | Grid-based, procedurally generatable; path gen needs care |
| Zero Overlap | 5/5 | No equivalent on GZ (Unblock Me = block exit, different mechanic) |

## Competitor Analysis

### 1. Roll the Ball® - slide puzzle (BitMango)
- **Platform:** Google Play / iOS / Amazon
- **Downloads:** 100M+
- **Rating:** 4.2★ (1.54M reviews)
- **Core mechanic:** Slide tiles in grid to connect path from start to exit
- **Tile types:** Start, End, Straight pipe, Corner pipe, Obstacle block
- **Systems:** Star rating (3-star per level), level packs, hints, daily rewards, achievements
- **Monetization:** Ads + IAP (hints, level packs, remove ads)
- **Key feature:** Ball rolls along completed path with satisfying animation

### 2. Roll the Ball: slide puzzle 2 (BitMango sequel)
- Sequel with more tile types, themed level packs
- Added: rotating tiles, portals, special blocks

### 3. Unblock Me (Kiragames) — indirect competitor
- Different mechanic (slide blocks to exit one specific block)
- GZ already has this: /unblock-me/

## Systems to Implement (Competitive Parity)

1. **Star Rating:** 3 stars (optimal moves), 2 stars (par+2), 1 star (solved)
2. **Level Progression:** 27 levels, 6 tiers (Beginner → Master)
3. **Move Counter:** Track moves vs par
4. **Hint System:** Highlight a tile that needs moving
5. **Undo:** Undo last tile move
6. **Reset:** Reset level to initial state
7. **Progress Save:** localStorage with version
8. **Level Select:** Grid showing stars earned per level
9. **Sound:** Click, place, error, win, ball-roll SFX + procedural BGM
10. **Tutorial:** First-time overlay explaining mechanics
11. **Settings:** Sound/music toggles

## Tile Types

| Tile | Connections | Visual |
|------|-------------|--------|
| START | One exit (right) | Green block with arrow |
| END | One entry (right) | Target/checkered flag |
| STRAIGHT_H | Left + Right | Horizontal pipe |
| STRAIGHT_V | Top + Bottom | Vertical pipe |
| CORNER_TR | Top + Right | L-shaped (NE corner) |
| CORNER_TL | Top + Left | L-shaped (NW corner) |
| CORNER_BR | Bottom + Right | L-shaped (SE corner) |
| CORNER_BL | Bottom + Left | L-shaped (SW corner) |
| OBSTACLE | None | Dark fixed block |

## Level Tier Distribution

| Tier | Levels | Grid | Difficulty |
|------|--------|------|------------|
| Beginner | 1-5 | 5×5 | Short straight paths, few obstacles |
| Easy | 6-10 | 6×6 | Add corners, moderate obstacles |
| Medium | 11-15 | 6×6 | Longer paths, more obstacles |
| Hard | 16-20 | 7×7 | Complex paths, many obstacles |
| Expert | 21-25 | 7×7 | Long winding paths |
| Master | 26-27 | 8×8 | Maximum complexity |
