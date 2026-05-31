# Gravity Drop — Competitive Benchmark Report

> **Game:** Gravity Drop  
> **Slug:** gravity-drop  
> **Internal Score:** 21/25  
> **Platform:** GameZipper.com (HTML5 Browser)  
> **Genre:** Block Removal Physics Puzzle  
> **Date:** June 2026

---

## 1. Competitor Overview

| # | Game | Platform | Levels | Downloads | Core Mechanic |
|---|------|----------|--------|-----------|---------------|
| 1 | **BlockRemove** | Browser | Progressive (20+ removals) | Growing | Click ice blocks to guide cube to goal via physics |
| 2 | **Boom Blox** | Wii | 300+ SP, 100+ MP | ~2M | Throw/grab blocks, chain reactions, Jenga-like physics |
| 3 | **Physics Drop** | iOS/Android/Browser | 110+ | 5M+ | Draw lines to guide red ball into U-shaped target |
| 4 | **Roll the Ball** | iOS/Android | Hundreds | 50M+ | Slide blocks to create path for ball |
| 5 | **Heart Box** | iOS/Android | 200+ | 10M+ | Guide robot to charger by removing/placing physics objects |

---

## 2. Block Types to Implement

| Block Type | Description |
|------------|-------------|
| **Standard (removable)** | Basic wood/stone blocks, tap to remove |
| **Fixed (indestructible)** | Steel/stone, cannot be removed, acts as obstacle |
| **Bouncy** | Ball bounces off with extra force |
| **Explosive (TNT)** | Explodes when hit, destroys nearby blocks |
| **Fragile** | Breaks after ball bounces off once |
| **Ice** | Slippery, ball slides without friction |
| **Portal** | Teleports ball between linked portal pairs |

---

## 3. Level Structure (40 levels across 5 worlds)

- **World 1: Basics (L1-8)** — Standard blocks only, gravity drops, 2-4 removals
- **World 2: Bounce (L9-16)** — Introduce bouncy blocks, bank shots
- **World 3: Hazards (L17-24)** — Fixed blocks, TNT, obstacles
- **World 4: Chain (L25-32)** — Chain reactions required, portals, fragile blocks
- **World 5: Master (L33-40)** — All mechanics combined, 15-20 removals

---

## 4. Scoring System

```
Level Score = Base (1000 pts)
            + Target Precision Bonus (0-500 pts)
            - Move Penalty (-50 pts per extra move beyond par)
            + Time Bonus (0-300 pts for fast completion)
            + Chain Bonus (100 pts per chain reaction)
```

**Star Rating:**
- ⭐ — Complete level
- ⭐⭐ — Complete within par moves
- ⭐⭐⭐ — Par moves + fast time + hit bonus target

---

## 5. Systems to Implement

1. **Scoring** — Points, par moves, star ratings per level
2. **Progress Save** — localStorage with version, auto-save after each level
3. **Tutorial** — First 3 levels teach mechanics naturally
4. **Hint System** — Highlights next block to remove (limited charges, earn more by completing levels)
5. **Undo** — Reverse last removal (limited per level)
6. **Achievements** — Progression + skill + fun categories
7. **Sound** — Web Audio API procedural BGM + SFX (block pop, ball bounce, chain, victory)
8. **Visual FX** — Particles on block removal, screen shake on chain reactions, celebration animation

---

## 6. Art Direction

- **Style:** Clean 2D with neon accents (GameZipper dark theme)
- **Background:** Dark gradient (deep blue to dark purple)
- **Blocks:** Rounded rectangles with subtle glow, color-coded by type
- **Ball:** Bright orange with glow trail
- **Target:** Pulsing green/gold circle
- **Particles:** Neon sparkles on removal, chain reaction bursts

---

## 7. Key Differentiators

1. **Ball physics (not cube)** — Bouncing ball adds satisfying physics feel
2. **Chain reaction emphasis** — Core mechanic, not just bonus
3. **Pure tap-to-remove** — Simpler than drawing (Physics Drop) or sliding (Roll the Ball)
4. **Browser-native persistence** — Full save system unlike BlockRemove
5. **Quick sessions** — 30-90 seconds per level average
