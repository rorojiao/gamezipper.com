# Akari (Light Up) — Competitor Benchmark

## Selected Game
**Akari** (a.k.a. "Light Up") — Nikoli-published logic puzzle. Place light bulbs in a grid to illuminate all white cells. Each bulb lights its row and column until hitting a black cell (wall). Numbered walls tell how many bulbs are adjacent (orthogonally). No two bulbs may illuminate each other.

## Core Mechanic
1. Grid of white and black cells; some black cells have numbers (0-4)
2. Place bulbs on white cells
3. Each bulb illuminates its entire row/column until blocked by a wall
4. Numbered walls must have exactly that many adjacent bulbs
5. Bulbs cannot illuminate each other (no two bulbs on same row/column without a wall between them)
6. All white cells must be illuminated

## Competitors

### Simon Tatham's Portable Puzzle Collection (puzzling.sourceforge.net)
- Free, open source, 35+ puzzle types including Akari ("Light Up")
- Pure gameplay, no scoring/stars/daily challenges
- Desktop app, no mobile-optimized web version
- Weakness: No progression, no save, no monetization, ugly UI

### Nikola (nikoli.com)
- Official Nikoli publisher's app
- Premium paid app on Nintendo Switch/iOS/Android
- 200+ handcrafted puzzles
- Weakness: Paid only, no free web version, Japanese-only initially

### Puzzle Baron (puzzlebaron.com)
- Web-based Akari with limited free puzzles
- Daily puzzles available
- Weakness: Ugly UI, no mobile optimization, no levels/progression

### BrainBashers (brainbashers.com)
- Free daily Akari puzzle
- Simple web implementation
- Weakness: Single puzzle per day, no progression, no scoring

### Google Play Akari apps
- "Akari Puzzle" by Simon Hayhoe — 500K downloads
- "Light Up Puzzle" — various small apps 10K-100K downloads
- All have low-quality UIs and limited content

## Gap Analysis
- **Zero quality free browser Akari games** on Poki, CrazyGames, or major web portals
- No mobile-optimized web implementation exists
- GameZipper would be the **first quality free browser Akari game**
- Search "play akari online", "akari puzzle free", "light up puzzle online" — no good results

## Feature Requirements for GameZipper
1. **Grid sizes**: 7x7 (Easy), 8x8 (Medium), 9x9 (Hard), 10x10 (Expert), 11x11 (Master)
2. **30 levels** across 5 tiers (6 per tier)
3. **Daily challenge** with seed-based generation
4. **Scoring**: Time-based + hints used penalty
5. **3-star rating** per level (based on time)
6. **Hint system**: 3 hints per level (reveals one correct bulb placement)
7. **Undo/Reset**
8. **Tutorial** (first-time only)
9. **localStorage save** with version field
10. **Dark neon theme** matching GameZipper style
11. **Web Audio BGM + SFX**
12. **Touch + Mouse support**
13. **Mobile responsive**

## Scoring Matrix
| Dimension | Score | Notes |
|-----------|-------|-------|
| Market demand | 4 | Nikoli classic, dedicated puzzle community |
| SEO gap | 5 | Zero quality free browser games |
| Retention potential | 4 | 30 levels + daily challenge |
| Implementation feasibility | 5 | Simple grid logic, no physics |
| Zero overlap | 4 | New mechanic category (illumination) |
| **Total** | **22/25** |
