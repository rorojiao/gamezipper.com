# Level Devil — Competitive Benchmark

## Target Game
**Level Devil** by Unept — Poki #2 most popular game (May 2026)

## Core Mechanics
- 2D side-scrolling platformer with simple left/right movement + jump
- Player is a simple geometric character (rectangle/circle)
- Goal: reach the door at the end of each level
- Twist: EVERYTHING is a trap — the level itself tries to kill you
- Traps include: falling floors, moving walls, appearing spikes, fake doors, expanding obstacles, floor that collapses, ceiling that drops, invisible walls, doors that run away, projectiles

## Competitor Analysis

### Level Devil (Unept) — Primary
- **Levels**: 50+ levels across multiple chapters
- **Art Style**: Minimal, dark background, simple shapes, neon accents
- **Difficulty**: Starts easy, becomes extremely hard
- **Key Features**:
  - Instant restart on death (no loading)
  - Death counter per level
  - "Devil face" antagonist that triggers traps
  - Fake doors (go to wrong door = death)
  - Moving platforms that change path
  - Spikes that appear/disappear
  - Walls that close in
  - Floors that fall away
  - Level elements that move when you approach
- **Monetization**: Interstitial ads every 5-10 deaths
- **Retention**: Rage-gaming appeal, "one more try" loop
- **Session Length**: 30-120 seconds per attempt

### Trap Adventure 2 — Secondary
- Similar trap platformer on mobile
- 50M+ downloads
- More complex graphics but same core loop

### Cat Mario / Syobon Action — Origin
- The original "trap platformer" genre
- Japanese indie game that spawned the genre
- Key innovation: nothing is as it seems

## Level Design Patterns (must implement)

### Basic Traps (Levels 1-10)
1. Falling floor — walk across, floor disappears
2. Fake door — door looks real but is a trap (wrong door)
3. Spike popup — spikes appear from floor when you approach
4. Moving wall — wall slides toward you
5. Collapsing ceiling — ceiling drops when you enter area

### Medium Traps (Levels 11-25)
6. Running door — door moves away when you approach
7. Invisible wall — blocks your path
8. Fake ground — looks solid but you fall through
9. Expanding obstacle — grows when you get near
10. Projectile — launched at you from off-screen
11. Platform betrayal — platform moves away as you jump
12. Conveyor belt — pushes you toward danger

### Hard Traps (Levels 26-40)
13. Multiple fake doors — several doors, only one is real
14. Timed sequences — must move at exact pace
15. Reversing controls — left/right swap briefly
16. Speed traps — must run through or die
17. Combo traps — multiple traps in sequence
18. Devil chase — antagonist chases you

### Expert Traps (Levels 41-50)
19. Memory traps — must remember safe path
20. Pixel-perfect jumps — tiny platforms
21. Multi-phase levels — level changes mid-run
22. Fake exits — door leads to more traps

## Technical Implementation

### Physics
- Simple AABB collision detection
- Gravity + jump (variable height based on hold duration)
- Tile-based level data (16x16 or 32x32 grid)
- Platform collision from all 4 sides

### Rendering
- Canvas 2D
- Minimal art style: dark bg (#0a0a1a), white/light player, red traps, green door
- Particle effects on death (simple explosion)
- Screen shake on death
- Smooth camera follow

### Audio
- Web Audio API procedural sounds:
  - Jump: short rising tone
  - Death: descending buzz
  - Door reach: victory chime
  - Trap trigger: whoosh/thud
  - Step: subtle footstep (optional)

### Level Data Format
```javascript
// Each level is a grid + trigger zones
var LEVELS = [
  {
    name: "Welcome",
    grid: [ // 20x12 tile grid
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....P...........D...",
      "####################",
      "####################",
    ],
    traps: [
      {type:'fall_floor', x:10, y:9, trigger:'step_on'},
      {type:'spike_popup', x:12, y:9, trigger:'near', range:2},
    ],
    par_deaths: 3, // 3-star if you die 3 or fewer times
  }
];
```

## SEO Keywords
- "level devil"
- "trap platformer"
- "impossible platformer"
- "trick game"
- "rage game"
- "devil platformer"

## Target Metrics
- 50 levels (5 chapters of 10)
- File size: 40-60KB single HTML file
- Load time: < 2s
- 60fps on mobile
- Touch controls: left/right buttons + jump button
