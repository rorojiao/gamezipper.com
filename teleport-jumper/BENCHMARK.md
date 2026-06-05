# BENCHMARK.md — Teleport Jumper (GZ Superior Version)

## Game Overview
**Slug:** teleport-jumper
**Category:** puzzle
**Tags:** teleport, portal, puzzle, platformer, logic, brain
**Core Mechanic:** Targeted Blink — press teleport key to place a preview box, confirm to teleport, reach the exit

## Competitive Landscape

### 1. Teleport Jumper (Robert Alvarez)
- **Platform:** CrazyGames + Poki
- **Rating:** 8.8/10 CG (6,112 votes), 3.9/5 Poki (20.7K likes)
- **Mechanic:** Arrow keys move, X/Space opens placement box, C cancels, R resets
- **Art:** Retro flat, geometric shapes, muted palette
- **Levels:** ~60-100 estimated
- **Weaknesses:** No progression systems, no par scoring, no skins, no daily challenge

### 2. Return Portal (Poki First-Party)
- **Rating:** 83.5K Poki likes (category leader)
- **Mechanic:** Place portal + walk into it → teleport to exit
- **Weakness:** Poki-made (promotion advantage), different mechanic (portal placement vs self-teleport)

### 3. Hop Warp
- **Rating:** 18.3K Poki likes
- **Mechanic:** Warp/teleport variant

### 4. Portal Pusher
- **Rating:** 8.5K Poki likes
- **Mechanic:** Push portal objects (NOT self-teleport)

## GZ Superior Version Design

### Core Systems (Must-Have)
1. **Targeted Blink with Preview**: Press teleport → ghost appears at destination → confirm/cancel
2. **Limited Teleport Charges**: 3-5 per level (adds strategic depth)
3. **3-Star Par Rating**: Based on teleports used (par = optimal, star = par+1, 1 star = completed)
4. **5 Difficulty Tiers**: Tutorial → Basic → Intermediate → Advanced → Expert
5. **80 Levels**: 16 per tier
6. **Skin Unlocks**: Complete tiers to unlock cosmetic skins
7. **Level Progress**: localStorage with version field
8. **Tutorial System**: 4-step interactive tutorial
9. **Rewind/Undo**: Undo last teleport (consumes extra charge)
10. **Sound Toggle**: Web Audio procedural BGM + SFX

### Art Style: Cosmic Void
- Background: #0D0D1A → #1A1A2E gradient
- Character: Glowing cyan orb with pulse animation
- Teleport effect: Purple energy trail, ghost at destination
- Exit portal: Golden/white shimmer with particles
- Hazards: Red/orange spikes, moving barriers
- Walls: Dark purple (#2A1A4E) with subtle glow
- UI: Glass-morphism panels, neon accent borders

### Controls
| Action | Desktop | Mobile |
|--------|---------|--------|
| Move | WASD / Arrows | Virtual D-pad (left) |
| Teleport | Space / X | Big TELEPORT button (right) |
| Cancel | C | X button |
| Undo | Z | Undo button |
| Reset | R | Reset button |

### Level Design Framework
| Tier | Levels | New Elements |
|------|--------|-------------|
| Tutorial (1-16) | Basic teleport, reach exit | 1 charge each |
| Basic (17-32) | Walls, simple obstacles | 2-3 charges |
| Intermediate (33-48) | Moving hazards, teleport through walls | 3-4 charges |
| Advanced (49-64) | Switches, keys, trap destinations | 3-5 charges |
| Expert (65-80) | All mechanics combined, tight par | 2-4 charges |

### Unique Selling Points vs Competitors
1. **Cosmic Void aesthetic** — visually striking thumbnails, stands out on game portals
2. **Teleport charges** — strategic depth absent from all browser teleport games
3. **Par scoring system** — 3-star rating drives replayability
4. **Skin unlocks** — progression rewards (5 skins)
5. **Full mobile optimization** — large touch targets, virtual controls
6. **80 handcrafted levels** — more than most browser teleport games

### SEO Keywords
teleport puzzle game, portal puzzle, blink puzzle, teleporter game, short range teleport, brain teaser puzzle, logic platformer
