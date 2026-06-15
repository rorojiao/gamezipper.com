# BENCHMARK.md — Bonsai Prune (Prune-inspired Zen Tree Puzzle)

## Competitive Intelligence

### Prune (2015, Joel McDonald / Polyculture)
- **Platform**: iOS ($3.99), Android ($4.99), PC
- **Awards**: Time Game of the Year 2015, BAFTA nom (Best Debut + Best Mobile), GDC nom
- **Sales**: 100k copies in first month
- **Engine**: Unity, 1-2 person indie team
- **Structure**: 6 chapters × ~12 levels (~48-72 levels total)

### Core Mechanics
1. **Swipe to grow**: Swipe upward from root → sapling grows in that direction with organic curves
2. **Tap to prune**: Cut branches to redirect growth energy
3. **Finite energy**: Each level has limited growth energy
4. **Light orbs**: Warm glowing nodes — reach them to bloom flowers
5. **Hazards** (progressive):
   - Fire orbs: touch = branch burns back
   - Buzzsaws: sever branches on contact
   - Pressure pads: hold to open gates
6. **No failure state**: No death, no timer, no penalty — pure zen

### What Makes It Zen
- **Minimalist UI**: No HUD, no tutorial text, no score numbers during play
- **Black silhouette tree** on gradient sky (per-chapter color scheme)
- **Ambient electronic BGM** (Kyle Preston — Bonobo/Tycho feel)
- **Single soft chime** per bloom — no victory stings
- **No "level complete" fanfare** — just quiet transition

### Art Style Reference
- Tree: pure black silhouette, tapered branches (thick base → hairline tips)
- Sky: 3-stop vertical gradient per chapter (deep blue → coral/rose/amber)
- Orbs: warm radial glow (white core → golden halo)
- Blooms: soft pink/white flower particles
- Overall: meditative, spacious, breathing

### Scoring (adapted for GZ)
- Original: no scoring, bloom count is cosmetic
- **Our adaptation**: 3-star system based on bloom efficiency
  - 3 stars: bloom ALL orbs + minimal pruning
  - 2 stars: bloom all orbs
  - 1 star: bloom minimum required orbs

## Our Clone Design (30 levels, 5 chapters)

| Chapter | Theme | Levels | Mechanics |
|---------|-------|--------|-----------|
| 1 | Dawn | L1-6 | Basic growth + blooming |
| 2 | Garden | L7-12 | Multiple orbs, strategic branching |
| 3 | Embers | L13-18 | Fire orbs (hazard) |
| 4 | Storm | L19-24 | Wind drift + tighter energy |
| 5 | Bonsai Master | L25-30 | Complex multi-hazard puzzles |

### Technical Approach
- Single-file HTML5 Canvas
- Procedural tree growth (L-system inspired, frame-by-frame)
- Swipe to grow, tap to prune
- Web Audio API ambient BGM + SFX
- localStorage progress saving
- Per-chapter gradient backgrounds
