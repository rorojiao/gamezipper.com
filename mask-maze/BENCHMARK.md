# Mask Maze — Competitive Benchmark Report

Date: 2026-06-12
Inspiration: Tomb of the Mask (Playgendary/Happymagenta)
Slug: mask-maze

## Original Game Profile
- Tomb of the Mask: 100M+ Google Play, 4.5★, 2.48M reviews
- Core mechanic: Swipe in cardinal direction → character slides until hitting wall
- Vertical maze with rising lava, collect dots/coins, avoid spikes
- Modes: Arcade (endless) + Stage (level-based)
- Power-ups: Magnet, Freeze, Shield
- 16 collectible masks (cosmetic + passive abilities)
- Art: Pixel art / 8-bit retro, dark tomb backgrounds, neon accents
- Music: Chiptune / 8-bit (Spotify OST "GroovyTraps", "Crystal Nocturne")
- Monetization: 75-80% ads / 20-25% IAP

## Competitive Browser Landscape
Multiple browser clones exist (nite.games, kinggames.org, arcadino.com, etc.)
- All are ad-cluttered wrappers, low quality
- Our differentiation: clean UX, no aggressive ads, high Canvas quality

## Our Differentiation Strategy
1. Name: "Mask Maze" — NOT "Tomb of the Mask" (avoid TM)
2. Cleaner art: dark gradient + neon glow instead of pixel art
3. Stage mode focus (30 handcrafted levels) + Arcade mode
4. No aggressive forced ads — rewarded ads only
5. Smooth Canvas animations with particles and screen shake

## Game Spec for Development
- Slug: mask-maze
- 30 handcrafted levels across 5 tiers (6 levels per tier)
- Swipe-to-slide mechanic (pointer events + touch)
- Vertical scrolling maze with rising lava pressure
- Collectibles: dots (score) + coins (bonus)
- Hazards: spikes, moving traps
- Power-ups: Shield (1 hit protection), Magnet (attract dots), Freeze (stop traps)
- 3-star rating per level (based on dots collected + time)
- Progression: localStorage with version field
- Tutorial overlay for first-time players
- BGM: Web Audio chiptune (scene-based: title/game/win)
- SFX: slide, collect, hit, power-up, death, level-complete
- Art: Canvas-drawn neon style (no external images needed)
- Responsive: desktop + mobile
