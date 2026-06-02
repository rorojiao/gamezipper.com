# Chain Reaction — Competitor Benchmark

## Selected Game
**Slug**: `chain-reaction`
**Status**: IN PROGRESS (selected 2026-06-03)
**Score**: 15/25 (niche but unique mechanic)
- 市场需求 (3/5): Chain reaction puzzle genre exists but niche
- SEO 空白 (3/5): "chain reaction puzzle", "chain reaction game" — moderate volume
- 留存潜力 (3/5): Strategic depth in finding optimal trigger points
- 实现可行性 (5/5): Grid-based chain propagation with simple physics — very doable
- 零重叠 (5/5): Completely new mechanic for GZ — no chain-reaction-style game exists

## Target Spec
Tap to trigger chain reactions and clear all targets on each level. Strategic puzzle — find the right starting point. 40+ levels, cascade animations, star ratings, undo, hints, Web Audio chain SFX+BGM, Canvas rendering

## Competitor Analysis (Top 3 Chain-Reaction / Cascade Puzzle Games)

### 1. Chain Reaction (by SiegeGames / CrazyGames)
- **Core mechanic**: Place bombs on grid, bombs chain-explode when adjacent
- **Levels**: 50+ levels, escalating grid sizes
- **Systems**: Star ratings (3 stars by turn count), undo last move, level select
- **Audio**: Satisfying boom SFX, simple chiptune BGM
- **Visual**: Neon grid, glowing orbs, expanding shockwave rings
- **Win condition**: All non-bomb cells cleared (or all bombs triggered)

### 2. Pop the Lock / Fuse Puzzle
- **Core mechanic**: Sequence the chain in correct order to light the fuse
- **Levels**: 100+ short levels
- **Systems**: Hint system, daily challenge, time-attack mode
- **Audio**: Sizzle/light-up chain SFX
- **Visual**: Fuse trail with sparks

### 3. Cascade / Rube Goldberg Web Games (Poki featured)
- **Core mechanic**: Drop items to trigger chain physics reactions
- **Levels**: 30+ hand-crafted levels
- **Systems**: Slow-motion, replay, level ratings
- **Audio**: Domino-clack, ping, crash SFX
- **Visual**: 2D physics top-down view

## Systems to Implement (S-grade commercial quality)
- [x] Core chain-reaction cascade mechanic (tap a target, adjacent same-color targets chain-explode)
- [x] 40+ hand-crafted levels with progressive difficulty
- [x] Star rating (3 stars = clear in minimum moves, 2 = clear, 1 = over moves)
- [x] Move counter + minimum-moves-3-stars
- [x] Undo button (unlimited per level)
- [x] Hint button (highlights optimal starting target)
- [x] Restart level
- [x] Level select grid (locked until cleared)
- [x] Progress save (localStorage v1)
- [x] Combo / cascade chain counter (visual + score)
- [x] Particle effects (explosion rings, sparks, screen shake)
- [x] Smooth animations: shockwave, fade-out, color burst
- [x] Web Audio API BGM (procedural) + SFX (tap/explode/cascade/win/click)
- [x] Sound toggle + Music toggle (separate)
- [x] Tutorial overlay on level 1 (skippable)
- [x] Responsive: 1280x720 desktop, 390x844 mobile
- [x] Touch + mouse support
- [x] Game state cleanup on exit (memory leak prevention)
- [x] SEO: VideoGame JSON-LD, FAQPage JSON-LD, HowTo JSON-LD, BreadcrumbList JSON-LD
- [x] og:title, og:description, og:image
- [x] Analytics: site-analytics.cap.1ktower.com
- [x] overflow-x:hidden, user-select:none, touch-action:none on canvas
- [x] Title: "Play Chain Reaction Online Free — Cascade Puzzle | GameZipper"

## Core Mechanic (Detailed)

### Game Loop
1. Each level is an NxM grid of colored "reactors" (filled cells)
2. A subset of cells are "primed" (pulsing, clickable) — these are the player's targets
3. Player taps ONE primed cell → it explodes, scoring 100 points
4. If the explosion has 2+ adjacent reactors of the same color, they CHAIN — each adjacent same-color reactor becomes a primed cell
5. The chain continues until no more adjacent same-color reactors
6. WIN: All reactors on the grid destroyed in ≤ MIN_MOVES
7. 3 stars: exact MIN_MOVES, 2 stars: MIN_MOVES + 2, 1 star: completed

### Scoring
- 1st reactor exploded: 100
- 2nd reactor in same chain: 200 (x2)
- 3rd reactor: 400 (x4)
- 4th: 800 (x8)
- 5th+: 1600 (x16) — combo cap
- Each chain beyond the 1st: +500 bonus

### Difficulty Progression
- Levels 1-5: 3x3 grid, 3-5 reactors, 1 chain
- Levels 6-10: 4x4 grid, 6-8 reactors, 1-2 chains
- Levels 11-20: 5x5 grid, 8-12 reactors, 2-3 chains
- Levels 21-30: 6x6 grid, 12-16 reactors, 3-4 chains
- Levels 31-40: 7x7 grid, 16-22 reactors, 4-5 chains, multi-color chains

## Art Style (GameZipper dark neon)
- Background: dark gradient (deep purple #1a0033 → midnight blue #0a0e27)
- Reactor colors: 5 neon colors (cyan #00f0ff, magenta #ff00aa, lime #aaff00, gold #ffaa00, hot-pink #ff5577)
- Primed cells: pulsing glow ring + scale animation
- Explosion: expanding ring (3 frames), particle burst (12 particles), screen shake 4px
- HUD: glass-morphism top bar, score / level / moves / target

## Music & Audio
- BGM: ambient electronic, mysterious, slow tempo (procedural Web Audio)
- SFX (Web Audio synthesized):
  - tap: 600Hz square wave, 60ms decay
  - chain: ascending 800→1600Hz, 150ms
  - cascade: 1000Hz triangle + noise burst
  - win: chord arpeggio C-E-G-C
  - lose/undo: descending 400→200Hz
  - button: 1200Hz click, 30ms
