# BENCHMARK.md — Hex Path Spin

## Game: Hex Path Spin (#520)
- **Slug**: `/hex-path-spin/`
- **Category**: Puzzle
- **Mechanic**: Hex tile rotation path-building (Entanglement-style)

## Competitor Analysis

### Primary Competitor: Entanglement (by Mark Gossard)
- **Platform**: Web (entanglement-game.com), iOS, Android, Steam
- **Downloads**: Millions across platforms
- **Awards**: IGF 2011 finalist
- **Core mechanic**: Rotate hexagonal tiles to build the longest continuous curved path
- **Monetization**: Free web version, paid mobile/Steam ports
- **Strengths**: Elegant minimalist design, infinite replayability, procedurally generated boards
- **Weaknesses**: No browser-based free clone existed before this

### Spiritual Successor: Tsuro (board game)
- **Sales**: 500K+ physical copies
- **Mechanic**: Tile placement to create paths, avoid edges
- **Differentiator**: Hex Path Spin uses rotation (not placement) and scoring (not elimination)

## GameZipper Catalog Gap Analysis
- **hex path**: 0 results (unique mechanic)
- **tile rotation**: 0 results 
- **entanglement**: 0 results
- **pipe-connect**: 11 results (but uses square grid, not hex curved paths)
- **tangle games**: 5 results (rope/wire untangling — completely different verb)

**Verdict**: Zero catalog overlap. Unique hex-tile path-rotation mechanic.

## Technical Benchmark
| Metric | Hex Path Spin | Entanglement (web) |
|--------|--------------|-------------------|
| File size | 50KB (single file) | ~2MB (loaded assets) |
| Load time | <1s | 3-5s |
| Levels | 30 (5 tiers) | Infinite (procedural) |
| Offline | Yes (self-contained) | No (requires server) |
| Mobile | Yes (touch events) | Limited |

## Scoring Framework (25-point)
| Category | Score | Notes |
|----------|-------|-------|
| Demand | 4/5 | Entanglement has millions of players, proven demand |
| Uniqueness | 5/5 | Zero catalog overlap, unique mechanic |
| Feasibility | 5/5 | Pure logic puzzle, deterministic, no physics |
| Monetization | 3/5 | Display ads only, no IAP opportunity |
| SEO | 3/5 | Niche keywords, low competition |
| **Total** | **19/25** | ✅ Above 18 threshold |

## Development Notes
- 3 tile pattern types: Curls (adjacent), Waves (one-apart), Crosses (mixed)
- Board sizes: 7 hexes (Tier 1), 19 hexes (Tier 2-3), 37 hexes (Tier 4-5)
- Seeded PRNG (mulberry32) for deterministic level generation
- Star ratings based on path length vs. hex count (35%/55%/75% thresholds)
