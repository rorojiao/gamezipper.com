# Hex Minesweeper — Competitive Benchmark & Design Blueprint

> **GameZipper.com** | Puzzle Game Pipeline | Last updated: 2026-06-09
> Game concept: Hexagonal grid Minesweeper inspired by "Hexcells" by Matthew Brown

---

## Table of Contents

1. [Competitive Landscape](#1-competitive-landscape)
2. [Competitor Deep-Dives](#2-competitor-deep-dives)
3. [Feature Comparison Matrix](#3-feature-comparison-matrix)
4. [Level Progression Blueprint](#4-level-progression-blueprint)
5. [Visual Style Targets](#5-visual-style-targets)
6. [Key Differentiators](#6-key-differentiators)
7. [Technical Targets](#7-technical-targets)
8. [Sound Design Targets](#8-sound-design-targets)

---

## 1. Competitive Landscape

### Top 5 Competitors Researched

| # | Competitor | Platform | Developer | Price | Release |
|---|-----------|----------|-----------|-------|---------|
| 1 | **Hexcells / Hexcells Plus / Hexcells Infinite** | Steam (PC/Mac/Linux) | Matthew Brown | $2.99-$4.99 each ($8.99 pack) | 2014 |
| 2 | **Hexmines** | iOS | Independent | Free (likely IAP) | 2016+ |
| 3 | **Minesweeper Hex** | Android (Google Play) | Segit | Free | 2024+ |
| 4 | **Hexsweeper (minesweeper.org)** | Web Browser | minesweeper.org | Free | Ongoing |
| 5 | **Microsoft Minesweeper** | Windows / Xbox / Mobile | Microsoft | Free (with ads/IAP) | 2012-present |

### Additional Competitors Noted

| Competitor | Platform | Notes |
|-----------|----------|-------|
| Hexsweeper (minesweeper100.com) | Web | Free hex puzzle, 6-neighbor clues |
| Hexagonal Minesweeper (Collepic.NET) | Web | Free, unblocked browser game |
| HexMS | Android | Minimalist, single-screen, no ads |
| Beesweeper (itch.io) | Web | Hex minesweeper with bee theme |
| Hexasweeper (itch.io) | Web | Browser hex minesweeper |
| Hex Saper | Android/iOS (TapTap) | Classic + fast-paced modes |
| Infinity Sweeper | Steam | Modern minesweeper variant |

---

## 2. Competitor Deep-Dives

### 2.1 Hexcells Trilogy (Matthew Brown) - THE Gold Standard

The Hexcells trilogy is the most critically acclaimed hexagonal minesweeper, universally praised as a "logic puzzle masterpiece."

#### Hexcells (Original, Feb 2014)

| Feature | Detail |
|---------|--------|
| **Price** | $2.99 |
| **Levels** | 30 puzzles across 6 worlds (5 per world) |
| **Platform** | PC, Mac, Linux (Steam) |
| **Scoring** | -1 per mistake; "Perfectionist" achievement for zero mistakes across all levels |
| **Achievements** | 6 total (World 2-6 unlocks + Perfectionist) |
| **Grid** | Hexagonal, variable sizes starting small and growing |
| **Clue Types** | Number on cell (adjacent mine count), column/row totals, bracket `{N}` notation (group constraints) |
| **Visual Style** | Dark background, yellow/blue/black hex cells, minimalist, ambient |
| **Sound** | Ambient generative music, satisfying click/reveal sounds |
| **No-Guess Guarantee** | YES - Every puzzle solvable through pure logic, no guessing ever required |
| **Languages** | 9 (EN, FR, DE, ES, JA, KO, PT-BR, RU, ZH) |
| **Steam Recommendations** | 5,043+ |
| **Key Innovation** | Bracket clues `{N}` that constrain mine count in a connected group of cells |

#### Hexcells Plus (Feb 2014)

| Feature | Detail |
|---------|--------|
| **Price** | $2.99 |
| **Levels** | 36 new puzzles (6 worlds x 6 levels) - more challenging |
| **Achievements** | 6 (World 2-6 + Perfectionist) |
| **Recommendations** | 2,242+ |
| **Key Difference** | Harder puzzles from the start, larger grids, more complex clue patterns |

#### Hexcells Infinite (Sep 2014)

| Feature | Detail |
|---------|--------|
| **Price** | $4.99 |
| **Levels** | 36 puzzles + random puzzle generator + user-made puzzle support |
| **Achievements** | 7 (World 2-6 + Perfectionist + "60 down 99,999,940 to go") |
| **Recommendations** | 4,086+ |
| **Key Innovation** | Infinite replayability via procedural generation and custom puzzles |
| **Tags** | Puzzle, Casual, Logic, Indie, Minimalist |

**Hexcells Trilogy Summary:**
- Total hand-crafted puzzles: **102** (30 + 36 + 36)
- Combined price: $8.99 (complete pack)
- Universal acclaim for logic-first design (zero guessing required)
- Ambient/minimalist aesthetic
- Playtime: ~10-15 hours for perfectionist completion
- Key mechanic: Each cell has **6 neighbors** instead of classic Minesweeper's 8

---

### 2.2 Hexmines (iOS)

| Feature | Detail |
|---------|--------|
| **Platform** | iOS App Store |
| **Price** | Free |
| **Tagline** | "Less guessing, more thinking" |
| **Grid** | Hexagonal |
| **Key Selling Point** | Clean interface, rewards skill and strategy over the classic square board |
| **Appeal** | Targets both veterans and newcomers to minesweeper |

---

### 2.3 Minesweeper Hex (Android - nl.segit)

| Feature | Detail |
|---------|--------|
| **Platform** | Android (Google Play) |
| **Price** | Free |
| **Tagline** | "The all-time classic, with a twist!" |
| **Style** | Minimalistic |
| **Sessions** | Designed for quick play sessions |
| **Grid** | Hexagonal fields instead of squares |
| **Gameplay** | Classic minesweeper rules adapted for hex grid |
| **Appeal** | Quick strategic thinking sessions |

---

### 2.4 Hexsweeper (minesweeper.org)

| Feature | Detail |
|---------|--------|
| **Platform** | Web browser (minesweeper.org/hexsweeper) |
| **Price** | Free |
| **Grid** | Hex board, 6 neighbors per cell |
| **Modes** | Easy (radius 5, 8 mines) + additional difficulty levels |
| **Theme** | Dark/Light mode (auto day/night switching) |
| **Languages** | 15+ languages |
| **Features** | Leaderboards, online play, no download required |
| **Note** | Part of larger minesweeper.org ecosystem with classic, no-guess, and 1v1 duel modes |

---

### 2.5 Microsoft Minesweeper (Baseline Comparison)

| Feature | Detail |
|---------|--------|
| **Platform** | Windows, Xbox, Microsoft Store |
| **Price** | Free (with ads/IAP) |
| **Modes** | Classic, Adventure, Daily Challenges |
| **Classic Grid** | 9x9 Beginner, 16x16 Intermediate, 30x16 Expert |
| **Adventure Mode** | Dungeon-crawler twist on minesweeper |
| **Features** | Themes, auto-chording, achievements, Xbox Live integration |
| **Visual Style** | Updated modern look, multiple themes |
| **Grid** | Square (classic) - NOT hexagonal |
| **Relevance** | Baseline for UX expectations, not a direct hex competitor |

---

## 3. Feature Comparison Matrix

| Feature | Hexcells Trilogy | Hexmines (iOS) | Minesweeper Hex (Android) | Hexsweeper (Web) | MS Minesweeper | **GameZipper Target** |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Hexagonal Grid** | YES | YES | YES | YES | NO | YES |
| **No-Guess Logic** | YES | Partial | NO | NO | NO | YES |
| **Bracket/Group Clues** | YES | NO | NO | NO | N/A | YES |
| **Column/Row Clues** | YES | NO | NO | NO | N/A | YES |
| **Curated Levels** | YES (102 total) | NO | NO | NO | NO | YES (30) |
| **Random Generator** | YES (Infinite) | NO | NO | YES | YES | YES |
| **Progressive Difficulty** | YES | NO | NO | NO | NO | YES |
| **No Mistakes Scoring** | YES | NO | NO | NO | NO | YES |
| **Ambient Sound** | YES | NO | NO | NO | NO | YES |
| **Dark Theme** | YES | NO | YES | YES | YES | YES |
| **Mobile-Friendly** | NO | YES | YES | YES | Partial | YES |
| **Single-File HTML5** | NO | NO | NO | NO | NO | YES |
| **Procedural Audio** | NO | NO | NO | NO | NO | YES |
| **Touch Optimized** | NO | YES | YES | Partial | YES | YES |
| **Hint System** | NO | NO | NO | NO | NO | YES |
| **Leaderboards** | Steam | NO | YES | YES | Xbox Live | NO |
| **Achievements** | YES (6-7) | YES | YES | NO | YES | NO |
| **Free to Play** | NO ($2.99+) | YES | YES | YES | YES (w/ ads) | YES |
| **Offline Play** | YES | YES | YES | NO | YES | YES |
| **Zero Install** | NO | NO | NO | YES | NO | YES |

---

## 4. Level Progression Blueprint

### Design Philosophy
- **30 levels** across **6 worlds** (5 levels per world)
- Each world introduces a new mechanic or increases complexity
- All puzzles are **logic-solvable** (no guessing required)
- Progressive grid size: small to large
- Progressive mine density: ~10% to ~25%

### World Layout

#### World 1: "First Steps" (Levels 1-5)
| Level | Grid Radius | Cells | Mines | Mine % | New Mechanic |
|-------|:-----------:|:-----:|:-----:|:------:|-------------|
| 1 | 2 | 19 | 2 | 10% | Basic reveal, numbers only |
| 2 | 2 | 19 | 3 | 16% | Multiple number chains |
| 3 | 3 | 37 | 4 | 11% | Larger grid, safe first click |
| 4 | 3 | 37 | 5 | 14% | Flagging introduced |
| 5 | 3 | 37 | 6 | 16% | World completion challenge |

#### World 2: "Expanding Horizon" (Levels 6-10)
| Level | Grid Radius | Cells | Mines | Mine % | New Mechanic |
|-------|:-----------:|:-----:|:-----:|:------:|-------------|
| 6 | 3 | 37 | 7 | 19% | Column total clues |
| 7 | 4 | 61 | 8 | 13% | Larger grid + column clues |
| 8 | 4 | 61 | 10 | 16% | Row total clues |
| 9 | 4 | 61 | 12 | 20% | Column + row combined |
| 10 | 4 | 61 | 13 | 21% | World completion challenge |

#### World 3: "Connected Thinking" (Levels 11-15)
| Level | Grid Radius | Cells | Mines | Mine % | New Mechanic |
|-------|:-----------:|:-----:|:-----:|:------:|-------------|
| 11 | 4 | 61 | 12 | 20% | Bracket `{N}` group clues introduced |
| 12 | 4 | 61 | 14 | 23% | Multiple bracket groups |
| 13 | 5 | 91 | 15 | 16% | Larger grid + brackets |
| 14 | 5 | 91 | 18 | 20% | All clue types combined |
| 15 | 5 | 91 | 20 | 22% | World completion challenge |

#### World 4: "Deep Logic" (Levels 16-20)
| Level | Grid Radius | Cells | Mines | Mine % | New Mechanic |
|-------|:-----------:|:-----:|:-----:|:------:|-------------|
| 16 | 5 | 91 | 20 | 22% | Sparse reveals, heavy deduction |
| 17 | 5 | 91 | 22 | 24% | Overlapping group constraints |
| 18 | 6 | 127 | 22 | 17% | Large grid, multi-step chains |
| 19 | 6 | 127 | 28 | 22% | Complex interlocking clues |
| 20 | 6 | 127 | 30 | 24% | World completion challenge |

#### World 5: "Expert Territory" (Levels 21-25)
| Level | Grid Radius | Cells | Mines | Mine % | New Mechanic |
|-------|:-----------:|:-----:|:-----:|:------:|-------------|
| 21 | 6 | 127 | 30 | 24% | Minimal initial reveals |
| 22 | 6 | 127 | 32 | 25% | Contradiction-based deduction |
| 23 | 7 | 169 | 34 | 20% | Very large grid |
| 24 | 7 | 169 | 40 | 24% | All mechanics at full complexity |
| 25 | 7 | 169 | 42 | 25% | World completion challenge |

#### World 6: "Grandmaster" (Levels 26-30)
| Level | Grid Radius | Cells | Mines | Mine % | New Mechanic |
|-------|:-----------:|:-----:|:-----:|:------:|-------------|
| 26 | 7 | 169 | 42 | 25% | Master-level deduction |
| 27 | 7 | 169 | 45 | 27% | Multi-layer logical chains |
| 28 | 8 | 217 | 48 | 22% | Massive grid, precision required |
| 29 | 8 | 217 | 55 | 25% | Ultimate challenge |
| 30 | 8 | 217 | 58 | 27% | Grand Finale - all mechanics at peak |

### Difficulty Curve Summary

```
Mine Density %
    27% |                                          *  *
    25% |                    *  *  *  *  *  *  *  *  *
    22% |              *  *  *  *  *  *  *
    20% |           *  *  *  *  *  *
    16% |     *  *  *
    14% |     *
    11% |  *
    10% |  *
         +--------------------------------------------
          1  5  10  15  20  25  30
              Level ->
```

### Random / Endless Mode
After completing all 30 levels, unlock an **Endless Mode** with procedurally generated puzzles:
- Select difficulty: Easy / Medium / Hard / Expert
- Random grid radius 3-8
- Seed-based generation for reproducibility
- Optional: share seed codes

---

## 5. Visual Style Targets

### GameZipper Dark Theme Integration

#### Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background Deep | Dark navy | `#0a0a1a` | Page background, furthest layer |
| Background Mid | Deep indigo | `#1a1a2e` | Game board background |
| Background Surface | Navy panel | `#16213e` | UI panels, modals |
| Hex Cell Hidden | Dark blue | `#1e2a4a` | Unrevealed hex cells |
| Hex Cell Hover | Medium blue | `#2a3a6a` | Hover/press state |
| Hex Cell Revealed | Steel blue | `#0f3460` | Revealed safe cell |
| Accent Primary | Neon red | `#e94560` | Neon accent, highlights |
| Accent Secondary | Cyan | `#00d2ff` | Cyan neon for numbers |
| Accent Gold | Gold | `#ffd700` | World stars, perfect scores |
| Mine | Bright red | `#ff4444` | Mine indicator, danger |
| Flag | Coral red | `#ff6b6b` | Flagged cells |
| Text Primary | Light gray | `#e0e0e0` | Main text |
| Text Dim | Mid gray | `#888888` | Secondary text |

#### Number Colors (Hex Cell Clues)
Follow classic Minesweeper convention with neon twist:

| Number | Color | Hex |
|--------|-------|-----|
| 1 | Cyan | `#00d2ff` |
| 2 | Green | `#00ff88` |
| 3 | Red/Orange | `#ff6644` |
| 4 | Purple | `#aa44ff` |
| 5 | Gold | `#ffd700` |
| 6 | Hot Pink | `#ff44aa` |

#### Visual Effects
- **Hex Reveal**: Satisfying scale+fade animation (150ms ease-out)
- **Mine Explosion**: Particle burst + screen shake (300ms)
- **Flag Plant**: Bounce-in animation (200ms)
- **World Complete**: Star rating overlay with neon glow
- **Perfect Score**: Gold shimmer effect across board
- **Ambient Particles**: Subtle floating dots in background (optional, toggleable)

#### Typography
- **Font**: System monospace for numbers (`'JetBrains Mono', 'Fira Code', monospace`)
- **UI Font**: System sans-serif (`-apple-system, 'Segoe UI', sans-serif`)
- **Hex Numbers**: Bold, centered, 60% of cell radius
- **World Title**: Large, bold with neon accent underline

#### Hex Cell Geometry
- Flat-top orientation (pointy-side horizontal) for better mobile aspect ratio
- Cell size adapts to screen: `min(screenW, screenH) / (gridRadius * 2 + 3)`
- 2px gap between cells
- Subtle inner shadow on hidden cells for depth
- Rounded corners on hex vertices (subtle, 2px radius)

---

## 6. Key Differentiators

### What Makes GameZipper Hex Minesweeper Unique

#### 1. Zero-Install, Instant Play
- Single-file HTML5, no download, no signup
- Loads in <2 seconds on mobile
- Zero-friction access vs Steam downloads or app installs

#### 2. Mobile-First Touch UX
- Long-press to flag (no right-click needed)
- Pinch-to-zoom on large grids
- Haptic feedback on reveal/flag/explosion
- Edge-scroll for grids larger than viewport
- Touch-optimized cell sizing (minimum 32px tap target)

#### 3. Hint System (Unique vs Hexcells)
- Progressive hint system that teaches logic patterns:
  - **Hint Level 1**: Highlights a cell where logic can be applied
  - **Hint Level 2**: Shows the specific deduction to make
  - **Hint Level 3**: Reveals the answer with explanation
- Hints cost "mistakes" (break perfect score)
- Designed for learning, not cheating

#### 4. Procedural Audio
- Web Audio API generates all sounds (no audio files):
  - Satisfying click/reveal tones (pentatonic scale, ascending pitch)
  - Flag placement: soft thud
  - Mine explosion: bass rumble + noise burst
  - World complete: ascending arpeggio
  - Perfect score: triumphant chord
  - Ambient background: gentle generative tones (toggleable)
- Total audio footprint: ~0 bytes (all synthesized)

#### 5. GameZipper Ecosystem Integration
- Seamless fit with GameZipper dark theme (#0a0a1a to #1a1a2e)
- Neon accent system consistent across all GameZipper games
- Share score via URL (seed-based)
- Part of puzzle game collection

#### 6. Accessibility and Approachability
- Tutorial overlay for first-time players
- Visual + audio feedback on every action
- Color-blind friendly mode (patterns + shapes on numbers)
- Adjustable difficulty within each world (Easy/Standard/Hard variants)
- Undo last action (within current level)

#### 7. Scoring and Motivation
- Per-level score: 3-star system
  - 1 star = Completed (any mistakes)
  - 2 stars = Completed with 2 or fewer mistakes
  - 3 stars = Perfect (zero mistakes)
- World progress tracking
- Total mistake counter across all levels
- "Perfectionist" status for all-3-star completion

---

## 7. Technical Targets

### Platform and Delivery

| Target | Specification |
|---------|--------------|
| **Format** | Single HTML5 file (< 100 KB gzipped) |
| **Rendering** | Canvas 2D API |
| **Audio** | Web Audio API (procedural only) |
| **Input** | Mouse + Touch + Keyboard |
| **Browser Support** | Chrome 90+, Safari 15+, Firefox 90+, Edge 90+ |
| **Mobile** | iOS Safari 15+, Chrome Android |
| **Offline** | Works after initial load (no network needed) |
| **FPS** | 60fps on mid-range 2020 devices |
| **Load Time** | < 2 seconds on 4G |

### Grid Engine Specifications

| Feature | Specification |
|---------|--------------|
| **Grid Type** | Hexagonal (axial coordinates, flat-top) |
| **Max Grid Radius** | 8 (217 cells) |
| **Min Grid Radius** | 2 (19 cells) |
| **Cell Rendering** | Pre-rendered to offscreen canvas, composited |
| **Panning** | Drag-to-pan for grids exceeding viewport |
| **Zoom** | Pinch-to-zoom (1x-3x) on mobile |
| **State Storage** | localStorage for progress |
| **Seed RNG** | Mulberry32 or similar deterministic PRNG |

---

## 8. Sound Design Targets

### Audio Architecture

All sounds are generated procedurally using Web Audio API oscillators, noise generators, and filters. **Zero audio files** required.

### Sound Palette

| Event | Sound Design | Parameters |
|-------|-------------|------------|
| **Cell Reveal** | Soft sine tone, pentatonic scale | Freq: C4-C5 range, Duration: 120ms, Gain: 0.15 |
| **Cell Reveal (chain)** | Ascending arpeggio | Each subsequent reveal = +1 semitone |
| **Flag Place** | Short percussive click + low thud | Triangle wave 100Hz, Duration: 80ms |
| **Flag Remove** | Reverse of flag place | Ascending triangle, 80ms |
| **Mine Hit** | Bass rumble + noise burst + screen shake | Sine 60Hz + white noise, Duration: 500ms |
| **Level Complete** | Ascending C-major arpeggio | 4-note sweep, Duration: 600ms |
| **World Complete** | Triumphant chord progression | C-E-G-C chord, Duration: 1.2s |
| **Perfect Score** | Shimmer effect + chord | Layered detuned sines, Duration: 1.5s |
| **Hint Reveal** | Gentle chime | Sine at G5, Duration: 200ms, Reverb tail |
| **Menu Click** | Soft click | Square wave 800Hz, Duration: 30ms |
| **Error/Wrong** | Low buzz | Sawtooth 80Hz, Duration: 200ms |

### Ambient Audio (Optional, Toggleable)
- **Mode**: Generative ambient pad
- **Synthesis**: Layered sine oscillators with slow LFO modulation
- **Frequency range**: 80-400 Hz (low, warm)
- **Volume**: Very low (0.03 gain)
- **Purpose**: Match Hexcells' "ambient puzzle" atmosphere

---

## Appendix: Key Takeaways from Research

### What Hexcells Does Best (To Emulate)
1. **Pure logic solvability** - every puzzle can be solved without guessing
2. **Ambient, meditative atmosphere** - calming sound + minimalist visuals
3. **Progressive teaching** - new mechanics introduced gradually
4. **Perfectionist scoring** - incentivizes replay for zero-mistake runs
5. **Multiple clue types** - numbers, columns, rows, brackets for rich deduction

### Where Competitors Fall Short (Opportunities)
1. **Mobile apps** lack curated levels and progressive difficulty
2. **Web games** lack ambient atmosphere and polished UX
3. **No competitor** combines curated levels + random generation + hint system
4. **None** are single-file zero-install with procedural audio
5. **Accessibility** (color-blind mode, hints, undo) is universally neglected
6. **Touch UX** is an afterthought on most platforms

### Hexcells Mechanics Worth Implementing

#### Cell Number Clues
Standard: Number in a revealed cell = count of mines in its 6 adjacent hex neighbors.

#### Column/Row Total Clues
Numbers at the edge of the grid indicating total mines in that column or row (visible before cells are revealed).

#### Bracket `{N}` Group Clues
`{3}` means exactly 3 mines in the highlighted group of connected cells. These create powerful deduction chains.

#### Combination Clues
- `(N)` = exactly N mines in the marked region
- `[-N-]` = exactly N mines in this diagonal/line segment

**Recommendation**: Implement cell number clues + column/row totals + bracket groups. This provides Hexcells-level depth without overwhelming casual players.

---

*End of BENCHMARK.md*
*Generated for GameZipper.com Hex Minesweeper development pipeline*
