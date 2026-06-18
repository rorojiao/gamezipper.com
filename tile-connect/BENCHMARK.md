# Tile Connect Classic — Competitive Benchmark

**Game**: Tile Connect Classic (Onet symbol-link variant)  
**Slug**: `tile-connect`  
**Score**: 21/25 (Round 33 queue)  
**Research Date**: June 18, 2026

---

## Market Leaders & Reference Games

### 1. Onet Classic (Indonesian Origin)
- **Downloads**: 50M+ (Android Play Store)
- **Core Mechanic**: Match identical symbol tiles via path with ≤2 turns
- **Tile Types**: Fruits, animals, objects (NOT traditional Mahjong)
- **Grid Size**: 8x10 to 12x14 scaling
- **Mode**: Classic + Time Attack + Endless
- **Progression**: 1000+ levels, increasing tile type count
- **Monetization**: IAA banner + interstitial + rewarded video (hints/shuffle)

### 2. Tile Master - Match Puzzle
- **Downloads**: 100M+ (combined Android/iOS)
- **Features**:
  - 30+ themed tile sets (animals, fruits, emojis, patterns)
  - Daily challenges (seeded layouts)
  - Hint system (3 free hints/watch ad)
  - Shuffle power-up (limited daily)
  - Combo multiplier (consecutive matches)
  - Star rating (1-3 stars based on time)
- **Level Difficulty**: Starts 6 tile types, ends 25+ types
- **Progress Save**: Level unlock progress saved locally

### 3. Link Link / Puppy Connect
- **Downloads**: 30M+ (SE Asia market leader)
- **Unique Features**:
  - Cute animal/character tile art (appeals to casual)
  - Progress maps with unlockable chapters (forest, beach, space)
  - Boss levels (special patterns with timer)
  - Special tiles:
    - 🌟 BOMB: Clear 3x3 area
    - 🔒 LOCKED: Can't match until unlocked
    - ❄️ FROZEN: Can't select for 3 seconds
  - Leaderboard (daily/weekly high scores)
- **Social**: Challenge friends via shareable screenshots

### 4. Onet Connect Animal (PC/Web)
- **Platform**: Web portals (Poki, CrazyGames, Arkadium)
- **Features**:
  - Clean modern UI (dark gradient, neon accents)
  - Responsive (works on mobile)
  - No ads (premium/paid version)
  - 100 handcrafted levels
  - Undo button (3 per level)
  - No special tiles (pure puzzle)
- **Performance**: 60fps Canvas, instant load

---

## Core Mechanics to Implement

### Pathfinding Rules
- **Max 2 turns**: Path can have 0, 1, or 2 right-angle turns
- **Empty space required**: All cells along path must be empty
- **Adjacent tiles**: Can match directly (0 turns)
- **Edge wrapping**: Path can go off-board edge (some variants allow this)
- **Visual feedback**: Draw glowing line showing path

### Tile Matching
- **Same tile type**: Only match identical symbols
- **Both must be selectable**: Not locked/frozen
- **Match removed**: Both tiles disappear
- **All cleared → Level complete**: Win condition

### Grid Scaling
- **Easy (L1-L10)**: 8x10 grid, 6 tile types, no time limit
- **Medium (L11-L30)**: 10x12 grid, 10-15 tile types, 3 min timer
- **Hard (L31-L60)**: 12x14 grid, 20-30 tile types, 2 min timer
- **Expert (L61+)**: 14x16 grid, 35+ tile types, 90 sec timer

---

## System Requirements (Competitor Parity)

### ✅ Core Systems (Must Have)
- [x] Pathfinding algorithm (BFS, max 2 turns)
- [x] Level progression (30 levels minimum, target 50)
- [x] Timer countdown (visible, with pause on win)
- [x] Score system (base 100 + combo bonus)
- [x] Star rating (1-3 based on time/score)
- [x] Hint system (shows 1 valid match, 3 free/watch ad)
- [x] Shuffle power-up (reshuffles remaining tiles)
- [x] Undo button (back 1 match, 3 per level)
- [x] Progress save (localStorage with level unlocks + best score)
- [x] Tutorial overlay (first-time guide: tap → tap → match)

