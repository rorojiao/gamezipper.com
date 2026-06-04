# Monster Truck Madness — Competitive Benchmark Report

> **Game Genre:** Physics-based vehicle balancing / driving
> **Date:** 2026-06-04
> **Target GZ Slug:** `monster-truck-madness`

## Competitors Analyzed

### 1. Drive Mad (Martin Magni / AddictingGame) — `poki.com/en/g/drive-mad`
- **Core**: Drive a blocky monster truck through physics obstacle courses. Maintain throttle + brake balance or flip.
- **Levels**: 100+ levels across multiple garage tiers
- **Systems**: score (3-stars per level), coins, garage (unlock new trucks), checkpoints, level select
- **Vibe**: cartoonish, satisfying crash physics, fast retry
- **What to copy**: tilt/throttle balance gameplay, level progression, garage unlocks, star system
- **What to improve**: tighter level design (focused on key terrain types), modern neon visuals, deeper power-ups

### 2. Hill Climb Racing (Fingersoft) — `poki.com/en/g/hill-climb-racing-lite`
- **Core**: Side-scrolling hill climb driving with fuel management, upgrades, multiple vehicles/terrains
- **Levels**: Endless + weekly events
- **Systems**: coin shop, garage, vehicle upgrades, air control, multiple terrain biomes
- **Vibe**: cartoony, satisfying bounce, mobile-first
- **What to copy**: air-time bonus, terrain variety, upgrade system
- **What to improve**: structured level progression (not endless), boss obstacles (looping, gaps)

### 3. Moto X3M — `poki.com/en/moto-x3m`
- **Core**: Stunt bike physics with level-based progression
- **Levels**: 25+ levels, 3-star system, secret crates
- **Systems**: crash physics, checkpoints, multiple bikes
- **Vibe**: fast, satisfying stunts, particles
- **What to copy**: clean level structure, secret crate (3-star bonus), checkpoint system
- **What to improve**: vertical terrain, monster truck flair

## Design Pillars for Monster Truck Madness (GZ version)

1. **Throttle + Brake balance** — the truck flips if you floor it on slopes; you must modulate.
2. **3-star level system** — finish fast + airtime + no-flip = 3 stars
3. **30 hand-crafted levels** — desert, mountain, lava, neon, arctic biomes
4. **Coin shop + garage** — unlock 4 trucks (Bulldozer, Rocket, Cyber, Frost)
5. **Air-time scoring** — big jumps award bonus coins
6. **Crash recovery** — auto-respawn 1.5s after flipping (no instant lose)
7. **Mobile tilt OR on-screen throttle** — both supported
8. **Modern neon UI** — gradient sky, glow trails, particle dust
