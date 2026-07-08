# Spiral Galaxies (Tentai Show) — Competitive Benchmark

## Subject
**Spiral Galaxies** (Nikoli: Tentai Show / 天体ショー)

## Origin & Authority
- **Publisher**: Nikoli Co., Japan (inventor of Sudoku, Slitherlink, etc.)
- **Page**: https://www.nikoli.co.jp/en/puzzles/tentai_show/
- **Standard reference**: Simon Tatham Portable Puzzles — "Galaxies"
- **Variants**: symmetric polyomino partitioning

## Rules (Authoritative)
1. Grid of unit squares (rectangular).
2. Several dots ("stars") placed on grid points (intersections) or cell centers.
3. **Goal**: partition the grid into polyomino regions.
4. Each region contains **exactly one** dot.
5. Each region is **180° rotationally symmetric** about its dot.
6. (Optional Nikoli flavor) Filling black-star regions reveals a picture.

## Catalog Gap Analysis (GameZipper)
| Keyword | Count in js/games-data.js | Dedicated game? |
|---------|---------------------------|-----------------|
| `spiral galaxies` | 0 | ❌ NO |
| `tentai show` | 0 | ❌ NO |
| `galaxies puzzle` | 0 | ❌ NO |
| `symmetric polyomino` | 0 | ❌ NO |
| `rotationally symmetric` | 0 | ❌ NO |

**True zero-gap** confirmed on 2026-07-08. No sibling implements "180° symmetric polyomino partitioning" mechanic.

## Competitive Landscape

| Source | Platform | Format | Notes |
|--------|----------|--------|-------|
| Nikoli | Print/web | Books, sample puzzles | Original author |
| Simon Tatham "Galaxies" | Desktop/mobile/web | C → JS | 6+ sizes, infinite generation |
| PuzzleManiak "GalaxiesManiak" | iOS (2009) | Native | 6 difficulty levels, daily puzzle |
| Puzzle-Baron | Web | HTML | Daily/weekly/monthly |
| puzzle-galaxies.com | Web | Proprietary | Has strategy guide |
| puzzle-loop.com (variant) | Web | HTML | Nikoli aggregator |

## Standards to Match
1. **Generation**: reverse-construction (start from a valid tiling, place stars, then player solves).
2. **Grid sizes**: 4×4 → 10×10 (5 difficulty tiers).
3. **Interaction**: click/tap grid lines OR click cells to assign to nearest star (we'll use click cells — more intuitive on mobile).
4. **UX must-haves**: undo, hint, restart, level select, 3-star ratings, save (localStorage), keyboard shortcuts, sound toggle.
5. **Visual feedback**: regions colored differently, 180° symmetry indicator on each star, win confetti.
6. **Verification**: each level has exactly one unique solution (constraint-propagation solver).

## Differentiation (vs. competitors)
- **Browser-native single-file HTML5**: no app download (Simon Tatham needs install; PuzzleManiak is iOS-only).
- **30 handcrafted-quality levels** across 5 tiers, each verified unique.
- **Modern UI**: dark cosmic theme, neon star colors, particle effects.
- **Hint system**: 3 hints/level, reveals one forced cell.
- **Web Audio ambient music**: cosmic drone + chime SFX.
- **Mobile-first**: tap cells (not grid lines), large touch targets.

## Game Design Decisions

### Representation Choice
Two interaction paradigms exist:
- **(A) Click grid lines** (Simon Tatham, Nikoli original): draw/remove borders.
- **(B) Click cells** to toggle assignment to nearest star.

**Decision**: Use **(B)** — click a cell to assign it to a star (cycle or smart-pick). More intuitive for casual mobile users; standard in modern puzzle apps.

### Star Placement Convention
- Centers can be at **cell centers** (integer coords) or **grid intersections** (half-integer coords).
- For our game, use **grid intersections only** for authenticity and richer polyomino shapes (L-shapes, T-shapes become possible).
- Black stars (picture-mode) → cosmetic only; we render all stars in cosmic palette and color regions by star identity.

### Reverse-Construction Level Generation
1. Start from a partition of W×H into rotationally-symmetric polyominoes (each with a center on a grid intersection).
2. Place one star at each center.
3. Verify uniqueness via constraint solver (forces must converge).
4. Output: star positions + dimensions.

### Difficulty Tiers
| Tier | Grid | # Stars | Complexity |
|------|------|---------|------------|
| Beginner | 4×4 | 2-3 | trivial shapes |
| Easy | 5×5 | 3-4 | dominoes & triominoes |
| Medium | 6×6 | 4-5 | mixed small |
| Hard | 8×8 | 6-8 | L/T shapes |
| Expert | 10×10 | 8-12 | complex |

## Verification Strategy (3-method)
1. **Python BFS/forced-propagation** solver: from stars, propagate forced cells (any cell that must belong to a star because no other star can reach it), verify uniqueness.
2. **Independent Node.js** solver: same algorithm, different impl.
3. **In-engine Node.js** solver: load actual index.html LEVELS data, solve, match stored solution.

## SEO Keywords (target)
spiral galaxies, tentai show, symmetric polyomino puzzle, galaxies puzzle, rotation puzzle, 180 degree symmetry puzzle, nikoli puzzle, brain teaser, logic puzzle, free browser game, html5, mobile game, no download