### ✅ Advanced Systems (Nice to Have)
- [x] Combo multiplier (consecutive matches: 2x, 3x, 4x...)
- [x] Daily challenge (seeded layout, unique every day)
- [x] Special tiles (optional for launch):
  - 🔒 LOCKED: Can't match until adjacent match
  - ❄️ FROZEN: Can't select for N seconds
  - 💣 BOMB: Clears 3x3 area (rare)
- [x] Level select screen (map view with stars)
- [x] Settings modal (sound toggle, reset progress)
- [x] Achievements (matches in X seconds, perfect star runs)

### ✅ UX/UX (Must Match Leaders)
- [x] Large tap targets (≥44px on mobile)
- [x] Touch-action:none on canvas (prevent scroll)
- [x] Pointer events (unified mouse/touch)
- [x] Visual feedback:
  - Tap highlight (glow border)
  - Match animation (particles/flash)
  - Path drawing (glowing line)
  - Combo popup (text floating)
- [x] Smooth 60fps animations
- [x] Dark gradient background (GameZipper style)
- [x] Responsive (desktop 1280x720, mobile 390x844)

### ✅ Monetization (GameZipper Ad Spec)
- [x] Monetag zones: 110120 (banner), 110121 (native), 110122 (interstitial)
- [x] Ad placement:
  - Banner: Bottom of game canvas (persistent, non-intrusive)
  - Native: Level complete overlay (rewarded video: extra hints)
  - Interstitial: Every 5 levels or on game over

---

## Technical Constraints

### File Format
- **Single HTML5 file**: `/home/msdn/gamezipper.com/tile-connect/index.html`
- **Size target**: 40-60KB (similar to Tile Master, Onet)
- **No external deps**: Only CDN fonts (optional)
- **Canvas rendering**: 2D context, 60fps rAF loop

### Tile Assets
- **Emoji/symbol tiles**: Use Unicode emoji or simple SVG icons embedded as base64
- **16-32 tile types**: Cover fruits, animals, objects, shapes
- **Recommended emoji set**:
  - Fruits: 🍎🍊🍋🍇🍓🍒🍑🥝
  - Animals: 🐶🐱🐰🐻🐼🐨🦁🐮
  - Objects: ⚽🎸🎮🎁🎈🎀⭐🌟

### Performance
- **Pathfinding**: BFS on grid, O(rows×cols) per check
- **Level generation**: Random layout with guaranteed solvable (or regenerate)
- **Drawing**: Batch same-type tiles for draw call efficiency

---

## Level Data Structure

```javascript
const LEVELS = [
  // Easy (L1-L10)
  { id: 1, rows: 8, cols: 10, types: 6, time: 180, par: 0 },
  { id: 2, rows: 8, cols: 10, types: 6, time: 180, par: 0 },
  // ... up to L10
  
  // Medium (L11-L30)
  { id: 11, rows: 10, cols: 12, types: 10, time: 150, par: 0 },
  { id: 12, rows: 10, cols: 12, types: 11, time: 150, par: 0 },
  // ... up to L30
  
  // Hard (L31-L60)
  { id: 31, rows: 12, cols: 14, types: 20, time: 120, par: 0 },
  // ... up to L60
];
```

### Solvability Guarantee
- Generate random layout
- Run BFS to find all possible matches
- If 0 matches → regenerate
- Save seed for reproducible levels

---

## Next Steps

1. **Phase 3**: Build complete game with Claude Code (delegate to subagent)
2. **Phase 4**: Generate art assets (RunningHub: icon + background)
3. **Phase 5**: Generate BGM (Web Audio procedural) + SFX
4. **Phase 6**: Verify all 30+ levels solvable
5. **Phase 7**: Full QA (code-level + browser if possible)
6. **Phase 8**: Register in games-data.js + sitemap.xml + git commit
7. **Phase 9**: Final report with build metrics

---

**Benchmark Status**: ✅ COMPLETE  
**Next**: Phase 3 — Game Development