# Liquid Connect Benchmark

## GameZipper Gap Analysis

### Market Position
Liquid Connect combines liquid flow mechanics with path-connection puzzle logic. Current competitors focus on EITHER pipe rotation OR water sorting, not both combined. GameZipper has neither a liquid-flow puzzle nor a hybrid pour+connect mechanic.

### Top 5 Competitors

| # | Game | Developer | Downloads | Rating | Mechanic | Platform |
|---|------|-----------|-----------|--------|----------|----------|
| 1 | Water Connect Flow | HM Games Pty Ltd | 10M+ | 4.5★ | Rotate pipes to connect water flow to trees | Android/iOS |
| 2 | Water Connect: Matching | Puzzle Go | 50K+ | 4.3★ | Connect pipes, match fountains to flowers | Android |
| 3 | Water Puzzle: Pipe Connect | Caxstudio | 5K+ | 4.5★ | Jungle path-finding, 3-star collection | Android |
| 4 | Magic Water Puzzle | iKame Games | 10K+ | 4.5★ | Hybrid water sort + color block puzzle | Android/iOS |
| 5 | Water Sort | Various | Various | 4.0-4.6★ | Tube-based water sorting (reference) | All |

### Key Differentiation for GameZipper
- **Hybrid mechanic**: No competitor combines liquid pour animation + path connection logic
- **Water Sort** on GZ = pure sorting (tube-to-tube)
- **Pipe Connect** on GZ = pure pipe rotation (source to drain)
- **Liquid Connect** = pour liquid through connected paths to fill target containers (unique combination)

### Core Systems to Implement
1. **Grid-based path system**: Connect source to target(s) via path tiles
2. **Liquid flow animation**: Visual liquid filling animation along connected paths
3. **Multiple liquid colors**: 3-5 colors per level, must route correct color to correct target
4. **Level progression**: 30+ levels, 5 difficulty tiers (4x4 → 6x6 → 8x8)
5. **Star rating**: Based on moves/time
6. **Hint system**: Show next correct move
7. **Undo**: Unlimited undo
8. **Daily challenge**: One random puzzle per day

### Difficulty Curve
- Tier 1 (L1-5): 4x4 grid, 2 colors, straightforward paths
- Tier 2 (L6-10): 5x5 grid, 3 colors, some branching
- Tier 3 (L11-15): 5x5 grid, 3 colors, cross-path challenges
- Tier 4 (L16-20): 6x6 grid, 4 colors, complex routing
- Tier 5 (L21-25): 7x7 grid, 4-5 colors, advanced puzzles

### Technical Approach
- 2D Canvas rendering
- Procedural level generation with seeded PRNG
- BFS/DFS pathfinding for solution validation
- Liquid fill animation using gradient fills along paths
- Touch + mouse input support
- Web Audio API for SFX (pour, connect, complete)

### Art Style
- Dark gradient background (#0a0a1a → #1a1a3a)
- Neon-colored liquids (cyan, magenta, lime, amber, coral)
- Glass-like container effects (translucent with highlights)
- Particle effects on liquid completion

### Monetization
- Rewarded ads for hints (3 per level)
- Interstitial ads between levels
- No paywall on gameplay
