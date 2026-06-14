# Dungeons of Dreadrock — Competitive Benchmark

> Source game: **Dungeons of Dreadrock** by Prof. Dr. Christoph Minnameier (2022)
> Steam: Very Positive 95%, Metacritic Switch 83, Google Play 100K-500K+ downloads
> Awards: Google Play Indie Festival winner, Deutscher Computerspielpreis Best Mobile Game, Indie Clash 1st Prize
> Inspiration: Dungeon Master, Legend of Grimrock, Sokoban, Bomberman, Adventures of Lolo
> Comparable GZ games: Escape Manor (room escape), There Is No Game (point-and-click), 100 Doors (door escape)

## Genre
Top-down grid-based real-time puzzle dungeon crawler. **Every level is a single-screen puzzle room.** Heroine descends through 100 floors to rescue her brother from the Dead King.

## Core Mechanics to Implement
1. **Grid-based 4-directional movement** (up/down/left/right) — tile-by-tile
2. **Real-time enemy movement** — enemies move on their own AI (not turn-based)
3. **Auto-attack on collision with enemy** (when facing adjacent enemy)
4. **Sword = primary tool** (combat + throwable to hit distant switches)
5. **Pressure plates** (open gates while pressed; some auto-reset on timer)
6. **Switches/levers** (toggle gates, trapdoors)
7. **Portals/teleporters** (paired pads; entities can collide via teleport)
8. **Keys + locked doors**
9. **Trapdoors** (open to drop entities/items into pit)
10. **Fireball traps** (real-time hazard on a cycle)
11. **Sokoban-style pushing** (Living Tree enemy retreats when hit — push to plate)
12. **Spider webs** (ranged enemy that immobilizes briefly)
13. **Cross-floor persistence** (item picked on floor N may be needed on N+1)
14. **Instant room restart** (zero penalty for failure)
15. **Progressive hint system** (escalating hints available)

## Systems to Match (Competitor Parity)
- Level select with progress lock (chapters accessible by floor reached)
- Auto-save per floor (localStorage v1)
- Hint system (escalating, multi-tier)
- Title card per level (cryptic pun hint)
- Inventory display (sword, key, potions, items)
- Hearts/HP system (some hits reduce HP)
- Score: rooms cleared, deaths, hints used → star rating (0-3)
- Tutorial overlay on first room
- Sound on/off toggle
- Story snippets between chapters (short text)
- Cheat menu / level select after first completion

## Art Style Reference
- 32-bit pixel art, top-down
- Warm fantasy palette (Zelda: Minish Cap / A Link to the Past aesthetic)
- Dark dungeon tiles with subtle visual variety (cracks, moss)
- Minimalist UI overlay (hearts top-left, inventory top-right)
- Character sprites with directional facing

## Music Style Reference
- Orchestral/retro fantasy hybrid
- Mood shifts with dungeon depth (deeper = darker)
- Audio cues functional: plate clicks, plate-resets, enemy footstep variety
- Ambient dungeon tone (low drones, distant drips)

## Key Numbers (for parity)
- 100 levels in source — we'll ship **30 levels** covering 15+ distinct mechanics
- Playtime source: 4-6h — target 20-40 min
- Mobile: free + IAP to remove ads

## 30-Level Difficulty Curve
| Tier | Levels | Mechanic introduced |
|------|--------|---------------------|
| Tutorial | 1-3 | Movement, sword pickup, basic zombie combat |
| Easy | 4-8 | Pressure plates, switches, keys, doors |
| Easy-Med | 9-12 | Spider web dodge, Living Tree push, portal basics |
| Medium | 13-18 | Thrown sword, ogre kite, trapdoor, multi-switch |
| Medium-Hard | 19-24 | Fireball traps, drow archer, compass navigation |
| Hard | 25-29 | Combined mechanics, cross-floor item puzzle, boss |
| Final | 30 | Escape sequence / Dead King showdown |

## Scoring (pipeline Round 13)
D=4, S=3, R=4, F=3, Z=4 → Total **18/25** (above 18 threshold)
- Demand 4: 100K+ downloads, multiple awards, sequel out
- SEO 3: "dungeon puzzle", "100 doors" — partial overlap with 100-doors/escape-manor
- Retention 4: 30 handcrafted levels = high engagement
- Feasibility 3: real-time grid sim + combat is harder than turn-based but doable
- Zero-overlap 4: no top-down real-time grid dungeon puzzle on GZ (point-and-click escapes exist but different mechanic)
