# Mekorama — Competitive Benchmark

## Selected Game: Mekorama-style Isometric Diorama Puzzle

### Competitor 1: Mekorama (Martin Magni)
- **Platform**: iOS/Android, Web (nargames.com)
- **Downloads**: 10M+ on Google Play
- **Core Mechanic**: Guide a small robot through isometric mechanical dioramas by tapping to set waypoints. Rotate the 3D diorama to find hidden paths.
- **Levels**: 50 hand-crafted levels
- **Systems**:
  - Tap-to-move waypoint system
  - 360° diorama rotation (swipe to rotate)
  - Height-based pathfinding (robot navigates stairs/ramps/bridges)
  - Level editor (create custom levels)
  - QR code level sharing
  - Collectible cards
  - Star rating per level
  - No timer — relaxing gameplay
- **Art Style**: Minimalist isometric, mechanical/industrial dioramas, muted colors
- **Music**: Ambient, relaxing

### Competitor 2: Monument Valley (ustwo Games)
- **Downloads**: 100M+ combined
- **Core Mechanic**: Guide princess Ida through impossible architecture (M.C. Escher-inspired). Manipulate architecture to create paths.
- **Levels**: 19 (MV1) + 19 (MV2) + 15 (MV3)
- **Systems**:
  - Impossible geometry / optical illusions
  - Rotate/tap architectural elements
  - Story-driven progression
  - Beautiful pastel art
  - Ambient soundscapes
- **Art Style**: Geometric, pastel, minimalist, Escher-inspired
- **Music**: Ethereal ambient

### Competitor 3: Ghosts of Memories
- **Downloads**: 5M+
- **Core Mechanic**: Isometric path-finding puzzle, rotate panels to create paths
- **Levels**: 36+
- **Systems**:
  - Panel rotation
  - Path connecting
  - Ambient exploration
  - No time pressure

## Key Mechanics to Implement
1. **Isometric grid rendering** — 3D-looking diorama on 2D Canvas
2. **4-direction rotation** — Rotate the entire diorama view (N/S/E/W)
3. **Tap-to-move** — Click/tap a cell, robot pathfinds to it
4. **Height/elevation** — Multiple levels with stairs, ramps, bridges
5. **Obstacles** — Walls, gaps, moving platforms, switches
6. **Star collection** — Optional stars per level for completionist appeal
7. **50 levels** — Progressive difficulty
8. **Hint system** — Show path hint (limited uses)
9. **Progress save** — localStorage with version
10. **Tutorial** — First 3 levels teach mechanics

## Art Direction
- Dark gradient background (GameZipper style)
- Neon accent colors on structures
- Charming robot character
- Mechanical/industrial diorama aesthetic
- Glowing paths when selected
- Particle effects on level completion

## Music Direction
- Ambient electronic, relaxing, slow tempo
- Web Audio API procedural generation
- SFX: tap, move, rotate, star collect, level complete, error
