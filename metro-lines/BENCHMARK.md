# Metro Lines — Competitor Benchmark

## Genre
Real-time subway/transit simulation puzzle. Inspired by **Mini Metro** (Dinosaur Polo Club, 2015) — BAFTA-nominated, IGF award winner, 250K+ desktop copies sold, millions of mobile downloads.

## Core Mechanic (Mini Metro)
1. **Stations** spawn over time as geometric shapes: circle, triangle, square, star, diamond, pentagon, cross, gem.
2. **Passengers** are tiny shapes that appear at stations. Each passenger wants to reach a station matching its shape.
3. **Lines**: player draws colored metro lines connecting stations. Each line is a colored path. Max lines limited (start with 3).
4. **Trains**: travel along lines, stop at each station, pick up passengers whose destination is reachable on the line, drop off passengers at matching-shape stations.
5. **Carriages**: attach to trains to increase capacity.
6. **Overcrowding**: each station holds ~6 passengers in queue. If a station overflows, an overcrowd timer starts (~20s). If timer runs out → game over.
7. **Weekly upgrades**: every ~30s = "week". Player chooses 1 of: +1 line, +1 train, +1 carriage, +1 bridge (cross rivers).
8. **Score**: passengers delivered. Endless until game over.

## Systems to Implement (Full Feature Parity)
| System | Mini Metro | Metro Lines |
|--------|-----------|-------------|
| Station shapes (8 types) | ✅ | ✅ |
| Line drawing (drag to connect) | ✅ | ✅ |
| Train movement along lines | ✅ | ✅ |
| Passenger generation + matching | ✅ | ✅ |
| Station capacity + overcrowd | ✅ | ✅ |
| Weekly upgrade selection | ✅ | ✅ |
| Scoring (passengers delivered) | ✅ | ✅ |
| High score (localStorage) | ✅ | ✅ |
| Multiple city maps | ✅ (11 cities) | ✅ (20+ level scenarios) |
| Pause | ✅ | ✅ |
| Sound (ambient + alerts) | ✅ (award-winning) | ✅ (Web Audio procedural) |
| Daily challenge | ✅ | ✅ |
| Tutorial | ✅ | ✅ (skippable) |
| Achievements | partial | ✅ (10 achievements) |
| Hint system | ❌ | ✅ (GZ addition) |

## Level Design (20+ scenarios)
To satisfy GZ "20+ levels with difficulty progression" requirement:
- **Tutorial tier (L1-4)**: 2-3 shapes, slow spawn, 1-2 lines. Teach drawing, trains, overcrowding.
- **Easy tier (L5-9)**: 3-4 shapes, moderate spawn, objective = deliver 30/40/50 passengers.
- **Medium tier (L10-14)**: 4-5 shapes, faster spawn, rivers (bridges needed), survive 2/3/4 minutes.
- **Hard tier (L15-19)**: 5-6 shapes, fast spawn, tight resources, deliver 80/100/120.
- **Expert tier (L20-22)**: 6-7 shapes, very fast, connect 15+ stations, survive 5 min.
- **Endless mode**: unlocks after tutorial, infinite procedural.

## Art Style (Mini Metro reference)
- **Minimalist**: solid colored lines on light/dark background
- Stations: bold geometric shapes, thick outlines, white fill
- Lines: 7 distinct colors (red, blue, yellow, green, purple, orange, pink)
- Trains: small rounded rectangles in line color
- Passengers: tiny shapes at station perimeter
- Clean sans-serif UI (we use Inter/system font)
- Dark gradient background (GameZipper style) for menu, clean playing field

## Sound Design
- Ambient minimal electronic BGM (procedural Web Audio: soft synth pads)
- Station-spawn chime
- Passenger-delivered blip
- Overcrowd warning (rising tension tone)
- Upgrade-earned chime
- Game-over tone

## Scoring
- +1 per passenger delivered
- Combo bonus: delivering 5+ in rapid succession = +bonus
- Star rating per level: 1★=complete, 2★=complete+no overcrowd, 3★=complete+all objectives

## Technical Notes
- Canvas 2D rendering at 60fps
- Real-time simulation loop (delta-time based)
- Pathfinding: trains follow line segments (precomputed path), reverse at endpoints
- Touch: drag from station to station to draw/extend lines; tap station to see passengers
