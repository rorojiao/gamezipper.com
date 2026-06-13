# Rope Rescue - Competitive Benchmark

## Date: 2026-06-14
## Candidate: Rope Rescue (rope-rescue)
## Status: SELECTED (24/25 score)

---

## Competitive Analysis

### 1. Rope Rescue (Supersonic Studios)
- **Downloads/Rating**: 90M+, 4.5★
- **Levels**: 500+ levels
- **Core Mechanic**: Drag rope ends to tie ropes around pegs, stretch to rescue targets
- **Interaction**: Touch-drag to pull rope ends, rope wraps around obstacles
- **Victory Condition**: Guide rescue object (hero/animal) to goal zone
- **Scoring**: 1-3 stars based on rope length, time, attempts
- **Progression**: 5-6 chapters with difficulty curve
- **Hints**: Watch video or spend currency for hint
- **Save**: Local save with level progress and best stars
- **Monetization**: Interstitial on level complete, rewarded video for hints, no major IAP

### 2. Cut the Rope (ZeptoLab)
- **Downloads/Rating**: 1B+, 4.7★
- **Levels**: 200+ levels (original game)
- **Core Mechanic**: Cut ropes to let candy fall to Om Nom, physics-based
- **Interaction**: Swipe to cut ropes, tap to pop bubbles, drag sliding
- **Victory Condition**: Get candy to Om Nom mouth
- **Scoring**: 1-3 stars based on time, stars collected (0-3 per level)
- **Progression**: Multiple boxes (chapters) with new mechanics
- **Hints**: Purchase with coins or watch video
- **Save**: Save level progress, star collection, achievements
- **Monetization**: Rewarded videos for hints, interstitial between chapters

---

## Key Mechanic Differences

| Aspect | Rope Rescue | Cut the Rope | Our Game (Rope Rescue GZ) |
|--------|-------------|--------------|---------------------------|
| Core Action | TIE/WRAP ropes | CUT ropes | TIE/WRAP ropes |
| Rope Physics | Stretch, tension, weight | Swing, gravity, cut | Stretch + gravity |
| Win Condition | Guide target to safety | Get candy to Om Nom | Rescue hero to goal |
| Obstacles | Spikes, falling, moving | Spikes, bubbles, bumpers | Spikes, moving, cutting |
| Difficulty | Moderate (rope planning) | Moderate-High (timing) | Moderate (tactical) |

---

## Feature Requirements (Must Have)

### Core Mechanics
- [x] Verlet physics engine (reuse Cut the Rope code)
- [ ] Rope stretching with tension visualization
- [ ] Rope wrapping around pegs/obstacles
- [ ] Weight distribution (heavy target pulls rope taut)
- [ ] Goal zone detection (rescue target reaches goal)
- [ ] Collision detection with spikes/hazards

### Input System
- [ ] Touch-drag rope ends
- [ ] Rope auto-anchors to pegs when near
- [ ] Visual feedback (rope tension color)
- [ ] Pointer events for desktop/mobile

### Level System
- [ ] Minimum 30 levels (5 chapters × 6 levels)
- [ ] Progressive difficulty: simple → multi-peg → moving obstacles
- [ ] Obstacle types: static pegs, moving pegs, spike zones, rope-cut zones
- [ ] Level metadata: par rope length, hint count, star thresholds

### Scoring & Stars
- [ ] 1-3 stars based on: rope length used (shorter = better), time (optional), attempts
- [ ] Star thresholds: Bronze (1★, 200% rope), Silver (2★, 150% rope), Gold (3★, 100% rope)
- [ ] Best score per level (localStorage)
- [ ] Progress save with version field

### UI Systems
- [ ] Level select screen (chapter-based)
- [ ] In-game UI: restart, hint, back, menu
- [ ] Tutorial overlay (first 3 levels)
- [ ] Victory modal with stars + next level button
- [ ] Settings modal: sound, music, reset progress

### Feedback & Polish
- [ ] Particles on rope tie/stretch
- [ ] Screen shake on hazard hit
- [ ] Smooth rope rendering (quadratic curves)
- [ ] Rope tension visualization (color gradient: green → red)
- [ ] Confetti on 3-star completion

### Audio
- [ ] BGM: Ambient tension-building (Web Audio)
- [ ] SFX: rope stretch, rope tie, win, fail, hint, button click
- [ ] Sound toggle button

---

## Level Difficulty Progression

| Chapter | Levels | Mechanics Introduced | Difficulty |
|---------|--------|----------------------|------------|
| 1 | 1-6 | Basic rope stretching, static pegs | Easy |
| 2 | 7-12 | Multi-peg wrapping, weight distribution | Easy-Medium |
| 3 | 13-18 | Moving pegs, spike zones | Medium |
| 4 | 19-24 | Rope-cut hazards, timing | Medium-Hard |
| 5 | 25-30 | Complex obstacle combos, optimal rope length | Hard |

---

## Technical Constraints

- Single file HTML: rope-rescue/index.html
- No external deps (except fonts)
- Canvas rendering (60fps)
- Responsive: desktop (1280×720) + mobile (390×844)
- Touch-action:none on canvas
- No emoji in game (Canvas-drawn graphics only)
- English UI only

---

## Core Systems to Implement

### 1. Physics Engine
- Verlet integration for rope simulation
- Rope segments with mass and constraints
- Gravity and collision detection
- Peg wrapping logic (rope bends around pegs)

### 2. Game State Management
- Menu → Level Select → Gameplay → Victory/Defeat
- Level progression unlock system
- Star progress tracking
- LocalStorage save/load

### 3. Level Data Structure
```javascript
{
  chapter: 1,
  level: 1,
  parRopeLength: 300,
  starThresholds: { bronze: 200, silver: 150, gold: 100 },
  target: { x: 400, y: 300 },
  goal: { x: 600, y: 500 },
  pegs: [{ x: 400, y: 200, radius: 15 }],
  spikes: [],
  movingPegs: [],
  cutZones: []
}
```

### 4. Rope Mechanics
- Two rope ends that player drags
- Rope auto-anchors to pegs when within radius
- Rope segments stretch under weight
- Rope tension visualization (color: green → yellow → red)
- Rope length calculation for scoring

### 5. Win/Lose Conditions
- WIN: Target reaches goal zone (inside goal radius)
- LOSE: Target hits spike or falls off screen
- WIN timing: Delay before victory modal

---

## Next Phase: Game Development
Generate complete single-file HTML5 game with above features using Claude Code.