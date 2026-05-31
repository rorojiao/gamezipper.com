# Physics Drawing Puzzle — Competitor Benchmark

> **Game**: Draw Physics Puzzle (brain-it-on) for GameZipper
> **Date**: 2026-05-31

## Target: Brain It On! — Score 19/25
- Market: 10M+ downloads, top Android puzzle
- Core: Draw freehand shapes → physics objects → solve challenges (ramps, levers, weights)
- Simple physics engine, 30+ levels, multiple solutions, star ratings

## Competitors: Brain It On!, Shatterbrain, Love Balls, Draw Physics Line

### Must-Have Systems (from all competitors):
1. **Star System**: 1-3 stars per level (completion + ink usage + time)
2. **Level Gating**: Stars unlock next level pack
3. **Hint System**: Show solution (earned by stars or watching)
4. **Progress Save**: localStorage with version field
5. **Tutorial**: First 3 levels teach mechanics implicitly
6. **Multiple Solutions**: Encouraged — core design pillar
7. **Sound Effects**: Web Audio API — satisfying physics sounds, solve chime
8. **BGM**: Ambient electronic, mysterious, soft synth pads

### Level Design Principles:
- Progressive difficulty: Easy L1-5 → Medium L6-15 → Hard L16-25 → Expert L26-30+
- Varied objectives: "knock blocks over", "get ball in cup", "separate objects", "stack objects"
- Each level has clear win condition
- Star thresholds: 1★=complete, 2★=within time/ink, 3★=optimal solution

### Art Style:
- Clean minimalist: dark gradient bg (GameZipper style), neon accent colored shapes
- Player-drawn objects appear as solid-filled shapes
- Crisp UI, minimal text, rounded corners, glass-morphism

### Scoring Formula:
- Base score: 1000 per level
- Time bonus: max 500 (faster = more)
- Ink bonus: max 500 (less ink = more)
- Stars: 1★ > 50% ink used, 2★ > 30%, 3★ ≤ 30%
