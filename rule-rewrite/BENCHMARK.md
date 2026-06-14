# BENCHMARK.md — Rule Rewrite (Baba Is You style)

## Game: Baba Is You (Hempuli, 2019)
- **Metacritic**: 87/100
- **Steam**: Overwhelmingly Positive (98% positive)
- **Awards**: GDC Best Design, IGF Excellence in Design
- **Downloads**: 2.5M+ across all platforms
- **Levels**: 200+ across main game + extras

## Core Mechanic
Grid-based puzzle where word blocks form rules. Rules are parsed from the grid:
- **NOUN IS PROPERTY**: e.g., "BABA IS YOU" (player controls Baba), "WALL IS STOP" (blocks movement), "FLAG IS WIN" (touch to win)
- **NOUN IS NOUN**: e.g., "BABA IS ROCK" (transforms entities)
- Rules form from 3 consecutive word blocks (horizontal or vertical)
- Players push word blocks to change rules mid-game
- Breaking a rule immediately removes its effect

## Properties (from Baba Is You)
| Property | Effect |
|----------|--------|
| YOU | Player controls this entity |
| WIN | Touching this entity completes the level |
| STOP | Cannot be pushed or walked through |
| PUSH | Can be pushed by player |
| SINK | Destroys self and anything on same tile |
| MELT | Destroyed by HOT entities |
| HOT | Destroys MELT entities |
| DEFEAT | Kills YOU entities on contact |
| MOVE | Moves automatically (direction varies) |
| SHUT | Blocks OPEN entities |
| OPEN | Removes SHUT entities |
| TEXT | Applied to word blocks themselves |
| FLOAT | Exists on a different layer |
| WEAK | Destroyed by any contact |
| PULL | Pulled when adjacent entity moves away |

## Nouns
BABA, ROCK, WALL, FLAG, WATER, LAVA, KEY, DOOR, SKULL, GRASS, ICE, TILE, etc.

## Systems to Implement
1. Grid-based movement (arrow keys + swipe)
2. Rule parsing engine (scan grid for NOUN-IS-PROPERTY/NOUN-IS-NOUN triples)
3. Property application (dynamic based on active rules)
4. Push mechanic (push chains of PUSH entities)
5. Transform mechanic (NOUN-IS-NOUN converts entities)
6. Win/lose detection
7. Undo system (full history stack)
8. Level progression (25+ levels across 5 tiers)
9. Tutorial overlay for first levels
10. Sound effects (Web Audio API)
11. Progress save (localStorage)
12. Star ratings based on move count

## Difficulty Progression
- Tier 1 (Tutorial): Learn "YOU", "WIN", "STOP", "PUSH" basics
- Tier 2 (Easy): Introduce SINK, MELT/HOT, transform rules
- Tier 3 (Medium): Multiple rule manipulation, DEFEAT, KEY/DOOR
- Tier 4 (Hard): Complex rule chains, self-transforming, text manipulation
- Tier 5 (Expert): Mind-bending rule puzzles, require deep thinking

## Art Style
- Clean, flat, colorful pixel-art aesthetic
- Dark gradient background (GameZipper style)
- Bold, readable word blocks
- Particle effects on rule changes and wins
