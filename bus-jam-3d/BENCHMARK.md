# Bus Jam 3D — Competitor Benchmark

## Top Competitors Analyzed

### 1. **Bus Jam** (Rollic / Berk Hulagu) — 1M+ downloads
- Core: Tap/click passengers to send them to the bus of matching color
- Levels: 500+ levels across 7+ chapters
- Vehicles: Buses with 6-slot capacity each (max)
- Passengers: Lines of color-matched NPCs, all in single file
- Buses appear at the curb with limited capacity; tap passenger → walks to bus
- Color matching: Each bus holds one color, max 6-12 passengers
- Buses depart when full, scoring bonus
- Fail: Out of time / running out of moves
- Coins/Gems: Currency for power-ups (skip, undo, hint, extra bus)
- Power-ups: Add extra slot, swap passengers, remove
- Visuals: 3D cartoon, vibrant colors, simple cuboid buses & sphere passengers
- Audio: Light pop, whoosh, success chime
- Lives system: 5 hearts, refills over time

### 2. **Passenger Sort - Bus Jam** (com.passengersort.game)
- Same mechanic + parking lot variation (cars leaving parking)
- 100+ levels
- Color sorting with car queue
- Slight twist: cars block each other in parking

### 3. **Block Jam 3D** (Voodoo, 2022) — sibling mechanic
- Color block matching → boxes at exit
- More about clearing queues and order resolution

### 4. **Bus Color Jam** (Puzzle Level, web)
- Browser playable version
- 50+ levels, similar color matching
- 2D/3D hybrid art style

## System Requirements to Match

| System | Bus Jam Original | Our Implementation |
|--------|------------------|---------------------|
| Levels | 500+ | 30 hand-crafted (5 tiers × 6) |
| Color matching | 5-6 colors | 5 colors (red/yellow/blue/green/purple) |
| Bus capacity | 6-12 slots | Configurable 4-8 per level |
| Power-ups | 4 (add slot, undo, skip, sort) | 3 (extra slot, undo move, sort) |
| Lives | 5 hearts | Unlimited (casual web) |
| Currency | Coins + Gems | Stars (1-3 per level) |
| Tutorial | 3-stage guided | Animated overlay |
| Progress | Cloud sync | localStorage with version |
| Boosters | Hint, Time+, Shuffle, Free Bus | Add Slot, Undo, Skip |
| Skins | Bus skins, character skins | 6 bus color schemes |
| Achievements | 20+ | 10 achievements |
| Buses left | Counter | Counter |
| Combo | Per clear | Per consecutive clear (2x, 3x) |
| Daily reward | Login streak | Daily bonus button (cosmetic) |
| Star rating | 1-3 stars by remaining slots | 1-3 stars by efficiency |
| Endless mode | Yes | Yes (post-tier-3 unlock) |
| Tutorial | Guided level | Step-by-step overlay |
| Pause | Yes | Yes |
| Sound on/off | Yes | Yes |
| Music | BGM | BGM (procedural) + SFX |

## Difficulty Curve (Tiers)

- **Tier 1 — Starter Line (L1-6)**: 2 buses, 3 colors, small queues (5-7 passengers)
- **Tier 2 — Express Route (L7-12)**: 3 buses, 4 colors, medium queues (8-12)
- **Tier 3 — Rush Hour (L13-18)**: 3 buses, 5 colors, larger queues (12-16)
- **Tier 4 — Big Terminal (L19-24)**: 4 buses, 5 colors, capacity 5-7, complex order
- **Tier 5 — Mega Hub (L25-30)**: 4 buses, 5 colors, capacity 4-6, mixed intro order

## Visual Style
- Dark navy/purple gradient background with subtle city silhouette
- Brightly colored 3D-looking buses (rendered with canvas gradients)
- Spherical/capsule passengers with simple smiley face
- Glowing accent on selected bus/passenger
- Particle effects on success (confetti, stars)
- Smooth camera-style 3D tilt

## Music Style
- Upbeat lo-fi with chiptune elements, light percussion, cheerful
- 2-3 min loop
- Procedural Web Audio fallback if API unavailable

## SFX (Web Audio)
1. tap_click — short bright blip
2. passenger_walk — soft step
3. bus_door — pneumatic hiss
4. bus_depart — engine + horn
5. match_success — bright chime
6. combo — rising arpeggio
7. star_earn — sparkle
8. fail_buzzer — descending tone
9. ui_open — whoosh
10. ui_close — reverse whoosh
11. level_complete — celebration fanfare
12. powerup — magic sparkle
13. countdown — tick
