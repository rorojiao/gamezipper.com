# Pack Master — Competitor Benchmark

## Genre: Spatial Packing Puzzle (Polyomino Bin-Packing)

## Top Competitors

### 1. Pack Master (SayGames / Zynga, mobile)
- **Downloads**: 50M+ on Google Play
- **Core Loop**: Drag items of various shapes into a suitcase. All items must fit perfectly.
- **Systems**: Level progression (100+ levels), star rating (1-3 based on efficiency), hint system, daily challenges
- **Monetization**: Interstitial ads between levels, rewarded ads for hints
- **Art Style**: Clean 3D-ish items on flat background, vibrant colors
- **Key Feature**: Items can be rotated by tapping

### 2. Perfect Packing / Fill The Box (Voodoo, hyper-casual)
- **Downloads**: 10M+
- **Core Loop**: Drag polyomino shapes to fill a grid completely
- **Systems**: Endless mode, score-based, simple star system
- **Art Style**: Minimal flat design, neon accents
- **Key Feature**: Satisfying snap feedback, particle effects

### 3. Unpacking (Witch Beam, indie)
- **Downloads**: 2M+ (premium + Game Pass)
- **Core Loop**: Place unpacked items into rooms (spatial puzzle + story)
- **Systems**: Story progression, room customization, zen mode
- **Art Style**: Pixel art, cozy aesthetic
- **Key Feature**: Narrative-driven, emotional

## Systems We Must Implement

| System | Competitor Reference | Our Implementation |
|--------|---------------------|-------------------|
| Level progression | All — 100+ levels | 36 levels across 6 worlds |
| Star rating | Pack Master — 3 stars | 3 stars (no hints = 3★) |
| Hint system | Pack Master — show valid placement | Highlight valid spot for an item |
| Reset | All — clear and retry | Reset button (free) |
| Progress save | All — localStorage | packmaster_save_v1 with stars + unlock |
| Tutorial | Pack Master — first level guide | Overlay hints on level 1 |
| Drag-and-drop | All — touch + mouse | Pointer events, touch-action:none |
| Sound effects | All — place/pickup/win | Web Audio API procedural SFX |
| Background music | Casual games — ambient | Web Audio API procedural BGM |
| Level select | All — grid of levels | DOM grid with stars + lock states |
| Mute toggle | All | Settings button |

## Difficulty Curve
- World 1 (L1-6): 4×3 to 5×4 grids, 3-6 items, max piece size 3-4
- World 2 (L7-12): 5×4 to 7×4 grids, 5-8 items, max piece size 4-5
- World 3 (L13-18): 6×5 to 8×4 grids, 7-10 items, max piece size 5
- World 4 (L19-24): 8×5 to 9×5 grids, 8-12 items, max piece size 5
- World 5 (L25-30): 8×6 to 10×6 grids, 10-14 items, max piece size 5
- World 6 (L31-36): 10×6 to 10×7 grids, 12-16 items, max piece size 5
