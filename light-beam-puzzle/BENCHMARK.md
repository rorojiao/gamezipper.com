# Light Beam Puzzle — Competitive Benchmark

## Overview
**Genre:** Logic Puzzle / Optical Physics
**Platform Target:** GameZipper.com (single-file HTML5)
**Slug:** light-beam-puzzle
**Competitor Gap:** ZERO existing laser/mirror games on GameZipper (250 games)

---

## Competitor Analysis

### 1. Laser Maze (Poki)
- **Platform:** Web (Poki, CrazyGames)
- **Likes:** 8.2K+ on Poki
- **Mechanics:** Place mirrors on grid to direct laser to target
- **Levels:** ~30 handcrafted
- **Monetization:** Banner ads
- **Strengths:** Clean grid UI, satisfying beam animation, progressive difficulty
- **Weaknesses:** No color mixing, no prisms, limited obstacle types

### 2. Laser Reflection Puzzle (Mobile)
- **Platform:** Android/iOS
- **Downloads:** 100K+ on Google Play
- **Mechanics:** Rotate mirrors to redirect beam, color filters
- **Levels:** 50+
- **Strengths:** Color beam mechanics, multiple beam paths
- **Weaknesses:** Cluttered UI, intrusive ads

### 3. Beam (Mobile)
- **Platform:** iOS
- **Mechanics:** Prism splitting, color matching, mirrors
- **Strengths:** Beautiful neon aesthetics, prism color splitting
- **Weaknesses:** Very polished but simple level count

### 4. Photon (Web)
- **Platform:** Various web portals
- **Mechanics:** Light source + mirrors + targets, beam splitting
- **Strengths:** Minimalist design, physics-accurate reflection
- **Weaknesses:** No progression system, limited levels

---

## Feature Matrix Comparison

| Feature | Laser Maze | Laser Reflection | Beam | Photon | **Our Target** |
|---------|------------|-----------------|------|--------|---------------|
| Mirror placement | Drag | Rotate only | Rotate | Place | Drag + Rotate |
| Beam colors | Single | Multi | Multi | Single | **Multi** |
| Color mixing | No | Filter | Prism | No | **Yes** |
| Beam splitting | No | No | Yes | No | **Yes** |
| Obstacles | Walls | Walls | Walls | Walls | **Walls + Blocks** |
| Star rating | No | No | No | No | **Yes (3-star)** |
| Hint system | Limited | No | No | No | **Yes** |
| Undo | No | No | No | No | **Yes** |
| Level count | 30 | 50+ | ~20 | ~15 | **30** |
| Tutorial | Basic | No | Yes | No | **Yes (4-step)** |
| Power-ups | None | None | None | None | **3 types** |
| Sound | Basic | Basic | Good | Minimal | **Full SFX+BGM** |
| Progress save | No | No | No | No | **localStorage** |
| Difficulty tiers | None | Vague | None | None | **5 tiers** |

---

## Our Game — Competitive Edge

### Core Mechanics
1. **Beam Reflection**: Laser emits from source at fixed direction -> bounces off mirrors at 45-degree angles -> must reach target receiver(s)
2. **Color Beams**: Red, Green, Blue beams that can combine (R+G=Yellow, R+B=Magenta, G+B=Cyan, R+G+B=White)
3. **Prism Split**: Prism splits white beam into RGB, or splits colored beams into components
4. **Color Filter**: Filter blocks certain colors, passing only matching colors
5. **Beam Splitter**: Split a beam into two beams going different directions

### Level Design (30 levels, 5 tiers)
| Tier | Levels | New Mechanic | Difficulty |
|------|--------|-------------|-----------|
| 1 (Easy) | 1-6 | Single mirror, straight shots | Tutorial-like |
| 2 (Medium) | 7-12 | Multiple mirrors, beam splitting | Multi-step routing |
| 3 (Hard) | 13-18 | Color beams, color matching targets | Color logic |
| 4 (Expert) | 19-24 | Prisms, color mixing | Complex optical paths |
| 5 (Master) | 25-30 | All mechanics combined, tight grid | Advanced puzzles |

### Unique Selling Points (vs competitors)
1. **Color mixing system** — no web competitor has full RGB color mixing
2. **5-tier difficulty progression** — most competitors have flat difficulty
3. **3-star rating + hint system** — engagement/replayability
4. **Canvas neon aesthetics** — dark background with glowing beams
5. **Power-ups** — Hint (shows solution step), Beam Trace (visualizes full path), Reset
6. **Responsive** — works on mobile with touch drag

### Monetization
- Monetag MultiTag zones (110120 banner, 110121 native, 110122 interstitial)
- Interstitial between tiers (after every 6 levels)

### Technical Spec
- Single-file HTML5, Canvas 2D rendering
- Dark neon theme (#0a0a1a background)
- Procedural Web Audio BGM + 8+ SFX
- Touch + mouse + keyboard support
- localStorage for progress
- SEO: meta tags, JSON-LD (VideoGame, FAQPage, HowTo, BreadcrumbList)
- Estimated size: ~45-55KB
