# BENCHMARK: Code Robot (Programming Puzzle)

## Competitor Analysis

### 1. Lightbot (Lightbot Inc.)
- **Platform**: iOS/Android/Web
- **Downloads**: 10M+ (combined)
- **Core mechanic**: Arrange directional commands (forward, turn, jump, light) to guide a robot through a 3D isometric grid. Light up all blue tiles.
- **Key features**: P1/P2 subroutine slots, limited main command slots, isometric 3D rendering
- **Monetization**: Paid ($2.99), educational/school licensing
- **Weaknesses**: Paid (we're free), 3D isometric (complex, we'll do clean 2D top-down)
- **Our advantage**: Free, browser-based, no install, 30 levels vs their 20

### 2. Cargo-Bot (Two Lives Left)
- **Platform**: iPad
- **Downloads**: 500K+
- **Core mechanic**: Program a crane to move crates using command blocks. Nested loops/subroutines.
- **Key features**: 36 puzzles, star ratings based on efficiency, Scratch-like blocks
- **Weaknesses**: iPad only (we're cross-platform web)
- **Our advantage**: Web-based, mobile + desktop, wider accessibility

### 3. Code.org / Hour of Code
- **Platform**: Web
- **Users**: 100M+ students
- **Core mechanic**: Block-based programming (move, repeat, if-then) to navigate mazes
- **Key features**: IP-themed (Minecraft, Star Wars, Frozen), child-friendly
- **Weaknesses**: Not a standalone game, no monetization, IP-restricted
- **Our advantage**: Standalone game, ad-monetized, original art

### 4. Human Resource Machine (Tomorrow Corporation)
- **Platform**: PC/Mobile/Switch
- **Downloads**: 2M+
- **Core mechanic**: Assembly-language-style programming puzzle
- **Weaknesses**: Complex (too advanced for casual), paid
- **Our advantage**: Simpler, more accessible, free

## Our Differentiation
1. **Free + browser-based** — no install, instant play, mobile + desktop
2. **2D top-down** (clean, readable, fast vs Lightbot's 3D isometric)
3. **30 levels** across 5 tiers (more content than most competitors)
4. **Original art** — procedural Canvas robot, no IP dependencies
5. **Web Audio BGM + SFX** — satisfying command execution sounds
6. **Star ratings** — replayability via efficiency scoring
7. **Subroutine system** — depth without complexity (P1/P2 reusable blocks)

## Technical Design

### Grid System
- Top-down 2D grid (square cells, 40-48px each)
- Grid sizes: 4x4 (T1) → 8x8 (T5)
- Cell types: FLOOR (walkable), GAP (jump-only), GOAL (exit), VOID (unwalkable)

### Command System
- Main program: drag commands into a linear slot list
- Commands: FWD (move forward 1 cell), L (turn 90° left), R (turn 90° right), JUMP (forward 2 cells over gap), LIGHT (toggle current tile)
- P1/P2 subroutines: available from T3+, drag commands into subroutine slots, call from main program
- RUN button: execute the full program step-by-step with animation

### Rendering
- Canvas 2D top-down view
- Robot: procedural Canvas drawing (rounded rect body, LED eyes, antenna)
- Tiles: grid with subtle gradients, light tiles glow when activated
- Command blocks: rounded rectangles with icons (arrows, bulb, etc.)
- Step animation: robot smoothly moves/turns with ~300ms per step

### Level Data Structure
```javascript
var LEVELS = [
  {
    name: "Level 1: First Steps",
    tier: 1,
    grid: [
      ['S','F','F','G'],  // S=start, F=floor, G=goal
    ],
    gridW: 4, gridH: 1,
    startDir: 1, // 0=N, 1=E, 2=S, 3=W
    slots: 4,    // max main program slots
    p1Slots: 0,  // subroutine slots (0 = locked)
    p2Slots: 0,
    lightTiles: [], // cells that need to be lit
    hint: "Use FORWARD to move right toward the goal.",
    par: 3     // min commands for 3 stars
  },
  // ...
];
```
