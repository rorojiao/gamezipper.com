# Bottle Flip 3D — Competitive Benchmark

## Top Competitors Analyzed

### 1. Bottle Flip 3D (bottleflip3d.com — top hit)
- **Levels**: 300+ handcrafted levels
- **Mechanics**: Tap/click to set flip power and release; physics-based arc
- **Obstacles**: Rotating gears, mobile conveyor belts, wind interference
- **Difficulty curve**: New mechanic introduced every 10 levels (magnetic fields, elastic platforms)
- **Pacing**: Quick levels (5-15s each), high replayability

### 2. Physics Bottle Flip 3D (Google Play, 4.5★)
- **Levels**: 200+ unique levels
- **Skin system**: Gold caps collectible → unlock bottle skins (milk cartons, energy drinks, soda cans)
- **Environment**: Interactable furniture (books, platforms) for trick shots
- **Loop**: Win → earn caps → unlock skin → replay

### 3. Bottle Flip Idle (CrazyGames)
- **Idle genre twist**: Auto-flip loop
- **Currencies**: Multi-currency economy
- **Progression**: Tables, upgrades, special-effect bottles

### 4. Korgi Bottle Flip (Playgama)
- **Precision focus**: Trajectory / gravity / landing angle
- **Platform labeling**: Land on specific labeled zones
- **Skill ceiling**: Pure timing challenge

## Systems to Implement (S-grade requirement)

| System | Source | Implementation |
|--------|--------|----------------|
| 30+ levels w/ progressive difficulty | All | Generators + handcrafted level data |
| 3-tier scoring (per-landing + streak + perfect) | Bottle Flip 3D | base + streak×10 + perfect×50 |
| Combo/streak counter | All | Resets on miss, +10 per consecutive |
| 3 obstacle types (moving platform, rotating bar, wind zone) | Bottle Flip 3D | Spawned by level data |
| 6 unlockable bottle skins | Physics Bottle Flip 3D | Plastic, Milk, Soda, Energy, Water, Gold |
| Star rating (1-3 per level) | All | 3 stars = perfect (no miss), 2 = 1 miss, 1 = completed |
| localStorage progress + skins + best scores | All | `{version: 2, skins:[], levels:{}}` |
| Tutorial overlay (skippable) | All | First 3 levels auto-show controls |
| Pause menu | All | ESC or button |
| Sound on/off toggle | All | Persisted |
| Mute / volume | All | AudioContext gain |
| Perfect-landing detection (bottle upright) | All | Wobble angle threshold |
| Trail particles + splash on landing | Korgi | Visual juice |
| Camera shake on impact | Bottle Flip 3D | 4-frame shake |
| Daily challenge (random seed) | Industry | Bonus stars |

## Difficulty Curve
- Levels 1-5: Plain static platforms (tutorial)
- Levels 6-10: Gaps between platforms
- Levels 11-15: Moving platforms
- Levels 16-20: Rotating bars in path
- Levels 21-25: Wind zones
- Levels 26-30: Combo of 2-3 obstacle types

## Art Direction
- Neon-styled 3D (per clonkbot github reference) — but rendered in 2D Canvas with pseudo-3D shading
- Dark gradient background, neon accent colors (cyan, magenta, yellow)
- Bottle = colored cylinder with cap, slight rotation animation in 2D
- Particle systems for impact and trail
- HUD: top-left level/stars, top-right score/streak, bottom-center power gauge

## Music Direction
- "Upbeat chiptune, fast tempo, energetic, retro arcade, 8-bit synth, driving bass, exciting loop-friendly"
- Web Audio API procedural generation (no external deps)

## SFX (procedural)
- tap-charge: rising sine
- release: snap percussion
- land-success: bell tone
- land-perfect: chord + sparkle
- land-fail: thud + crash
- unlock-skin: ascending arpeggio
- star-earned: ding
