# Eco Reclaim — Competitive Benchmark (Terra Nil-style)

Target: build a browser single-file reverse-city-builder / eco-restoration puzzle
that captures the core satisfaction loop of **Terra Nil** (Free Lives / Devolver, 2023,
BAFTA nominee, 90% positive Steam) at a playable single-file Canvas fidelity.

## Primary references (2023–2026)

| Title | Year | Hook | Key systems |
|-------|------|------|-------------|
| **Terra Nil** | 2023 | Reverse city-builder; restore barren wasteland then leave | 10 tools, ~7 biomes, 3 climates, animal-recolonize goals, recycle-pack ending |
| **The Hex Scale (indie)** | 2024 | Hex grid restoration with limited energy | Coverage %, biome conditions |
| **Plantera / Viridi (casual)** | 2015–17 | Casual plant-and-grow idle | Simpler resource loop |
| **Mini Motorways / Mini Metro** | 2019–24 | Minimalist hex/grid resource routing | GZ already has metro-lines; useful UI language |

## Systems we MUST reproduce (Terra Nil parity)

1. **Grid map** — square or hex grid of tiles; each tile has a state.
2. **Tile states**: Barren → Soil (purified) → Grassland → Wetland → Forest → Fynbos → Beach; plus Toxic/Rock blockers.
3. **Restoration tools** (resource-spending actions):
   - **Toxin Scrubber** — purify a barren/toxic tile to soil.
   - **Irrigator** — convert soil to wetland if a water source is adjacent.
   - **Cultivator** — grow grassland on soil.
   - **Arboretum** — convert grassland → forest.
   - **Excavator** — dig a river (water source).
4. **Resource economy**: spend "Cores" to place tools; regain cores by restoring tiles (positive feedback). Net must reach goal coverage before cores run out.
5. **Biome coverage goals**: each level requires X% Wetland, Y% Forest, Z% total green, etc.
6. **Animal return**: end-of-level bonus — when certain biome conditions are met, animals return (e.g., Beaver needs Wetland+Forest adjacency).
7. **Level progression**: at least 12 levels with escalating map size / biome complexity / goals.
8. **Reset/recycle ending**: once goals met, "pack up" — convert all buildings back to cores, revealing untouched nature. S-rank by leftover cores.
9. **Climate / temperature secondary layer** (simplified): some tiles can only be restored within a temperature band.
10. **Undo** (Terra Nil's signature safety net) — last action reversible for a core cost.
11. **Save state** with version, level unlocks, best cores.
12. **Tutorial** — first level walks through each tool with skippable prompts.
13. **Sound design**: water burble on irrigate, rustle on grass, wind on forest, chime on goal complete.

## Art / audio direction
- Painterly isometric or top-down tiles with soft green→teal→forest palette.
- Subtle particle blossoms when grass spreads; ripples on wetland placement.
- BGM: ambient pad + nature ambience (wind, distant birds), slow tempo (60–80 BPM).

## Single-file feasibility notes
- Hex grids are heavier to render + click-resolve than square grids; use **square grid (10x10)** for v1 to keep it single-file and performant.
- Animal-return logic = adjacency pattern matcher (cheap).
- Climate layer = optional scoring modifier, not full simulation.

## Scoring (from Round 26 research)
D 4 · S 4 · R 4 · F 3 · Z 5 = **20/25** → selected from queue (Tier 1 next after spin-rogue).

## Non-goals (keep scope sane)
- No procedurally-generated endless mode beyond level set.
- No multiplayer.
- No real Terra Nil IP; original tile art and naming.
