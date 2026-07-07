# Pin-Pull Puzzle — Competitive Benchmark

> Date: 2026-07-07
> Mechanic: Pin-Pull / Screw-Unlock Jam Puzzle
> Reference Games: World of Screw, Screw Out, How to Loot - Pin Pull

---

## 1. Reference Games Analysis

### World of Screw (Poki)

**Core Mechanic:**
- Click screws in correct color-order to disassemble 3D object
- Reveal hidden objects inside
- Color-coded pins must be removed top-to-bottom (physics dependency)

**Gameplay Flow:**
- 50+ levels across 5 tiers
- Each level: 3D object (gift box, robot, etc.) with 4-12 screws
- Screws have colors (red, blue, green, yellow) - must remove in order
- Some screws are blocked by panels - can only remove when exposed
- Hidden objects revealed at level end (collectibles)

**Features:**
- 3D perspective (fake 2.5D with CSS transforms)
- Satisfying unscrew animation (rotate + slide out)
- Level timer (par time)
- 3-star rating based on time
- Hint system (highlights next screw)

**Monetization:**
- Banner ads between levels
- Interstitial ad on 10th, 20th level
- IAP for unlimited hints

**Technical Notes:**
- Single-file HTML (~45KB)
- Canvas rendering for 3D effect
- CSS animations for screw rotation
- Web Audio for SFX (click, unscrew, reveal)

**Strengths:**
- Very satisfying unscrew feel
- Clear visual hierarchy (color-coded)
- Good difficulty curve (1 screw → 12 screws, with dependencies)
- Collectible meta-game (hidden objects)

**Weaknesses:**
- Some levels feel trial-and-error (order not intuitive)
- 3D perspective occasionally obscures color
- No undo button (mistakes = restart)

---

### Screw Out: Bolts and Nuts (CrazyGames)

**Core Mechanic:**
- Unscrew color-coded bolts from metal panels
- Panels slide away when fully unscrewed
- Reveal character/object underneath

**Gameplay Flow:**
- 100+ levels across 10 zones
- Bolt colors: red, orange, yellow, green, blue, purple
- Some bolts are "locked" (cannot unscrew until adjacent panel removed)
- Zone themes: construction, space, underwater, jungle
- Boss levels: larger objects with 20+ bolts

**Features:**
- Zone selection screen
- Unlock system (complete zone N to unlock N+1)
- Power-ups: X-ray (see bolt order), Time freeze (slow timer)
- Daily bonus (spin wheel for hints)
- Achievements (unscrew 500 bolts total, etc.)

**Monetization:**
- Rewarded video ads for hints
- Interstitial every 5 levels
- Premium purchase (remove ads + unlimited hints)

**Technical Notes:**
- Canvas rendering (~55KB)
- SVG bolt shapes (scalable)
- LocalStorage progress save
- Procedural level generation (zones 6-10)

**Strengths:**
- Massive content (100 levels)
- Zone progression with themes
- Procedural generation extends replayability
- Power-ups add strategy depth

**Weaknesses:**
- Procedural levels sometimes unsolvable (bug reported)
- Load times slow on mobile (large canvas)
- IAP gating feels aggressive

---

### How to Loot - Pin Pull (Poki)

**Core Mechanic:**
- Pull pins in correct order to drop loot into bag
- Avoid hazards (lava, spikes, enemies)
- 3 objectives per level: collect loot, avoid hazards, reach exit

**Gameplay Flow:**
- 40 levels across 4 chapters
- Pin types: standard (pull), timed (auto-release), color-ordered (red before blue)
- Hazards: lava pools, spike pits, moving enemies
- Loot types: coins, gems, treasure chests
- Par time for each objective (3-star rating)

**Features:**
- Objective checklist (loot collected, hazards avoided, exit reached)
- Undo button (last 3 moves)
- Hint system (highlights next pin)
- Chapter boss (large multi-pin puzzle)

**Monetization:**
- Banner ads at top
- Interstitial every 10 levels
- Rewarded video for extra hints

**Technical Notes:**
- Canvas physics engine (gravity simulation)
- Collision detection (loot vs hazards)
- Particle effects (lava sparks, coin shine)
- Web Audio SFX (pull, drop, crash)

**Strengths:**
- Physics-based (loot falls realistically)
- Multi-objective system adds depth
- Undo button reduces frustration
- Chapter progression with bosses

**Weaknesses:**
- Physics sometimes glitchy (loot falls through platforms)
- Pin order occasionally unclear
- No level skip (stuck = quit)

---

## 2. Differentiation Strategy

### Gaps to Fill

1. **Undo System**: None of reference games have proper undo. Implement full undo stack (all moves reversible).

2. **Solvability Guarantees**: Reference games occasionally have unsolvable levels. Use BFS verification during generation to ensure 100% solvable.

3. **Visual Clarity**: 2D top-down view (no 3D perspective confusion). Bold color coding (high contrast for colorblind).

4. **Progressive Mechanics**: Start with simple pull-order, then introduce:
   - Color dependencies (red before blue)
   - Physics hazards (loot falls into lava)
   - Timed pins (auto-release after N seconds)
   - Chained pins (pull A, then B unlocks)

5. **Level Count**: 30 levels (5 tiers × 6 levels) — compact but polished. Reference games have 50-100, but many feel padded.

6. **No IAP**: Free play, ads only. Reference games gate content behind paywall.

---

## 3. Technical Spec

### Core Systems

**Data Structure:**
```javascript
var LEVELS = [
  {
    tier: 1,
    par: 3,
    pins: [
      {x: 200, y: 150, color: 'red', blockedBy: [], type: 'standard'},
      {x: 300, y: 250, color: 'blue', blockedBy: [0], type: 'standard'},
    ],
    hazards: [],
    loot: [{x: 250, y: 350, value: 10}],
    goal: {x: 400, y: 500}
  },
  // ... 30 levels
];
```

**Game Loop:**
- Init: Load level, render pins/loot/hazards/goal
- Click pin → Check if unblocked → Animate removal → Update physics → Check win/loss
- Physics: Gravity applied to loot, collision with hazards/goal
- Win: All loot in goal bag, no hazards triggered
- Loss: Any loot touches hazard

**Verification (BFS):**
- Generate level data
- Run BFS from initial state → goal state
- If no path exists, regenerate
- Store verified path as hint sequence

**Input Handling:**
- Pointer events (mouse + touch)
- Touch-action: none on canvas
- 36px minimum hit target for pins

**Visual Feedback:**
- Pin pull: rotate animation (180deg over 300ms)
- Loot fall: gravity acceleration (9.8 m/s²)
- Hazard trigger: shake effect + red flash
- Win: particle confetti + sound fanfare

---

## 4. Success Metrics

- **Engagement**: 3+ sessions per user (repeat play)
- **Retention**: 50% complete Tier 1, 20% complete all 30 levels
- **Monetization**: 0.5% CTR on interstitial ads (industry avg: 0.3-0.7%)
- **Viral Potential**: Shareable level completion images (auto-screenshot on win)

---

## 5. Build Priority

1. **Core Loop** (Tiers 1-2): Standard pull-order puzzles, no hazards
2. **Physics Engine** (Tier 3): Loot gravity + hazard collision
3. **Advanced Mechanics** (Tiers 4-5): Timed pins, chained pins, multi-objective
4. **Polish**: SFX, BGM, particle effects, undo system
5. **Verification**: BFS solver + auto-hint generation