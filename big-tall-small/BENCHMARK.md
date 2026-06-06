# Big Tall Small — Competitive Benchmark

## Selected Game
**Big Tall Small** — 3-character size-based puzzle platformer
- Slug: `big-tall-small`
- Category: puzzle / platformer
- GameZipper catalog: 254th game (after einstein-riddle 253rd)

## Why this game
- **Zero overlap** with all 253 existing GZ games (no 3-character size puzzle)
- High SEO potential — "big tall small" is a 2021 Poki/CrazyGames hit, still ranking
- Strong retention — multi-character puzzles have high replay/star-rating behavior
- Single HTML file viable (grid-based, fixed camera, 3 entities)

## Top 3 Competitors Analyzed

### 1. Big Tall Small (Poki / CrazyGames) — original by Miltin Madhutkar
- **Levels**: 25 hand-designed levels across 3 worlds
- **Characters**:
  - **Big** (red, square) — can't fit through small gaps, can push heavy boxes
  - **Tall** (blue, narrow) — fits through vertical-only gaps, can reach high ledges
  - **Small** (yellow, round) — fits anywhere, can roll through tunnels
- **Controls**: Click character to select, then click destination cell / arrows
- **Goal**: Get all 3 to the exit (each has its own color-matched portal)
- **Systems**:
  - Level select grid (locked → unlocked → starred)
  - 3-star rating per level (1 star = complete, 2 = under par moves, 3 = no undo)
  - Move counter
  - Undo (unlimited)
  - Restart level
  - Background music per world
  - SFX for switch, success, fail
  - Pause menu
- **Aesthetic**: Clean 2D cartoon, pastel backgrounds, soft shadows

### 2. Bump Ball (Coplay / Y8) — similar mechanic
- Multi-ball puzzle with different sizes
- Drag-and-drop instead of click-to-move
- Bumpers and portals

### 3. Three Goblets (Poki) — character switch puzzle
- Three characters, switch to navigate hazards
- Has additional trait gates (fire/ice/water) beyond size

## Systems We Must Implement (S-grade)
| System | Our Implementation |
|--------|---------------------|
| **3 characters w/ size traits** | Big (red, can't pass 1-tile), Tall (blue, vertical-only), Small (yellow, fits anywhere) |
| **30 levels** | Across 5 worlds of 6 levels each |
| **Move counter** | Per-level, displayed top-right |
| **3-star rating** | 1★=complete, 2★=par, 3★=no-undo/optimal |
| **Undo** | Undo last move (one-step, rewind to last safe state) |
| **Restart** | Reset level state |
| **Level select** | 6×5 grid, locked/unlocked/starred |
| **World progression** | 5 worlds, each with new visual theme + new mechanic |
| **Character switch** | Tap/click character → tap destination cell |
| **Tutorial** | 4-step modal at start of world 1 |
| **Save state** | localStorage v2 (level unlocks, stars, best moves) |
| **Pause menu** | Resume, Restart, Level Select, Sound toggle |
| **Win modal** | Stars earned, par, "Next Level" button |
| **Background music** | Web Audio procedural — light chiptune per world |
| **SFX** | Switch, move, step, complete, star, fail (Web Audio) |
| **Portal animations** | Pulsing glow + particle effect on portal tiles |
| **Character trail** | Subtle path trail showing where the active char just walked |
| **JSON-LD** | 4 blocks: VideoGame, FAQPage, HowTo, BreadcrumbList |
| **OG image** | Custom SVG-rendered (procedural) 512×512 with all 3 characters |
| **Touch support** | Tap character → tap destination (no drag for simplicity) |
| **Mobile controls** | On-screen character select + 4-direction dpad (active character only) |

## Level Design (5 Worlds × 6 levels = 30)

### World 1 — "First Steps" (6 levels, easy)
- L1: Big straight to portal (tutorial)
- L2: Tall straight to portal (tutorial)
- L3: Small straight to portal (tutorial)
- L4: Big needs Tall to push box down; Small goes around
- L5: All 3 to 3 portals arranged in a row
- L6: First branching — choose Big first, then Tall, then Small

### World 2 — "Stack & Reach" (6 levels)
- L7-L12: Adds **boxes** that only Big can push
- L8: Tall stands on box to reach high ledge
- L11: Switch + door mechanic (one char must hit switch while others go through door)

### World 3 — "Tunnels" (6 levels)
- L13-L18: Adds **tunnels** that only Small fits through
- L15: Tall bridges gap (lies horizontal? No — Tall is tall, not wide — Tall bridges vertical shafts by standing as column)
- L17: Big pushes box onto switch, Small squeezes through, Tall walks up stairs

### World 4 — "Hazards" (6 levels)
- L19-L24: Adds **spikes** and **moving enemies**
- L20: Enemy patrol — must wait or switch
- L23: Spikes block all chars; one char must hit switch to deactivate

### World 5 — "Master Mode" (6 levels)
- L25-L30: Combines all mechanics
- L26: Boxes + tunnels + spikes + switch
- L28: Optimal solution requires 5-star thinking
- L30: Final challenge — 3+ boxes, 2 switches, 1 enemy

## Visual Theme per World
| World | Background | Floor | Accent |
|-------|-----------|-------|--------|
| 1. First Steps | Pastel sky blue | Soft green grass | Yellow sun |
| 2. Stack & Reach | Soft pink dawn | Light grey | Box-brown |
| 3. Tunnels | Mint green | Dark grey stone | Tunnel-blue |
| 4. Hazards | Dark navy | Cracked stone | Spike-red |
| 5. Master Mode | Purple cosmos | Star-flecked | Gold |

## Code Targets
- File: `big-tall-small/index.html` (single file, target 50-80KB)
- Procedural SVG-based og-image
- Procedural Web Audio BGM (one track per world, ~30s loop)
- 6+ SFX (switch/move/step/complete/star/fail/click)
- All English UI

## Quality Standards
- All 30 levels must be solvable — validate by BFS search on level data
- Move counter matches par (par = optimal solution steps)
- Undo restores both move count and character positions
- Save state with version + timestamp
- Cleanup on exit: cancel rAF, close audio context, remove listeners
