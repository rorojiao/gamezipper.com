# Kaleidoscope Pattern Puzzle — Competitive Benchmark

## Market Position (Phase 0)
- **Gap status**: TRUE ZERO GAP in GameZipper catalog (553 games, 0 kaleidoscope-puzzle)
- `kaleidoscope` keyword appears only as a single level/label in 3 existing games (string-art L20, magic-sort label, unpuzzle wedge) — not a standalone game
- **Mobile market**: KaleidoscopeMagicPad (9game.cn), Magic Kaleidoscope (Steam ¥22) confirm demand
- **Adjacent genres covered**: tentai-show (galaxies symmetry), gem-paint (mandala level), tangram, jigsaw — but no kaleidoscope-pattern-recreation game

## Competitor Analysis

| Game | Mechanic | Symmetry | Grid | Our Edge |
|------|----------|----------|------|----------|
| Tentai Show (ours) | Divide grid into symmetric regions | 2-fold | Paper | Different: rotate tiles, not divide |
| Gem-Paint (ours) | Paint gems by number | N/A | Varied | Different: rotation-based |
| I Love Hue (ours, R76) | Swap tiles to restore gradient | N/A | 4x4-8x8 | Different: rotation not swap |
| Magic Kaleidoscope (Steam) | VR/visual toy | 4-8 fold | Freeform | We add: puzzle structure, levels, scoring |
| Rotate Me (mobile) | Rotate objects to match | Varied | Single obj | We add: full grid, 30 levels, symmetry math |

## Core Mechanic Design

**Kaleidoscope Pattern Puzzle**: An NxN grid where every tile has a color + a rotation (0-3).
The solved state exhibits **4-fold rotational symmetry** — the pattern looks identical when rotated 90°.

**Player action**: Click any tile to rotate it 90° clockwise.
**Goal**: Rotate all tiles back to their correct orientation to reveal the symmetric kaleidoscope pattern.

### Why it's a puzzle (not just busywork)
1. **Unique solution**: Each tile has exactly ONE correct rotation (mathematically guaranteed by symmetry)
2. **Visual feedback**: Correct tiles glow; the pattern "snaps" into beauty when right
3. **Strategy**: Higher tiers add more colors and larger grids — visual disambiguation becomes harder

## Feature Parity (S-Tier Standard)

| Feature | Status |
|---------|--------|
| 30 levels, 5 tiers (4x4 → 8x8) | ✅ |
| 3-star rating system | ✅ |
| Hint system (3 per level) | ✅ |
| Undo | ✅ |
| Move counter + par display | ✅ |
| Daily challenge | ✅ |
| Achievements (10) | ✅ |
| Web Audio BGM + SFX | ✅ |
| Progress save (localStorage) | ✅ |
| Mobile-responsive | ✅ |
| Full SEO schemas | ✅ |

## Art Direction
- Symmetric mandala/kaleidoscope aesthetic
- Rich saturated palettes (10 palettes, 3-4 colors each)
- Glowing correct-tile feedback
- Tier-appropriate grid sizes
