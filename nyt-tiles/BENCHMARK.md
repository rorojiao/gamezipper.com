# NYT Tiles (Zen) — Competitive Benchmark

## Game Overview
- **Slug**: nyt-tiles
- **Category**: Puzzle / Tile Matching / Zen
- **Core Mechanic**: Find and tap matching tile pairs from layered stacks to clear all tiles
- **Target Audience**: Casual puzzle fans, NYT Games subscribers, relaxation seekers

## Competitors Analyzed

### 1. NYT Tiles (by NYT Games)
- **Mechanics**: Grid of layered tiles (up to 3 layers deep). Tap matching pairs to clear them. Tiles beneath are revealed. Goal: clear all tiles.
- **Levels**: Daily puzzle (1 per day) + unlimited play modes
- **Scoring**: Based on speed and combos. Streak multipliers for consecutive matches.
- **Difficulty**: Progressive - more layers, more tile types, fewer obvious matches at higher levels
- **Systems**: Daily challenge, streak tracking, stats (games played, win rate, best time)
- **Visual Style**: Clean, minimal, calming pastels. Dark mode option. Smooth animations.
- **Music/SFX**: Ambient, lo-fi beats. Satisfying tile-tap sounds, soft chimes for combos.
- **Monetization**: Subscription (NYT Games bundle)
- **Retention Hooks**: Daily streaks, stats tracking, shareable results

### 2. Tile Master 3D (Mobile - Rollic/Voodoo)
- **Mechanics**: 3D tile stack, tap groups of 3 matching tiles. Slots at bottom fill up (max 7). Match 3 to clear.
- **Levels**: 1000+ levels with varied themes
- **Scoring**: Stars per level (1-3), based on speed and moves
- **Difficulty**: Increasing tile variety, tighter time limits, more complex arrangements
- **Systems**: Power-ups (shuffle, undo, hint), coin economy, daily rewards, theme unlocks
- **Visual Style**: Colorful 3D rendered tiles, themed backgrounds (fruits, animals, objects)
- **Music/SFX**: Upbeat casual music, satisfying pop sounds
- **Monetization**: Ads between levels, IAP for coins/boosters
- **Retention Hooks**: Level progression, daily missions, theme collection

### 3. Mahjong Dimensions (Arkadium)
- **Mechanics**: 3D cube of tiles, rotate to see all sides. Match free (unblocked) pairs to clear.
- **Levels**: Infinite mode with increasing difficulty + puzzle mode
- **Scoring**: Time-based scoring. Combo multipliers. Level completion bonuses.
- **Difficulty**: More tile layers, fewer matches, time pressure increases
- **Systems**: Daily challenge, leaderboards, hint system, shuffle
- **Visual Style**: Glossy 3D tiles, space/cosmic backgrounds, rotating cube effect
- **Music/SFX**: Relaxing ambient, spatial audio feedback
- **Monetization**: Ads, premium subscription
- **Retention Hooks**: Daily challenges, leaderboard competition

### 4. Tile Connect - Match Puzzle (Mobile)
- **Mechanics**: Flat grid of tiles. Connect matching pairs with a path (max 2 turns). Clear all pairs to win.
- **Levels**: 500+ levels
- **Scoring**: Stars, combo bonus, time bonus
- **Systems**: Hints, shuffle, extra time power-ups, daily rewards
- **Visual Style**: Cute emoji/icon tiles, bright colorful backgrounds
- **Monetization**: Rewarded ads for power-ups, IAP
- **Retention Hooks**: Level progression, seasonal themes

## Feature Matrix for Our Implementation

| Feature | NYT Tiles | Tile Master 3D | Mahjong Dimensions | Our Target |
|---------|-----------|----------------|-------------------|------------|
| Core Mechanic | Match pairs (layered) | Match 3 (stacked) | Match pairs (3D) | Match pairs (layered) |
| Levels | Daily + modes | 1000+ | Infinite | 20+ curated |
| Score System | Streak multiplier | Stars (1-3) | Time-based | Stars + combo + time |
| Power-ups | None | Shuffle/Undo/Hint | Hint/Shuffle | Shuffle/Undo/Hint |
| Daily Puzzle | Yes | Yes | Yes | Yes (seeded) |
| Tutorial | Yes | Yes | Yes | Yes (interactive) |
| Progress Save | Yes | Yes | Yes | Yes (localStorage) |
| Sound Toggle | Yes | Yes | Yes | Yes |
| Animations | Smooth | Satisfying pop | 3D rotation | Smooth + particles |
| Best Score | Stats page | Per-level stars | Leaderboard | Per-level + global |

## Design Targets

### Gameplay
- **Grid**: 6x6 to 8x8 grid with 2-3 layers of tiles
- **Tile Types**: Emoji/unicode symbols (30+ distinct types)
- **Matching**: Tap two identical free tiles to remove them
- **Free tile**: Not covered by another tile, at least one side (left or right) exposed
- **Win condition**: Clear all tiles
- **Lose condition**: Timer expires OR no valid moves remain

### Scoring Formula
- Base match: 100 points
- Speed bonus: max(0, 500 - milliseconds_taken / 10)
- Combo multiplier: consecutive matches within 3 seconds = 1.5x, 2x, 2.5x...
- Level completion: 1000 + remaining_time * 10
- Star rating: ★★★ = 90%+ max score, ★★ = 70%+, ★ = clear

### Level Design (20 levels)
- L1-5: 4x4 grid, 2 layers, 8 tile types, generous timer (3 min)
- L6-10: 5x5 grid, 2-3 layers, 12 tile types, moderate timer (2.5 min)
- L11-15: 6x6 grid, 3 layers, 16 tile types, challenging timer (2 min)
- L16-20: 7x7 grid, 3 layers, 20 tile types, tight timer (1.5 min)

### Visual Style
- Dark gradient background (GameZipper house style)
- Tiles: rounded rectangles with subtle shadows, colored by type
- Satisfying animations: tile flip, match dissolve, combo flash, particle burst
- Neon accent colors on dark theme

### Audio
- BGM: Ambient electronic, lo-fi, calm and meditative
- SFX: Tile tap (soft click), match (chime), combo (ascending tone), level complete (celebration), game over (soft descending)
