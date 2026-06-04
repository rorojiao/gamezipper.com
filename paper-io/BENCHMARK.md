# Paper.io Clone — Competitive Benchmark

## Competitor Analysis (June 2026)

### 1. Paper.io 2 (Voodoo)
- **Downloads:** 300M+ on Google Play
- **Rating:** 4.3 stars
- **Core Mechanics:** Move a square around a grid, leave a trail to capture territory. Return to your territory to fill it in. If another player crosses your trail, you die. If you cross another player's trail, they die.
- **Map:** Finite grid arena (varies by mode)
- **Game Modes:** Classic (time-based scoring), Battle Royale (last standing), Teams
- **AI Bots:** 3-8 AI opponents per match
- **Progression:** Skins unlocked by reaching % territory thresholds
- **Controls:** Swipe (mobile) / WASD (desktop)
- **Monetization:** Rewarded video ads for revives + skins. Banner ads.
- **Session Length:** 2-5 minutes per round
- **Key Metrics:** % territory captured, kills, survival time

### 2. Splix.io
- **Platform:** Browser (desktop-focused)
- **Core Mechanics:** Similar to Paper.io — trail-based territory capture
- **Differences:** Larger map, more players, no team mode
- **Monetization:** Minimal (open source)
- **Session Length:** 5-10 minutes

### 3. Territorial.io
- **Platform:** Browser + Mobile
- **Core Mechanics:** Territory expansion on world map, real-time strategy
- **Differences:** Hex-based, diplomatic alliances, larger scale
- **Session Length:** 10-30 minutes

### 4. Hole.io (Voodoo)
- **Downloads:** 500M+
- **Core Mechanics:** Control a hole that swallows objects to grow
- **Relevance:** Same "expansion" genre, different mechanic
- **Monetization:** Skins + rewarded ads

## Systems to Implement

| System | Paper.io 2 | Our Target |
|--------|-----------|-------------|
| Territory capture | Trail-based fill | Trail-based fill (same) |
| AI opponents | 3-8 bots | 3-7 AI bots per match |
| Game modes | Classic, Battle Royale | Classic (30 levels) |
| Skins | Unlockable | 6 unlockable skins |
| Score system | % territory + kills | % territory + kills + combo |
| Kill mechanic | Cross trail = kill | Cross trail = kill (same) |
| Death penalty | Game over | Game over, option to retry |
| Trail mechanic | Dies if trail crossed | Same |
| Minimap | Full map view | Full map on pause |
| Power-ups | Speed boost, shield | Speed boost, shield, magnet |
| Tutorial | Simple first game | 3-step interactive tutorial |
| Progression | Skin unlocks | Skin unlocks + level progression |
| Particles | Death explosion | Death + capture particles |
| Sound | Basic SFX | Web Audio BGM + 8 SFX |

## Level Design (30 levels)

| Tier | Levels | Grid Size | AI Count | AI Difficulty | Win Condition |
|------|--------|-----------|----------|---------------|---------------|
| 1 (Easy) | 1-5 | 20x20 | 2-3 | Random wandering, slow | Capture 15% territory |
| 2 (Medium) | 6-10 | 25x25 | 3-4 | Basic strategy | Capture 20% territory |
| 3 (Hard) | 11-15 | 30x30 | 4-5 | Targeted expansion | Capture 25% territory |
| 4 (Expert) | 16-20 | 35x35 | 5-6 | Aggressive + kill-seeking | Capture 30% territory |
| 5 (Master) | 21-25 | 40x40 | 5-6 | Expert AI with ambush | Capture 35% territory |
| 6 (Endless) | 26-30 | 40x40 | 6-7 | All AI traits mixed | Survive 90s + 25% territory |

## AI Behavior Patterns

1. **Wanderer (Easy):** Random direction changes, small territory patches
2. **Builder (Medium):** Systematic grid-filling pattern, medium patches
3. **Hunter (Hard):** Actively seeks player trail to kill, large patches
4. **Expander (Expert):** Fast expansion, avoids conflict, defensive
5. **Ambusher (Master):** Waits near borders, strikes when player extends trail

## Art Style

- **Theme:** Neon geometric on dark background (consistent with GameZipper style)
- **Player:** Colored square with trail (gradient glow)
- **Territory:** Semi-transparent fill matching player color
- **Grid:** Subtle grid lines for spatial reference
- **Particles:** Explosion on kill, sparkle on territory capture
- **UI:** Minimal HUD — territory %, timer, kills counter

## Music Style

- **Genre:** Upbeat electronic/chiptune
- **Tempo:** 120-140 BPM (matches fast-paced gameplay)
- **Mood:** Exciting, competitive, energetic
- **Reference:** Voodoo game soundtracks (Paper.io, Hole.io)
